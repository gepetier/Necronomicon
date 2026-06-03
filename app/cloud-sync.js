export const CLOUD_CONFIG = {
  clientId: "240706458880-tlj1amstdpjfccgbtj29lpe0jc06dj2u.apps.googleusercontent.com",
  apiUrl: "https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec",
};

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const CREDENTIAL_STORAGE_KEY = "necronomicon-google-credential";
const JSONP_TIMEOUT_MS = 15000;

let googleIdentityPromise = null;
let jsonpCounter = 0;

export function getStoredCredential() {
  return window.localStorage.getItem(CREDENTIAL_STORAGE_KEY) || "";
}

export function storeCredential(credential) {
  if (credential) {
    window.localStorage.setItem(CREDENTIAL_STORAGE_KEY, credential);
  }
}

export function clearStoredCredential() {
  window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
}

export function decodeCredential(credential) {
  const payload = decodeJwtPayload(credential);
  if (!payload) {
    return null;
  }

  const expiresAt = Number(payload.exp || 0) * 1000;
  return {
    email: String(payload.email || "").toLowerCase(),
    name: String(payload.name || payload.email || ""),
    picture: String(payload.picture || ""),
    expiresAt,
  };
}

export function isCredentialUsable(credential) {
  const decoded = decodeCredential(credential);
  return Boolean(decoded && decoded.email && decoded.expiresAt > Date.now() + 60000);
}

export async function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return window.google;
  }

  if (!googleIdentityPromise) {
    googleIdentityPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("No s'ha pogut carregar Google Identity Services."));
      document.head.append(script);
    });
  }

  return googleIdentityPromise;
}

export function renderGoogleButton(rootEl, callback) {
  if (!rootEl || !window.google?.accounts?.id) {
    return;
  }

  rootEl.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: CLOUD_CONFIG.clientId,
    callback,
    auto_select: true,
    cancel_on_tap_outside: false,
  });
  window.google.accounts.id.renderButton(rootEl, {
    theme: "filled_black",
    size: "large",
    text: "signin_with",
    shape: "pill",
    logo_alignment: "left",
    width: 320,
  });
}

export function promptGoogleSignIn() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
  }
}

export async function loadCampaignFromCloud(idToken) {
  return jsonpRequest({
    action: "loadCampaign",
    idToken,
  });
}

export async function saveCampaignToCloud(idToken, campaign) {
  await postWithoutCors({
    action: "saveCampaign",
    idToken,
    campaign,
  });
  return { ok: true };
}

export async function saveCharacterToCloud(idToken, character) {
  await postWithoutCors({
    action: "saveCharacter",
    idToken,
    character,
  });
  return { ok: true };
}

export async function saveChronicleToCloud(idToken, chronicle) {
  await postWithoutCors({
    action: "saveChronicle",
    idToken,
    chronicle,
  });
  return { ok: true };
}

export async function saveGlossaryEntryToCloud(idToken, entry) {
  await postWithoutCors({
    action: "saveGlossaryEntry",
    idToken,
    entry,
  });
  return { ok: true };
}

function jsonpRequest(payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `__necronomiconCloudCallback${Date.now()}${jsonpCounter++}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Drive no ha respost a temps."));
    }, JSONP_TIMEOUT_MS);

    window[callbackName] = (response) => {
      cleanup();
      if (!response || response.ok === false) {
        reject(new Error(response?.error || "Resposta no valida de Google Drive."));
        return;
      }
      resolve(response);
    };

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    const url = new URL(CLOUD_CONFIG.apiUrl);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("payload", JSON.stringify(payload));
    script.src = url.toString();
    script.onerror = () => {
      cleanup();
      reject(new Error("No s'ha pogut contactar amb Google Drive."));
    };
    document.head.append(script);
  });
}

async function postWithoutCors(payload) {
  await fetch(CLOUD_CONFIG.apiUrl, {
    method: "POST",
    mode: "no-cors",
    credentials: "include",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
    keepalive: JSON.stringify(payload).length < 60000,
  });
}

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${normalized}${"=".repeat((4 - normalized.length % 4) % 4)}`;
    const binary = window.atob(padded);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
