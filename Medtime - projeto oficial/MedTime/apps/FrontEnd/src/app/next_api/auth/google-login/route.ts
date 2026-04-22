import { NextRequest } from "next/server";
import { requestMiddleware, responseRedirect, getRequestIp, validateRequestBody } from "@/lib/api-utils";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations, verifyToken } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";
import { z } from "zod";
import { userRegisterCallback } from "@/lib/user-register";

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {

    const ip = getRequestIp(request);

    const userAgent = request.headers.get("user-agent") || "unknown";

    const body = await validateRequestBody(request);

    const googleAccessToken = body.access_token;
    const callbackUrl = body.callback_url;
    const loginUrl = new URL('/login', callbackUrl).href;

    if(!googleAccessToken) {
      return responseRedirect(loginUrl, callbackUrl);
    }

    const { usersCrud, sessionsCrud, refreshTokensCrud } =
      await authCrudOperations();

    const { valid, payload } = await verifyToken(googleAccessToken);

    if(!valid || !payload?.sub) {
      return responseRedirect(loginUrl, callbackUrl);
    }

    const users = await usersCrud.findMany({ email: payload.sub });

    let user = users?.[0];

    if (!user) {
      const userData = {
        email: payload.sub,
        password: 'NOT-SET',
      };
  
      user = await usersCrud.create(userData);
      
      // Custom extension hooks after user registration. 
      await userRegisterCallback(user)
    }

    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await generateRandomString();

    const hashedRefreshToken = await pbkdf2Hash(refreshToken);

    const sessionData = {
      user_id: user.id,
      ip: ip,
      user_agent: userAgent,
    };
    const session = await sessionsCrud.create(sessionData);
    const sessionId = session.id;

    const refreshTokenData = {
      user_id: user.id,
      session_id: sessionId,
      token: hashedRefreshToken,
      expires_at: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000
      ).toISOString(),
    };

    await refreshTokensCrud.create(refreshTokenData);

    return createAuthResponse({ accessToken, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    return createErrorResponse({
      errorMessage: "Login failed. Please try again later",
      status: 500,
    });
  }
}, false);
