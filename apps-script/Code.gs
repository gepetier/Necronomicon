const CONFIG = {
  CLIENT_ID: "240706458880-tlj1amstdpjfccgbtj29lpe0jc06dj2u.apps.googleusercontent.com",
  DRIVE_FOLDER_ID: "1zyOcMrfnJ88RJ7PKWesT16ciS3MrlQI6",
  CAMPAIGN_FILE_NAME: "campaign.json",
  BACKUP_PREFIX: "campaign-backup-",
  // TODO: replace with the DM/admin Google account before deploying.
  BOOTSTRAP_ADMIN_EMAILS: ["sharegepeto@gmail.com"],
};

const DEFAULT_ACCESS = {
  roles: {
    dm: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editGlossary: true,
      managePermissions: true,
    },
    player: {
      editAnyCharacter: false,
      editOwnCharacter: true,
      editChronicles: false,
      editGlossary: false,
      managePermissions: false,
    },
    viewer: {
      editAnyCharacter: false,
      editOwnCharacter: false,
      editChronicles: false,
      editGlossary: false,
      managePermissions: false,
    },
  },
  users: {},
};

function doGet(e) {
  const request = readRequest(e);
  const result = handleRequest(request);
  return writeJsonpResponse(e, result);
}

function doPost(e) {
  const request = readRequest(e);
  const result = handleRequest(request);
  return writeJsonResponse(result);
}

function handleRequest(request) {
  try {
    const user = verifyGoogleToken(request.idToken || "");
    if (!user.email) {
      throw new Error("Usuari Google no validat.");
    }

    if (request.action === "loadCampaign") {
      const campaign = loadCampaign();
      return ok({
        user: decorateUser(user, campaign.access),
        campaign,
      });
    }

    if (request.action === "saveCampaign") {
      const campaign = normalizeCampaign(request.campaign);
      const current = loadCampaign();
      const actor = decorateUser(user, current.access || campaign.access);
      if (!canManageCampaign(actor)) {
        throw new Error("No tens permisos per publicar tota la campanya.");
      }

      saveCampaign(campaign, user.email);
      return ok({
        user: decorateUser(user, campaign.access),
        campaign,
      });
    }

    if (request.action === "saveCharacter") {
      const current = loadCampaign();
      const actor = decorateUser(user, current.access);
      const character = request.character || null;
      if (!character || !character.id) {
        throw new Error("Fitxa de personatge no valida.");
      }
      if (!canEditCharacter(actor, String(character.id))) {
        throw new Error("No tens permisos per editar aquesta fitxa.");
      }

      current.characters = (current.characters || []).map((item) => (
        item && item.id === character.id ? character : item
      ));
      updateLibraryActiveCharacter(current, character);
      saveCampaign(current, user.email);
      return ok({
        user: decorateUser(user, current.access),
        campaign: current,
      });
    }

    throw new Error(`Accio desconeguda: ${request.action || "(buida)"}`);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readRequest(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  const params = (e && e.parameter) || {};
  if (params.payload) {
    return JSON.parse(params.payload);
  }

  return {
    action: params.action || "",
    idToken: params.idToken || "",
  };
}

function verifyGoogleToken(idToken) {
  if (!idToken) {
    throw new Error("Falta token de Google.");
  }

  const response = UrlFetchApp.fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { muteHttpExceptions: true },
  );
  if (response.getResponseCode() !== 200) {
    throw new Error("Google no ha acceptat el token.");
  }

  const payload = JSON.parse(response.getContentText());
  if (payload.aud !== CONFIG.CLIENT_ID) {
    throw new Error("El token no pertany a aquesta aplicacio.");
  }
  if (String(payload.email_verified) !== "true") {
    throw new Error("El correu Google no esta verificat.");
  }

  return {
    email: String(payload.email || "").toLowerCase(),
    name: String(payload.name || payload.email || ""),
    picture: String(payload.picture || ""),
  };
}

function loadCampaign() {
  const file = getCampaignFile();
  if (!file) {
    const blank = createBlankCampaign();
    writeCampaignFile(blank);
    return blank;
  }

  const content = file.getBlob().getDataAsString("UTF-8");
  if (!String(content || "").trim()) {
    const blank = createBlankCampaign();
    writeCampaignFile(blank);
    return blank;
  }

  try {
    return normalizeCampaign(JSON.parse(content));
  } catch (error) {
    backupRawCampaign(content, "invalid-json");
    const blank = createBlankCampaign();
    writeCampaignFile(blank);
    return blank;
  }
}

function createBlankCampaign() {
  return normalizeCampaign({
    characters: [],
    chronicles: [],
    glossary: [],
    ui: {},
    access: DEFAULT_ACCESS,
  });
}

function saveCampaign(campaign, actorEmail) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const normalized = normalizeCampaign(campaign);
    backupCampaign(actorEmail);
    writeCampaignFile(normalized);
  } finally {
    lock.releaseLock();
  }
}

