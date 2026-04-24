import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const resultsDir = resolve(rootDir, "qa-results", "captures");
const host = process.env.QA_HOST || "127.0.0.1";
const port = Number(process.env.QA_PORT || "4173");
const chromeBinary = resolveChromeBinary();
const scenarios = buildScenarios();

async function main() {
  if (!chromeBinary) {
    throw new Error("No s'ha trobat Chrome o Edge. Defineix QA_CHROME_BIN si cal.");
  }

  await mkdir(resultsDir, { recursive: true });
  const server = startServer();

  try {
    await waitForServer();
    const manifest = [];

    for (const scenario of scenarios) {
      const outputPath = resolve(resultsDir, scenario.fileName);
      const url = new URL(`http://${host}:${port}/capture-harness.html`);
      url.searchParams.set("scenario", scenario.name);
      if (scenario.scrollY > 0) {
        url.searchParams.set("scrollY", String(scenario.scrollY));
      }

      await runChrome([
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=6000",
        `--window-size=${scenario.width},${scenario.height}`,
        `--screenshot=${outputPath}`,
        url.toString(),
      ]);

      manifest.push({
        scenario: scenario.name,
        viewport: scenario.viewport,
        scrollY: scenario.scrollY,
        path: outputPath,
      });

      console.log(`CAPTURED ${scenario.fileName}`);
    }

    await writeFile(resolve(resultsDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } finally {
    stopServer(server);
  }
}

function buildScenarios() {
  const desktop = { viewport: "desktop", width: 1440, height: 1200, scrollY: 0 };
  const mobile = { viewport: "mobile", width: 390, height: 844, scrollY: 0 };
  const mobileDeep = { viewport: "mobile", width: 390, height: 844 };

  return [
    { name: "characters-grid", ...desktop, fileName: "characters-grid-desktop.png" },
    { name: "character-detail-lore", ...desktop, fileName: "character-detail-lore-desktop.png" },
    { name: "character-detail-sheet", ...desktop, fileName: "character-detail-sheet-desktop.png" },
    { name: "character-detail-inventory", ...desktop, fileName: "character-detail-inventory-desktop.png" },
    { name: "character-detail-history", ...desktop, fileName: "character-detail-history-desktop.png" },
    { name: "character-editor", ...desktop, fileName: "character-editor-desktop.png" },
    { name: "chronicles-read", ...desktop, fileName: "chronicles-read-desktop.png" },
    { name: "chronicles-edit", ...desktop, fileName: "chronicles-edit-desktop.png" },
    { name: "chronicles-search-empty", ...desktop, fileName: "chronicles-search-empty-desktop.png" },
    { name: "chronicles-notes", ...desktop, fileName: "chronicles-notes-desktop.png" },
    { name: "glossary-detail", ...desktop, fileName: "glossary-detail-desktop.png" },
    { name: "glossary-detail", ...desktop, scrollY: 2350, fileName: "glossary-detail-desktop-focus.png" },
    { name: "glossary-edit", ...desktop, fileName: "glossary-edit-desktop.png" },
    { name: "glossary-filter-empty", ...desktop, fileName: "glossary-filter-empty-desktop.png" },
    { name: "glossary-notes", ...desktop, fileName: "glossary-notes-desktop.png" },
    { name: "characters-grid", ...mobile, fileName: "characters-grid-mobile.png" },
    { name: "character-detail-lore", ...mobile, fileName: "character-detail-lore-mobile.png" },
    { name: "character-editor", ...mobile, fileName: "character-editor-mobile.png" },
    { name: "chronicles-read", ...mobile, fileName: "chronicles-read-mobile.png" },
    { name: "chronicles-edit", ...mobile, fileName: "chronicles-edit-mobile.png" },
    { name: "chronicles-search-empty", ...mobile, fileName: "chronicles-search-empty-mobile.png" },
    { name: "chronicles-notes", ...mobile, fileName: "chronicles-notes-mobile.png" },
    { name: "glossary-detail", ...mobile, fileName: "glossary-detail-mobile.png" },
    { name: "glossary-detail", ...mobile, scrollY: 4200, fileName: "glossary-detail-mobile-focus.png" },
    { name: "glossary-edit", ...mobile, fileName: "glossary-edit-mobile.png" },
    { name: "glossary-filter-empty", ...mobile, fileName: "glossary-filter-empty-mobile.png" },
    { name: "glossary-notes", ...mobile, fileName: "glossary-notes-mobile.png" },
    { name: "character-detail-lore", ...mobileDeep, scrollY: 760, fileName: "character-detail-lore-mobile-fold2.png" },
    { name: "character-editor", ...mobileDeep, scrollY: 1120, fileName: "character-editor-mobile-fold2.png" },
    { name: "chronicles-read", ...mobileDeep, scrollY: 980, fileName: "chronicles-read-mobile-fold2.png" },
    { name: "chronicles-edit", ...mobileDeep, scrollY: 1180, fileName: "chronicles-edit-mobile-fold2.png" },
    { name: "glossary-detail", ...mobileDeep, scrollY: 980, fileName: "glossary-detail-mobile-fold2.png" },
    { name: "glossary-edit", ...mobileDeep, scrollY: 1260, fileName: "glossary-edit-mobile-fold2.png" },
  ];
}

function resolveChromeBinary() {
  const candidates = [
    process.env.QA_CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || "";
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
  const targetUrl = `http://${host}:${port}/capture-harness.html`;
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

  throw new Error(`El servidor de captures no respon a ${targetUrl}`);
}

function runChrome(args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(chromeBinary, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code !== 0) {
        rejectPromise(new Error(stderr.trim() || `Chrome ha acabat amb codi ${code}`));
        return;
      }
      resolvePromise();
    });
  });
}

function stopServer(server) {
  if (!server.killed) {
    server.kill();
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
