"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import WorkspaceHome from "../../components/workspace/WorkspaceHome";
import PageTemplateModal from "../../components/workspace/PageTemplateModal";
import Button from "../../components/ui/Button";
import { useWorkspace } from "../../hooks/useWorkspace";

export default function WorkspacePage() {
  const router = useRouter();
  const { loadTree, pages, pageTree, createPage, saveError, isLoading } = useWorkspace();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  useEffect(() => {
    if (pageTree.length === 0) {
      void loadTree();
    }
  }, [loadTree, pageTree.length]);

  return (
    <PageWrapper>
      <Topbar />
      <section className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold">Workspace</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Your team's knowledge base, docs, and notes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void createPage({ title: "Untitled" })}>+ New page</Button>
          <Button variant="ghost" onClick={() => setIsTemplateModalOpen(true)}>Use template</Button>
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
      <WorkspaceHome pages={Object.values(pages)} onCreatePage={() => void createPage({ title: "Untitled" })} loading={isLoading} />
      <PageTemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onUseTemplate={({ title, content }) => {
          void (async () => {
            const result = await createPage({ title, content });
            if (result.meta.requestStatus === "fulfilled") {
              const nextPage = result.payload as { id: string };
              router.push(`/workspace/${nextPage.id}`);
            }
          })();
        }}
      />
    </PageWrapper>
  );
}
