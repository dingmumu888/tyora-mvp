# Idea Detail Owner CTA Design

## Goal

Keep public idea discussions focused on reading and replying, while preserving a clear project-continuation path for the person who created the idea.

## Public Visitor Behavior

- Do not show the `Ready to build?` section to logged-out visitors.
- Do not show the project-continuation CTA to logged-in users who are not the idea author.
- Do not show a loading placeholder for the CTA while the session is being checked. This prevents the owner-only action from flashing for other visitors.
- Visitors continue to see the existing Like, Interested, comments, and reply controls.

## Idea Author Behavior

- Show the project-continuation action only when the current session user ID matches `idea.author.id`.
- Replace the large dark `Ready to build?` card with a compact, calm owner-only section.
- Use the heading `Continue your project` and supporting copy that explains TYORA will receive the current idea details.
- Keep the existing WhatsApp handoff payload: Idea ID, Idea URL, Title, and Customer Name.
- Keep the action after the reply area so it does not interrupt the public discussion flow.

## Live Activity

- Remove the `Live Activity` section from every public idea detail page.
- Do not relocate its repeated author, review, or comment-count text. Those facts already appear in the post header, TYORA Expert Review section, and comments area.
- Do not change activity data stored or shown in My TYORA or admin pages.

## Ownership And Session Rules

- Reuse the existing `/api/community/session` request inside `IdeaActions`.
- `mode="ready"` returns no UI until the session check completes.
- After the check, `mode="ready"` returns no UI unless `user.id === idea.author.id`.
- Admin status alone does not grant the public owner CTA; admins continue to use admin tools.

## Layout And Accessibility

- The owner CTA must work on desktop and mobile without increasing horizontal width.
- Use existing button styles, focus behavior, and accessible link text.
- Do not add another login prompt because logged-out visitors cannot own the post in the current browser session.

## Testing

- Add a focused regression check proving `mode="ready"` is owner-only.
- Verify the old `Ready to build?` copy and public login CTA are removed.
- Verify `Live Activity` is absent from the idea detail page.
- Verify Like, Interested, comments, reply controls, and the WhatsApp handoff fields remain present.
- Run the existing idea detail/community tests and the production build.

## Success Criteria

- A visitor replying to someone else's post does not see either section from the screenshot.
- A logged-out visitor does not see a project-continuation login prompt.
- The post author still has one compact way to continue their own project with TYORA.
- Public idea pages are shorter and remain focused on TYORA review and community replies.
