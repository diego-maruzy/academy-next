export function getOidcAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.APP_URL?.replace(/\/$/, "") ??
    "https://play.checkmateproperty.com"
  );
}
