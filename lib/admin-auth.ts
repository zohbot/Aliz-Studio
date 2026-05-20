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
const defaultOwnerEmail = "owner@alizstudio.test";
const defaultOwnerPassword = "aliz-demo-2026";
const defaultSessionSecret = "development-only-aliz-studio-session-secret";

function isStrictProductionRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.ALIZ_REQUIRE_PRODUCTION_SECRETS === "true";
}

function assertSafeProductionAuth() {
  if (!isStrictProductionRuntime()) {
    return;
  }

  const hasUnsafeEmail = !process.env.OWNER_EMAIL || process.env.OWNER_EMAIL === defaultOwnerEmail;
  const hasUnsafePassword = !process.env.OWNER_PASSWORD || process.env.OWNER_PASSWORD === defaultOwnerPassword;
  const hasUnsafeSecret =
    !process.env.OWNER_SESSION_SECRET || process.env.OWNER_SESSION_SECRET === defaultSessionSecret;

  if (hasUnsafeEmail || hasUnsafePassword || hasUnsafeSecret) {
    throw new Error(
      "Production owner auth requires OWNER_EMAIL, OWNER_PASSWORD, and OWNER_SESSION_SECRET overrides."
    );
  }
}

export function getOwnerCredentials(): OwnerCredentials {
  assertSafeProductionAuth();

  return {
    email: process.env.OWNER_EMAIL || defaultOwnerEmail,
    password: process.env.OWNER_PASSWORD || defaultOwnerPassword,
    name: process.env.OWNER_NAME || "Aliz Studio Owner"
  };
}

function getSessionSecret() {
  assertSafeProductionAuth();

  return process.env.OWNER_SESSION_SECRET || defaultSessionSecret;
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

function stringsMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const maxLength = Math.max(leftBuffer.length, rightBuffer.length);
  const paddedLeft = Buffer.concat([leftBuffer, Buffer.alloc(maxLength - leftBuffer.length)]);
  const paddedRight = Buffer.concat([rightBuffer, Buffer.alloc(maxLength - rightBuffer.length)]);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(paddedLeft, paddedRight);
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
  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = credentials.email.toLowerCase();

  return stringsMatch(normalizedEmail, expectedEmail) && stringsMatch(password, credentials.password);
}

export function shouldShowDemoOwnerCredentials() {
  return !isStrictProductionRuntime() && process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "false";
}
