"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { useWorkspace } from "../../hooks/useWorkspace";
import PageIcon from "./PageIcon";

interface PageSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function PageSearch({ open, onClose }: PageSearchProps) {
  const router = useRouter();
  const { searchPages, searchResults, createPage } = useWorkspace();
  const [query, setQuery] = useState("");

  const normalizePreview = (raw?: string | null): string => {
    if (!raw) {
      return "No preview";
    }

    const trimmed = raw.trim();

    // Older content may contain serialized editor JSON. Parse and extract readable text.
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const bucket: string[] = [];

        const visit = (value: unknown) => {
          if (!value) {
            return;
          }

          if (typeof value === "string") {
            if (value.trim().length > 0) {
              bucket.push(value.trim());
            }
            return;
          }

          if (Array.isArray(value)) {
            value.forEach(visit);
            return;
          }

          if (typeof value === "object") {
            Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
              if (key === "text" && typeof child === "string") {
                if (child.trim().length > 0) {
                  bucket.push(child.trim());
                }
                return;
              }

              visit(child);
            });
          }
        };

        visit(parsed);
        const parsedText = bucket.join(" ").replace(/\s+/g, " ").trim();
        if (parsedText.length > 0) {
          return parsedText;
        }
      } catch (_error) {
        // Fall through to generic cleanup.
      }
    }

    return trimmed.replace(/[{}\[\]"]+/g, " ").replace(/\s+/g, " ").trim();
  };

  const highlight = (text: string, needle: string) => {
    if (!needle.trim()) {
      return text;
    }

    const escapedNeedle = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedNeedle})`, "ig"));

    return parts.map((part, index) =>
      part.toLowerCase() === needle.toLowerCase() ? (
        <mark key={`mark-${index}`} className="rounded bg-[var(--mention-bg)] px-1 text-[var(--mention-text)]">
          {part}
        </mark>
      ) : (
        <span key={`text-${index}`}>{part}</span>
      )
    );
  };

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      void searchPages(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchPages]);

  return (
    <Modal open={open} onClose={onClose} title="Search">
      <Input
        label="Search tasks, pages, people"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tasks, pages, people..."
      />
      <div className="mt-3 space-y-2">
        {!query.trim() ? (
          <>
            <p className="text-[12px] text-[var(--text-secondary)]">Recent pages appear here once you start navigating.</p>
            <div className="surface-elevated p-3 text-[12px]">
              <p className="mb-2 font-semibold">Quick actions</p>
              <button
                type="button"
                className="block w-full rounded-md px-2 py-1 text-left transition hover:bg-[var(--bg-card)]"
                onClick={() => {
                  onClose();
                  router.push("/tasks");
                }}
              >
                Create new task
              </button>
              <button
                type="button"
                className="mt-1 block w-full rounded-md px-2 py-1 text-left transition hover:bg-[var(--bg-card)]"
                onClick={() => {
                  void (async () => {
                    const result = await createPage({ title: "Untitled" });
                    onClose();
                    if (result.meta.requestStatus === "fulfilled") {
                      const nextPage = result.payload as { id: string };
                      router.push(`/workspace/${nextPage.id}`);
                    }
                  })();
                }}
              >
                Create new page
              </button>
              <button
                type="button"
                className="mt-1 block w-full rounded-md px-2 py-1 text-left transition hover:bg-[var(--bg-card)]"
                onClick={() => {
                  onClose();
                  router.push("/projects?new=1");
                }}
              >
                Create new project
              </button>
            </div>
          </>
        ) : null}
        {query.trim() && searchResults.length === 0 ? (
          <p className="text-[12px] text-[var(--text-secondary)]">No results. Try a different search term.</p>
        ) : null}
        {searchResults.map((result) => (
          <Link key={result.id} href={`/workspace/${result.id}`} className="surface-elevated block p-3" onClick={onClose}>
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <PageIcon icon={result.emoji} className="h-5 w-5 text-[var(--text-secondary)]" />
              <span>{highlight(result.title, query)}</span>
            </p>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {highlight(normalizePreview(result.contentText).slice(0, 160), query)}
            </p>
          </Link>
        ))}
      </div>
    </Modal>
  );
}
