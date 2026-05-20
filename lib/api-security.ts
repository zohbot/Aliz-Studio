import { NextResponse } from "next/server";

const defaultMaxJsonBytes = 8_000;

export async function parseJsonRequest(request: Request, maxBytes = defaultMaxJsonBytes) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > maxBytes) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Request body is too large." }, { status: 413 })
    };
  }

  try {
    return {
      ok: true as const,
      data: await request.json()
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
    };
  }
}

export function assertSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const allowedOrigins = new Set([requestOrigin]);
  const requestUrl = new URL(request.url);

  if (configuredOrigin) {
    allowedOrigins.add(new URL(configuredOrigin).origin);
  }

  if (process.env.NODE_ENV !== "production" && requestUrl.port) {
    allowedOrigins.add(`${requestUrl.protocol}//127.0.0.1:${requestUrl.port}`);
    allowedOrigins.add(`${requestUrl.protocol}//localhost:${requestUrl.port}`);
  }

  if (allowedOrigins.has(origin)) {
    return null;
  }

  return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
}
