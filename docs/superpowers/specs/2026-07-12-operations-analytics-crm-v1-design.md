# TYORA Operations Analytics and CRM V1 Design

## Goal

Turn the admin landing page into one practical workbench and add a small, privacy-conscious visitor and customer view for early-stage operations.

## Scope

- Merge the visible Today and Work Orders entry points into one Workbench experience.
- Keep the existing unified work-order data source for Community ideas, private/custom ideas, Source requests, and project submissions.
- Show filters for All, Needs Reply, Replied, Community, Source, and Projects.
- Use blue labels for Community, purple labels for Source, and neutral labels for Projects.
- Keep advanced Community and Source management pages available.
- Add customer management based on existing CommunityUser records.
- Extend existing analytics rather than adding a third-party analytics product.

## Visitor Analytics

- Track page visits across the public site from one root-level client tracker.
- Count a visitor once per calendar day by distinct first-party visitor ID; page views remain separate.
- Capture landing path, page group, referrer, normalized source, UTM source/medium/campaign, country, city when supplied by Vercel headers, device class, and a masked IP.
- Store only a one-way hash of the IP for correlation and a masked value for display. Never store or expose the full IP.
- Source priority is UTM source first, then referrer classification, then Direct.
- Analytics failures must never break public pages.

## Customer Management

- Existing CommunityUser is the customer record for V1; no duplicate CRM user table.
- On successful email-code verification, record first seen, last login, login count, initial source, latest country/city, masked IP, and IP hash.
- Login metadata updates are best-effort and must not block a valid login.
- Admin customer rows show email, display name, joined date, last login, login count, location, masked IP, source, idea count, comment count, and reaction count.

## Workbench

- `/admin` opens Workbench as the primary view.
- Workbench header shows today unique visitors, page views, new customers, needs reply, and replied counts.
- The operational queue uses the existing WorkOrder model and API.
- Replied means a Community idea has a TYORA review or a Source/Project record has progressed beyond its initial waiting state.
- Existing edit/reply/status behavior remains intact.
- Existing destructive actions keep confirmation requirements; V1 does not add permanent hard-delete behavior.

## Privacy and Accuracy

- Visitor counts are operational estimates, not guaranteed identity counts. VPNs, cookie clearing, shared devices, and network changes can affect accuracy.
- Country and city are inferred from edge headers and may be approximate.
- No fingerprinting, session replay, advertising profiles, or third-party trackers.
- Analytics and CRM endpoints remain admin-protected.

## Failure Handling

- Tracking POST requests return a controlled error without exposing internals.
- Missing UTM, referrer, IP, country, or city values are accepted and shown as Unknown/Direct where appropriate.
- Customer login succeeds even if customer metadata persistence fails; the server logs the metadata failure without secrets.

## Verification

- Unit/static tests cover source classification, IP masking, daily unique counting, customer login metadata, admin protection, and Workbench filters.
- `npm run build` must pass with no TypeScript errors.
- Existing homepage, `/ask`, `/source`, Email Login, WhatsApp, Pricing, and Brand Film behavior must remain unchanged.
