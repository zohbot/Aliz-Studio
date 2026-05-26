import { NextResponse } from "next/server";

const defaultMaxJsonBytes = 8_000;
const isJsonContentType = (contentType: string | null) => {
  const normalized = normalizeContentType(contentType);

  return normalized === "application/json" || normalized.endsWith("+json");
};

function normalizeContentType(contentType: string | null) {
  if (!contentType) {
    return "";
  }

  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export async function parseJsonRequest(request: Request, maxBytes = defaultMaxJsonBytes) {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Request content-type must be application/json." },
        { status: 415 }
      )
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = Number(contentLengthHeader);

  if (contentLengthHeader && (!Number.isFinite(contentLength) || contentLength < 0)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid content-length header." }, { status: 400 })
    };
  }

  if (contentLength > maxBytes) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Request body is too large." }, { status: 413 })
    };
  }

  const body = await request.text();

  if (body.length > maxBytes) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Request body is too large." }, { status: 413 })
    };
  }

  try {
    return {
      ok: true as const,
      data: JSON.parse(body)
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
