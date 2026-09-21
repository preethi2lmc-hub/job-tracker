import { NextResponse } from "next/server";

interface MuseJob {
  id: number;
  name: string;
  publication_date: string;
  locations: { name: string }[];
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
// required. Its own `location` query param is a loose relevance hint, not a
// hard filter, so we fetch a few pages and filter properly ourselves below.
const MUSE_API = "https://www.themuse.com/api/public/jobs";
const PAGES_TO_FETCH = 3;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";
  const keyword = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!location) {
    return NextResponse.json({ error: "location is required" }, { status: 400 });
  }

  try {
    const pages = await Promise.all(
      Array.from({ length: PAGES_TO_FETCH }, (_, i) =>
        fetch(
          `${MUSE_API}?page=${i + 1}&location=${encodeURIComponent(location)}`,
          { signal: AbortSignal.timeout(8000) }
        ).then((res) => (res.ok ? res.json() : { results: [] }))
      )
    );

    const locationLower = location.toLowerCase();
    const seen = new Set<number>();
    const results: JobSearchResult[] = [];

    for (const page of pages) {
      for (const job of (page.results ?? []) as MuseJob[]) {
        if (seen.has(job.id)) continue;

        const matchingLocation = job.locations.find((l) =>
          l.name.toLowerCase().includes(locationLower)
        );
        if (!matchingLocation) continue;

        if (keyword && !job.name.toLowerCase().includes(keyword)) continue;

        seen.add(job.id);
        results.push({
          id: String(job.id),
          title: job.name,
          company: job.company?.name ?? "Unknown company",
          location: matchingLocation.name,
          url: job.refs?.landing_page ?? "",
          publication_date: job.publication_date,
        });
      }
    }

    results.sort((a, b) => b.publication_date.localeCompare(a.publication_date));

    return NextResponse.json(results.slice(0, 20));
  } catch {
    return NextResponse.json(
      { error: "Job search is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
