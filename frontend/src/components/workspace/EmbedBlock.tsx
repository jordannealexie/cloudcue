"use client";

import { parseEmbedUrl } from "../../lib/embedParser";

interface EmbedBlockProps {
  url: string;
}

export default function EmbedBlock({ url }: EmbedBlockProps) {
  const parsed = parseEmbedUrl(url);

  if (parsed.type === "youtube" || parsed.type === "figma") {
    return (
      <div className="surface-elevated overflow-hidden">
        <iframe src={parsed.iframeUrl} title="Embed" className="h-[360px] w-full" allowFullScreen />
      </div>
    );
  }

  return (
    <a href={parsed.url} target="_blank" rel="noreferrer" className="surface-elevated block p-3">
      <p className="text-[13px] font-semibold">External Link</p>
      <p className="text-[12px] text-[var(--text-secondary)]">{parsed.url}</p>
    </a>
  );
}
