"use client";

import Button from "../ui/Button";

interface PageHeaderProps {
  title: string;
  emoji?: string | null;
  coverUrl?: string | null;
  isSaving?: boolean;
  authorName?: string;
  updatedAt?: string;
  commentCount?: number;
  onTitleChange: (title: string) => void;
}

export default function PageHeader({
  title,
  emoji,
  coverUrl,
  isSaving = false,
  authorName,
  updatedAt,
  commentCount = 0,
  onTitleChange
}: PageHeaderProps) {
  const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : "just now";

  return (
    <div className="surface-card overflow-hidden p-0">
      <div
        className="relative h-[120px] w-full bg-[var(--bg-card-2)] sm:h-[160px] lg:h-[180px]"
        style={
          coverUrl
            ? {
                backgroundImage: `linear-gradient(180deg, transparent 0%, rgba(14,13,21,0.28) 100%), url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }
            : {
                backgroundImage: "linear-gradient(120deg, rgba(194,240,75,0.22), rgba(61,83,135,0.28) 50%, rgba(191,169,186,0.2))"
              }
        }
      >
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button variant="secondary">Change cover</Button>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost">{emoji ?? "Add emoji"}</Button>
          <span className="rounded-full bg-[var(--bg-card-2)] px-2 py-1 text-[12px] text-[var(--text-secondary)]">
            {isSaving ? "Saving..." : "Saved ✓"}
          </span>
        </div>

        <input
          aria-label="Page title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full border-none bg-transparent text-[28px] font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-hint)] sm:text-[32px] lg:text-[40px]"
          placeholder="Untitled"
        />

        <p className="text-[12px] text-[var(--text-secondary)]">
          Created by {authorName ?? "You"} · Last edited {updatedLabel} · {commentCount} comments
        </p>
      </div>
    </div>
  );
}
