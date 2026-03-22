import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

interface AccessPayload {
  userId: string;
  email: string;
}

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
const accessExpiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"];
const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

if (!jwtSecret || !jwtRefreshSecret) {
  throw new Error("Missing JWT secrets in environment");
}

/** Creates a signed access token for API authorization. */
export const signAccessToken = (payload: AccessPayload): string => {
  return jwt.sign(payload, jwtSecret, { expiresIn: accessExpiresIn });
};

/** Creates a signed refresh token for session continuation. */
export const signRefreshToken = (payload: AccessPayload): string => {
  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshExpiresIn });
};

/** Verifies an access token and returns its payload. */
export const verifyAccessToken = (token: string): Express.UserContext => {
  return jwt.verify(token, jwtSecret) as Express.UserContext;
};

/** Verifies a refresh token and returns its payload. */
export const verifyRefreshToken = (token: string): Express.UserContext => {
  return jwt.verify(token, jwtRefreshSecret) as Express.UserContext;
};

/** Stores a refresh token in the database for revocation support. */
export const persistRefreshToken = async (token: string, userId: string): Promise<void> => {
  try {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Failed to persist refresh token");
  }
};

/** Validates that the refresh token exists and has not expired. */
export const validateStoredRefreshToken = async (token: string): Promise<void> => {
  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });

    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Failed to validate refresh token");
  }
};

/** Deletes one refresh token from storage. */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  try {
    await prisma.refreshToken.deleteMany({ where: { token } });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Failed to revoke refresh token");
  }
};
