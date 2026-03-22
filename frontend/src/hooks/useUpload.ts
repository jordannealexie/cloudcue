"use client";

import { useCallback, useState } from "react";
import { uploadFileWithPresign } from "../lib/uploadFile";

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, pageId: string) => {
    try {
      setIsUploading(true);
      setError(null);
      return await uploadFileWithPresign({ file, pageId });
    } catch (uploadError) {
      setError((uploadError as Error).message);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { isUploading, error, uploadFile };
};
