# Operations UX Design

## Scope

Improve the post-submission experience and daily work-order handling without adding customer chat or account requirements to Source.

## Customer confirmation

- Source replaces the form with a confirmation card after a successful submit.
- The card shows the request ID, saved contact channel, expected response time of one business day, privacy reassurance, and Home/New Request actions.
- Private Custom submissions stop on a private confirmation screen showing the request ID and links to My TYORA and another request.
- Public community submissions retain the existing redirect to the public discussion.

## Work-order handling

- Work-order cards remain compact by default. Status/reply/notes/contact controls live inside a collapsed `Handle work order` section.
- Customer-visible TYORA replies remain distinct from internal notes.
- A polymorphic `WorkOrderContactEvent` table stores append-only contact records for every work-order type.
- Each event stores channel, contacted timestamp, optional next follow-up timestamp, internal note, and creation timestamp.
- Cards show the latest contact and next follow-up without opening the editor.

## Data and API

- `GET /api/admin/work-orders` includes contact history and latest follow-up fields.
- `PATCH /api/admin/work-orders` continues to update status/reply/notes and optionally appends one contact event.
- Contact records are admin-only and never exposed through public community or Source endpoints.

## Validation

- Channel must be Email, WhatsApp, Phone, or Other.
- Contact and follow-up dates must be valid ISO timestamps.
- Follow-up must not precede the contact time.
- Notes are limited to 1000 characters.

## Testing

- Static regression tests cover the confirmation screens, collapsed editor, contact fields, and API persistence path.
- Type checking, all existing regression scripts, production build, security scan, desktop/mobile visual checks, and live deployment checks are required.
