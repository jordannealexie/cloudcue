import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import {
	forgotPassword,
	forgotPasswordSchema,
	login,
	loginSchema,
	logout,
	refresh,
	register,
	registerSchema,
	resetPassword,
	resetPasswordSchema
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";

const authRouter = Router();
const authGuard = process.env.NODE_ENV === "production"
	? authLimiter
	: (_req: Request, _res: Response, next: NextFunction) => next();

authRouter.post("/register", authGuard, validate(registerSchema), register);
authRouter.post("/login", authGuard, validate(loginSchema), login);
authRouter.post("/refresh", authGuard, refresh);
authRouter.post("/logout", authGuard, logout);
authRouter.post("/forgot-password", authGuard, validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authGuard, validate(resetPasswordSchema), resetPassword);

export default authRouter;
