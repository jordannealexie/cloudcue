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

const jsonHeaders = { "content-type": "application/json" };
const authOnly = (token) => ({ Authorization: `Bearer ${token}` });
const authJson = (token) => ({ Authorization: `Bearer ${token}`, "content-type": "application/json" });

const run = async () => {
  const matrix = [];
  const record = (name, ok, detail) => matrix.push({ name, ok, detail });

  const ownerEmail = `reg_owner_${Date.now()}@cloudcue.local`;
  const otherEmail = `reg_other_${Date.now()}@cloudcue.local`;
  const password = "Password123!";

  const registerOwner = await req("/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email: ownerEmail, name: "Regression Owner", password })
  });
  record("auth.register.owner", registerOwner.status === 201, registerOwner.status);

  const registerOther = await req("/auth/register", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email: otherEmail, name: "Regression Other", password })
  });
  record("auth.register.other", registerOther.status === 201, registerOther.status);

  const loginOwner = await req("/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email: ownerEmail, password })
  });
  const ownerToken = loginOwner.body?.data?.accessToken;
  record("auth.login.owner", loginOwner.status === 200 && !!ownerToken, loginOwner.status);

  const loginOther = await req("/auth/login", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email: otherEmail, password })
  });
  const otherToken = loginOther.body?.data?.accessToken;
  record("auth.login.other", loginOther.status === 200 && !!otherToken, loginOther.status);

  const me = await req("/users/me", { headers: authOnly(ownerToken) });
  record("users.me", me.status === 200, me.status);

  const sessions = await req("/users/sessions", { headers: authOnly(ownerToken) });
  record("users.sessions", sessions.status === 200, sessions.status);

  const project = await req("/projects", {
    method: "POST",
    headers: authJson(ownerToken),
    body: JSON.stringify({ name: "Regression Project", description: "Regression", color: "#22AA44" })
  });
  record("projects.create", project.status === 201, project.status);

  const page = await req("/pages", {
    method: "POST",
    headers: authJson(ownerToken),
    body: JSON.stringify({ title: "Regression Page" })
  });
  const pageId = page.body?.data?.id;
  record("pages.create", page.status === 201 && !!pageId, page.status);

  const comment = await req(`/pages/${pageId}/comments`, {
    method: "POST",
    headers: authJson(ownerToken),
    body: JSON.stringify({ content: "owner comment" })
  });
  const commentId = comment.body?.data?.id;
  record("comments.create", comment.status === 201 && !!commentId, comment.status);

  const unauthorizedEdit = await req(`/comments/${commentId}`, {
    method: "PATCH",
    headers: authJson(otherToken),
    body: JSON.stringify({ content: "unauthorized edit" })
  });
  record("comments.unauthorizedEdit", unauthorizedEdit.status === 403, unauthorizedEdit.status);

  const teamMembers = await req("/team/members", { headers: authOnly(ownerToken) });
  record("team.members", teamMembers.status === 200, teamMembers.status);

  const teamInvites = await req("/team/invites", { headers: authOnly(ownerToken) });
  record("team.invites", teamInvites.status === 200, teamInvites.status);

  for (const filter of ["all", "unread", "mentions", "tasks", "comments"]) {
    const notifications = await req(`/notifications?filter=${filter}`, { headers: authOnly(ownerToken) });
    record(`notifications.${filter}`, notifications.status === 200, notifications.status);
  }

  const presign = await req("/upload/presign", {
    method: "POST",
    headers: authJson(ownerToken),
    body: JSON.stringify({ fileName: "regression.txt", mimeType: "text/plain", fileSize: 14, pageId })
  });
  const uploadUrl = presign.body?.data?.uploadUrl;
  const fileId = presign.body?.data?.fileId;
  const fileUrl = presign.body?.data?.fileUrl;
  record("upload.presign", presign.status === 201 && !!uploadUrl && !!fileId && !!fileUrl, presign.status);

  const uploadPut = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "regressionData"
  });
  record("upload.put", uploadPut.status === 200, uploadPut.status);

  const uploadConfirm = await req("/upload/confirm", {
    method: "POST",
    headers: authJson(ownerToken),
    body: JSON.stringify({ fileId })
  });
  record("upload.confirm", uploadConfirm.status === 200, uploadConfirm.status);

  const uploaded = await fetch(fileUrl);
  const uploadedText = await uploaded.text();
  record("upload.fetch", uploaded.status === 200 && uploadedText === "regressionData", `${uploaded.status}/${uploadedText}`);

  const dependencies = await req("/health/dependencies");
  const dbHealthy = dependencies.body?.data?.dependencies?.database === true;
  const storageHealthy = dependencies.body?.data?.dependencies?.storage;
  record("health.dependencies", dependencies.status === 503 && dbHealthy && storageHealthy === false, dependencies.status);

  const failed = matrix.filter((entry) => !entry.ok);
  const result = {
    ok: failed.length === 0,
    total: matrix.length,
    passed: matrix.length - failed.length,
    failed: failed.length,
    failedItems: failed
  };

  console.log(JSON.stringify(result, null, 2));

  if (failed.length > 0) {
    process.exit(1);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