function normalizeCampaign(candidate) {
  const campaign = candidate && typeof candidate === "object" ? candidate : {};
  const access = campaign.access && typeof campaign.access === "object"
    ? campaign.access
    : DEFAULT_ACCESS;

  return {
    ...campaign,
    characters: Array.isArray(campaign.characters) ? campaign.characters : [],
    chronicles: Array.isArray(campaign.chronicles) ? campaign.chronicles : [],
    glossary: Array.isArray(campaign.glossary) ? campaign.glossary : [],
    ui: campaign.ui && typeof campaign.ui === "object" ? campaign.ui : {},
    access: {
      roles: {
        ...DEFAULT_ACCESS.roles,
        ...(access.roles || {}),
      },
      users: {
        ...(access.users || {}),
      },
    },
  };
}

function updateLibraryActiveCharacter(campaign, character) {
  if (!Array.isArray(campaign.campaigns) || !campaign.activeCampaignId) {
    return;
  }

  campaign.campaigns = campaign.campaigns.map((entry) => {
    if (!entry || entry.id !== campaign.activeCampaignId || !entry.state) {
      return entry;
    }

    return {
      ...entry,
      updatedAt: new Date().toISOString(),
      state: {
        ...entry.state,
        characters: Array.isArray(entry.state.characters)
          ? entry.state.characters.map((item) => (
            item && item.id === character.id ? character : item
          ))
          : [character],
      },
    };
  });
}

function decorateUser(user, access) {
  const email = String(user.email || "").toLowerCase();
  const normalizedAccess = normalizeCampaign({ access }).access;
  const configured = normalizedAccess.users[email] || null;
  const bootstrapAdmin = CONFIG.BOOTSTRAP_ADMIN_EMAILS
    .map((item) => String(item || "").toLowerCase())
    .includes(email);
  const role = configured && configured.role
    ? configured.role
    : bootstrapAdmin
      ? "dm"
      : "viewer";
  const permissions = normalizedAccess.roles[role] || normalizedAccess.roles.viewer;

  return {
    ...user,
    role,
    characterIds: Array.isArray(configured && configured.characterIds) ? configured.characterIds : [],
    permissions,
  };
}

function canManageCampaign(user) {
  return Boolean(user && user.permissions && user.permissions.managePermissions);
}

function canEditCharacter(user, characterId) {
  if (!user || !user.permissions) {
    return false;
  }
  if (user.permissions.editAnyCharacter) {
    return true;
  }
  return Boolean(
    user.permissions.editOwnCharacter
      && Array.isArray(user.characterIds)
      && user.characterIds.includes(characterId),
  );
}

function getCampaignFile() {
  const folder = getCampaignFolder();
  const files = folder.getFilesByName(CONFIG.CAMPAIGN_FILE_NAME);
  return files.hasNext() ? files.next() : null;
}

function writeCampaignFile(campaign) {
  const folder = getCampaignFolder();
  const content = `${JSON.stringify(campaign, null, 2)}\n`;
  const file = getCampaignFile();
  if (file) {
    file.setContent(content);
    return file;
  }

  return folder.createFile(CONFIG.CAMPAIGN_FILE_NAME, content, MimeType.PLAIN_TEXT);
}

function backupCampaign(actorEmail) {
  const file = getCampaignFile();
  if (!file) {
    return;
  }

  backupRawCampaign(file.getBlob().getDataAsString("UTF-8"), actorEmail);
}

function backupRawCampaign(content, label) {
  const folder = getCampaignFolder();
  const stamp = Utilities.formatDate(new Date(), "Etc/UTC", "yyyyMMdd-HHmmss");
  const safeActor = String(label || "unknown").replace(/[^a-zA-Z0-9_.@-]/g, "_");
  folder.createFile(
    `${CONFIG.BACKUP_PREFIX}${stamp}-${safeActor}.json`,
    String(content || ""),
    MimeType.PLAIN_TEXT,
  );
}

function getCampaignFolder() {
  const folderId = extractDriveId(CONFIG.DRIVE_FOLDER_ID);
  if (!folderId) {
    throw new Error("Falta l'identificador de la carpeta Drive.");
  }

  try {
    return DriveApp.getFolderById(folderId);
  } catch (error) {
    throw new Error(
      `No es pot accedir a la carpeta Drive ${folderId}. Comprova que l'id no inclogui '?hl=es' i que el compte que desplega l'Apps Script tingui permisos sobre la carpeta.`,
    );
  }
}

function extractDriveId(value) {
  const raw = String(value || "").trim();
  const folderMatch = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return folderMatch[1];
  }

  return raw.split("?")[0].split("&")[0];
}

function ok(payload) {
  return {
    ok: true,
    ...payload,
  };
}

function writeJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeJsonpResponse(e, payload) {
  const callback = e && e.parameter && e.parameter.callback
    ? String(e.parameter.callback).replace(/[^\w$.]/g, "")
    : "";
  if (!callback) {
    return writeJsonResponse(payload);
  }

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
