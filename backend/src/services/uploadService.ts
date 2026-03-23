import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./prisma";
import { ApiError } from "../utils/http";
import { rethrowPrismaRuntimeError } from "../utils/prismaErrors";

const endpoint = process.env.STORAGE_ENDPOINT;
const accessKeyId = process.env.STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.STORAGE_SECRET_KEY;
const bucket = process.env.STORAGE_BUCKET ?? "cloudcue-uploads";
const publicBaseUrl = process.env.STORAGE_PUBLIC_URL ?? "http://localhost:9000/cloudcue-uploads";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing storage configuration");
}

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey }
});

export const generatePresignedUpload = async (payload: {
  fileName: string;
  mimeType: string;
  pageId: string;
  fileSize?: number;
}) => {
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
    rethrowPrismaRuntimeError(error);
    throw new ApiError(500, "Unable to generate upload url");
  }
};

export const generateAvatarPresignedUpload = async (payload: {
  fileName: string;
  mimeType: string;
  userId: string;
}) => {
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

    const key = file.url.replace(`${publicBaseUrl}/`, "");
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    await prisma.pageFile.delete({ where: { id: fileId } });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    rethrowPrismaRuntimeError(error);

    throw new ApiError(500, "Unable to remove file");
  }
};
