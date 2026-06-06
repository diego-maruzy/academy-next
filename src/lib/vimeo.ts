export function getVimeoEmbedUrl(vimeoUrl: string | null): string | null {
  if (!vimeoUrl) {
    return null;
  }

  const match = vimeoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const videoId = match?.[1];

  if (!videoId) {
    return null;
  }

  return `https://player.vimeo.com/video/${videoId}`;
}
