export function isLikelyWebView(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (!ua) {
    return false;
  }

  if (ua.includes("wv") || ua.includes("webview")) {
    return true;
  }

  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("instagram")) {
    return true;
  }

  if (ua.includes("iphone") || ua.includes("ipad")) {
    return ua.includes("applewebkit") && !ua.includes("safari/");
  }

  if (ua.includes("android")) {
    return ua.includes("version/") && !ua.includes("chrome/");
  }

  return false;
}

export function summarizeUserAgent(userAgent: string) {
  if (!userAgent) {
    return "unknown";
  }

  const ua = userAgent.toLowerCase();

  if (isLikelyWebView(userAgent)) {
    if (ua.includes("iphone") || ua.includes("ipad")) {
      return "ios-webview";
    }

    if (ua.includes("android")) {
      return "android-webview";
    }

    return "embedded-webview";
  }

  if (ua.includes("iphone") || ua.includes("ipad")) {
    return "ios-browser";
  }

  if (ua.includes("android")) {
    return "android-browser";
  }

  if (ua.includes("macintosh")) {
    return "desktop-mac";
  }

  if (ua.includes("windows")) {
    return "desktop-windows";
  }

  return "other-browser";
}
