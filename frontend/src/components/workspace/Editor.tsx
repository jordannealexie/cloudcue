"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs, defaultProps, filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockContentWrapper, SuggestionMenuController, createReactBlockSpec, getDefaultReactSlashMenuItems, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { RiArrowRightSLine, RiDoubleQuotesL, RiSeparator } from "react-icons/ri";
import Button from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

interface EditorProps {
  pageId: string;
  initialContent: unknown;
  onAutosave: (payload: { content: unknown; contentText: string }) => Promise<void>;
}

const toggleListItemPropSchema = {
  ...defaultProps,
  expanded: {
    default: false
  }
} as const;

const toggleListItem = createReactBlockSpec(
  {
    type: "toggleListItem",
    propSchema: toggleListItemPropSchema,
    content: "inline"
  },
  {
    render: ({ block, editor, contentRef }) => {
      const isExpanded = Boolean(block.props.expanded);

      return (
        <BlockContentWrapper
          blockType="toggleListItem"
          blockProps={block.props}
          propSchema={toggleListItemPropSchema}
          domAttributes={{
            "data-expanded": isExpanded ? "true" : "false"
          }}
        >
          <div className="bn-toggle-row">
            <button
              type="button"
              contentEditable={false}
              className="bn-toggle-trigger"
              data-expanded={isExpanded ? "true" : "false"}
              aria-label={isExpanded ? "Collapse toggle" : "Expand toggle"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.updateBlock(block, {
                  props: {
                    ...block.props,
                    expanded: !isExpanded
                  }
                });
              }}
            >
              ▸
            </button>
            <div ref={contentRef} className="bn-inline-content" />
          </div>
        </BlockContentWrapper>
      );
    }
  }
);

const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    toggleListItem
  }
});

const collectText = (value: unknown, bucket: string[]) => {
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
    value.forEach((item) => collectText(item, bucket));
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

      collectText(child, bucket);
    });
  }
};

const toPlainText = (content: unknown): string => {
  const parts: string[] = [];
  collectText(content, parts);
  return parts.join(" ").replace(/\s+/g, " ").trim();
};

const sanitizeInlineContent = (input: unknown): unknown[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item) => item && typeof item === "object" && typeof (item as { type?: unknown }).type === "string")
    .map((item) => {
      const itemRecord = item as Record<string, unknown>;
      return {
        ...itemRecord,
        styles: typeof itemRecord.styles === "object" && itemRecord.styles ? itemRecord.styles : {}
      };
    });
};

const sanitizeTableContent = (input: unknown): unknown | undefined => {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  if (record.type !== "tableContent" || !Array.isArray(record.rows)) {
    return undefined;
  }

  const rows = record.rows
    .filter((row) => row && typeof row === "object" && Array.isArray((row as { cells?: unknown }).cells))
    .map((row) => {
      const rowRecord = row as Record<string, unknown>;
      const rawCells = rowRecord.cells as unknown[];
      const cells = rawCells.map((cell) => {
        if (Array.isArray(cell)) {
          return sanitizeInlineContent(cell);
        }

        return sanitizeInlineContent([cell]);
      });

      return { cells };
    });

  return {
    type: "tableContent",
    columnWidths: Array.isArray(record.columnWidths) ? record.columnWidths : undefined,
    rows
  };
};

const getSafeInitialContent = (input: unknown): never[] | undefined => {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const sanitized = input
    .filter((block) => block && typeof block === "object" && typeof (block as { type?: unknown }).type === "string")
    .map((block) => {
      const blockRecord = block as Record<string, unknown>;
      const safeBlock: Record<string, unknown> = {
        ...blockRecord,
        props: typeof blockRecord.props === "object" && blockRecord.props ? blockRecord.props : {}
      };

      if (Array.isArray(blockRecord.content)) {
        safeBlock.content = sanitizeInlineContent(blockRecord.content);
      } else {
        const safeTableContent = sanitizeTableContent(blockRecord.content);
        if (safeTableContent) {
          safeBlock.content = safeTableContent;
        }
      }

      return safeBlock;
    });

  if (sanitized.length === 0) {
    return undefined;
  }

  return sanitized as never[];
};

export default function Editor({ pageId, initialContent, onAutosave }: EditorProps) {
  const { resolvedTheme } = useTheme();
  const safeInitialContent = useMemo(() => getSafeInitialContent(initialContent), [initialContent]);

  const editor = useCreateBlockNote({
    schema: editorSchema,
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

  const getSlashMenuItems = async (query: string) => {
    const defaultItems = getDefaultReactSlashMenuItems(editor);
    const customItems = [
      {
        title: "Quote",
        subtext: "Insert a quote line",
        aliases: ["quote", "blockquote"],
        group: "Basic blocks",
        icon: <RiDoubleQuotesL />,
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "paragraph",
            props: {
              textColor: "gray"
            },
            content: [{ type: "text", text: "Quote", styles: { italic: true } }]
          });
        }
      },
      {
        title: "Toggle",
        subtext: "Collapsible toggle list",
        aliases: ["toggle", "expand", "collapse"],
        group: "Basic blocks",
        icon: <RiArrowRightSLine />,
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "toggleListItem",
            props: {
              expanded: false
            },
            content: [{ type: "text", text: "Toggle", styles: {} }],
            children: [{ type: "paragraph", content: [{ type: "text", text: "Empty toggle", styles: {} }] }]
          } as never);
        }
      },
      {
        title: "Divider",
        subtext: "Insert a visual divider",
        aliases: ["divider", "separator", "line"],
        group: "Basic blocks",
        icon: <RiSeparator />,
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "paragraph",
            content: [{ type: "text", text: "────────", styles: {} }]
          });
        }
      }
    ];

    return filterSuggestionItems([...defaultItems, ...customItems], query);
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
        slashMenu={false}
      >
        <SuggestionMenuController triggerCharacter="/" getItems={getSlashMenuItems} />
      </BlockNoteView>
    </div>
  );
}
