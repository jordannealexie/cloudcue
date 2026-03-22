import { apiClient } from "./apiClient";

export const uploadFileWithPresign = async (payload: {
  file: File;
  pageId: string;
}): Promise<{ fileId: string; fileUrl: string }> => {
  const presign = await apiClient.post("/upload/presign", {
    fileName: payload.file.name,
    mimeType: payload.file.type,
    pageId: payload.pageId,
    fileSize: payload.file.size
  });

  const { uploadUrl, fileUrl, fileId } = presign.data.data as {
    uploadUrl: string;
    fileUrl: string;
    fileId: string;
  };

  await fetch(uploadUrl, {
    method: "PUT",
    body: payload.file,
    headers: {
      "Content-Type": payload.file.type
    }
  });

  await apiClient.post("/upload/confirm", { fileId });

  return { fileId, fileUrl };
};
