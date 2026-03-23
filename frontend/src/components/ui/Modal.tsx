"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4 backdrop-blur-sm md:p-6">
      <div className="pop-in w-full max-w-xl rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-modal)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">{title}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
