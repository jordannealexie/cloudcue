const base = process.env.SMOKE_API_BASE_URL || "http://localhost:4000/api";

const req = async (path, options = {}) => {
  const response = await fetch(base + path, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: response.status, body };
};

const run = async () => {
  const email = `upload_security_${Date.now()}@cloudcue.local`;
  const password = "Password123!";

  const register = await req("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, name: "Upload Security Smoke", password })
  });

  if (register.status !== 201) {
    throw new Error(`register failed: ${register.status}`);
  }

  const login = await req("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = login.body?.data?.accessToken;
  if (login.status !== 200 || !token) {
    throw new Error(`login failed: ${login.status}`);
  }

  const authJson = {
    Authorization: `Bearer ${token}`,
    "content-type": "application/json"
  };

  const page = await req("/pages", {
    method: "POST",
    headers: authJson,
    body: JSON.stringify({ title: "Upload Security Page" })
  });

  const pageId = page.body?.data?.id;
  if (page.status !== 201 || !pageId) {
    throw new Error(`page create failed: ${page.status}`);
  }

  const unsupportedMime = await req("/upload/presign", {
    method: "POST",
    headers: authJson,
    body: JSON.stringify({
      fileName: "bad.exe",
      mimeType: "application/x-msdownload",
      fileSize: 10,
      pageId
    })
  });

  if (unsupportedMime.status !== 400) {
    throw new Error(`unsupported mime should fail with 400, got ${unsupportedMime.status}`);
  }

  const validPresign = await req("/upload/presign", {
    method: "POST",
    headers: authJson,
    body: JSON.stringify({
      fileName: "proof.txt",
      mimeType: "text/plain",
      fileSize: 8,
      pageId
    })
  });

  if (validPresign.status !== 201) {
    throw new Error(`valid presign failed: ${validPresign.status}`);
  }

  const uploadUrl = validPresign.body?.data?.uploadUrl;
  const fileUrl = validPresign.body?.data?.fileUrl;
  const fileId = validPresign.body?.data?.fileId;

  if (!uploadUrl || !fileUrl || !fileId) {
    throw new Error("valid presign did not return uploadUrl/fileUrl/fileId");
  }

  const spoofUpload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00])
  });

  if (uploadUrl.includes("/api/upload/local/") && spoofUpload.status !== 400) {
    throw new Error(`mime spoof should fail with 400 on local upload, got ${spoofUpload.status}`);
  }

  const goodPresign = await req("/upload/presign", {
    method: "POST",
    headers: authJson,
    body: JSON.stringify({
      fileName: "ok.txt",
      mimeType: "text/plain",
      fileSize: 8,
      pageId
    })
  });

  if (goodPresign.status !== 201) {
    throw new Error(`second presign failed: ${goodPresign.status}`);
  }

  const goodUploadUrl = goodPresign.body?.data?.uploadUrl;
  const goodFileUrl = goodPresign.body?.data?.fileUrl;
  const goodFileId = goodPresign.body?.data?.fileId;

  const uploadGood = await fetch(goodUploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "abc12345"
  });

  if (uploadGood.status !== 200) {
    throw new Error(`good upload failed: ${uploadGood.status}`);
  }

  const confirm = await req("/upload/confirm", {
    method: "POST",
    headers: authJson,
    body: JSON.stringify({ fileId: goodFileId })
  });

  if (confirm.status !== 200) {
    throw new Error(`confirm failed: ${confirm.status}`);
  }

  const fetchUploaded = await fetch(goodFileUrl);
  const uploadedText = await fetchUploaded.text();
  if (fetchUploaded.status !== 200 || uploadedText !== "abc12345") {
    throw new Error(`fetch uploaded failed: ${fetchUploaded.status} ${uploadedText}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          unsupportedMime: unsupportedMime.status,
          spoofUpload: spoofUpload.status,
          successfulUpload: uploadGood.status,
          uploadedFetch: fetchUploaded.status,
          localUploadMode: uploadUrl.includes("/api/upload/local/")
        }
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
