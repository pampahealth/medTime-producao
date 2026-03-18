import { AppError } from "@/utils/AppErrors";
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandling: ErrorRequestHandler = (error, request, response, next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    const first = error.errors[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Validation error";
    response.status(400).json({
      message: msg,
      errorMessage: msg,
      issues: error.format(),
    });
    return;
  }

  response.status(500).json({ message: error.message });
};