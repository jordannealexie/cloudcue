"use client";

import { useState } from "react";
import Link from "next/link";
import DropdownMenu from "../ui/DropdownMenu";
import type { PageTreeNode } from "../../types/workspace";
import PageIcon from "./PageIcon";
import ConfirmModal from "../ui/ConfirmModal";

interface PageTreeItemProps {
  node: PageTreeNode;
  level?: number;
  activeId?: string | null;
  onAddSubpage?: (parentId: string) => void;
  onDeletePage?: (pageId: string) => void;
}

export default function PageTreeItem({ node, level = 0, activeId, onAddSubpage, onDeletePage }: PageTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  return (
    <div className="space-y-1" style={{ paddingLeft: `${level * 14}px` }}>
      <div className={`group flex items-center justify-between rounded-lg px-2 py-1.5 ${activeId === node.id ? "bg-[var(--bg-card-2)] border-l-2 border-[var(--accent)]" : ""}`}>
        {hasChildren ? (
          <button
            type="button"
            className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-2)]"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Collapse page" : "Expand page"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="mr-1 inline-flex h-5 w-5" />
        )}

        <Link href={`/workspace/${node.id}`} className="flex flex-1 items-center gap-2 text-[14px] font-medium">
          <PageIcon icon={node.emoji} className="h-5 w-5 text-[var(--text-secondary)]" />
          <span className="truncate">{node.title}</span>
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Delete ${node.title}`}
          className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--blush)] opacity-0 transition hover:bg-[var(--bg-card-2)] group-hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <DropdownMenu
          trigger={<span className="text-[16px] leading-none">⋯</span>}
          items={[
            { label: "Add subpage", onClick: () => onAddSubpage?.(node.id) },
            { label: "Copy link", onClick: () => navigator.clipboard.writeText(`${window.location.origin}/workspace/${node.id}`) },
            { label: "Delete", onClick: handleDelete }
          ]}
        />
      </div>

      {expanded
        ? node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              activeId={activeId}
              onAddSubpage={onAddSubpage}
              onDeletePage={onDeletePage}
            />
          ))
        : null}

      <ConfirmModal
        open={isDeleteConfirmOpen}
        title="Delete page"
        message={`Delete \"${node.title}\"? This action cannot be undone.`}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDeletePage?.(node.id);
        }}
      />
    </div>
  );
}
