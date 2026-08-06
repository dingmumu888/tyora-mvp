export type CommunitySessionChange = "login" | "logout";

export const COMMUNITY_SESSION_SYNC_KEY = "tyora:community-session-sync";
export const COMMUNITY_SESSION_CHANNEL = "tyora:community-session";

export type CommunitySessionSignal = {
  type: CommunitySessionChange;
  changedAt: number;
};

export function emitCommunitySessionChange(type: CommunitySessionChange, user?: unknown) {
  window.dispatchEvent(new CustomEvent(`tyora:community-${type}`, {
    detail: user ? { user } : undefined
  }));
}

export function broadcastCommunitySessionChange(type: CommunitySessionChange, user?: unknown) {
  emitCommunitySessionChange(type, user);
  const signal: CommunitySessionSignal = {
    type,
    changedAt: Date.now()
  };

  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(COMMUNITY_SESSION_CHANNEL);
      channel.postMessage(signal);
      window.setTimeout(() => channel.close(), 0);
    }
  } catch {
    // Storage, focus, visibility, and server revalidation remain available.
  }

  try {
    window.localStorage.setItem(COMMUNITY_SESSION_SYNC_KEY, JSON.stringify(signal));
  } catch {
    // Same-page synchronization still works when browser storage is unavailable.
  }
}
