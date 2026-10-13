# Adarsh Result
Independent project for AdarshResult.com. Do not combine this repository with Chat Sangam.

## Stack
Next.js App Router, TypeScript, Tailwind CSS v4, Supabase PostgreSQL/Auth/Storage, Vercel.

## Local setup
1. Use Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set the Supabase URL and anon/publishable key.
5. Run `npm run dev`.

## Current status
Starter homepage, responsive styling, metadata, sitemap/robots and initial Supabase schema are committed. This is not a production launch yet: content detail pages, live data, secure admin screens, auth middleware, schema review, tests, analytics and deployment configuration still need implementation.

## Security
Review `supabase/schema.sql` before applying. RLS is enabled; public reads are limited to published content. Never expose a service-role key in client code. Create the first admin user deliberately.

## Deploy
Create a separate Vercel project linked only to this repository and a separate Supabase project. Add environment variables and test build, RLS, admin and sitemap before connecting adarshresult.com.