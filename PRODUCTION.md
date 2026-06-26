# TYORA Production Backend

TYORA stores CMS, project, team, and media records through server API routes backed by SQLite.

## Local Development

- Database: `prisma/dev.db`
- Uploads: `public/uploads`
- Initialize database tables: `npm run db:init`
- Generate Prisma client/schema artifacts: `npm run db:generate`

The app auto-creates SQLite tables on first API access, so `npm run dev` works after install.

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

To move from local SQLite to Supabase or PostgreSQL later:

1. Keep the API routes unchanged.
2. Replace the repository implementation in `lib/server/data-store.ts`.
3. Use `prisma/schema.prisma` as the relational model reference.
4. Move uploaded files from `public/uploads` to object storage such as Supabase Storage or S3.
