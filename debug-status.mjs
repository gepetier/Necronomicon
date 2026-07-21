import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { resolve } from "node:path";

const root = process.cwd();
const [devServer, qaSummary, captures] = await Promise.all([
  probePort(5173),
  readJson(resolve(root, "qa-results", "summary.json")),
  readJson(resolve(root, "qa-results", "captures", "manifest.json")),
]);

console.log("Necronomicon - estat de depuracio");
console.log(`Servidor Vite (5173): ${devServer ? "actiu" : "aturat"}`);
if (qaSummary) {
  console.log(`Darrer QA enregistrat: ${qaSummary.ok ? "correcte" : "amb errors"} - ${qaSummary.generatedAt || "sense data"}`);
  const failed = (qaSummary.scenarios || []).filter((scenario) => !scenario.ok);
  if (failed.length) console.log(`Escenaris fallits enregistrats: ${failed.map((scenario) => `${scenario.suite}/${scenario.mode}`).join(", ")}`);
} else {
  console.log("Darrer QA enregistrat: sense resultat (executa npm.cmd run qa:smoke o npm.cmd run qa)");
}
console.log(`Captures disponibles: ${Array.isArray(captures) ? captures.length : 0}`);
console.log("Guia: DEBUG.md");

function readJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function probePort(port) {
  return new Promise((resolveProbe) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const settle = (value) => { socket.destroy(); resolveProbe(value); };
    socket.setTimeout(750);
    socket.once("connect", () => settle(true));
    socket.once("error", () => settle(false));
    socket.once("timeout", () => settle(false));
  });
}
