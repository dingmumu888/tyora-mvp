# TYORA Customer Paths P0 Design

## Goal

Make the three customer paths unambiguous and safe on mobile and desktop: public Ideas, private Custom, and existing-product Source.

## Scope

- Homepage featured idea cards open their own idea detail pages.
- Mobile idea submission includes an explicit Public / Private choice.
- `/custom` provides a clear private submission entry using the existing private idea workflow.
- Mobile navigation uses `Custom` instead of `Build`; `/build` remains available as a compatibility route but is no longer a primary customer path.
- Idea images preserve their full composition instead of being center-cropped to a square.
- Site search includes Custom and uses working Source pricing and protection anchors.
- Desktop navigation removes the duplicate Pricing item.

## Constraints

- Reuse the existing community idea API and `visibility: "Private"`; do not create a second custom-project data model.
- Do not change Source pricing, Custom pricing, authentication, or backend response schemas in this batch.
- Keep `/build` working for existing links.
- Preserve existing public idea posting behavior.
- All visible customer copy remains English.

## User Flow

1. Public creator chooses Ideas and posts publicly.
2. Confidential creator chooses Custom and enters the existing submission flow preselected as Private.
3. Buyer with an existing product chooses Source.
4. Mobile and desktop expose the same three labels and destinations.

## Verification

- Static regression scripts cover links, visibility defaults, image processing, navigation, and search anchors.
- Existing Source, idea detail, login, notification, and work-order tests continue to pass, except obsolete assertions updated to match approved behavior.
- `npm run build` and security scan pass.

