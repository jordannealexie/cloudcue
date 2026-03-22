"use client";

import Image from "next/image";

interface ImageBlockProps {
  url: string;
  caption?: string;
}

export default function ImageBlock({ url, caption }: ImageBlockProps) {
  return (
    <figure className="surface-elevated overflow-hidden p-2">
      <Image src={url} alt={caption ?? "Uploaded image"} width={1280} height={720} className="h-auto w-full rounded-lg" />
      {caption ? <figcaption className="mt-2 text-[12px] text-[var(--text-secondary)]">{caption}</figcaption> : null}
    </figure>
  );
}
