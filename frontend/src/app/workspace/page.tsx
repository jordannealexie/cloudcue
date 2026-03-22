"use client";

import { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import WorkspaceHome from "../../components/workspace/WorkspaceHome";
import PageSearch from "../../components/workspace/PageSearch";
import Button from "../../components/ui/Button";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function WorkspacePage() {
  const { loadTree, pages, pageTree, createPage, saveError } = useWorkspace();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (pageTree.length === 0) {
      void loadTree();
    }
  }, [loadTree, pageTree.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PageWrapper>
      <Topbar />
      <section className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold">Workspace</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Your team's knowledge base, docs, and notes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsSearchOpen(true)}>
            Search pages
          </Button>
          <Button onClick={() => void createPage({ title: "Untitled" })}>+ New page</Button>
        </div>
      </section>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          "All pages",
          "My pages",
          "Shared with me",
          "Recently viewed",
          "Archived"
        ].map((tab) => (
          <span key={tab} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[12px] text-[var(--text-secondary)]">
            {tab}
          </span>
        ))}
      </div>
      {saveError ? <div className="surface-card mb-4 p-4 text-[var(--blush)]">{saveError}</div> : null}
      <WorkspaceHome pages={Object.values(pages)} onCreatePage={() => void createPage({ title: "Untitled" })} />
      <PageSearch open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </PageWrapper>
  );
}
