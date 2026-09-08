export type ApplicationStatus =
  | "Wishlist"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

export interface Application {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  experience_level: string | null;
  status: ApplicationStatus;
  date_applied: string | null;
  job_url: string | null;
  salary_range: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
