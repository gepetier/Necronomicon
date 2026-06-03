const CONFIG = {
  CLIENT_ID: "240706458880-tlj1amstdpjfccgbtj29lpe0jc06dj2u.apps.googleusercontent.com",
  DRIVE_FOLDER_ID: "1zyOcMrfnJ88RJ7PKWesT16ciS3MrlQI6",
  CAMPAIGN_FILE_NAME: "campaign.json",
  BACKUP_PREFIX: "campaign-backup-",
  BOOTSTRAP_ADMIN_EMAILS: ["sharegepeto@gmail.com"],
};

const DEFAULT_ACCESS = {
  roles: {
    superadmin: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editAssignedChronicles: true,
      editGlossary: true,
      editAssignedGlossary: true,
      managePermissions: true,
      manageCampaigns: true,
      publishCampaign: true,
    },
    gm: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editAssignedChronicles: true,
      editGlossary: true,
      editAssignedGlossary: true,
      managePermissions: false,
      manageCampaigns: false,
      publishCampaign: true,
    },
    player: {
      editAnyCharacter: false,
      editOwnCharacter: true,
      editChronicles: false,
      editAssignedChronicles: true,
      editGlossary: false,
      editAssignedGlossary: true,
      managePermissions: false,
      manageCampaigns: false,
      publishCampaign: false,
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

    if (request.action === "saveChronicle") {
      const current = loadCampaign();
      const actor = decorateUser(user, current.access);
      const chronicle = request.chronicle || null;
      if (!chronicle || !chronicle.id) {
        throw new Error("Cronica no valida.");
      }
      const currentChronicle = findActiveCampaignItem(current, "chronicles", String(chronicle.id));
      if (!canEditChronicle(actor, currentChronicle || chronicle)) {
        throw new Error("No tens permisos per editar aquesta cronica.");
      }

      current.chronicles = upsertById(current.chronicles, chronicle);
      updateLibraryActiveItem(current, "chronicles", chronicle);
      saveCampaign(current, user.email);
      return ok({
        user: decorateUser(user, current.access),
        campaign: current,
      });
    }

    if (request.action === "saveGlossaryEntry") {
      const current = loadCampaign();
      const actor = decorateUser(user, current.access);
      const entry = request.entry || null;
      if (!entry || !entry.id) {
        throw new Error("Entrada de glossari no valida.");
      }
      const currentEntry = findActiveCampaignItem(current, "glossary", String(entry.id));
      if (!canEditGlossaryEntry(actor, currentEntry || entry)) {
        throw new Error("No tens permisos per editar aquesta entrada del glossari.");
      }

      current.glossary = upsertById(current.glossary, entry);
      updateLibraryActiveItem(current, "glossary", entry);
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
  const accessRoles = access.roles || {};
  const migratedRoles = { ...accessRoles };
  if (accessRoles.dm && !migratedRoles.gm) {
    migratedRoles.gm = accessRoles.dm;
  }
  if (accessRoles.viewer && !migratedRoles.player) {
    migratedRoles.player = accessRoles.viewer;
  }
  delete migratedRoles.dm;
  delete migratedRoles.viewer;

  return {
    ...campaign,
    characters: Array.isArray(campaign.characters) ? campaign.characters : [],
    chronicles: Array.isArray(campaign.chronicles) ? campaign.chronicles : [],
    glossary: Array.isArray(campaign.glossary) ? campaign.glossary : [],
    ui: campaign.ui && typeof campaign.ui === "object" ? campaign.ui : {},
    access: {
      roles: {
        ...DEFAULT_ACCESS.roles,
        ...migratedRoles,
      },
      users: {
        ...normalizeAccessUsers(access.users || {}),
      },
    },
  };
}

function normalizeAccessUsers(users) {
  return Object.keys(users || {}).reduce((nextUsers, email) => {
    const user = users[email] || {};
    const normalizedEmail = String(email || "").toLowerCase();
    if (!normalizedEmail || normalizedEmail.indexOf("@") === -1) {
      return nextUsers;
    }
    nextUsers[normalizedEmail] = {
      ...user,
      role: normalizeRoleId(user.role || "player"),
      characterIds: Array.isArray(user.characterIds) ? user.characterIds.map(String) : [],
    };
    return nextUsers;
  }, {});
}

function normalizeRoleId(role) {
  if (role === "dm") {
    return "gm";
  }
  if (role === "viewer") {
    return "player";
  }
  return ["superadmin", "gm", "player"].indexOf(role) >= 0 ? role : "player";
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

function findActiveCampaignItem(campaign, collectionName, itemId) {
  const activeState = getActiveCampaignState(campaign);
  const collection = Array.isArray(activeState && activeState[collectionName])
    ? activeState[collectionName]
    : Array.isArray(campaign[collectionName])
      ? campaign[collectionName]
      : [];
  return collection.find((item) => item && String(item.id) === String(itemId)) || null;
}

function getActiveCampaignState(campaign) {
  if (!Array.isArray(campaign.campaigns) || !campaign.activeCampaignId) {
    return campaign;
  }
  const active = campaign.campaigns.find((entry) => entry && entry.id === campaign.activeCampaignId);
  return active && active.state ? active.state : campaign;
}

function upsertById(collection, item) {
  const list = Array.isArray(collection) ? collection : [];
  const exists = list.some((current) => current && current.id === item.id);
  if (!exists) {
    return [...list, item];
  }
  return list.map((current) => (
    current && current.id === item.id ? item : current
  ));
}

function updateLibraryActiveItem(campaign, collectionName, item) {
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
        [collectionName]: upsertById(entry.state[collectionName], item),
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
      ? "superadmin"
      : "player";
  const normalizedRole = normalizeRoleId(role);
  const permissions = normalizedAccess.roles[normalizedRole] || normalizedAccess.roles.player;

  return {
    ...user,
    role: normalizedRole,
    characterIds: Array.isArray(configured && configured.characterIds) ? configured.characterIds : [],
    permissions,
  };
}

function canManageCampaign(user) {
  return Boolean(user && user.permissions && (user.permissions.publishCampaign || user.permissions.managePermissions));
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

function canEditChronicle(user, chronicle) {
  if (!user || !user.permissions || !chronicle) {
    return false;
  }
  if (user.permissions.editChronicles) {
    return true;
  }
  return Boolean(
    user.permissions.editAssignedChronicles
      && isUserAssignedToItem(user, chronicle),
  );
}

function canEditGlossaryEntry(user, entry) {
  if (!user || !user.permissions || !entry) {
    return false;
  }
  if (user.permissions.editGlossary) {
    return true;
  }
  return Boolean(
    user.permissions.editAssignedGlossary
      && isUserAssignedToItem(user, entry),
  );
}

function isUserAssignedToItem(user, item) {
  const email = String(user.email || "").toLowerCase();
  return Boolean(
    email
      && Array.isArray(item.editableByUserEmails)
      && item.editableByUserEmails
        .map((value) => String(value || "").toLowerCase())
        .indexOf(email) >= 0,
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
