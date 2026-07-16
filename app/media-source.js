const SAFE_NETWORK_PROTOCOLS = new Set(["http:", "https:", "blob:"]);
const SAFE_DATA_MIME_TYPES = {
  image: /^data:image\/(?:avif|gif|jpeg|png|svg\+xml|webp)(?:;|,)/i,
  audio: /^data:audio\/(?:aac|mpeg|mp4|ogg|wav|webm)(?:;|,)/i,
  video: /^data:video\/(?:mp4|ogg|quicktime|webm)(?:;|,)/i,
};

export function sanitizeMediaSource(source, kind = "file") {
  const value = String(source || "").trim();
  if (!value) return "";
  if (value.startsWith("asset://")) return value;

  if (/^data:/i.test(value)) {
    return SAFE_DATA_MIME_TYPES[kind]?.test(value) ? value : "";
  }

  if (isRelativeSource(value)) return value;

  try {
    const url = new URL(value);
    return SAFE_NETWORK_PROTOCOLS.has(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

function isRelativeSource(value) {
  if (value.startsWith("//") || value.startsWith("\\\\")) return false;
  return /^(?:\.{0,2}\/|\/)?[^:/?#\\]+(?:[/?#].*)?$/.test(value);
}
