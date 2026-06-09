export const EMBEDDED_PARAM = "embedded";
export const RETURN_URL_PARAM = "returnUrl";

export type EmbeddedContext = {
  embedded: boolean;
  returnUrl: string | null;
};

export function getEmbeddedContextFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): EmbeddedContext {
  return {
    embedded: searchParams.get(EMBEDDED_PARAM) === "1",
    returnUrl: searchParams.get(RETURN_URL_PARAM),
  };
}

export function appendEmbeddedParamsToPath(
  path: string,
  context: EmbeddedContext,
  baseUrl = "http://local",
): string {
  if (!context.embedded && !context.returnUrl) {
    return path;
  }

  const url = new URL(path, baseUrl);

  if (context.embedded) {
    url.searchParams.set(EMBEDDED_PARAM, "1");
  }

  if (context.returnUrl) {
    url.searchParams.set(RETURN_URL_PARAM, context.returnUrl);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildPathWithEmbeddedParams(
  path: string,
  searchParams: Pick<URLSearchParams, "get">,
  baseUrl = "http://local",
) {
  return appendEmbeddedParamsToPath(
    path,
    getEmbeddedContextFromSearchParams(searchParams),
    baseUrl,
  );
}

export function copyEmbeddedSearchParams(
  source: Pick<URLSearchParams, "get">,
  target: URLSearchParams,
) {
  if (source.get(EMBEDDED_PARAM) === "1") {
    target.set(EMBEDDED_PARAM, "1");
  }

  const returnUrl = source.get(RETURN_URL_PARAM);

  if (returnUrl) {
    target.set(RETURN_URL_PARAM, returnUrl);
  }
}
