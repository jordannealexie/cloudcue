import { Router } from "express";
import {
	forgotPassword,
	forgotPasswordSchema,
	googleCallback,
	login,
	loginSchema,
	logout,
	refresh,
	register,
	registerSchema,
	resetPassword,
	resetPasswordSchema,
	startGoogleAuth
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authLimiter, authLoginLimiter, authRegisterLimiter } from "../middleware/rateLimiter";

const authRouter = Router();

authRouter.post("/register", authRegisterLimiter, validate(registerSchema), register);
authRouter.post("/login", authLoginLimiter, validate(loginSchema), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", authLimiter, logout);
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);
authRouter.get("/google/start", authLimiter, startGoogleAuth);
authRouter.get("/google/callback", authLimiter, googleCallback);

export default authRouter;
