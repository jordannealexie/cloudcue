"use client";

import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import CommentItem from "./CommentItem";
import type { PageComment } from "../../types/workspace";

interface CommentThreadProps {
  comments: PageComment[];
  onPost: (content: string, parentId?: string) => void;
  onResolve: (id: string) => void;
}

export default function CommentThread({ comments, onPost, onResolve }: CommentThreadProps) {
  const [content, setContent] = useState("");

  return (
    <aside className="surface-card h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold">Comments</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--bg-card-2)] px-2 py-1 text-[12px] text-[var(--text-secondary)]">{comments.length}</span>
          <Button variant="ghost" onClick={() => comments.forEach((comment) => onResolve(comment.id))}>Resolve all</Button>
        </div>
      </div>

      <div className="space-y-2">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onResolve={onResolve} />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Input label="Add a comment" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Type @ to mention someone" />
        <Button
          className="w-full"
          onClick={() => {
            if (content.trim()) {
              onPost(content.trim());
              setContent("");
            }
          }}
        >
          Send
        </Button>
      </div>
    </aside>
  );
}
