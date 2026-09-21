import { NextResponse } from "next/server";

interface MuseJob {
  id: number;
  name: string;
  publication_date: string;
  locations: { name: string }[];
  categories: { name: string }[];
  levels: { name: string }[];
  company: { name: string };
  refs: { landing_page: string };
}

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  publication_date: string;
}

// Free public jobs API (https://www.themuse.com/developers/api/v2) - no key
// required. Its `location` query param only matches when given the EXACT
// tag companies post under - "Chennai" alone silently falls back to
// unrelated results, but "Chennai, India" (or "Austin, TX" for US cities)
// works. So: try the raw input first, and if nothing matches, geocode the
// city (via OpenStreetMap's free Nominatim, also no key) to find the right
// suffix and retry once.
const MUSE_API = "https://www.themuse.com/api/public/jobs";
// Even with the exact location tag, matching jobs are blended in among a
// much larger relevance-sorted set rather than filtered to just that city -
// smaller cities' matches can be buried past page 3. Fetched concurrently,
// so the added latency is small.
const PAGES_TO_FETCH = 10;

// Nominatim gives full state names ("Texas"); Muse's US location tags use
// the 2-letter abbreviation ("TX").
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

async function fetchMuseJobs(locationQuery: string): Promise<MuseJob[]> {
  const pages = await Promise.all(
    Array.from({ length: PAGES_TO_FETCH }, (_, i) =>
      fetch(
        `${MUSE_API}?page=${i + 1}&location=${encodeURIComponent(locationQuery)}`,
        { signal: AbortSignal.timeout(8000) }
      )
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .catch(() => ({ results: [] }))
    )
  );

  const seen = new Set<number>();
  const jobs: MuseJob[] = [];
  for (const page of pages) {
    for (const job of (page.results ?? []) as MuseJob[]) {
      if (!seen.has(job.id)) {
        seen.add(job.id);
        jobs.push(job);
      }
    }
  }
  return jobs;
}

interface LocationMatch {
  job: MuseJob;
  matchingLocation: string;
}

function matchByCity(jobs: MuseJob[], city: string): LocationMatch[] {
  const cityLower = city.toLowerCase();
  const matches: LocationMatch[] = [];

  for (const job of jobs) {
    const matchingLocation = job.locations.find((l) =>
      l.name.toLowerCase().includes(cityLower)
    );
    if (matchingLocation) matches.push({ job, matchingLocation: matchingLocation.name });
  }
  return matches;
}

// Matches the role/title keyword against the job title itself plus its
// category and seniority level - e.g. searching "engineering" should also
// surface a "Backend Developer" role filed under the Software Engineering
// category, not just titles containing that literal word.
function jobMatchesKeyword(job: MuseJob, keyword: string): boolean {
  if (!keyword) return true;
  if (job.name.toLowerCase().includes(keyword)) return true;
  if (job.categories?.some((c) => c.name.toLowerCase().includes(keyword))) return true;
  if (job.levels?.some((l) => l.name.toLowerCase().includes(keyword))) return true;
  return false;
}

function toResults(matches: LocationMatch[], keyword: string): JobSearchResult[] {
  return matches
    .filter(({ job }) => jobMatchesKeyword(job, keyword))
    .map(({ job, matchingLocation }) => ({
      id: String(job.id),
      title: job.name,
      company: job.company?.name ?? "Unknown company",
      location: matchingLocation,
      url: job.refs?.landing_page ?? "",
      publication_date: job.publication_date,
    }));
}

// Resolves a bare city name (e.g. "Chennai") to the location suffix Muse's
// tags actually use ("India", or a US state's abbreviation like "TX").
async function geocodeLocationSuffix(city: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=jsonv2&addressdetails=1&limit=1`,
      {
        headers: { "User-Agent": "job-tracker-app (job search feature)" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;

    const results = await res.json();
    const address = results?.[0]?.address;
    if (!address) return null;

    if (address.country_code === "us") {
      const stateAbbr = US_STATE_ABBREVIATIONS[(address.state ?? "").toLowerCase()];
      return stateAbbr ?? address.country ?? null;
    }
    return address.country ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";
  const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!location) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }

  const city = location.split(",")[0].trim();

  try {
    let jobs = await fetchMuseJobs(location);
    let locationMatches = matchByCity(jobs, city);

    // Only retry with a resolved location suffix if the CITY itself found
    // nothing - a keyword that simply didn't match shouldn't trigger this.
    if (locationMatches.length === 0) {
      const suffix = await geocodeLocationSuffix(city);
      if (suffix) {
        jobs = await fetchMuseJobs(`${city}, ${suffix}`);
        locationMatches = matchByCity(jobs, city);
      }
    }

    const results = toResults(locationMatches, keyword);
    results.sort((a, b) => b.publication_date.localeCompare(a.publication_date));

    return NextResponse.json(results.slice(0, 20));
  } catch {
    return NextResponse.json(
      { error: "Job search is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
