const { execSync, spawnSync } = require("node:child_process");

const PORT = Number(process.env.PRISMA_LOCK_PORT || 4000);
const FORCE_KILL = process.env.PRISMA_GENERATE_KILL_PORT === "1";
const MAX_RETRIES = Number(process.env.PRISMA_GENERATE_RETRIES || 3);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPidsUsingPort = (port) => {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8"
    });

    const pids = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).pop())
      .filter((pid) => /^\d+$/.test(pid || ""));

    return [...new Set(pids)];
  } catch {
    return [];
  }
};

const killPids = (pids) => {
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: ["ignore", "pipe", "pipe"] });
      console.log(`[safe-generate] Killed PID ${pid} to release locked Prisma engine files.`);
    } catch (error) {
      console.warn(`[safe-generate] Failed to kill PID ${pid}: ${error.message}`);
    }
  }
};

const runPrismaGenerate = () =>
  spawnSync("npx", ["prisma", "generate"], {
    stdio: "pipe",
    shell: true,
    env: process.env
  });

const isEpermRenameError = (errorText) => {
  if (!errorText) {
    return false;
  }

  const normalized = String(errorText).toLowerCase();
  return normalized.includes("eperm") && normalized.includes("rename") && normalized.includes("query_engine");
};

(async () => {
  const pids = getPidsUsingPort(PORT);
  if (pids.length > 0 && !FORCE_KILL) {
    console.error(`[safe-generate] Port ${PORT} is in use by PID(s): ${pids.join(", ")}.`);
    console.error("[safe-generate] This often keeps Prisma engine DLL files locked on Windows.");
    console.error("[safe-generate] Stop your running API/dev process first, or rerun with PRISMA_GENERATE_KILL_PORT=1.");
    process.exit(1);
  }

  if (pids.length > 0 && FORCE_KILL) {
    killPids(pids);
    await sleep(600);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    console.log(`[safe-generate] Running prisma generate (attempt ${attempt}/${MAX_RETRIES})...`);
    const result = runPrismaGenerate();
    if (result.stdout) {
      process.stdout.write(result.stdout.toString());
    }
    if (result.stderr) {
      process.stderr.write(result.stderr.toString());
    }

    if (result.status === 0) {
      console.log("[safe-generate] Prisma client generated successfully.");
      process.exit(0);
    }

    const stderrText = result.stderr ? result.stderr.toString() : "";
    if (isEpermRenameError(stderrText) && attempt < MAX_RETRIES) {
      console.warn("[safe-generate] Detected EPERM rename lock. Retrying after short delay...");
      await sleep(1200);
      continue;
    }

    console.error("[safe-generate] prisma generate failed.");
    if (isEpermRenameError(stderrText)) {
      console.error("[safe-generate] EPERM lock persists. Close Node/dev servers and file indexers, then retry.");
    }

    process.exit(result.status || 1);
  }

  process.exit(1);
})();
