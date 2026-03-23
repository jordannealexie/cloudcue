"use client";

import { useState } from "react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import DropdownMenu from "../ui/DropdownMenu";
import ConfirmModal from "../ui/ConfirmModal";
import Input from "../ui/Input";
import type { PageComment } from "../../types/workspace";

interface CommentItemProps {
  comment: PageComment;
  onResolve: (id: string) => void;
  onReply: (content: string, parentId?: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function CommentItem({ comment, onResolve, onReply, onDelete, compact = false }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const tokens = comment.content.split(/(@\[[^\]]+\])/g);

  return (
    <article className={`surface-elevated ${compact ? "p-2.5" : "p-3"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Avatar name={comment.author?.name ?? "User"} src={comment.author?.avatarUrl} size="sm" />
        <div>
          <p className="text-[12px] font-semibold">{comment.author?.name ?? "User"}</p>
          <p className="text-[11px] text-[var(--text-secondary)]">{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed">
        {tokens.map((token, index) => {
          if (/^@\[[^\]]+\]$/.test(token)) {
            return (
              <span key={`${comment.id}-mention-${index}`} className="rounded bg-[var(--mention-bg)] px-1 text-[var(--mention-text)]">
                {token}
              </span>
            );
          }

          return <span key={`${comment.id}-text-${index}`}>{token}</span>;
        })}
      </p>
      {comment.resolvedAt ? (
        <p className="mt-2 text-[11px] font-semibold text-[var(--text-secondary)]">Resolved</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" onClick={() => setReplyOpen((open) => !open)}>Reply</Button>
        <Button variant="secondary" onClick={() => onResolve(comment.id)}>
          Resolve
        </Button>
        <DropdownMenu
          trigger={<span className="text-[16px] leading-none">⋯</span>}
          items={[
            {
              label: "Copy comment",
              onClick: () => {
                void navigator.clipboard.writeText(comment.content);
              }
            },
            {
              label: "Delete comment",
              tone: "danger",
              onClick: () => setDeleteOpen(true)
            }
          ]}
        />
      </div>

      {replyOpen ? (
        <div className="mt-3 space-y-2">
          <Input
            label="Reply"
            placeholder="Write a reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (!replyText.trim()) {
                  return;
                }

                onReply(replyText.trim(), comment.id);
                setReplyText("");
                setReplyOpen(false);
              }}
            >
              Send reply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setReplyText("");
                setReplyOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {comment.replies && comment.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-l border-[var(--border-subtle)] pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onResolve={onResolve}
              onReply={onReply}
              onDelete={onDelete}
              compact
            />
          ))}
        </div>
      ) : null}

      <ConfirmModal
        open={deleteOpen}
        title="Delete comment"
        message="Delete this comment? This action cannot be undone."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete(comment.id);
        }}
      />
    </article>
  );
}
