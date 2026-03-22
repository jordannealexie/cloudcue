import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http";
import { verifyAccessToken } from "../services/tokenService";

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
    req.user = payload;
    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};
