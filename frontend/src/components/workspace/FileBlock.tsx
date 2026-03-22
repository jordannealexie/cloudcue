"use client";

import Button from "../ui/Button";

interface FileBlockProps {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export default function FileBlock({ name, url, size, mimeType }: FileBlockProps) {
  return (
    <div className="surface-elevated flex items-center justify-between p-3">
      <div>
        <p className="text-[14px] font-semibold">{name}</p>
        <p className="text-[12px] text-[var(--text-secondary)]">
          {mimeType} • {(size / 1024).toFixed(1)} KB
        </p>
      </div>
      <a href={url} target="_blank" rel="noreferrer">
        <Button variant="secondary">Download</Button>
      </a>
    </div>
  );
}
