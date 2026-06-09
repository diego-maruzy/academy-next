type AuthCookieResult = {
  csrfToken: string;
  setCookieHeaders: string[];
  cookieHeader: string;
};

export type KeycloakSignInRedirectResult = {
  url: string;
  setCookieHeaders: string[];
};

function appendSetCookieHeaders(target: string[], response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    target.push(...headers.getSetCookie());
    return;
  }

  const single = response.headers.get("set-cookie");

  if (single) {
    target.push(single);
  }
}

function mergeCookieHeader(existing: string | null, setCookies: string[]) {
  const jar = new Map<string, string>();

  for (const part of (existing ?? "").split(";")) {
    const trimmed = part.trim();

    if (!trimmed) {
      continue;
    }

    const [name, ...rest] = trimmed.split("=");
    jar.set(name, rest.join("="));
  }

  for (const header of setCookies) {
    const [pair] = header.split(";");
    const [name, ...rest] = pair.split("=");
    jar.set(name.trim(), rest.join("="));
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

export async function fetchAuthCsrf(
  origin: string,
  cookieHeader: string | null,
): Promise<AuthCookieResult | null> {
  const setCookieHeaders: string[] = [];
  const cookies = cookieHeader ?? "";

  const csrfResponse = await fetch(`${origin}/api/auth/csrf`, {
    headers: { cookie: cookies },
    cache: "no-store",
  });

  if (!csrfResponse.ok) {
    return null;
  }

  appendSetCookieHeaders(setCookieHeaders, csrfResponse);

  const csrfPayload = (await csrfResponse.json()) as { csrfToken?: string };
  const csrfToken = csrfPayload.csrfToken;

  if (!csrfToken) {
    return null;
  }

  return {
    csrfToken,
    setCookieHeaders,
    cookieHeader: mergeCookieHeader(cookies, setCookieHeaders),
  };
}

export async function getKeycloakSignInRedirect(
  origin: string,
  cookieHeader: string | null,
  redirectTo: string,
): Promise<KeycloakSignInRedirectResult | null> {
  const csrf = await fetchAuthCsrf(origin, cookieHeader);

  if (!csrf) {
    return null;
  }

  const signInResponse = await fetch(`${origin}/api/auth/signin/keycloak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: csrf.cookieHeader,
    },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: redirectTo,
    }),
    redirect: "manual",
    cache: "no-store",
  });

  const setCookieHeaders = [...csrf.setCookieHeaders];
  appendSetCookieHeaders(setCookieHeaders, signInResponse);

  const location = signInResponse.headers.get("location");

  if (!location || signInResponse.status < 300 || signInResponse.status >= 400) {
    return null;
  }

  return {
    url: location,
    setCookieHeaders,
  };
}
