// There's no standard way for a page to ask a wallet "what tokens does this address hold" —
// that needs a blockchain indexer (e.g. Alchemy's Token API), and none support Arc yet since
// mainnet only just launched. This is the practical fallback: remember tokens the user has
// actually locked before, per chain, in this browser, so re-locking doesn't mean re-pasting the
// address every time.
export type RecentToken = { address: `0x${string}`; symbol: string };

const MAX_RECENT = 8;

function storageKey(chainId: number) {
  return `arc-token-lock:recent-tokens:${chainId}`;
}

export function getRecentTokens(chainId: number): RecentToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(chainId));
    return raw ? (JSON.parse(raw) as RecentToken[]) : [];
  } catch {
    return [];
  }
}

export function addRecentToken(chainId: number, token: RecentToken) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentTokens(chainId).filter((t) => t.address.toLowerCase() !== token.address.toLowerCase());
    const updated = [token, ...existing].slice(0, MAX_RECENT);
    window.localStorage.setItem(storageKey(chainId), JSON.stringify(updated));
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts — losing the
    // convenience list isn't worth failing the page over.
  }
}
