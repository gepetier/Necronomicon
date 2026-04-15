import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const host = process.env.QA_HOST || "127.0.0.1";
const port = Number(process.env.QA_PORT || "4173");
const root = resolve(process.cwd());

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wav": "audio/wav",
};

createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const targetPath = resolve(join(root, safePath));

  if (!targetPath.startsWith(root) || !existsSync(targetPath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const stats = statSync(targetPath);
  if (stats.isDirectory()) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Directory listing disabled");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": MIME_TYPES[extname(targetPath)] || "application/octet-stream",
  });
  createReadStream(targetPath).pipe(response);
}).listen(port, host, () => {
  console.log(`QA server listening on http://${host}:${port}`);
});
