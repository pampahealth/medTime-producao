import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";

const USE_BACKEND_PROXY = process.env.USE_BACKEND_PROXY === "true";

const PROXY_DISABLED_RESPONSE = new Response(
  JSON.stringify({ success: false, errorMessage: "Backend proxy desativado (USE_BACKEND_PROXY)" }),
  { status: 503, headers: { "Content-Type": "application/json" } }
);

function getPathSegments(path: string[]): string[] {
  return Array.isArray(path) ? path : path ? [path] : [];
}

function proxyError(data: unknown, status: number): Response {
  const err = data as { errorMessage?: string; message?: string };
  return createErrorResponse({
    errorMessage: err?.errorMessage ?? err?.message ?? "Erro no backend",
    status,
  });
}

async function proxy(
  request: NextRequest,
  path: string[],
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<Response> {
  const opts = {
    method,
    pathSegments: path,
    searchParams: request.nextUrl.searchParams,
    headers: request.headers,
    ...(body !== undefined && (method === "POST" || method === "PUT") ? { body } : {}),
  };
  const { status, data } = await proxyToBackend(opts);
  if (status >= 400) return proxyError(data, status);
  return createSuccessResponse(data ?? null, status === 204 ? 200 : status);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!USE_BACKEND_PROXY) return PROXY_DISABLED_RESPONSE;
  const path = getPathSegments((await context.params).path ?? []);
  return proxy(request, path, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!USE_BACKEND_PROXY) return PROXY_DISABLED_RESPONSE;
  const path = getPathSegments((await context.params).path ?? []);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  return proxy(request, path, "POST", body);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!USE_BACKEND_PROXY) return PROXY_DISABLED_RESPONSE;
  const path = getPathSegments((await context.params).path ?? []);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  return proxy(request, path, "PUT", body);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!USE_BACKEND_PROXY) return PROXY_DISABLED_RESPONSE;
  const path = getPathSegments((await context.params).path ?? []);
  return proxy(request, path, "DELETE");
}
