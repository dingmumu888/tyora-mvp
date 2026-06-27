# TYORA Production Backend

TYORA stores CMS, pricing, founder profile, case studies, contact settings, team records, media records, and project submissions through server API routes backed by Supabase PostgreSQL. Uploaded images, videos, and documents are stored in Supabase Storage.

## Local Development

- Database: Supabase PostgreSQL via `DATABASE_URL`
- Uploads: Supabase Storage via `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`
- Initialize or sync database tables: `npm run db:init`
- Generate Prisma client/schema artifacts: `npm run db:generate`

Create a Supabase Storage bucket named `tyora-media` or set `SUPABASE_STORAGE_BUCKET` to your bucket name. The bucket should be public if uploaded homepage images and videos need to render directly on the public site.

Required production environment variables:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

## API Boundary

- `GET /api/content`
- `PUT /api/content`
- `DELETE /api/content`
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads`
- `GET /api/media`
- `PUT /api/media`
- `POST /api/media/upload`
- `GET /api/team`
- `PUT /api/team`

## Migration Path

The repository layer is isolated in `lib/server/data-store.ts`.

The current production target is Supabase/PostgreSQL. If TYORA later moves to another managed PostgreSQL provider:

1. Keep the API routes unchanged.
2. Update `DATABASE_URL`.
3. Use `prisma/schema.prisma` as the relational model reference.
4. Keep media in Supabase Storage or move it to another object storage service behind the same media asset records.
