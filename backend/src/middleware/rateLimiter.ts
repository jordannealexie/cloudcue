import rateLimit from "express-rate-limit";

const isDevelopment = process.env.NODE_ENV !== "production";

const authRateMessage = {
  success: false,
  data: null,
  message: "Too many authentication attempts, please try again later"
};

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 30 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: authRateMessage
});

export const authRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 20 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: authRateMessage
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 80 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: authRateMessage
});

export const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDevelopment ? 500 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Too many write requests, please slow down"
  }
});
