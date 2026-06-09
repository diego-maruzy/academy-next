const DEFAULT_ACADEMY_OIDC_LOGIN_URL =
  "https://play.checkmateproperty.com/oidc/login";

export function getAcademyOidcLoginUrl() {
  return (
    process.env.NEXT_PUBLIC_ACADEMY_OIDC_LOGIN_URL?.trim() ||
    DEFAULT_ACADEMY_OIDC_LOGIN_URL
  );
}
