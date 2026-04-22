import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { hashString, verifyHashString } from '@/lib/server-utils';
import { authCrudOperations } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  passcode: z.string().min(6, 'Please provide a 6-digit verification code').max(6, 'Verification code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = resetPasswordSchema.parse(body);

    const { usersCrud, userPasscodeCrud } = await authCrudOperations();

    const passObjectResult = await userPasscodeCrud.findMany({
      pass_object: validatedData.email
    }, {
      orderBy: {
        column: 'id',
        direction: 'desc'
      }
    });
    
    const passcodeData = passObjectResult?.[0];

    if (!passcodeData || !passcodeData.passcode || passcodeData.revoked || !(new Date(passcodeData.valid_until).getTime() > new Date().getTime())) {
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const isCodeValid = await verifyHashString(validatedData.passcode, passcodeData.passcode);

    if (!isCodeValid) {
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const users = await usersCrud.findMany({ email: validatedData.email });
    const user = users?.[0];

    if (!user) {
      return createErrorResponse({
        errorMessage: 'User does not exist',
        status: 401,
      });
    }

    const hashedPassword = await hashString(validatedData.password);

    await usersCrud.update(user.id, { password: hashedPassword });

    await userPasscodeCrud.update(passcodeData.id, {
      revoked: true,
    });

    return createSuccessResponse({
      data: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 401,
      });
    }

    return createErrorResponse({
      errorMessage: 'Server error, please try again later',
      status: 500,
    });
  }
}, false);