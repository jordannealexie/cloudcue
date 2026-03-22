"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import PermissionsPanel from "./PermissionsPanel";
import Button from "../ui/Button";

interface ShareModalProps {
  pageId: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ pageId, open, onClose }: ShareModalProps) {
  const [message, setMessage] = useState<string | null>(null);

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/workspace/${pageId}`);
      setMessage("Link copied");
    } catch (_error) {
      setMessage("Unable to copy link");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share page">
      <div className="mb-3 space-y-2">
        <Button variant="secondary" className="w-full" onClick={() => void copyLink()}>
          Copy page link
        </Button>
        <p className="text-[12px] text-[var(--text-secondary)]">
          Subpages inherit at least viewer visibility when they are nested under this page.
        </p>
        {message ? <p className="text-[12px] text-[var(--text-secondary)]">{message}</p> : null}
      </div>
      <PermissionsPanel pageId={pageId} />
    </Modal>
  );
}
