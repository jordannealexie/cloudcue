"use client";

import Link from "next/link";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import type { WorkspacePage } from "../../types/workspace";
import PageIcon from "./PageIcon";

interface WorkspaceHomeProps {
  pages: WorkspacePage[];
  onCreatePage: () => void;
}

export default function WorkspaceHome({ pages, onCreatePage }: WorkspaceHomeProps) {
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
            <div className="-mt-8 mb-2">
              <PageIcon className="h-10 w-10 text-[var(--text-primary)] shadow-md" />
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
