import type { VideoProvider } from "@/types/shorts";

type VimeoEmbedOptions = {
  title?: boolean;
  byline?: boolean;
  portrait?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  background?: boolean;
};

type YouTubeEmbedOptions = {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  enableJsApi?: boolean;
};

export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url.trim());
}

export function detectVideoProvider(url: string): VideoProvider | null {
  const normalized = url.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (isDirectVideoUrl(normalized)) {
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
    autoplay: String(options.autoplay ?? false),
    muted: String(options.muted ?? true),
    controls: String(options.controls ?? true),
    background: String(options.background ?? false),
    playsinline: "1",
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

export function getYouTubeEmbedUrl(
  url: string | null,
  options: YouTubeEmbedOptions = {},
): string | null {
  if (!url) {
    return null;
  }

  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];

  let videoId: string | null = null;

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    return null;
  }

  const hasReelsOptions =
    options.autoplay !== undefined ||
    options.muted !== undefined ||
    options.controls !== undefined ||
    options.loop !== undefined ||
    options.enableJsApi !== undefined;

  if (!hasReelsOptions) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  const params = new URLSearchParams({
    autoplay: options.autoplay ? "1" : "0",
    mute: options.muted === false ? "0" : "1",
    controls: options.controls === false ? "0" : "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: options.enableJsApi ? "1" : "0",
  });

  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
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

export function getReelsEmbedUrl(
  url: string | null,
  provider: VideoProvider,
): string | null {
  if (!url || isDirectVideoUrl(url)) {
    return null;
  }

  if (provider === "youtube") {
    return getYouTubeEmbedUrl(url, {
      autoplay: true,
      muted: true,
      controls: false,
      loop: true,
      enableJsApi: true,
    });
  }

  return getVimeoEmbedUrl(url, {
    title: false,
    byline: false,
    portrait: false,
    autoplay: true,
    muted: true,
    controls: false,
    background: false,
  });
}

export function postEmbedPlay(
  iframe: HTMLIFrameElement,
  provider: VideoProvider,
) {
  if (provider === "youtube") {
    iframe.contentWindow?.postMessage(
      '{"event":"command","func":"playVideo","args":""}',
      "*",
    );
    return;
  }

  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: "play" }),
    "*",
  );
}

export function postEmbedPause(
  iframe: HTMLIFrameElement,
  provider: VideoProvider,
) {
  if (provider === "youtube") {
    iframe.contentWindow?.postMessage(
      '{"event":"command","func":"pauseVideo","args":""}',
      "*",
    );
    return;
  }

  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: "pause" }),
    "*",
  );
}

export function postEmbedMute(
  iframe: HTMLIFrameElement,
  provider: VideoProvider,
  muted: boolean,
) {
  if (provider === "youtube") {
    iframe.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: muted ? "mute" : "unMute",
        args: "",
      }),
      "*",
    );
    return;
  }

  iframe.contentWindow?.postMessage(
    JSON.stringify({ method: "setVolume", value: muted ? 0 : 1 }),
    "*",
  );
}
