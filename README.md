# Adarsh Result
Independent project for AdarshResult.com. Keep this repository, Supabase project and Vercel project separate from Chat Sangam.

## Stack
Next.js App Router, TypeScript, Tailwind CSS v4, Supabase PostgreSQL/Auth and Vercel.

## Local setup
1. Use Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the project's publishable key) and `NEXT_PUBLIC_SITE_URL`.
5. Run `npm run dev`.

## Features in source
- Responsive branded homepage and category navigation.
- Supabase-backed published notice lists, search and detail pages.
- SEO metadata, canonical URLs, robots and sitemap starter.
- Supabase Auth login, protected content dashboard and role-checked notice creation.
- PostgreSQL schema with RLS, status workflow and official source/PDF fields.

## First admin setup
1. Set the Supabase URL and publishable/anon key in the separate Vercel project's environment variables.
2. Create the first user in Supabase Authentication.
3. Copy that user's UUID and run this SQL in the Adarsh Result Supabase project: `insert into public.profiles (id, display_name, role) values ('USER_UUID_HERE', 'Site Admin', 'admin');`
4. Sign in at `/admin/login`. Do not enable public sign-up.
5. Create a draft, verify the official source and dates, then publish only verified information.

## Database
The schema was applied as migration `adarsh_result_core_schema` to the active Supabase project visible in the connected workspace. `supabase/schema.sql` records the schema/policies for review.

## Remaining deployment checks
- Confirm Vercel Git integration and environment variables for this repository.
- Confirm `adarshresult.com` is owned and configured before claiming the domain is live.
- Test production build, login, role restrictions, publishing, sitemap and all routes.
- Complete the privacy policy, add contact details, backups and monitoring before production launch.

## Safety
Public visitors can read only published posts. Writes require authenticated users with a profile role. Never commit secrets or use a Supabase service-role key in client-side code.
