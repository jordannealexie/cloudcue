import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../utils/http";
import {
  confirmUpload,
  generateAvatarPresignedUpload,
  generatePresignedUpload,
  removeUpload,
  uploadLocalFileFromTicket
} from "../services/uploadService";

const allowedUploadMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
] as const;

export const presignSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z
    .string()
    .min(1)
    .refine((value) => allowedUploadMimeTypes.includes(value as (typeof allowedUploadMimeTypes)[number]), {
      message: "Unsupported file type"
    }),
  pageId: z.string().uuid(),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024).optional()
}).superRefine((value, ctx) => {
  if (!value.fileSize) {
    return;
  }

  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const coverTypes = ["image/jpeg", "image/png", "image/webp"];

  if (value.fileName.toLowerCase().includes("cover")) {
    if (!coverTypes.includes(value.mimeType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cover must be jpeg, png, or webp" });
    }
    if (value.fileSize > 5 * 1024 * 1024) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cover max size is 5MB" });
    }
    return;
  }

  if (imageTypes.includes(value.mimeType) && value.fileSize > 10 * 1024 * 1024) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image max size is 10MB" });
  }
});

export const confirmSchema = z.object({
  fileId: z.string().uuid()
});

export const avatarPresignSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024)
});

export const postPresign = async (req: Request, res: Response) => {
  const data = await generatePresignedUpload(req.body);
  return sendSuccess(res, data, "Upload url generated", 201);
};

export const postConfirmUpload = async (req: Request, res: Response) => {
  const data = await confirmUpload(req.body.fileId);
  return sendSuccess(res, data, "Upload confirmed");
};

export const postAvatarPresign = async (req: Request, res: Response) => {
  const data = await generateAvatarPresignedUpload({
    fileName: req.body.fileName,
    mimeType: req.body.mimeType,
    userId: req.user!.userId
  });
  return sendSuccess(res, data, "Avatar upload url generated", 201);
};

export const deleteUpload = async (req: Request, res: Response) => {
  await removeUpload(String(req.params.fileId), req.user!.userId);
  return sendSuccess(res, null, "Upload removed");
};

export const putLocalUpload = async (req: Request, res: Response) => {
  const token = String(req.params.uploadToken);
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);

  await uploadLocalFileFromTicket(token, body, req.header("content-type") ?? undefined);
  return res.status(200).end();
};
