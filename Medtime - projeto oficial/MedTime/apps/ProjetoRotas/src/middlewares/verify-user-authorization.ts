import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppErrors";

function verifyUserAuthorization(role: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !role.includes(request.user.role)) {
      throw new AppError("User not authorized", 401);
    }
    return next();
  };
}

export { verifyUserAuthorization };
