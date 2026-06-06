import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "checkmate_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSessionPayload = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permission: string;
};

export function getAdminSessionSecretError(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    return "ADMIN_SESSION_SECRET ausente ou inválida. Configure no .env.local com pelo menos 32 caracteres e reinicie o servidor.";
  }

  return null;
}

function getSessionSecret() {
  const configError = getAdminSessionSecretError();

  if (configError) {
    throw new Error(configError);
  }

  return new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);
}

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function verifyAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const session = payload as Partial<AdminSessionPayload>;

    if (
      !session.id ||
      !session.email ||
      !session.full_name ||
      !session.role ||
      !session.permission
    ) {
      return null;
    }

    return {
      id: session.id,
      email: session.email,
      full_name: session.full_name,
      role: session.role,
      permission: session.permission,
    };
  } catch {
    return null;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyAdminSessionFromToken(
  token: string,
): Promise<AdminSessionPayload | null> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET;

    if (!secret || secret.length < 32) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const session = payload as Partial<AdminSessionPayload>;

    if (
      !session.id ||
      !session.email ||
      !session.full_name ||
      !session.role ||
      !session.permission
    ) {
      return null;
    }

    return {
      id: session.id,
      email: session.email,
      full_name: session.full_name,
      role: session.role,
      permission: session.permission,
    };
  } catch {
    return null;
  }
}
