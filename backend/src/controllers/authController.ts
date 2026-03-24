import type { Request, Response } from "express";
import crypto from "crypto";
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
import { prisma } from "../services/prisma";
import { ApiError, sendSuccess } from "../utils/http";

interface OAuthIdentity {
  email: string;
  name: string;
}

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

const oauthStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 10 * 60 * 1000
};

const getClientUrl = (): string => process.env.CLIENT_URL ?? "http://localhost:3000";

const getOAuthCallbackUrl = (path: string): string => `${getClientUrl()}/social/callback${path}`;

const extractDisplayNameFromEmail = (email: string): string => {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) {
    return "CloudCue User";
  }
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const upsertOAuthUser = async (identity: OAuthIdentity) => {
  const randomPassword = crypto.randomBytes(24).toString("hex");
  try {
    return await registerUser({
      email: identity.email,
      name: identity.name,
      password: randomPassword
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 409) {
      const user = await prisma.user.findUnique({
        where: { email: identity.email },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      });

      if (user) {
        return user;
      }

      throw new ApiError(409, "A local account with this email already exists. Sign in with password first.");
    }
    throw error;
  }
};

const establishSession = async (res: Response, user: { id: string; email: string }) => {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email });
  await persistRefreshToken(refreshToken, user.id);
  res.cookie("refreshToken", refreshToken, cookieOptions);
  return accessToken;
};

const createOauthState = (): string => crypto.randomBytes(24).toString("hex");

const ensureProviderConfigured = (config: Record<string, string | undefined>, providerName: string) => {
  const missing = Object.entries(config)
    .filter(([, value]) => !value || value.trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new ApiError(503, `${providerName} sign-in is not configured (${missing.join(", ")})`);
  }
};

const redirectToClientAuth = (res: Response, pathWithQuery: string): Response => {
  res.redirect(getOAuthCallbackUrl(pathWithQuery));
  return res;
};

const validateOAuthState = (req: Request, res: Response, cookieName: string): void => {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const stateCookie = req.cookies[cookieName] as string | undefined;
  res.clearCookie(cookieName, oauthStateCookieOptions);

  if (!state || !stateCookie || state !== stateCookie) {
    throw new ApiError(400, "OAuth state mismatch");
  }
};

const readGoogleIdentity = async (code: string): Promise<OAuthIdentity> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  ensureProviderConfigured(
    {
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_CLIENT_SECRET: clientSecret,
      GOOGLE_REDIRECT_URI: redirectUri
    },
    "Google"
  );

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      redirect_uri: redirectUri ?? "",
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    throw new ApiError(401, "Google token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as { id_token?: string };

  if (!tokenData.id_token) {
    throw new ApiError(401, "Google token response missing id_token");
  }

  const verifyResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`
  );

  if (!verifyResponse.ok) {
    throw new ApiError(401, "Google token validation failed");
  }

  const verifyData = (await verifyResponse.json()) as {
    email?: string;
    email_verified?: string;
    name?: string;
    aud?: string;
  };

  if (verifyData.aud !== clientId) {
    throw new ApiError(401, "Google token audience mismatch");
  }

  if (!verifyData.email || verifyData.email_verified !== "true") {
    throw new ApiError(401, "Google account email is not verified");
  }

  return {
    email: verifyData.email,
    name: verifyData.name?.trim() || extractDisplayNameFromEmail(verifyData.email)
  };
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
    const accessToken = await establishSession(res, user);

    return sendSuccess(res, { user, accessToken }, "Login successful");
  } catch (error) {
    throw error;
  }
};

export const startGoogleAuth = async (_req: Request, res: Response): Promise<Response> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  ensureProviderConfigured(
    {
      GOOGLE_CLIENT_ID: clientId,
      GOOGLE_REDIRECT_URI: redirectUri
    },
    "Google"
  );

  const state = createOauthState();
  res.cookie("oauth_state_google", state, oauthStateCookieOptions);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId ?? "");
  authUrl.searchParams.set("redirect_uri", redirectUri ?? "");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  res.redirect(authUrl.toString());
  return res;
};

export const googleCallback = async (req: Request, res: Response): Promise<Response> => {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      throw new ApiError(400, "Google callback missing code");
    }

    validateOAuthState(req, res, "oauth_state_google");

    const identity = await readGoogleIdentity(code);
    const user = await upsertOAuthUser(identity);
    const accessToken = await establishSession(res, user);

    return redirectToClientAuth(res, `?provider=google&accessToken=${encodeURIComponent(accessToken)}`);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Google sign-in failed";
    return redirectToClientAuth(res, `?provider=google&error=${encodeURIComponent(message)}`);
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
