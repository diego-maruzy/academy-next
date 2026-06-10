/**
 * Normalização segura para tokens em variáveis de ambiente.
 * Não altera caracteres internos do JWT (base64url).
 */
export function normalizeTokenFromEnv(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  let token = value.trim();

  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }

  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }

  token = token.replace(/[\r\n\t]/g, "");

  return token.length > 0 ? token : undefined;
}

/**
 * Normalização para tokens em query string / hash da URL.
 * Corrige '+' que virou espaço durante transporte HTTP.
 */
export function normalizeTokenFromQuery(
  value: string | null | undefined,
): string | undefined {
  const base = normalizeTokenFromEnv(value);

  if (!base) {
    return undefined;
  }

  try {
    return decodeURIComponent(base).replace(/ /g, "+");
  } catch {
    return base.replace(/ /g, "+");
  }
}
