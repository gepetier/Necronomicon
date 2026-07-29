const STORAGE_KEY = "necronomicon-session-log-v1";
const SESSION_KEY = "necronomicon-session-log-session-v1";
const MAX_ENTRIES = 600;
const MAX_TEXT_LENGTH = 360;

let entries = [];
let entriesLoaded = false;
let sessionId = "";
let contextProvider = () => ({});
let initialized = false;

export function startSessionLog(options = {}) {
  if (typeof options.contextProvider === "function") {
    contextProvider = options.contextProvider;
  }
  if (initialized) return getSessionLogSummary();

  initialized = true;
  sessionId = getOrCreateSessionId();
  recordSessionEvent("session", "Sessio oberta", {
    href: safePathname(window.location),
    visibility: document.visibilityState || "unknown",
  });

  window.addEventListener("error", (event) => {
    recordSessionEvent("error", "Error JavaScript no controlat", {
      message: event.message || "Error desconegut",
      source: safePathname(event.filename),
      line: Number(event.lineno) || 0,
      column: Number(event.colno) || 0,
    }, "error");
  });
  window.addEventListener("unhandledrejection", (event) => {
    recordSessionEvent("error", "Promesa rebutjada sense control", {
      message: formatError(event.reason),
    }, "error");
  });
  window.addEventListener("pagehide", (event) => {
    recordSessionEvent("session", "Sessio en segon pla o tancada", {
      persisted: Boolean(event.persisted),
    });
  });
  document.addEventListener("visibilitychange", () => {
    recordSessionEvent("session", "Canvi de visibilitat", {
      visibility: document.visibilityState || "unknown",
    });
  });

  return getSessionLogSummary();
}

export function installSessionActivityLogger() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button, a, [role='button'], [data-module-link], [data-toggle-edit]") : null;
    const action = describeUiTarget(target);
    if (action) recordSessionEvent("ui", "Accio d'interficie", { action });
  }, true);

  document.addEventListener("submit", (event) => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    recordSessionEvent("ui", "Formulari enviat", {
      form: form.dataset.form || form.getAttribute("name") || "formulari",
    });
  }, true);

  document.addEventListener("change", (event) => {
    const field = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement
      ? event.target
      : null;
    if (!field || field.type === "password" || field.name === "loginName") return;
    const fieldName = field.dataset.sessionLogLabel || field.name || field.dataset.glossarySession || "camp";
    if (fieldName) recordSessionEvent("ui", "Camp modificat", { field: fieldName, type: field.type || field.tagName.toLowerCase() });
  }, true);
}

export function recordSessionEvent(category, message, details = {}, level = "info") {
  ensureEntriesLoaded();
  const entry = {
    id: createEntryId(),
    at: new Date().toISOString(),
    sessionId: sessionId || getOrCreateSessionId(),
    category: trimText(category || "app", 48),
    level: ["info", "warning", "error"].includes(level) ? level : "info",
    message: trimText(message || "Esdeveniment", MAX_TEXT_LENGTH),
    details: sanitizeDetails({ ...getContext(), ...details }),
  };
  entries = [...entries, entry].slice(-MAX_ENTRIES);
  persistEntries();
  return entry;
}

export function getSessionLogEntries(options = {}) {
  ensureEntriesLoaded();
  const limit = Math.max(1, Math.min(Number(options.limit) || 160, MAX_ENTRIES));
  const currentOnly = options.currentSession === true;
  const filtered = currentOnly ? entries.filter((entry) => entry.sessionId === sessionId) : entries;
  return filtered.slice(-limit).reverse().map((entry) => structuredClone(entry));
}

export function getSessionLogSummary() {
  ensureEntriesLoaded();
  const currentEntries = entries.filter((entry) => entry.sessionId === (sessionId || getOrCreateSessionId()));
  return {
    sessionId: sessionId || getOrCreateSessionId(),
    total: entries.length,
    currentSessionTotal: currentEntries.length,
    errors: entries.filter((entry) => entry.level === "error").length,
    latestAt: entries.at(-1)?.at || "",
  };
}

export function formatSessionLogText(options = {}) {
  const summary = getSessionLogSummary();
  const logEntries = getSessionLogEntries({ limit: options.limit || MAX_ENTRIES });
  const lines = [
    "Necronomicon · registre de sessio",
    `Generat: ${new Date().toISOString()}`,
    `Sessio actual: ${summary.sessionId}`,
    `Entrades: ${summary.total} · Errors: ${summary.errors}`,
    "",
  ];
  logEntries.reverse().forEach((entry) => {
    const detail = Object.entries(entry.details || {})
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" · ");
    lines.push(`[${entry.at}] ${entry.level.toUpperCase()} ${entry.category}: ${entry.message}${detail ? ` · ${detail}` : ""}`);
  });
  return `${lines.join("\n")}\n`;
}

export function createSessionLogExport() {
  return {
    kind: "necronomicon-session-log",
    version: 1,
    exportedAt: new Date().toISOString(),
    summary: getSessionLogSummary(),
    entries: getSessionLogEntries({ limit: MAX_ENTRIES }).reverse(),
  };
}

export function clearSessionLog() {
  ensureEntriesLoaded();
  entries = [];
  persistEntries();
}

function getContext() {
  try {
    return contextProvider() || {};
  } catch {
    return {};
  }
}

function ensureEntriesLoaded() {
  if (entriesLoaded) return;
  entries = loadEntries();
  entriesLoaded = true;
}

function loadEntries() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidEntry).slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persistEntries() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // El registre no pot bloquejar l'app si el magatzem local esta ple o desactivat.
  }
}

function getOrCreateSessionId() {
  if (sessionId) return sessionId;
  try {
    const stored = String(window.sessionStorage.getItem(SESSION_KEY) || "");
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return sessionId;
  }
}

function describeUiTarget(target) {
  if (!(target instanceof Element)) return "";
  const dataKey = Object.keys(target.dataset || {})
    .find((key) => /^(moduleLink|toggleEdit|cloud|repair|export|import|delete|save|create|open|close|select|switch|toggle|map)/i.test(key));
  if (dataKey) return `data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  if (target instanceof HTMLButtonElement) return target.type === "submit" ? "boto submit" : "boto";
  if (target instanceof HTMLAnchorElement) return "enllac";
  return "control";
}

function sanitizeDetails(details) {
  const blocked = /token|secret|password|accesskey|loginname|email|authorization|cookie/i;
  return Object.fromEntries(
    Object.entries(details || {})
      .filter(([key, value]) => !blocked.test(key) && value !== undefined && value !== null && value !== "")
      .slice(0, 12)
      .map(([key, value]) => [trimText(key, 60), trimText(value, MAX_TEXT_LENGTH)]),
  );
}

function trimText(value, limit) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, limit);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error || "Error desconegut");
}

function safePathname(value) {
  try {
    return new URL(String(value || ""), window.location.origin).pathname;
  } catch {
    return "";
  }
}

function createEntryId() {
  return window.crypto?.randomUUID?.() || `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidEntry(entry) {
  return Boolean(entry && typeof entry === "object" && entry.at && entry.message && entry.sessionId);
}
