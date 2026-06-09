import {
  validateHostTokens,
  type HostTokenValidationResult,
} from "@/lib/auth/host-token-validation";
import type { ResolvedKeycloakRoles } from "@/lib/auth/keycloak-token";

export type ValidatedKeycloakIdentity = {
  sub: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  roles: ResolvedKeycloakRoles;
  clientId: string;
  claims: {
    iss: string;
    aud?: string | string[];
    azp?: string;
    exp?: number;
    iat?: number;
  };
};

export { validateHostTokens, type HostTokenValidationResult };

export async function validateKeycloakTokens(input: {
  idToken?: string | null;
  accessToken?: string | null;
}): Promise<ValidatedKeycloakIdentity | null> {
  const result = await validateHostTokens(input);

  if (!result.ok) {
    return null;
  }

  return {
    sub: result.sub,
    email: result.email,
    name: result.name,
    givenName: result.givenName,
    familyName: result.familyName,
    roles: result.roles,
    clientId: result.clientId,
    claims: result.claims,
  };
}
