import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

const endpoint = process.env.STORAGE_ENDPOINT;
const accessKeyId = process.env.STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.STORAGE_SECRET_KEY;
const bucket = process.env.STORAGE_BUCKET ?? "cloudcue-uploads";
const publicBaseUrl = process.env.STORAGE_PUBLIC_URL ?? "http://localhost:9000/cloudcue-uploads";
const backendPublicUrl = process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? "4000"}`;
const localStorageDir = path.resolve(process.cwd(), "storage", "uploads");
const localStoragePublicPrefix = "/api/local-files";
const fallbackEnabled =
  (process.env.STORAGE_FALLBACK_LOCAL ?? (process.env.NODE_ENV === "production" ? "false" : "true")) === "true";
const forceLocalStorage = (process.env.STORAGE_FORCE_LOCAL ?? "false") === "true";
const localUploadTokenSecret = process.env.LOCAL_UPLOAD_TOKEN_SECRET ?? process.env.JWT_SECRET ?? "cloudcue-local-upload";

let storageReachableCache: { value: boolean; expiresAt: number } | null = null;
let localStorageSyncRunning = false;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing storage configuration");
}

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey }
});

const isStorageUnavailableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  const name = (error as { name?: unknown }).name;
  const message = String((error as { message?: unknown }).message ?? "");
  const cause = (error as { cause?: unknown }).cause;
  const causeCode = cause && typeof cause === "object" ? (cause as { code?: unknown }).code : undefined;

  return (
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "EHOSTUNREACH" ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ETIMEDOUT" ||
    causeCode === "EHOSTUNREACH" ||
    name === "TimeoutError" ||
    message.toLowerCase().includes("connect")
  );
};

const throwStorageUnavailable = (): never => {
  throw new ApiError(503, "Storage service is unavailable. Please try again shortly.");
};

const normalizeMimeType = (value: string | undefined): string => String(value ?? "").split(";")[0].trim().toLowerCase();

const looksLikeUtf8Text = (body: Buffer): boolean => {
  const sample = body.subarray(0, Math.min(body.length, 1024));
  const decoded = sample.toString("utf8");
  const replacementCount = (decoded.match(/\uFFFD/g) ?? []).length;
  return replacementCount === 0;
};

const matchesMimeSignature = (mimeType: string, body: Buffer): boolean => {
  if (body.length === 0) {
    return false;
  }

  const header4 = body.subarray(0, 4);
  const header5 = body.subarray(0, 5).toString("ascii");
  const header6 = body.subarray(0, 6).toString("ascii");
  const header12Ascii = body.subarray(0, 12).toString("ascii");

  switch (mimeType) {
    case "image/png":
      return header4.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case "image/jpeg":
      return body.length > 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
    case "image/gif":
      return header6 === "GIF87a" || header6 === "GIF89a";
    case "image/webp":
      return header4.toString("ascii") === "RIFF" && header12Ascii.slice(8, 12) === "WEBP";
    case "application/pdf":
      return header5 === "%PDF-";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return body.length > 3 && body[0] === 0x50 && body[1] === 0x4b && (body[2] === 0x03 || body[2] === 0x05);
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      return body.length > 8 && body.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    case "application/json": {
      if (!looksLikeUtf8Text(body)) {
        return false;
      }
      try {
        JSON.parse(body.toString("utf8"));
        return true;
      } catch {
        return false;
      }
    }
    case "text/plain":
    case "text/markdown":
    case "text/csv":
    case "image/svg+xml":
      return looksLikeUtf8Text(body);
    default:
      return false;
  }
};

const hashUploadToken = (token: string) => createHash("sha256").update(token).digest("hex");

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const safeCompare = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

type LocalUploadTokenPayload = {
  nonce: string;
  key: string;
  mimeType: string;
  maxBytes: number;
  expiresAt: number;
};

const signLocalUploadPayload = (payload: LocalUploadTokenPayload): string => {
  const canonical = `${payload.nonce}|${payload.key}|${payload.mimeType}|${payload.maxBytes}|${payload.expiresAt}`;
  return createHmac("sha256", localUploadTokenSecret).update(canonical).digest("hex");
};

const encodeLocalUploadToken = (payload: LocalUploadTokenPayload): string => {
  const signature = signLocalUploadPayload(payload);
  return toBase64Url(JSON.stringify({ payload, signature }));
};

const decodeLocalUploadToken = (token: string): LocalUploadTokenPayload => {
  let parsed: { payload?: LocalUploadTokenPayload; signature?: string };
  try {
    parsed = JSON.parse(fromBase64Url(token));
  } catch {
    throw new ApiError(404, "Upload link is invalid or expired");
  }

  if (!parsed.payload || !parsed.signature) {
    throw new ApiError(404, "Upload link is invalid or expired");
  }

  const expectedSignature = signLocalUploadPayload(parsed.payload);
  if (!safeCompare(expectedSignature, parsed.signature)) {
    throw new ApiError(404, "Upload link is invalid or expired");
  }

  return parsed.payload;
};

const ensureLocalNonceTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS upload_nonces (
      nonce TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      max_bytes INTEGER NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const persistLocalNonce = async (payload: LocalUploadTokenPayload, tokenHash: string) => {
  await ensureLocalNonceTable();

  await prisma.$executeRawUnsafe(
    `INSERT INTO upload_nonces (nonce, token_hash, key, mime_type, max_bytes, expires_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))`,
    payload.nonce,
    tokenHash,
    payload.key,
    payload.mimeType,
    payload.maxBytes,
    payload.expiresAt
  );
};

const consumeLocalNonce = async (payload: LocalUploadTokenPayload, tokenHash: string) => {
  await ensureLocalNonceTable();

  const rows = await prisma.$queryRawUnsafe<
    Array<{ key: string; mime_type: string; max_bytes: number; expires_at: Date }>
  >(
    `UPDATE upload_nonces
     SET used_at = NOW()
     WHERE nonce = $1
       AND token_hash = $2
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING key, mime_type, max_bytes, expires_at`,
    payload.nonce,
    tokenHash
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Upload link is invalid or expired");
  }

  const row = rows[0];
  if (row.key !== payload.key || row.mime_type !== payload.mimeType || Number(row.max_bytes) !== payload.maxBytes) {
    throw new ApiError(404, "Upload link is invalid or expired");
  }
};

const cleanupUsedOrExpiredNonces = async () => {
  await ensureLocalNonceTable();
  await prisma.$executeRawUnsafe(
    `DELETE FROM upload_nonces
     WHERE expires_at < NOW() - INTERVAL '1 day'
        OR used_at IS NOT NULL`
  );
};

const ensureLocalUploadDir = async (key: string) => {
  const directory = path.dirname(path.join(localStorageDir, key));
  await fs.mkdir(directory, { recursive: true });
};

const createLocalUploadResponse = async (payload: {
  key: string;
  mimeType: string;
  maxBytes: number;
}): Promise<{ uploadUrl: string; fileUrl: string }> => {
  const ticketPayload: LocalUploadTokenPayload = {
    nonce: randomUUID(),
    key: payload.key,
    mimeType: normalizeMimeType(payload.mimeType),
    maxBytes: payload.maxBytes,
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  const ticketToken = encodeLocalUploadToken(ticketPayload);
  await persistLocalNonce(ticketPayload, hashUploadToken(ticketToken));

  return {
    uploadUrl: `${backendPublicUrl}/api/upload/local/${encodeURIComponent(ticketToken)}`,
    fileUrl: `${backendPublicUrl}${localStoragePublicPrefix}/${payload.key}`
  };
};

const getLocalStorageKeyFromUrl = (url: string): string | null => {
  const marker = `${localStoragePublicPrefix}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(markerIndex + marker.length));
};

