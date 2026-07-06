import { getCommunitySession } from "@/lib/server/community-auth";
import { addCommunityComment } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required to comment.", 401);
  const { slug } = await params;
  try {
    return ok(await addCommunityComment(slug, await request.json(), session.userId));
  } catch (error) {
    return fail(messageFromError(error, "Unable to add comment."), 400);
  }
}
