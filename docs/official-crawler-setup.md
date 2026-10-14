# Official Government Website Crawler

This is an additive crawler for the existing Next.js + Vercel + Supabase Adarsh Result project.

## What it does

- Fetches only the official listing pages defined in `lib/crawler/sources.ts`.
- Extracts relevant HTTPS links from those pages, restricted to the same source host or approved government/education domains.
- Stores candidate links in `crawler_discoveries`; it does **not** publish them.
- Logs source health and every run in Supabase.
- Provides `/admin/crawler` for authenticated editors/admins to convert candidates to drafts or dismiss them.
- Schedules the endpoint hourly through `vercel.json`.

## Deployment checklist

1. Review the source list and confirm each listing URL is current and appropriate.
2. Apply `supabase/migrations/20261014_official_crawler.sql` to the Adarsh Result Supabase project.
3. Add these server-only Vercel environment variables in Preview and Production:
   - `CRON_SECRET`: a long random secret. Vercel Cron sends this as a bearer token.
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key; server-side only, never prefix with `NEXT_PUBLIC_`.
4. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` already exist.
5. Deploy this branch as a Preview first. Sign in with an editor account and visit `/admin/crawler`.
6. Call the cron endpoint only with the configured bearer secret; verify successful run logs and inspect each source's discovered links.
7. Merge to `main` only after the preview build and manual source checks pass.

## Limitations

- The initial crawler is a link detector, not a full structured data extractor. It does not reliably determine application dates, vacancy counts, eligibility, or whether a notice has changed.
- Government sites vary in markup and may use JavaScript, CAPTCHAs, PDF-only notices, or access controls. Failed sources are logged and require source-specific adapters.
- Only convert a discovery to a draft after opening the official link. Verify the PDF, dates, eligibility, fees and application link before publishing.
- Respect each site's robots.txt, terms, rate limits and published access guidance. Do not bypass CAPTCHAs or access controls.
- The initial schedule is hourly to remain conservative and reduce unnecessary requests.
