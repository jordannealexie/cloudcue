"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "../../../components/layout/PageWrapper";
import Topbar from "../../../components/layout/Topbar";
import PageTree from "../../../components/workspace/PageTree";
import PageHeader from "../../../components/workspace/PageHeader";
import PageBreadcrumb from "../../../components/workspace/PageBreadcrumb";
import CommentThread from "../../../components/workspace/CommentThread";
import Editor from "../../../components/workspace/Editor";
import ShareModal from "../../../components/workspace/ShareModal";
import Button from "../../../components/ui/Button";
import { useWorkspace } from "../../../hooks/useWorkspace";
import { useSocket } from "../../../hooks/useSocket";
import {
  fetchCommentsThunk,
  postCommentThunk,
  resolveCommentThunk,
  setCommentPanelOpen
} from "../../../store/slices/commentsSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks/useAppStore";

export default function WorkspaceEditorPage() {
  const params = useParams<{ pageId: string }>();
  const router = useRouter();
  const pageId = params.pageId;
  const dispatch = useAppDispatch();
  const { loadTree, loadPage, pageTree, pages, updatePage, createPage, removePage, isSaving, saveError } = useWorkspace();
  const comments = useAppSelector((state) => state.comments.byPageId[pageId] ?? []);
  const commentsError = useAppSelector((state) => state.comments.error);
  const isCommentPanelOpen = useAppSelector((state) => state.comments.isCommentPanelOpen);
  const viewers = useAppSelector((state) => state.workspace.viewers[pageId] ?? []);

  const [shareOpen, setShareOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useSocket(pageId);

  useEffect(() => {
    if (pageTree.length === 0) {
      void loadTree();
    }

    if (!pages[pageId]) {
      void loadPage(pageId);
    }

    if (comments.length === 0) {
      void dispatch(fetchCommentsThunk(pageId));
    }
  }, [comments.length, dispatch, loadPage, loadTree, pageId, pageTree.length, pages]);

  const page = pages[pageId];

  const breadcrumb = useMemo(() => {
    return [
      { label: "Home", href: "/workspace" },
      { label: page?.title ?? "Untitled", href: `/workspace/${pageId}` }
    ];
  }, [page?.title, pageId]);

  if (!page) {
    return (
      <PageWrapper>
        <Topbar />
        <div className="surface-card p-6">Loading page...</div>
      </PageWrapper>
    );
  }

  const exportMarkdown = () => {
    const markdown = `# ${page.title}\n\n${page.contentText ?? ""}`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${page.title.replace(/\s+/g, "-").toLowerCase() || "page"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (_error) {
      // Clipboard access can fail on insecure contexts or denied permissions.
    }
  };

  const archivePage = async () => {
    await removePage(pageId);
    router.push("/workspace");
  };

  return (
    <PageWrapper>
      <Topbar />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr_300px]">
        <aside className="surface-card hidden p-3 lg:block">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold">Pages</h3>
            <Button variant="ghost" onClick={() => void createPage({ title: "Untitled" })}>+
            </Button>
          </div>
          <PageTree
            tree={pageTree}
            activeId={pageId}
            onAddPage={() => void createPage({ title: "Untitled" })}
            onAddSubpage={(parentId) => void createPage({ parentId, title: "Untitled" })}
            onDeletePage={(targetPageId) => {
              if (targetPageId === pageId) {
                void archivePage();
                return;
              }

              void removePage(targetPageId);
            }}
          />
        </aside>

        <main className="space-y-3">
          <PageBreadcrumb segments={breadcrumb} />
          {saveError ? <div className="surface-card p-3 text-[12px] text-[var(--blush)]">{saveError}</div> : null}
          {commentsError ? <div className="surface-card p-3 text-[12px] text-[var(--blush)]">{commentsError}</div> : null}
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-[var(--text-secondary)]">Also viewing: {viewers.length}</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => dispatch(setCommentPanelOpen(!isCommentPanelOpen))}>Comments</Button>
              <Button variant="primary" onClick={() => setShareOpen(true)}>Share</Button>
              <div className="relative">
                <Button variant="ghost" onClick={() => setIsMenuOpen((open) => !open)}>More</Button>
                {isMenuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
                    <button type="button" onClick={() => void copyPageLink()} className="w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[var(--bg-card-2)]">
                      Copy link
                    </button>
                    <button type="button" onClick={exportMarkdown} className="w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-[var(--bg-card-2)]">
                      Export markdown
                    </button>
                    <button type="button" onClick={() => void archivePage()} className="w-full rounded-lg px-3 py-2 text-left text-[12px] text-[var(--blush)] hover:bg-[var(--bg-card-2)]">
                      Archive page
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <PageHeader
            title={page.title}
            emoji={page.emoji}
            coverUrl={page.coverUrl}
            isSaving={isSaving}
            updatedAt={page.updatedAt}
            authorName={comments[0]?.author?.name}
            commentCount={comments.length}
            onTitleChange={(title) => {
              void updatePage({ pageId, title, contentText: title });
            }}
          />

          <Editor
            pageId={pageId}
            initialContent={page.content}
            onAutosave={async ({ content, contentText }) => {
              await updatePage({ pageId, content, contentText });
            }}
          />
        </main>

        <div className="hidden lg:block">
          <CommentThread
            comments={comments}
            onPost={(content, parentId) => {
              void dispatch(postCommentThunk({ pageId, content, parentId }));
            }}
            onResolve={(id) => {
              void dispatch(resolveCommentThunk({ pageId, commentId: id }));
            }}
          />
        </div>
      </div>

      {isCommentPanelOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => dispatch(setCommentPanelOpen(false))}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-[16px] bg-[var(--bg-surface)] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <CommentThread
              comments={comments}
              onPost={(content, parentId) => {
                void dispatch(postCommentThunk({ pageId, content, parentId }));
              }}
              onResolve={(id) => {
                void dispatch(resolveCommentThunk({ pageId, commentId: id }));
              }}
            />
          </div>
        </div>
      ) : null}

      <ShareModal pageId={pageId} open={shareOpen} onClose={() => setShareOpen(false)} />
    </PageWrapper>
  );
}
