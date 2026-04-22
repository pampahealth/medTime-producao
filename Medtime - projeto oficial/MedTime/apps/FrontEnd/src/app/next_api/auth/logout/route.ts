import { NextRequest } from "next/server";
import { requestMiddleware, ApiParams } from "@/lib/api-utils";
import { authCrudOperations } from "@/lib/auth";
import { pbkdf2Hash } from "@/lib/server-utils";
import { createLogoutResponse } from '@/lib/create-response';

export const POST = requestMiddleware(async (request: NextRequest, params: ApiParams) => {
  try {
    const { refreshTokensCrud, sessionsCrud } = await authCrudOperations();

    if (params.payload?.sub) {
      const refreshToken = request.cookies.get("refresh-token")?.value;

      if (refreshToken) {
        const hashedRefreshToken = await pbkdf2Hash(refreshToken);

        const refreshTokenRecords = await refreshTokensCrud.findMany({
          token: hashedRefreshToken,
          revoked: false,
        });

        if (refreshTokenRecords && refreshTokenRecords.length > 0) {
          for (const record of refreshTokenRecords) {
            await refreshTokensCrud.update(record.id, { revoked: true });
          }

          if (refreshTokenRecords[0].session_id) {
            await sessionsCrud.update(refreshTokenRecords[0].session_id, {
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    return createLogoutResponse();
  } catch (error) {
    return createLogoutResponse();
  }
}, false);
