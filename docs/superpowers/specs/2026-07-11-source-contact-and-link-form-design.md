# Source Contact and Product Link Form Design

## Goal

Reduce Source form submission failures and make contact entry easier for international buyers. The form must accept either email or WhatsApp, guide customers through WhatsApp country codes, and never block an otherwise valid request because an optional product link is malformed.

## Scope

This change applies to the public `/source` form on desktop and mobile, its `/api/source` submission path, and focused automated tests. It does not change Source pricing, admin workflow, database schema, or existing stored requests.

## Contact Fields

- Replace the combined `Email or WhatsApp` field with separate `Email` and `WhatsApp` controls.
- Require at least one completed contact method. Customers may provide both.
- Validate email only when an email value is present.
- Store email and WhatsApp in the existing separate payload fields.
- Display one clear form-level message when both contact methods are empty: `Please add an email address or WhatsApp number.`

## WhatsApp Country Code Selector

- Render WhatsApp as a country-code selector followed by a local-number input.
- Include a searchable list of common international destinations, with country name, ISO code, flag, and dialing code.
- Search must match dialing codes such as `+86`, English country names, and ISO country codes. Chinese aliases may be included where useful.
- Preselect the dialing code from the visitor country detected by the existing request-header country mechanism.
- Use `+1` when the country cannot be detected or mapped.
- Customers can always replace the preselected country code.
- Normalize the local number by removing spaces, parentheses, and hyphens before joining it with the selected dialing code.
- If the customer pastes a number that already starts with `+`, preserve that complete international number rather than adding the selected code twice.
- Do not claim that the number is active on WhatsApp; only apply basic format validation.

## Product Link Behavior

- Keep Product link optional.
- Add helper text: `Optional. Paste a product page link, for example https://www.1688.com/...`
- Normalize domain-like values by adding `https://` when the customer omits the protocol. For example, `www.1688.com/item/...` becomes `https://www.1688.com/item/...`.
- Accept only `http://` or `https://` URLs after normalization.
- If the value is still invalid, omit the link from the payload and allow the rest of the request to submit.
- Show a non-blocking notice after submission that the request was received but the invalid link was not saved.
- The server must also treat a malformed optional link as absent so older clients cannot cause a rejected request.

## Interaction And Layout

- Keep the two contact fields in the main required part of the form, above `More details (optional)`.
- On desktop, Email and WhatsApp may share a two-column row when space allows.
- On mobile, stack the fields and keep the dialing-code selector wide enough for a flag and code without crowding the local number.
- The country list opens as a compact searchable popover. It closes after selection, on outside click, and on Escape.
- Use existing Source page colors, input heights, border radii, and focus styles.
- All controls require accessible labels and keyboard operation.

## Data Flow

1. The page requests or receives the visitor country code without collecting or displaying the IP address.
2. The form maps that country to a default WhatsApp dialing code.
3. On submission, the client validates the required image, category, quantity, and at least one contact method.
4. The client normalizes email, WhatsApp, and product link values.
5. The API validates contact data and sanitizes the optional link again.
6. The existing Source request record stores the normalized values in its current columns.

## Error Handling

- Never surface raw browser or DOM exception text to the customer.
- Use field-specific, plain-English validation messages.
- A malformed optional link is a warning, not a submission error.
- A malformed email is an error only when WhatsApp is also absent; if a valid WhatsApp number is present, omit the malformed optional email and submit with a warning.
- A clearly incomplete WhatsApp local number is an error only when email is also absent; if a valid email is present, omit the incomplete WhatsApp number and submit with a warning.

## Testing

- Existing Source conversion tests continue to pass.
- Add tests proving separate email and WhatsApp fields are rendered.
- Add tests for the at-least-one-contact rule.
- Add tests for IP-country dialing-code defaults and the `+1` fallback.
- Add tests for country-code searching and complete-number normalization.
- Add tests proving a link without a protocol is normalized.
- Add tests proving an invalid optional link is omitted and does not block submission.
- Run the production build after focused tests.

## Success Criteria

- A buyer can submit with email only, WhatsApp only, or both.
- A buyer can find `+86` by searching and enter a Chinese WhatsApp number without typing the country code manually.
- A buyer who enters `www.1688.com` can still submit successfully.
- Invalid optional data produces a clear warning rather than `The string did not match the expected pattern.`
- The experience works on both desktop and mobile without changing the existing Source service content.
