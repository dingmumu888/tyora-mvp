import { prisma } from "@/lib/server/db";
import { trafficContext } from "@/lib/server/traffic-context";

function cookieValue(cookieHeader: string, name: string) {
  const item = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!item) return "";
  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return "";
  }
}

export async function recordCommunityUserLogin(userId: string, request: Request) {
  const visitorId = cookieValue(request.headers.get("cookie") || "", "tyora_visitor_id");
  const [user, firstVisit] = await Promise.all([
    prisma.communityUser.findUnique({ where: { id: userId } }),
    visitorId ? prisma.analyticsEvent.findFirst({
      where: { visitorId, type: "page_visit" },
      orderBy: { createdAt: "asc" },
      select: { referrerSource: true, countryCode: true, cityName: true }
    }) : null
  ]);
  if (!user) return;

  const context = trafficContext(request, "", request.headers.get("referer") || "");
  await prisma.communityUser.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
      firstTrafficSource: user.firstTrafficSource || firstVisit?.referrerSource || context.referrerSource,
      lastCountry: context.countryCode || firstVisit?.countryCode || user.lastCountry,
      lastCity: context.cityName || firstVisit?.cityName || user.lastCity,
      lastIpHash: context.ipHash || user.lastIpHash,
      lastMaskedIp: context.maskedIp || user.lastMaskedIp
    }
  });
}

export type AdminCustomer = {
  id: string;
  email: string;
  name: string;
  username: string;
  joinedAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  source: string;
  country: string;
  city: string;
  maskedIp: string;
  ideaCount: number;
  commentCount: number;
  reactionCount: number;
};

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const rows = await prisma.communityUser.findMany({
    orderBy: [{ lastLoginAt: "desc" }, { joinedAt: "desc" }],
    take: 500,
    include: { _count: { select: { ideas: true, comments: true, reactions: true } } }
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    joinedAt: row.joinedAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() || null,
    loginCount: row.loginCount,
    source: row.firstTrafficSource || "Direct",
    country: row.lastCountry || row.country || "Unknown",
    city: row.lastCity || "",
    maskedIp: row.lastMaskedIp || "",
    ideaCount: row._count.ideas,
    commentCount: row._count.comments,
    reactionCount: row._count.reactions
  }));
}
