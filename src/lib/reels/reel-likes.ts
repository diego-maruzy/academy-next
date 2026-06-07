const STORAGE_KEY = "academy-reel-likes";

export function getStoredReelLikes(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((value) => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export function saveStoredReelLikes(likes: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...likes]));
}

export function toggleStoredReelLike(reelId: string): boolean {
  const likes = getStoredReelLikes();

  if (likes.has(reelId)) {
    likes.delete(reelId);
  } else {
    likes.add(reelId);
  }

  saveStoredReelLikes(likes);
  return likes.has(reelId);
}
