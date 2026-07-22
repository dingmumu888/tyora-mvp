# Infrastructure portability

TYORA's relational data is accessed through Prisma and the standard PostgreSQL protocol. Application routes do not depend on Supabase database or authentication APIs. A future move to self-hosted PostgreSQL therefore keeps the existing Prisma schema, server APIs, email-login flow, and session model; the reviewed operational work is backup, restore, TLS, pooling, migration history, and rollback.

TYORA accesses object storage through the server-only `StorageProvider` contract. Public CMS uploads and private customer-file uploads no longer call a provider-specific API from application routes or business stores.

## Current provider

`TYORA_STORAGE_PROVIDER=supabase` is the only enabled provider. It is also the compatibility default when the variable is absent. The Supabase adapter continues to use the existing public and private bucket variables, verifies that the customer-file bucket is non-public, and issues private signed URLs for no more than 120 seconds.

Unknown provider names fail closed. They never fall back to public storage.

## Current service boundaries

- PostgreSQL: provider-neutral through `DATABASE_URL` and Prisma.
- Application APIs: owned by the Next.js application.
- Login and sessions: owned by TYORA; email delivery currently uses Resend.
- Object storage: provider-neutral application contract with a Supabase adapter.
- Public and private files: separate namespaces and buckets; private files remain authorized and short-lived.

## Adding a future provider

1. Implement `StorageProvider` in a new server-only adapter.
2. Keep public and private namespaces separate.
3. Verify private-container metadata before every private upload and signing operation.
4. Return permanent URLs only for public CMS media.
5. Return short-lived, provider-verified signed URLs for private objects.
6. Add the provider to `resolveStorageProviderKind` and `getStorageProvider` only after its authorization and path-policy tests pass.
7. Migrate object bytes while preserving object paths, then validate Preview before changing any runtime configuration.

## Future self-hosted cutover

1. Restore a sanitized backup into a non-production self-hosted PostgreSQL instance.
2. Verify Prisma migration history, TLS, connection pooling, backups, and point-in-time recovery.
3. Implement and test a `StorageProvider` adapter for the chosen object store or private storage API.
4. Copy public and private objects without changing their stored object paths.
5. Verify private authorization, signed URL expiry, upload validation, and public CMS URLs in Preview.
6. Switch Preview configuration first and run the complete acceptance suite.
7. Prepare a timed Production cutover and rollback; do not point the application at both writable databases.

Changing PostgreSQL hosts does not require replacing the application data model. It is not an automatic or zero-risk operation: database rows and object bytes still need a controlled migration with backups and rollback.