const buildStorageUrl = (key: string) => `${publicBaseUrl}/${key}`;

const pushLocalFileToStorage = async (key: string, contentType?: string) => {
  const absolutePath = path.resolve(localStorageDir, key);
  const body = await fs.readFile(absolutePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ...(contentType ? { ContentType: contentType } : {})
    })
  );
};

const removeLocalFileIfExists = async (fileUrl: string) => {
  const key = getLocalStorageKeyFromUrl(fileUrl);
  if (!key) {
    return false;
  }

  const target = path.resolve(localStorageDir, key);
  try {
    await fs.unlink(target);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return true;
    }
    throw error;
  }
};

export const uploadLocalFileFromTicket = async (ticketToken: string, body: Buffer, contentType?: string) => {
  const decodedToken = decodeLocalUploadToken(ticketToken);
  if (decodedToken.expiresAt <= Date.now()) {
    throw new ApiError(404, "Upload link is invalid or expired");
  }

  await consumeLocalNonce(decodedToken, hashUploadToken(ticketToken));

  if (!body || body.length === 0) {
    throw new ApiError(400, "Upload body is empty");
  }

  if (body.length > decodedToken.maxBytes) {
    throw new ApiError(413, "Uploaded file exceeds the allowed size");
  }

  const incomingMime = normalizeMimeType(contentType);
  if (decodedToken.mimeType && incomingMime && decodedToken.mimeType !== incomingMime) {
    throw new ApiError(400, "Content type does not match the upload request");
  }

  if (!matchesMimeSignature(decodedToken.mimeType, body)) {
    throw new ApiError(400, "Uploaded file content does not match the declared file type");
  }

  await ensureLocalUploadDir(decodedToken.key);
  await fs.writeFile(path.join(localStorageDir, decodedToken.key), body);
};

