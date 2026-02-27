import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../services/render.service.js";

export const notFoundMiddleware = (_request: Request, response: Response): void => {
  response.status(404).json({
    message: "Route not found"
  });
};

export const errorHandlerMiddleware = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation error",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  response.status(500).json({
    message: "Internal server error"
  });
};
