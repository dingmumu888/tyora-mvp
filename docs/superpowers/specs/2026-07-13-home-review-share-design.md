# Homepage Review And Sharing Design

## Goal

Make TYORA's real manufacturing feedback visible and readable from the community homepage, remove redundant question labels, prevent the HOT badge from covering timestamps, and make idea sharing work consistently across desktop and mobile.

## Homepage Cards

- Remove the `Can this be manufactured?` and `Estimated Cost?` question chips.
- Show a small `TYORA REVIEW` label when an expert review exists.
- Show a concise summary of the real review in bold black text.
- Clamp the summary to two lines and use an ellipsis for overflow. The card remains clickable so visitors can read the complete review on the idea detail page.
- Prefer the review's additional notes, then feasibility, estimated cost, MOQ, material, and sample notes when producing the summary.
- Show `TYORA review pending` in muted text when no review exists.
- Move the HOT badge onto the image at the top-left so it cannot overlap the timestamp.

## Idea Detail

- Remove the two question chips below the image gallery.
- Keep the complete TYORA Expert Review visible without truncation.
- Render the review body in bold black text so it is visually prominent while retaining the existing teal review container and heading.

## Sharing

- The Share button always opens a share panel instead of silently depending on `navigator.share`.
- The panel offers Facebook, X, LinkedIn, WhatsApp, Copy Link, and More Apps.
- Social links open the platform's supported share composer in a new tab.
- More Apps uses the native Web Share API when available. This is the supported route to Instagram and other installed apps; the web page will not claim that direct Instagram posting is available.
- If native sharing is unavailable, More Apps copies the link and displays clear confirmation.
- Every share choice records an `idea_share` analytics event with the idea path and platform in the analytics path value. This records share attempts for future referral work without claiming that TYORA can read likes on external networks.

## Accessibility And Error Handling

- The share panel supports Escape, backdrop close, explicit close, and descriptive labels.
- Clipboard and native share failures must not break the idea page. Cancellation is silent; genuine failures fall back to copying the link where possible.
- Existing Like and Interested behavior remains unchanged.

## Verification

- Add regression checks for the two-line homepage review, pending state, removed question chips, HOT placement, full detail review, share destinations, fallback behavior, and analytics event type.
- Run all source regression scripts, TypeScript checks, production build, and responsive browser checks before deployment.
