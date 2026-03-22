"use client";

import { useRef } from "react";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { useUpload } from "../../hooks/useUpload";

interface UploadZoneProps {
  pageId: string;
  onUploaded: (result: { fileId: string; fileUrl: string }, file: File) => void;
}

export default function UploadZone({ pageId, onUploaded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, isUploading } = useUpload();

  return (
    <div className="surface-elevated flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[14px]">Drag and drop files here, or choose from your device.</p>
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        {isUploading ? <Spinner /> : "Select file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          const result = await uploadFile(file, pageId);
          onUploaded(result, file);
        }}
      />
    </div>
  );
}
