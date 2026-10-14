# Supabase migrations

Apply migrations in timestamp order to the Adarsh Result Supabase project.

- `20261014_official_crawler.sql`: adds crawler source health, discovered official links, and crawl run logs. It does not modify the existing `posts` workflow.

The crawler uses the server-only `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` environment variables. Never expose either variable with a `NEXT_PUBLIC_` prefix.
