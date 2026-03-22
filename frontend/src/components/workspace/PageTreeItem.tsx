"use client";

import { useState } from "react";
import Link from "next/link";
import DropdownMenu from "../ui/DropdownMenu";
import type { PageTreeNode } from "../../types/workspace";

interface PageTreeItemProps {
  node: PageTreeNode;
  level?: number;
  activeId?: string | null;
  onAddSubpage?: (parentId: string) => void;
}

export default function PageTreeItem({ node, level = 0, activeId, onAddSubpage }: PageTreeItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1" style={{ paddingLeft: `${level * 16}px` }}>
      <div className={`group flex items-center justify-between rounded-lg px-2 py-1 ${activeId === node.id ? "bg-[var(--bg-card-2)] border-l-2 border-[var(--accent)]" : ""}`}>
        <button type="button" className="mr-1 text-[12px]" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? "▾" : "▸"}
        </button>
        <Link href={`/workspace/${node.id}`} className="flex flex-1 items-center gap-2 text-[13px]">
          <span>{node.emoji ?? "📄"}</span>
          <span className="truncate">{node.title}</span>
        </Link>
        <DropdownMenu
          trigger={<span className="px-2 text-[var(--text-secondary)]">...</span>}
          items={[
            { label: "Rename", onClick: () => undefined },
            { label: "Add subpage", onClick: () => onAddSubpage?.(node.id) },
            { label: "Duplicate", onClick: () => undefined },
            { label: "Copy link", onClick: () => navigator.clipboard.writeText(`${window.location.origin}/workspace/${node.id}`) },
            { label: "Archive", onClick: () => undefined }
          ]}
        />
      </div>

      {expanded
        ? node.children.map((child) => (
            <PageTreeItem key={child.id} node={child} level={level + 1} activeId={activeId} onAddSubpage={onAddSubpage} />
          ))
        : null}
    </div>
  );
}
