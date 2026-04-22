import { NextResponse } from "next/server";
import { AUTH_ENABLED, authConfig } from "../config/auth-config";
import { setCookie, clearCookie } from "./api-utils";

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export function createErrorResponse(params: {
  errorCode?: string;
  errorMessage: string;
  status?: number;
}): Response {
  const { errorCode, errorMessage, status = 500 } = params;
  return new Response(
    JSON.stringify({
      success: false,
      errorCode,
      errorMessage,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Creates an auth response with tokens set in cookies
 * Only functional when AUTH_ENABLED is true
 */
export function createAuthResponse(
  params: {
    accessToken: string;
    refreshToken: string;
  },
  redirectUrl?: string
): Response {
  if (!AUTH_ENABLED) {
    return createSuccessResponse(true);
  }

  const { accessToken, refreshToken } = params;
  const response = redirectUrl
    ? NextResponse.redirect(redirectUrl)
    : new Response(
        JSON.stringify({
          success: true,
          data: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

  setCookie(response, authConfig.tokenCookieName, accessToken, { path: "/" });
  setCookie(response, authConfig.refreshCookieName, refreshToken, {
    path: authConfig.refreshPath,
  });

  return response;
}

/**
 * Creates a logout response that clears auth cookies
 * Only functional when AUTH_ENABLED is true
 */
export function createLogoutResponse(): Response {
  const response = new Response(
    JSON.stringify({
      success: true,
      message: "Logged out successfully",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (AUTH_ENABLED) {
    clearCookie(response, authConfig.tokenCookieName, "/");
    clearCookie(response, authConfig.refreshCookieName, "/");
  }

  return response;
}
