import type { VideoProvider } from "@/types/shorts";

type VimeoEmbedOptions = {
  title?: boolean;
  byline?: boolean;
  portrait?: boolean;
};

export function detectVideoProvider(url: string): VideoProvider | null {
  const normalized = url.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes("vimeo.com") ||
    normalized.includes("player.vimeo.com")
  ) {
    return "vimeo";
  }

  if (
    normalized.includes("youtube.com") ||
    normalized.includes("youtu.be")
  ) {
    return "youtube";
  }

  return null;
}

export function getVimeoEmbedUrl(
  url: string | null,
  options: VimeoEmbedOptions = {},
): string | null {
  if (!url) {
    return null;
  }

  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const videoId = match?.[1];

  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    title: String(options.title ?? false),
    byline: String(options.byline ?? false),
    portrait: String(options.portrait ?? false),
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

export function getVideoEmbedUrl(
  url: string | null,
  provider: VideoProvider,
): string | null {
  if (!url) {
    return null;
  }

  if (provider === "youtube") {
    return getYouTubeEmbedUrl(url);
  }

  return getVimeoEmbedUrl(url);
}
