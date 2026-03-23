const base = "http://localhost:4000/api";

const req = async (path, options = {}) => {
  const res = await fetch(base + path, options);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

const jsonHeaders = { "content-type": "application/json" };
const authJson = (token) => ({ Authorization: `Bearer ${token}`, "content-type": "application/json" });
const authOnly = (token) => ({ Authorization: `Bearer ${token}` });

(async () => {
  const matrix = [];
  const record = (name, ok, detail) => matrix.push({ name, ok, detail });

  const emailA = `reg_owner_${Date.now()}@cloudcue.local`;
  const emailB = `reg_other_${Date.now()}@cloudcue.local`;
  const password = "Password123!";

  const regA = await req("/auth/register", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email: emailA, name: "Reg Owner", password }) });
  record("auth.register.owner", regA.status === 201, regA.status);

  const regB = await req("/auth/register", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email: emailB, name: "Reg Other", password }) });
  record("auth.register.other", regB.status === 201, regB.status);

  const loginA = await req("/auth/login", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email: emailA, password }) });
  const tokenA = loginA.body?.data?.accessToken;
  record("auth.login.owner", loginA.status === 200 && !!tokenA, loginA.status);

  const loginB = await req("/auth/login", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ email: emailB, password }) });
  const tokenB = loginB.body?.data?.accessToken;
  record("auth.login.other", loginB.status === 200 && !!tokenB, loginB.status);

  const me = await req("/users/me", { headers: authOnly(tokenA) });
  record("users.me", me.status === 200, me.status);

  const sessions = await req("/auth/sessions", { headers: authOnly(tokenA) });
  record("auth.sessions", sessions.status === 200, sessions.status);

  const project = await req("/projects", { method: "POST", headers: authJson(tokenA), body: JSON.stringify({ name: "Regression Project", description: "regression" }) });
  record("projects.create", project.status === 201, project.status);

  const page = await req("/pages", { method: "POST", headers: authJson(tokenA), body: JSON.stringify({ title: "Regression Page" }) });
  const pageId = page.body?.data?.id;
  record("pages.create", page.status === 201 && !!pageId, page.status);

  const comment = await req(`/pages/${pageId}/comments`, { method: "POST", headers: authJson(tokenA), body: JSON.stringify({ content: "owner comment" }) });
  const commentId = comment.body?.data?.id;
  record("comments.create", comment.status === 201 && !!commentId, comment.status);

  const unauthorizedEdit = await req(`/comments/${commentId}`, { method: "PATCH", headers: authJson(tokenB), body: JSON.stringify({ content: "hijack" }) });
  record("comments.unauthorizedEdit", unauthorizedEdit.status === 403, unauthorizedEdit.status);

  const teamMembers = await req("/team/members", { headers: authOnly(tokenA) });
  record("team.members", teamMembers.status === 200, teamMembers.status);

  const teamInvites = await req("/team/invites", { headers: authOnly(tokenA) });
  record("team.invites", teamInvites.status === 200, teamInvites.status);

  const filters = ["all", "unread", "mentions", "tasks", "comments"];
  for (const filter of filters) {
    const n = await req(`/notifications?filter=${filter}`, { headers: authOnly(tokenA) });
    record(`notifications.${filter}`, n.status === 200, n.status);
  }

  const presign = await req("/upload/presign", {
    method: "POST",
    headers: authJson(tokenA),
    body: JSON.stringify({ fileName: "regression.txt", mimeType: "text/plain", fileSize: 14, pageId })
  });

  const uploadData = presign.body?.data ?? {};
  const uploadPut = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "regression_data"
  });
  const confirm = await req("/upload/confirm", {
    method: "POST",
    headers: authJson(tokenA),
    body: JSON.stringify({ fileId: uploadData.fileId })
  });
  const uploaded = await fetch(uploadData.fileUrl);
  const uploadedText = await uploaded.text();

  record("upload.presign", presign.status === 201, presign.status);
  record("upload.put", uploadPut.status === 200, uploadPut.status);
  record("upload.confirm", confirm.status === 200, confirm.status);
  record("upload.fetch", uploaded.status === 200 && uploadedText === "regression_data", `${uploaded.status}/${uploadedText}`);

  const deps = await req("/health/dependencies");
  const dbHealthy = deps.body?.data?.dependencies?.database === true;
  const storageHealthy = deps.body?.data?.dependencies?.storage;
  record("health.dependencies", deps.status === 503 && dbHealthy && storageHealthy === false, JSON.stringify(deps.body?.data));

  const refresh = await req("/auth/refresh", { method: "POST", headers: jsonHeaders });
  record("auth.refresh", refresh.status === 200, refresh.status);

  const logout = await req("/auth/logout", { method: "POST", headers: jsonHeaders });
  record("auth.logout", logout.status === 200, logout.status);

  const failedAfterLogout = await req("/auth/refresh", { method: "POST", headers: jsonHeaders });
  record("auth.refreshAfterLogout", failedAfterLogout.status === 401, failedAfterLogout.status);

  const failed = matrix.filter((item) => !item.ok);
  console.log(JSON.stringify({ total: matrix.length, passed: matrix.length - failed.length, failed: failed.length, matrix }, null, 2));

  if (failed.length > 0) {
    process.exit(1);
  }
})();
