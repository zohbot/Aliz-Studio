import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ownerSessionCookieName = "aliz_owner_session";

export type OwnerSession = {
  userId: "owner";
  email: string;
  name: string;
  role: "owner";
  expiresAt: number;
};

type OwnerCredentials = {
  email: string;
  password: string;
  name: string;
};

const eightHoursInSeconds = 60 * 60 * 8;

export function getOwnerCredentials(): OwnerCredentials {
  return {
    email: process.env.OWNER_EMAIL || "owner@alizstudio.test",
    password: process.env.OWNER_PASSWORD || "aliz-demo-2026",
    name: process.env.OWNER_NAME || "Aliz Studio Owner"
  };
}

function getSessionSecret() {
  return process.env.OWNER_SESSION_SECRET || "development-only-aliz-studio-session-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function signaturesMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createOwnerSessionToken(credentials: OwnerCredentials = getOwnerCredentials()) {
  const session: OwnerSession = {
    userId: "owner",
    email: credentials.email,
    name: credentials.name,
    role: "owner",
    expiresAt: Date.now() + eightHoursInSeconds * 1000
  };
  const payload = base64UrlEncode(JSON.stringify(session));

  return `${payload}.${sign(payload)}`;
}

export function verifyOwnerSessionToken(token?: string): OwnerSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !signaturesMatch(sign(payload), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as OwnerSession;

    if (session.role !== "owner" || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getOwnerSession() {
  const cookieStore = await cookies();

  return verifyOwnerSessionToken(cookieStore.get(ownerSessionCookieName)?.value);
}

export function getOwnerCookieOptions() {
  return {
    httpOnly: true,
    maxAge: eightHoursInSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function isValidOwnerLogin(email: string, password: string) {
  const credentials = getOwnerCredentials();

  return email.trim().toLowerCase() === credentials.email.toLowerCase() && password === credentials.password;
}
