import "dotenv/config";

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL"
] as const;

const storageRequiredEnvVars = [
  "STORAGE_ENDPOINT",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET",
  "STORAGE_PUBLIC_URL"
] as const;

const forceLocalStorage = (process.env.STORAGE_FORCE_LOCAL ?? "false") === "true";

const missingEnvVars: string[] = requiredEnvVars.filter(
  (key) => !process.env[key] || process.env[key]?.trim() === ""
);

if (!forceLocalStorage) {
  missingEnvVars.push(
    ...storageRequiredEnvVars.filter((key) => !process.env[key] || process.env[key]?.trim() === "")
  );
}

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

if ((process.env.JWT_SECRET ?? "").length < 16 || (process.env.JWT_REFRESH_SECRET ?? "").length < 16) {
  console.warn("JWT secrets are shorter than recommended. Use at least 16 characters in production.");
}

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
if (!hasSmtp) {
  console.warn("SMTP is not fully configured. Forgot/reset password emails will fallback to server logs.");
}
