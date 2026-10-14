export type OfficialSource = {
  name: string;
  listingUrl: string;
  categoryHint?: "job" | "result" | "admit_card" | "answer_key" | "syllabus" | "notice";
};

// Keep this list restricted to official government/recruitment domains.
// Listing pages should be refined source-by-source after checking their current structure.
export const OFFICIAL_SOURCES: OfficialSource[] = [
  { name: "Staff Selection Commission (SSC)", listingUrl: "https://ssc.gov.in/", categoryHint: "job" },
  { name: "Union Public Service Commission (UPSC)", listingUrl: "https://upsc.gov.in/whats-new", categoryHint: "notice" },
  { name: "National Testing Agency (NTA)", listingUrl: "https://nta.ac.in/NoticeBoardArchive", categoryHint: "notice" },
  { name: "Railway Recruitment Board Chandigarh", listingUrl: "https://www.rrbcdg.gov.in/", categoryHint: "job" },
  { name: "Uttar Pradesh Public Service Commission (UPPSC)", listingUrl: "https://uppsc.up.nic.in/", categoryHint: "job" },
  { name: "UP Subordinate Services Selection Commission (UPSSSC)", listingUrl: "https://upsssc.gov.in/", categoryHint: "job" },
  { name: "Madhya Pradesh Employees Selection Board (MPESB)", listingUrl: "https://esb.mp.gov.in/", categoryHint: "job" },
];
