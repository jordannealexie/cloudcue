"use client";

import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import type { PageComment } from "../../types/workspace";

interface CommentItemProps {
  comment: PageComment;
  onResolve: (id: string) => void;
}

export default function CommentItem({ comment, onResolve }: CommentItemProps) {
  const tokens = comment.content.split(/(@\[[^\]]+\])/g);

  return (
    <article className="surface-elevated p-3">
      <div className="mb-2 flex items-center gap-2">
        <Avatar name={comment.author?.name ?? "User"} src={comment.author?.avatarUrl} size="sm" />
        <div>
          <p className="text-[13px] font-semibold">{comment.author?.name ?? "User"}</p>
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
        <Button variant="ghost">Reply</Button>
        <Button variant="secondary" onClick={() => onResolve(comment.id)}>
          Resolve
        </Button>
        <Button variant="ghost">More</Button>
      </div>
    </article>
  );
}
