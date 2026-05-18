import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const resultsDir = resolve(rootDir, "qa-results");
const host = process.env.QA_HOST || "127.0.0.1";
const port = Number(process.env.QA_PORT || "4173");
const chromeBinary = resolveChromeBinary();
const requestedTarget = process.argv[2] || "all";
const scenarios = getScenarios(requestedTarget);
const chromeTimeoutMs = Number(process.env.QA_CHROME_TIMEOUT_MS || "20000");

async function main() {
  if (!chromeBinary) {
    throw new Error("No s'ha trobat Chrome o Edge. Defineix QA_CHROME_BIN si cal.");
  }

  await mkdir(resultsDir, { recursive: true });
  const server = startServer();

  try {
    await waitForServer();
    const results = [];

    for (const scenario of scenarios) {
      const result = await runScenario(scenario);
      results.push(result);
      printScenarioResult(result);
    }

    const summary = {
      ok: results.every((result) => result.ok),
      generatedAt: new Date().toISOString(),
      chromeBinary,
      scenarios: results,
    };

    await writeFile(resolve(resultsDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    if (!summary.ok) {
      process.exitCode = 1;
    }
  } finally {
    stopServer(server);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => {
    setImmediate(() => {
      process.exit(process.exitCode || 0);
    });
  });

function getScenarios(target) {
  const all = [
    { suite: "functional", mode: "desktop", width: 1440, height: 1200 },
    { suite: "functional", mode: "mobile", width: 390, height: 844 },
    { suite: "ui", mode: "desktop", width: 1440, height: 1200 },
    { suite: "ui", mode: "mobile", width: 390, height: 844 },
    { suite: "edit", mode: "desktop", width: 1440, height: 1200 },
    { suite: "edit", mode: "mobile", width: 390, height: 844 },
  ];

  if (target === "all") {
    return all;
  }

  if (target === "smoke") {
    return [
      { suite: "functional", mode: "desktop", width: 1440, height: 1200 },
      { suite: "ui", mode: "mobile", width: 390, height: 844 },
    ];
  }

  return all.filter((scenario) => scenario.suite === target);
}

function resolveChromeBinary() {
  const candidates = [
    process.env.QA_CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => {
    return existsSync(candidate);
  }) || "";
}

function startServer() {
  return spawn(process.execPath, ["qa-server.mjs"], {
    cwd: rootDir,
    env: {
      ...process.env,
      QA_HOST: host,
      QA_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitForServer() {
  const targetUrl = `http://${host}:${port}/qa-harness.html`;
  const startedAt = Date.now();

  while (Date.now() - startedAt < 10000) {
    try {
      const response = await fetch(targetUrl, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {
      await delay(200);
      continue;
    }

    await delay(200);
  }

  throw new Error(`El servidor de QA no respon a ${targetUrl}`);
}

async function runScenario({ suite, mode, width, height }) {
  const artifactPath = resolve(resultsDir, `${suite}-${mode}.html`);
  const url = `http://${host}:${port}/qa-harness.html?suite=${suite}&mode=${mode}`;
  const dom = await runChrome([
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=5000",
    `--window-size=${width},${height}`,
    "--dump-dom",
    url,
  ]);

  await writeFile(artifactPath, dom, "utf8");
  const report = extractReport(dom);

  return {
    ...report,
    artifactPath,
    suite,
    mode,
  };
}

function runChrome(args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(chromeBinary, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      rejectPromise(new Error(`Chrome ha superat el temps limit de QA (${chromeTimeoutMs} ms).`));
    }, chromeTimeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      rejectPromise(error);
    });
    child.on("exit", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        rejectPromise(new Error(stderr.trim() || `Chrome ha acabat amb codi ${code}`));
        return;
      }
      resolvePromise(stdout);
    });
  });
}

function extractReport(dom) {
  const match = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  if (!match) {
    throw new Error("No s'ha trobat l'informe del harness.");
  }

  return JSON.parse(match[1]);
}

function printScenarioResult(result) {
  const status = result.ok ? "PASS" : "FAIL";
  console.log(`[${status}] ${result.suite}/${result.mode} (${result.viewport})`);
}

function stopServer(server) {
  if (!server.killed) {
    server.kill();
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
