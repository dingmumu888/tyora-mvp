export type CommunitySessionChange = "login" | "logout";

export const COMMUNITY_SESSION_SYNC_KEY = "tyora:community-session-sync";

export function emitCommunitySessionChange(type: CommunitySessionChange, user?: unknown) {
  window.dispatchEvent(new CustomEvent(`tyora:community-${type}`, {
    detail: user ? { user } : undefined
  }));
}

export function broadcastCommunitySessionChange(type: CommunitySessionChange, user?: unknown) {
  emitCommunitySessionChange(type, user);
  try {
    window.localStorage.setItem(COMMUNITY_SESSION_SYNC_KEY, JSON.stringify({
      type,
      changedAt: Date.now()
    }));
  } catch {
    // Same-page synchronization still works when browser storage is unavailable.
  }
}
