import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createErrorResponse } from '@/lib/create-response';
import { createSuccessResponse } from '@/lib/create-response';
import { hashString, verifyHashString } from '@/lib/server-utils';
import { z } from 'zod';
import { authCrudOperations } from '@/lib/auth';
import { userRegisterCallback } from '@/lib/user-register';

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passcode: z.string().min(6, 'Please provide a 6-digit verification code').max(6, 'Verification code must be 6 digits'),
});

/**
 * User Registration API
 * 
 * This endpoint only operates on the users table for basic user data insertion (email, password, etc.).
 * If you have built user extension tables in your project (such as user details table, user configuration table, etc.),
 * please implement the corresponding extension table data insertion logic in the userRegisterCallback method.
 * 
 * @see /src/lib/user-register.ts - userRegisterCallback method implementation location
 */
export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = registerSchema.parse(body);

    const { usersCrud, userPasscodeCrud } = await authCrudOperations();

    // Check if user already exists
    const existingUser = await usersCrud.findMany({
      email: validatedData.email
    });

    if (existingUser && existingUser.length > 0) {
      return createErrorResponse({
        errorMessage: 'User already registered',
        status: 409,
      });
    }

    const passObjectResult = await userPasscodeCrud.findMany({
      pass_object: validatedData.email
    },{
      orderBy: {
        column: 'id',
        direction: 'desc'
      }
    })
    
    const passcodeData = passObjectResult?.[0];

    if (!passcodeData || !passcodeData.passcode || passcodeData.revoked || !(new Date(passcodeData.valid_until).getTime() > new Date().getTime() )) {
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const isCodeValid = await verifyHashString(validatedData.passcode, passcodeData.passcode);

    if(!isCodeValid){
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const hashedPassword = await hashString(validatedData.password);

    const userData = {
      email: validatedData.email,
      password: hashedPassword,
    };

    const user = await usersCrud.create(userData);

    // Custom extension hooks after user registration. 
    await userRegisterCallback(user)

    await userPasscodeCrud.update(passcodeData.id, {
      revoked: true,
    });

    return createSuccessResponse({
      data: true,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 401,
      });
    }

    return createErrorResponse({
      errorMessage: 'Registration failed, please try again later',
      status: 500,
    });
  }
}, false);