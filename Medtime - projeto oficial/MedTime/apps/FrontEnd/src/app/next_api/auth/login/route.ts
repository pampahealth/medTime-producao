import { NextRequest } from "next/server";
import { requestMiddleware, validateRequestBody, getRequestIp } from "@/lib/api-utils";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash, verifyHashString } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";
import { API_BACKEND_URL } from "@/lib/backend-proxy";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = loginSchema.parse(body);

    // Quando USE_BACKEND_PROXY=true, login vai para ProjetoRotas /sessions
    if (process.env.USE_BACKEND_PROXY === "true") {
      const res = await fetch(`${API_BACKEND_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: validatedData.email, password: validatedData.password }),
      });
      const session = await res.json();
      if (!res.ok) {
        return createErrorResponse({
          errorMessage: session?.message ?? "E-mail ou senha incorretos",
          status: res.status,
        });
      }
      const token = session.token as string;
      return createAuthResponse({ accessToken: token, refreshToken: token });
    }

    // Fluxo original (PostgREST/auth local)
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { usersCrud, sessionsCrud, refreshTokensCrud } = await authCrudOperations();
    const users = await usersCrud.findMany({ email: validatedData.email });
    const user = users?.[0];

    if (!user) {
      return createErrorResponse({
        errorMessage: "Invalid email or password",
        status: 401,
      });
    }

    const isValidPassword = await verifyHashString(validatedData.password, user.password);
    if (!isValidPassword) {
      return createErrorResponse({
        errorMessage: "Invalid email or password",
        status: 401,
      });
    }

    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await generateRandomString();
    const hashedRefreshToken = await pbkdf2Hash(refreshToken);
    const sessionData = { user_id: user.id, ip, user_agent: userAgent };
    const session = await sessionsCrud.create(sessionData);
    const refreshTokenData = {
      user_id: user.id,
      session_id: session.id,
      token: hashedRefreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000).toISOString(),
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