export const syncLocalFallbackToStorage = async (): Promise<{ migratedCount: number }> => {
  if (!fallbackEnabled || localStorageSyncRunning) {
    return { migratedCount: 0 };
  }

  localStorageSyncRunning = true;

  try {
    const storageHealthy = await checkStorageHealth();
    if (!storageHealthy) {
      return { migratedCount: 0 };
    }

    const localMarker = `${localStoragePublicPrefix}/`;

    const [files, users, pages] = await Promise.all([
      prisma.pageFile.findMany({
        where: { url: { contains: localMarker } },
        select: { id: true, url: true, mimeType: true }
      }),
      prisma.user.findMany({
        where: { avatarUrl: { contains: localMarker } },
        select: { id: true, avatarUrl: true }
      }),
      prisma.page.findMany({
        where: { coverUrl: { contains: localMarker } },
        select: { id: true, coverUrl: true }
      })
    ]);

    let migratedCount = 0;

    for (const file of files) {
      const key = getLocalStorageKeyFromUrl(file.url);
      if (!key) {
        continue;
      }

      try {
        await pushLocalFileToStorage(key, file.mimeType);
      } catch {
        continue;
      }

      await prisma.pageFile.update({
        where: { id: file.id },
        data: { url: buildStorageUrl(key) }
      });
      migratedCount += 1;
    }

    for (const user of users) {
      if (!user.avatarUrl) {
        continue;
      }

      const key = getLocalStorageKeyFromUrl(user.avatarUrl);
      if (!key) {
        continue;
      }

      try {
        await pushLocalFileToStorage(key);
      } catch {
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: buildStorageUrl(key) }
      });
      migratedCount += 1;
    }

    for (const page of pages) {
      if (!page.coverUrl) {
        continue;
      }

      const key = getLocalStorageKeyFromUrl(page.coverUrl);
      if (!key) {
        continue;
      }

      try {
        await pushLocalFileToStorage(key);
      } catch {
        continue;
      }

      await prisma.page.update({
        where: { id: page.id },
        data: { coverUrl: buildStorageUrl(key) }
      });
      migratedCount += 1;
    }

    return { migratedCount };
  } finally {
    localStorageSyncRunning = false;
  }
};

export const startLocalFallbackSyncJob = () => {
  if (!fallbackEnabled) {
    return;
  }

  const intervalMs = Number(process.env.STORAGE_SYNC_INTERVAL_MS ?? 60_000);

  const run = async () => {
    try {
      await cleanupUsedOrExpiredNonces();
      const result = await syncLocalFallbackToStorage();
      if (result.migratedCount > 0) {
        console.log(`[storage-sync] Migrated ${result.migratedCount} local file reference(s) to object storage.`);
      }
    } catch (error) {
      console.warn("[storage-sync] Local fallback sync failed", error);
    }
  };

  setTimeout(run, 10_000);
  setInterval(run, intervalMs);
};

export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
};

const isStorageReachableCached = async (): Promise<boolean> => {
  const now = Date.now();
  if (storageReachableCache && storageReachableCache.expiresAt > now) {
    return storageReachableCache.value;
  }

  const value = await checkStorageHealth();
  storageReachableCache = { value, expiresAt: now + 10_000 };
  return value;
};

