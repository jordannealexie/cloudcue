"use client";

import { ReactNode } from "react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.5)] p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="mobile-sheet w-full max-w-xl rounded-t-[20px] border border-[var(--border-subtle)] bg-[var(--bg-modal)] p-5 md:min-h-0 md:rounded-[16px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">{title}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
