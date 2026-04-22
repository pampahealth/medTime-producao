
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, validateRequestBody } from "@/lib/api-utils";

export const GET = requestMiddleware(async (request, context) => {
  const user_id = context.payload?.sub;
  
  if (!user_id) {
    return createErrorResponse({
      errorMessage: "Usuário não autenticado",
      status: 401,
    });
  }
  
  const profilesCrud = new CrudOperations("user_profiles", context.token);
  
  const profiles = await profilesCrud.findMany({ user_id: parseInt(user_id) }, { limit: 1 });
  
  if (!profiles || profiles.length === 0) {
    return createErrorResponse({
      errorMessage: "Perfil não encontrado",
      status: 404,
    });
  }
  
  return createSuccessResponse(profiles[0]);
}, true);

export const PUT = requestMiddleware(async (request, context) => {
  const user_id = context.payload?.sub;
  
  if (!user_id) {
    return createErrorResponse({
      errorMessage: "Usuário não autenticado",
      status: 401,
    });
  }
  
  const body = await validateRequestBody(request);
  const profilesCrud = new CrudOperations("user_profiles", context.token);
  
  const profiles = await profilesCrud.findMany({ user_id: parseInt(user_id) }, { limit: 1 });
  
  if (!profiles || profiles.length === 0) {
    return createErrorResponse({
      errorMessage: "Perfil não encontrado",
      status: 404,
    });
  }
  
  const data = await profilesCrud.update(profiles[0].id, body);
  return createSuccessResponse(data);
}, true);
