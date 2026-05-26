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
const localDemoOwnerEmail = "owner@alizstudio.test";
const localDemoOwnerName = "Aliz Studio Owner";

type OwnerAuthConfig = OwnerCredentials & {
  sessionSecret: string;
};

function isStrictProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.ALIZ_REQUIRE_PRODUCTION_SECRETS === "true"
  );
}

function isLocalDemoAuthAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.ALIZ_ALLOW_LOCAL_DEMO_AUTH === "true";
}

function getOwnerAuthConfig(): OwnerAuthConfig {
  const allowLocalDemo = isLocalDemoAuthAllowed();

  return {
    email: process.env.OWNER_EMAIL || (allowLocalDemo ? localDemoOwnerEmail : ""),
    password: process.env.OWNER_PASSWORD || "",
    name: process.env.OWNER_NAME || (allowLocalDemo ? localDemoOwnerName : "Owner"),
    sessionSecret: process.env.OWNER_SESSION_SECRET || ""
  };
}

function assertSafeOwnerAuth(config: OwnerAuthConfig) {
  const hasMissingConfig = !config.email || !config.password || !config.sessionSecret;

  if (hasMissingConfig) {
    throw new Error(
      "Owner auth requires OWNER_EMAIL, OWNER_PASSWORD, and OWNER_SESSION_SECRET. For local-only demos, set ALIZ_ALLOW_LOCAL_DEMO_AUTH=true and still choose a local OWNER_PASSWORD and OWNER_SESSION_SECRET."
    );
  }

  if (isStrictProductionRuntime() && process.env.ALIZ_ALLOW_LOCAL_DEMO_AUTH === "true") {
    throw new Error(
      "ALIZ_ALLOW_LOCAL_DEMO_AUTH must not be enabled in production. Configure private owner credentials instead."
    );
  }
}

export function getOwnerCredentials(): OwnerCredentials {
  const config = getOwnerAuthConfig();
  assertSafeOwnerAuth(config);

  return {
    email: config.email,
    password: config.password,
    name: config.name
  };
}

function getSessionSecret() {
  const config = getOwnerAuthConfig();
  assertSafeOwnerAuth(config);

  return config.sessionSecret;
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
    sameSite: "strict" as const,
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
  return isLocalDemoAuthAllowed() && process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";
}
