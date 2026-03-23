import { Router } from "express";
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
import { authLimiter, authLoginLimiter, authRegisterLimiter } from "../middleware/rateLimiter";

const authRouter = Router();

authRouter.post("/register", authRegisterLimiter, validate(registerSchema), register);
authRouter.post("/login", authLoginLimiter, validate(loginSchema), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", authLimiter, logout);
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);

export default authRouter;
