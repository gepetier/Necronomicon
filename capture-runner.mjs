import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const resultsDir = resolve(rootDir, "qa-results", "captures");
const host = process.env.QA_HOST || "127.0.0.1";
const port = Number(process.env.QA_PORT || "4173");
const chromeBinary = resolveChromeBinary();
const requestedFilters = process.argv.slice(2);
const scenarios = filterScenarios(buildScenarios(), requestedFilters);
const chromeTimeoutMs = Number(process.env.CAPTURE_CHROME_TIMEOUT_MS || "20000");

async function main() {
  if (!chromeBinary) {
    throw new Error("No s'ha trobat Chrome o Edge. Defineix QA_CHROME_BIN si cal.");
  }
  if (!scenarios.length) {
    throw new Error(`Cap escenari de captura coincideix amb: ${requestedFilters.join(", ") || "all"}`);
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
        "--force-device-scale-factor=1",
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
  const mobile = { viewport: "mobile", width: 484, height: 844, scrollY: 0 };

  return [
    { name: "auth-landing", ...desktop, fileName: "auth-landing-desktop.png" },
    { name: "auth-waiting", ...desktop, fileName: "auth-waiting-desktop.png" },
    { name: "auth-campaign-select", ...desktop, fileName: "auth-campaign-select-desktop.png" },
    { name: "characters-grid", ...desktop, fileName: "characters-grid-desktop.png" },
    { name: "sidebar-preview", ...desktop, fileName: "sidebar-preview-desktop.png" },
    { name: "sidebar-pinned", ...desktop, fileName: "sidebar-pinned-desktop.png" },
    { name: "sidebar-campaign-switch", ...desktop, fileName: "sidebar-campaign-switch-desktop.png" },
    { name: "office-characters", ...desktop, fileName: "office-characters-desktop.png" },
    { name: "office-chronicles", ...desktop, fileName: "office-chronicles-desktop.png" },
    { name: "office-options", ...desktop, fileName: "office-options-desktop.png" },
    { name: "office-campaigns", ...desktop, fileName: "office-campaigns-desktop.png" },
    { name: "campaigns-dashboard", ...desktop, fileName: "campaigns-dashboard-desktop.png" },
    { name: "campaigns-dashboard-edit", ...desktop, fileName: "campaigns-dashboard-edit-desktop.png" },
    { name: "baskins-character-sheet", ...desktop, fileName: "baskins-character-sheet-desktop.png" },
    { name: "baskins-character-tooltip", ...desktop, fileName: "baskins-character-tooltip-desktop.png" },
    { name: "baskins-character-loadout", ...desktop, height: 1900, fileName: "baskins-character-loadout-desktop.png" },
    { name: "baskins-character-penalty", ...desktop, fileName: "baskins-character-penalty-desktop.png" },
    { name: "baskins-character-sheet", ...desktop, scrollY: 1650, fileName: "baskins-character-sheet-lower-desktop.png" },
    { name: "options-tools", ...desktop, fileName: "options-tools-desktop.png" },
    { name: "options-player-access", ...desktop, fileName: "options-player-access-desktop.png" },
    { name: "character-detail-lore", ...desktop, fileName: "character-detail-lore-desktop.png" },
    { name: "character-detail-sheet", ...desktop, fileName: "character-detail-sheet-desktop.png" },
    { name: "character-editor", ...desktop, fileName: "character-editor-desktop.png" },
    { name: "chronicles-character-return", ...desktop, fileName: "chronicles-character-return-desktop.png" },
    { name: "chronicles-read", ...desktop, fileName: "chronicles-read-desktop.png" },
    { name: "chronicles-read-session-3", ...desktop, fileName: "chronicles-read-session-3-desktop.png" },
    { name: "chronicles-read-session-4", ...desktop, fileName: "chronicles-read-session-4-desktop.png" },
    { name: "chronicles-edit", ...desktop, fileName: "chronicles-edit-desktop.png" },
    { name: "chronicles-edit-references", ...desktop, fileName: "chronicles-edit-references-desktop.png" },
    { name: "chronicles-reference-search", ...desktop, fileName: "chronicles-reference-search-desktop.png" },
    { name: "chronicles-quick-glossary-modal", ...desktop, fileName: "chronicles-quick-glossary-modal-desktop.png" },
    { name: "chronicles-reference-tooltip", ...desktop, fileName: "chronicles-reference-tooltip-desktop.png" },
    { name: "glossary-detail", ...desktop, fileName: "glossary-detail-desktop.png" },
    { name: "glossary-filter-empty", ...desktop, fileName: "glossary-filter-empty-desktop.png" },
    { name: "glossary-return", ...desktop, fileName: "glossary-return-desktop.png" },
    { name: "glossary-edit", ...desktop, fileName: "glossary-edit-desktop.png" },
    { name: "auth-landing", ...mobile, fileName: "auth-landing-mobile.png" },
    { name: "auth-waiting", ...mobile, fileName: "auth-waiting-mobile.png" },
    { name: "auth-campaign-select", ...mobile, fileName: "auth-campaign-select-mobile.png" },
    { name: "characters-grid", ...mobile, fileName: "characters-grid-mobile.png" },
    { name: "sidebar-pinned", ...mobile, fileName: "sidebar-pinned-mobile.png" },
    { name: "sidebar-campaign-switch", ...mobile, fileName: "sidebar-campaign-switch-mobile.png" },
    { name: "office-characters", ...mobile, fileName: "office-characters-mobile.png" },
    { name: "office-chronicles", ...mobile, fileName: "office-chronicles-mobile.png" },
    { name: "office-options", ...mobile, fileName: "office-options-mobile.png" },
    { name: "office-campaigns", ...mobile, fileName: "office-campaigns-mobile.png" },
    { name: "campaigns-dashboard", ...mobile, fileName: "campaigns-dashboard-mobile.png" },
    { name: "campaigns-dashboard-edit", ...mobile, scrollY: 500, fileName: "campaigns-dashboard-edit-mobile.png" },
    { name: "baskins-character-sheet", ...mobile, fileName: "baskins-character-sheet-mobile.png" },
    { name: "baskins-character-tooltip", ...mobile, fileName: "baskins-character-tooltip-mobile.png" },
    { name: "baskins-character-loadout", ...mobile, fileName: "baskins-character-loadout-mobile.png" },
    { name: "baskins-character-penalty", ...mobile, fileName: "baskins-character-penalty-mobile.png" },
    { name: "baskins-character-sheet", ...mobile, scrollY: 1900, fileName: "baskins-character-sheet-lower-mobile.png" },
    { name: "options-tools", ...mobile, fileName: "options-tools-mobile.png" },
    { name: "options-player-access", ...mobile, fileName: "options-player-access-mobile.png" },
    { name: "options-tools", ...mobile, scrollY: 1500, fileName: "options-permissions-mobile.png" },
    { name: "character-detail-lore", ...mobile, fileName: "character-detail-lore-mobile.png" },
    { name: "character-detail-sheet", ...mobile, fileName: "character-detail-sheet-mobile.png" },
    { name: "character-editor", ...mobile, fileName: "character-editor-mobile.png" },
    { name: "chronicles-character-return", ...mobile, fileName: "chronicles-character-return-mobile.png" },
    { name: "chronicles-read", ...mobile, fileName: "chronicles-read-mobile.png" },
    { name: "chronicles-read-session-3", ...mobile, fileName: "chronicles-read-session-3-mobile.png" },
    { name: "chronicles-read-session-4", ...mobile, fileName: "chronicles-read-session-4-mobile.png" },
    { name: "chronicles-edit", ...mobile, fileName: "chronicles-edit-mobile.png" },
    { name: "chronicles-edit-references", ...mobile, fileName: "chronicles-edit-references-mobile.png" },
    { name: "chronicles-reference-search", ...mobile, fileName: "chronicles-reference-search-mobile.png" },
    { name: "chronicles-quick-glossary-modal", ...mobile, fileName: "chronicles-quick-glossary-modal-mobile.png" },
    { name: "chronicles-reference-tooltip", ...mobile, fileName: "chronicles-reference-tooltip-mobile.png" },
    { name: "glossary-detail", ...mobile, fileName: "glossary-detail-mobile.png" },
    { name: "glossary-filter-empty", ...mobile, fileName: "glossary-filter-empty-mobile.png" },
    { name: "glossary-return", ...mobile, fileName: "glossary-return-mobile.png" },
    { name: "glossary-edit", ...mobile, fileName: "glossary-edit-mobile.png" },
  ];
}

function filterScenarios(allScenarios, filters) {
  if (!filters.length || filters.includes("all")) {
    return allScenarios;
  }

  const aliases = {
    changed: [
      "character-detail-sheet-desktop.png",
      "character-detail-sheet-mobile.png",
      "chronicles-character-return-desktop.png",
      "chronicles-character-return-mobile.png",
      "chronicles-reference-tooltip-desktop.png",
      "chronicles-reference-tooltip-mobile.png",
      "glossary-detail-desktop.png",
      "glossary-detail-mobile.png",
      "glossary-return-desktop.png",
      "glossary-return-mobile.png",
      "campaigns-dashboard-desktop.png",
      "campaigns-dashboard-mobile.png",
      "baskins-character-sheet-desktop.png",
      "baskins-character-sheet-mobile.png",
      "baskins-character-tooltip-desktop.png",
      "baskins-character-tooltip-mobile.png",
      "baskins-character-sheet-lower-desktop.png",
      "baskins-character-sheet-lower-mobile.png",
    ],
    smoke: ["characters-grid-desktop.png", "characters-grid-mobile.png"],
    sidebar: [
      "characters-grid-desktop.png",
      "characters-grid-mobile.png",
      "sidebar-preview-desktop.png",
      "sidebar-pinned-desktop.png",
      "sidebar-campaign-switch-desktop.png",
      "sidebar-pinned-mobile.png",
      "sidebar-campaign-switch-mobile.png",
    ],
    office: ["office-"],
    characters: ["character"],
    chronicles: ["chronicles"],
    glossary: ["glossary"],
    campaigns: ["campaigns-dashboard"],
    baskins: ["baskins-character"],
    options: ["options-tools", "options-player-access"],
    desktop: ["-desktop"],
    mobile: ["-mobile"],
  };

  const expandedFilters = filters.flatMap((filter) => aliases[filter] || [filter]);
  return allScenarios.filter((scenario) => {
    const haystack = `${scenario.name} ${scenario.fileName} ${scenario.viewport}`;
    return expandedFilters.some((filter) => haystack.includes(filter));
  });
}

function resolveChromeBinary() {
  const candidates = [
    process.env.QA_CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
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
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill();
      rejectPromise(new Error(`Chrome ha superat el temps limit de captura (${chromeTimeoutMs} ms).`));
    }, chromeTimeoutMs);

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
