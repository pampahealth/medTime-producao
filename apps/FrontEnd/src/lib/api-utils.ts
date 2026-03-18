import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "./create-response";
import { AUTH_ENABLED, authConfig } from "../config/auth-config";
import { AUTH_CODE } from "@/constants/auth";
import { User } from "@/types/auth";

export interface JWTPayload extends User {
  iat: number;
  exp: number;
}

export interface ApiParams {
  token?: string;
  payload?: JWTPayload | null;
}

export function getCookies(request: NextRequest, names: string[]): string[] {
  const cookies = request.cookies.getAll();
  return cookies
    .filter((cookie) => names.includes(cookie.name))
    .map((cookie) => cookie.value) || [];
}

export function validateEnv(): void {
  const requiredVars = [
    "POSTGREST_URL",
    "POSTGREST_SCHEMA",
    "POSTGREST_API_KEY",
  ];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const offset = Math.max(0, parseInt(searchParams.get("offset") || String(DEFAULT_OFFSET), 10) || DEFAULT_OFFSET);
  return {
    limit,
    offset,
    id: searchParams.get("id"),
    search: searchParams.get("search"),
  };
}

export async function validateRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      throw new Error("Invalid request body");
    }

    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Higher-order function to verify token - use this to protect API routes
 * When AUTH_ENABLED is false, token verification is skipped
 *
 * @param handler - The request handler function
 * @param checkToken - Whether to check the token (only effective when AUTH_ENABLED is true)
 */
export function requestMiddleware(
  handler: (request: NextRequest, params: ApiParams) => Promise<Response>,
  checkToken: boolean = true
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const params: ApiParams = {};

      // Only verify token when AUTH_ENABLED is true and checkToken is true
      if (AUTH_ENABLED && checkToken) {
        // Dynamic import to avoid loading auth module when not needed
        const { verifyToken } = await import("./auth");

        const [token] = getCookies(request, [authConfig.tokenCookieName]);
        const { code, payload } = await verifyToken(token);

        if (code === AUTH_CODE.TOKEN_EXPIRED) {
          return createErrorResponse({
            errorCode: AUTH_CODE.TOKEN_EXPIRED,
            errorMessage: "need login",
            status: 401,
          });
        } else if (code === AUTH_CODE.TOKEN_MISSING) {
          return createErrorResponse({
            errorCode: AUTH_CODE.TOKEN_MISSING,
            errorMessage: "need login",
            status: 401,
          });
        }

        params.token = token;
        params.payload = payload;
      }

      return await handler(request, params);
    } catch (error: unknown) {
      // Pass through Response objects as-is
      if (error instanceof Response) {
        return error;
      }

      console.error("Request middleware error:", error);

      const anyError = error as any;
      const errorMessage: string =
        typeof anyError?.message === "string"
          ? anyError.message
          : "Request failed";
      const status: number =
        typeof anyError?.status === "number"
          ? anyError.status
          : typeof anyError?.statusCode === "number"
            ? anyError.statusCode
            : 500;
      const errorCode: string | undefined =
        typeof anyError?.code === "string" ? anyError.code : undefined;

      return createErrorResponse({
        errorCode,
        errorMessage,
        status,
      });
    }
  };
}

export function responseRedirect(url: string, callbackUrl?: string) {
  const redirectUrl = new URL(url);
  if (callbackUrl) {
    redirectUrl.searchParams.set("redirect", callbackUrl);
  }
  return NextResponse.redirect(redirectUrl);
}

export function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  const htmlTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Email Verification</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background-color:#f3f4f6;"><span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f3f4f6;max-height:0;max-width:0;opacity:0;overflow:hidden;">Enter the verification code to continue signing up.</span><table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f4f6;"><tr><td align="center" style="padding:20px;"><table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:600px;background-color:#ffffff;border-collapse:collapse;"><tr><td align="center" style="background-color:#6b46c1;padding:36px 24px;"><h1 style="margin:0;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:600;">🔐 Email Verification</h1></td></tr><tr><td align="center" style="padding:28px 24px 20px 24px;"><table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;font-size:15px;line-height:22px;text-align:center;padding-bottom:18px;">Continue signing up by entering the code below:</td></tr><tr><td align="center" style="padding:0 0 18px 0;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td style="background-color:#f1f5f9;border:2px solid #d1d5db;border-style:solid;border-radius:8px;padding:16px 28px;font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:700;letter-spacing:4px;color:#0f172a;text-align:center;">${code}</td></tr></table></td></tr><tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#374151;font-size:14px;line-height:20px;text-align:center;padding-bottom:18px;">This code will expire in <strong>3 minutes</strong> for security purposes.</td></tr><tr><td align="center" style="padding:0 0 8px 0;"><table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;"><tr><td style="background-color:#fffbeb;border-left:4px solid #f59e0b;color:#92400e;padding:12px 14px;border-radius:0 8px 8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:18px;"><strong style="display:block;margin-bottom:6px;">Security Notice:</strong>If you didn't request this verification, please ignore this email. Never share this code with anyone.</td></tr></table></td></tr><tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#6b7280;font-size:12px;line-height:18px;text-align:center;padding-top:12px;padding-bottom:20px;">If you need help, contact our support.</td></tr></table></td></tr></table></td></tr></table></body></html>`;

  if (process.env.RESEND_KEY) {
    const resend = new Resend(process.env.RESEND_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification Code",
      html: htmlTemplate,
    });
    return true;
  }

  const url = `${process.env.NEXT_PUBLIC_ZOER_HOST}/zapi/app/email/send`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Postgrest-API-Key": process.env.POSTGREST_API_KEY || "",
    },
    body: JSON.stringify({
      to: email,
      subject: "Email Verification Code",
      html: htmlTemplate,
    }),
  });

  return true;
}

export function setCookie(
  response: Response,
  name: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
  } = {}
): void {
  const {
    path = "/",
    maxAge,
    httpOnly = true,
  } = options;

  const secureFlag = "Secure; ";
  const sameSite = "None";
  const httpOnlyFlag = httpOnly ? "HttpOnly; " : "";
  const maxAgeFlag = maxAge !== undefined ? `Max-Age=${maxAge}; ` : "";

  const cookieValue = `${name}=${value}; ${httpOnlyFlag}${secureFlag}SameSite=${sameSite}; ${maxAgeFlag}Path=${path}`;

  response.headers.append("Set-Cookie", cookieValue);
}

export function clearCookie(
  response: Response,
  name: string,
  path: string = "/"
): void {
  setCookie(response, name, "", { path, maxAge: 0 });
}
