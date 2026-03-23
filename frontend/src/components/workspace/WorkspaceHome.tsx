"use client";

import Link from "next/link";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { usePinnedItems } from "../../hooks/usePinnedItems";
import { toPinnedPageId } from "../../lib/pinnedItems";
import type { WorkspacePage } from "../../types/workspace";
import PageIcon from "./PageIcon";

interface WorkspaceHomeProps {
  pages: WorkspacePage[];
  onCreatePage: () => void;
  loading?: boolean;
}

export default function WorkspaceHome({ pages, onCreatePage, loading = false }: WorkspaceHomeProps) {
  const { isPinned, togglePin } = usePinnedItems();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <article key={index} className="surface-card overflow-hidden p-0">
            <div className="h-28 animate-pulse bg-[var(--bg-card-2)]" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-10 animate-pulse rounded bg-[var(--bg-card-2)]" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-card-2)]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-card-2)]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--bg-card-2)]" />
            </div>
          </article>
        ))}
      </div>
    );
  }

  const childCountMap = pages.reduce<Record<string, number>>((acc, page) => {
    if (page.parentId) {
      acc[page.parentId] = (acc[page.parentId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const rootPages = pages.filter((page) => !page.parentId);

  if (!pages.length) {
    return (
      <div className="surface-card flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center">
        <PageIcon className="h-12 w-12 text-[var(--text-secondary)]" />
        <h2 className="text-[20px] font-semibold">No pages yet</h2>
        <p className="text-[14px] text-[var(--text-secondary)]">Create your first page to start writing, planning, or brainstorming.</p>
        <Button onClick={onCreatePage}>Create a page</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rootPages.map((page) => (
        <Link key={page.id} href={`/workspace/${page.id}`} className="surface-card group overflow-hidden p-0">
          <div
            className="relative h-28"
            style={{
              backgroundImage: page.coverUrl
                ? `linear-gradient(180deg, transparent, rgba(14,13,21,0.4)), url(${page.coverUrl})`
                : "linear-gradient(120deg, rgba(24,35,70,0.2), rgba(61,83,135,0.26), rgba(191,169,186,0.24))",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
          <div className="p-4">
            <div className="-mt-8 mb-2 flex items-start justify-between gap-2">
              <PageIcon icon={page.emoji} className="h-10 w-10 text-[var(--text-primary)] shadow-md" />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void togglePin(toPinnedPageId(page.id));
                }}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-2)]"
              >
                {isPinned(toPinnedPageId(page.id)) ? "Unpin" : "Pin"}
              </button>
            </div>
            <h3 className="text-[16px] font-semibold">{page.title}</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">{childCountMap[page.id] ?? 0} subpages</p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Edited {new Date(page.updatedAt).toLocaleString()}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2" aria-label="Shared with">
                <Avatar name="Demo User" size="sm" />
                <Avatar name="Team User" size="sm" />
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]">Open</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
