import { requestMiddleware } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { authCrudOperations } from '@/lib/auth';

export const GET = requestMiddleware(async (request, params) => {
  try {
    if(!params.payload?.sub){
      return createErrorResponse({
        errorMessage: 'The user does not exist.',
        status: 400,
      });
    }

    const { usersCrud } = await authCrudOperations();

    const user = await usersCrud.findById(params.payload.sub);
    if (!user) {
      return createErrorResponse({
        errorMessage: 'The user does not exist.',
        status: 401,
      });
    }

    const userResponse = {
      email: user.email,
      role: user.role,
      id: user.id,
      isAdmin: user.role === process.env.SCHEMA_ADMIN_USER,
    };

    return createSuccessResponse(userResponse);

  } catch (error) {
    return createErrorResponse({
      errorMessage: 'Failed to obtain user information',
      status: 500,
    });
  }
}, true);