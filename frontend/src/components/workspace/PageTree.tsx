"use client";

import PageTreeItem from "./PageTreeItem";
import type { PageTreeNode } from "../../types/workspace";

interface PageTreeProps {
  tree: PageTreeNode[];
  activeId?: string | null;
  onAddSubpage?: (parentId: string) => void;
  onAddPage?: () => void;
  onDeletePage?: (pageId: string) => void;
}

export default function PageTree({ tree, activeId, onAddSubpage, onAddPage, onDeletePage }: PageTreeProps) {
  if (!tree.length) {
    return <div className="text-[13px] text-[var(--text-secondary)]">No pages yet.</div>;
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          activeId={activeId}
          onAddSubpage={onAddSubpage}
          onDeletePage={onDeletePage}
        />
      ))}
      <button
        type="button"
        onClick={onAddPage}
        className="w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-[12px]"
      >
        + Add a page
      </button>
    </div>
  );
}
