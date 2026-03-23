import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http";
import { verifyAccessToken } from "../services/tokenService";

const isValidUserContext = (payload: unknown): payload is Express.UserContext => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const userId = (payload as { userId?: unknown }).userId;
  const email = (payload as { email?: unknown }).email;
  const uuidLike = /^[0-9a-fA-F-]{36}$/;

  return (
    typeof userId === "string" &&
    userId.length > 0 &&
    uuidLike.test(userId) &&
    typeof email === "string" &&
    email.length > 0
  );
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    next(new ApiError(401, "Authorization header is required"));
    return;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new ApiError(401, "Invalid authorization format"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (!isValidUserContext(payload)) {
      next(new ApiError(401, "Invalid or expired access token"));
      return;
    }

    req.user = payload;
    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
