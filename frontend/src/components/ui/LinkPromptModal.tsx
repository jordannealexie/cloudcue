"use client";

import Modal from "./Modal";
import Button from "./Button";

interface LinkPromptModalProps {
  open: boolean;
  title: string;
  message: string;
  value: string;
  placeholder?: string;
  saveLabel?: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function LinkPromptModal({
  open,
  title,
  message,
  value,
  placeholder = "https://...",
  saveLabel = "Save",
  onChange,
  onCancel,
  onSave
}: LinkPromptModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-[14px] text-[var(--text-secondary)]">{message}</p>
        <input
          aria-label={title}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card-2)] px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-hint)] focus:border-[var(--accent)] focus:outline-none"
        />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onSave}>{saveLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