const shouldUseLocalFallback = async (): Promise<boolean> => {
  if (!fallbackEnabled) {
    return false;
  }

  if (forceLocalStorage) {
    return true;
  }

  return !(await isStorageReachableCached());
};

const createPageLocalUpload = async (payload: {
  fileName: string;
  mimeType: string;
  pageId: string;
  fileSize?: number;
}) => {
  const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `${payload.pageId}/${Date.now()}-${safeFileName}`;
  const local = await createLocalUploadResponse({
    key,
    mimeType: payload.mimeType,
    maxBytes: payload.fileSize ?? 50 * 1024 * 1024
  });

  const file = await prisma.pageFile.create({
    data: {
      pageId: payload.pageId,
      name: payload.fileName,
      url: local.fileUrl,
      size: payload.fileSize ?? 0,
      status: "pending",
      mimeType: payload.mimeType
    }
  });

  return {
    uploadUrl: local.uploadUrl,
    fileUrl: local.fileUrl,
    fileId: file.id
  };
};

const createAvatarLocalUpload = async (payload: { fileName: string; mimeType: string; userId: string }) => {
  const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `avatars/${payload.userId}/${Date.now()}-${safeFileName}`;
  const local = await createLocalUploadResponse({
    key,
    mimeType: payload.mimeType,
    maxBytes: 5 * 1024 * 1024
  });

  return {
    uploadUrl: local.uploadUrl,
    fileUrl: local.fileUrl
  };
};

export const generatePresignedUpload = async (payload: {
  fileName: string;
  mimeType: string;
  pageId: string;
  fileSize?: number;
}) => {
  if (await shouldUseLocalFallback()) {
    return createPageLocalUpload(payload);
  }

  try {
    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `${payload.pageId}/${Date.now()}-${safeFileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: payload.mimeType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    const fileUrl = `${publicBaseUrl}/${key}`;

    const file = await prisma.pageFile.create({
      data: {
        pageId: payload.pageId,
        name: payload.fileName,
        url: fileUrl,
        size: payload.fileSize ?? 0,
        status: "pending",
        mimeType: payload.mimeType
      }
    });

    return {
      uploadUrl,
      fileUrl,
      fileId: file.id
    };
  } catch (error) {
    if (isStorageUnavailableError(error) && fallbackEnabled) {
      return createPageLocalUpload(payload);
    }

    if (isStorageUnavailableError(error)) {
      throwStorageUnavailable();
    }

    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to generate upload url");
  }
};

export const generateAvatarPresignedUpload = async (payload: {
  fileName: string;
  mimeType: string;
  userId: string;
}) => {
  if (await shouldUseLocalFallback()) {
    return createAvatarLocalUpload(payload);
  }

  try {
    const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `avatars/${payload.userId}/${Date.now()}-${safeFileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: payload.mimeType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    const fileUrl = `${publicBaseUrl}/${key}`;

    return {
      uploadUrl,
      fileUrl
    };
  } catch (error) {
    if (isStorageUnavailableError(error) && fallbackEnabled) {
      return createAvatarLocalUpload(payload);
    }

    if (isStorageUnavailableError(error)) {
      throwStorageUnavailable();
    }

    throw new ApiError(500, "Unable to generate avatar upload url");
  }
};

export const confirmUpload = async (fileId: string) => {
  try {
    return await prisma.pageFile.update({
      where: { id: fileId },
      data: { status: "complete" }
    });
  } catch (error) {
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to confirm file upload");
  }
};

export const removeUpload = async (fileId: string, userId: string) => {
  try {
    const file = await prisma.pageFile.findUnique({
      where: { id: fileId },
      include: {
        page: {
          select: {
            id: true,
            createdById: true,
            permissions: {
              where: { userId },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!file) {
      throw new ApiError(404, "File not found");
    }

    const pageRole = file.page.permissions[0]?.role;
    const hasAccess = file.page.createdById === userId || ["editor", "admin"].includes(pageRole ?? "");

    if (!hasAccess) {
      throw new ApiError(403, "You do not have permission to remove this file");
    }

    const removedLocal = await removeLocalFileIfExists(file.url);
    if (!removedLocal) {
      const key = file.url.replace(`${publicBaseUrl}/`, "");
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
    await prisma.pageFile.delete({ where: { id: fileId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isStorageUnavailableError(error)) {
      throwStorageUnavailable();
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to remove file");
  }
};
