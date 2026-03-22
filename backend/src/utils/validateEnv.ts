import "dotenv/config";

const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "STORAGE_ENDPOINT",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET",
  "STORAGE_PUBLIC_URL",
  "CLIENT_URL"
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key] || process.env[key]?.trim() === "");

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

if ((process.env.JWT_SECRET ?? "").length < 16 || (process.env.JWT_REFRESH_SECRET ?? "").length < 16) {
  console.warn("JWT secrets are shorter than recommended. Use at least 16 characters in production.");
}
