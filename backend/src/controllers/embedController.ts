import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError, sendSuccess } from "../utils/http";

const extractTag = (html: string, expression: RegExp): string | undefined => {
  const match = html.match(expression);
  return match?.[1]?.trim();
};

const decodeHtml = (value?: string) =>
  value
    ?.replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

export const getEmbedMetaQuerySchema = z.object({
  url: z.string().url()
});

export const getEmbedMeta = async (req: Request, res: Response) => {
  const parsed = getEmbedMetaQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "A valid url query parameter is required");
  }

  const targetUrl = parsed.data.url;

  const response = await fetch(targetUrl, {
    headers: {
      "user-agent": "CloudCueBot/1.0 (+https://cloudcue.app)",
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new ApiError(400, "Unable to fetch embed metadata");
  }

  const html = await response.text();
  const origin = new URL(targetUrl).origin;

  const title = decodeHtml(
    extractTag(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i) ??
      extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
  );

  const description = decodeHtml(
    extractTag(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i) ??
      extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i)
  );

  const imageUrl = decodeHtml(
    extractTag(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i)
  );

  const faviconPath =
    extractTag(html, /<link\s+[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i) ??
    "/favicon.ico";
  const favicon = decodeHtml(new URL(faviconPath, origin).toString());

  return sendSuccess(res, {
    type: "bookmark",
    title: title ?? targetUrl,
    description: description ?? "",
    imageUrl: imageUrl ? new URL(imageUrl, origin).toString() : undefined,
    favicon,
    url: targetUrl
  });
};