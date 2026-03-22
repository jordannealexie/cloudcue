import type { Request, Response } from "express";
import { z } from "zod";
import { loginUser, registerUser, requestPasswordReset, resetPasswordWithToken } from "../services/userService";
import {
  persistRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  signRefreshToken,
  validateStoredRefreshToken,
  verifyRefreshToken
} from "../services/tokenService";
import { ApiError, sendSuccess } from "../utils/http";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(100)
});

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await registerUser(req.body);
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    return sendSuccess(res, { user, accessToken }, "Account created", 201);
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await loginUser(req.body.email, req.body.password);
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await persistRefreshToken(refreshToken, user.id);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return sendSuccess(res, { user, accessToken }, "Login successful");
  } catch (error) {
    throw error;
  }
};

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token cookie is missing");
    }

    await validateStoredRefreshToken(refreshToken);
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });

    return sendSuccess(res, { accessToken }, "Token refreshed");
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie("refreshToken", cookieOptions);
    return sendSuccess(res, null, "Logged out");
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    await requestPasswordReset(req.body.email);
    return sendSuccess(res, null, "If that account exists, a reset link has been sent");
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    await resetPasswordWithToken(req.body.token, req.body.password);
    return sendSuccess(res, null, "Password has been reset");
  } catch (error) {
    throw error;
  }
};
