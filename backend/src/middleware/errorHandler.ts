import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http";

interface PrismaLikeKnownError {
  code: string;
}

const isPrismaKnownError = (error: unknown): error is PrismaLikeKnownError => {
  return typeof error === "object" && error !== null && "code" in error;
};

const isPrismaValidationError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "PrismaClientValidationError"
  );
};

const isPrismaInitializationError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "PrismaClientInitializationError"
  );
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): Response => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      data: null,
      message: error.message
    });
  }

  if (isPrismaKnownError(error)) {
    const prismaError = error;

    if (prismaError.code === "P2002") {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Unique constraint violation"
      });
    }

    if (prismaError.code === "P2025") {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Requested resource was not found"
      });
    }

    return res.status(400).json({
      success: false,
      data: null,
      message: "Database request failed"
    });
  }

  if (isPrismaValidationError(error)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid database payload"
    });
  }

  if (isPrismaInitializationError(error)) {
    return res.status(503).json({
      success: false,
      data: null,
      message: "Database is unavailable"
    });
  }

  return res.status(500).json({
    success: false,
    data: null,
    message: "Internal server error"
  });
};
