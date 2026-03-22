"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import Button from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

interface EditorProps {
  pageId: string;
  initialContent: unknown;
  onAutosave: (payload: { content: unknown; contentText: string }) => Promise<void>;
}

const toPlainText = (content: unknown): string => JSON.stringify(content);

const getSafeInitialContent = (input: unknown): never[] | undefined => {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const hasInvalidBlock = input.some((block) => {
    return !block || typeof block !== "object" || typeof (block as { type?: unknown }).type !== "string";
  });

  if (hasInvalidBlock) {
    return undefined;
  }

  return input as never[];
};

export default function Editor({ pageId, initialContent, onAutosave }: EditorProps) {
  const { resolvedTheme } = useTheme();
  const safeInitialContent = useMemo(() => getSafeInitialContent(initialContent), [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: safeInitialContent ?? ([{ type: "paragraph", content: [] }] as never[])
  });

  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lastPayload, setLastPayload] = useState<unknown>(initialContent);

  const serialized = useMemo(() => JSON.stringify(lastPayload), [lastPayload]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (serialized === JSON.stringify(initialContent)) {
        return;
      }

      try {
        setStatus("saving");
        const blocks = editor.document;
        await onAutosave({ content: blocks, contentText: toPlainText(blocks) });
        setStatus("saved");
      } catch (_error) {
        setStatus("error");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [editor.document, initialContent, onAutosave, serialized, editor]);

  const handleRetry = async () => {
    try {
      setStatus("saving");
      const blocks = editor.document;
      await onAutosave({ content: blocks, contentText: toPlainText(blocks) });
      setStatus("saved");
    } catch (_error) {
      setStatus("error");
    }
  };

  return (
    <div className="surface-card p-4" data-page-id={pageId}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-[var(--text-secondary)]">
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Unsaved changes"}
        </p>
        {status === "error" ? <Button variant="secondary" onClick={() => void handleRetry()}>Retry</Button> : null}
      </div>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        className="workspace-editor"
        onChange={() => {
          setLastPayload(editor.document);
        }}
        slashMenu={true}
      />
    </div>
  );
}
