    const CONFIG = {
      CLIENT_ID: "386167885974-voguggv8fbvmqioec1p38vu3qf1fj33f.apps.googleusercontent.com",
      DRIVE_FOLDER_ID: "1zyOcMrfnJ88RJ7PKWesT16ciS3MrlQI6",
      CAMPAIGN_FILE_NAME: "campaign.json",
      ASSET_FOLDER_NAME: "assets",
      BACKUP_PREFIX: "campaign-backup-",
      BOOTSTRAP_ADMIN_EMAILS: ["sharegepeto@gmail.com"],
    };
    const BACKEND_VERSION = "2026-07-21-drive-asset-repair";
    const BACKUP_EVERY_REVISIONS = 20;
    const MAX_BACKUP_FILES = 40;
    const SESSION_TTL_SECONDS = 3600;
    const SESSION_CLAIM_TTL_SECONDS = 60;
    const DRIVE_ASSET_PREFIX = "drive-asset://";
    const LOCAL_ASSET_PREFIX = "asset://";
    const MAX_DRIVE_ASSET_BYTES = 12 * 1024 * 1024;
    const DIRECT_MEDIA_KEYS = new Set(["portrait", "imageAssets", "voiceNotes"]);
    const RICH_MEDIA_TOKEN_PATTERN = /\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}/g;
    const ALLOWED_DRIVE_ASSET_MIME_TYPES = new Set([
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/webp",
      "audio/aac",
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
      "video/mp4",
      "video/ogg",
      "video/quicktime",
      "video/webm",
      "application/pdf",
    ]);

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
        if (request.action === "createSession") return createServerSession(request);
        if (request.action === "claimSession") return claimServerSession(request);
        if (request.action === "claimAssetUpload") return claimAssetUpload(request);

        const user = resolveRequestUser(request);
        if (!user.email) {
          throw new Error("Usuari Google no validat.");
        }

        if (request.action === "saveAsset") {
          const current = loadCampaign();
          const campaignId = normalizeCampaignId(request.campaignId);
          const targetState = getCampaignStateForId(current, campaignId);
          const actor = decorateUser(user, targetState.access || current.access);
          assertCanUploadAsset(actor, current, campaignId, request.targetType, request.targetId);
          const savedAsset = persistDriveAsset(request.asset, campaignId, request.targetType, request.targetId);
          const operationId = String(request.operationId || "");
          CacheService.getScriptCache().put(
            `asset-claim:${operationId}`,
            JSON.stringify(savedAsset),
            SESSION_CLAIM_TTL_SECONDS,
          );
          return ok({ operationId });
        }

        if (request.action === "loadAsset") {
          const current = loadCampaign();
          const campaignId = normalizeCampaignId(request.campaignId);
          const targetState = getCampaignStateForId(current, campaignId);
          const actor = decorateUser(user, targetState.access || current.access);
          if (!actor.hasAccess) throw new Error("No tens acces a aquesta campanya.");
          const assetRef = String(request.assetRef || "");
          if (!campaignContainsAssetReference(targetState, assetRef)) {
            throw new Error("Aquesta imatge no pertany a la campanya activa.");
          }
          return ok(readDriveAsset(assetRef, { allowLegacyReference: true }));
        }

        if (request.action === "loadCampaign") {
          return withCampaignLock(() => {
            const campaign = loadCampaign();
            const authorized = createAuthorizedCampaignView(campaign, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              assetBundle: [],
              assetDiagnostics: getDriveAssetDiagnostics(authorized.campaign),
              capabilities: getClientCapabilities(),
              driveFile: getCurrentCampaignFileInfo(),
            });
          });
        }

        if (request.action === "saveCampaign") {
          return withCampaignLock(() => {
            const campaign = normalizeCampaign(request.campaign);
            const current = loadCampaign();
            const targetState = getCampaignStateForId(current, campaign.activeCampaignId);
            const actor = decorateUser(user, targetState.access || current.access || campaign.access);
            if (!canManageCampaign(actor)) {
              throw new Error("No tens permisos per publicar tota la campanya.");
            }
            assertExpectedRevision(current, request.expectedRevision);
            const campaignWithDriveAssets = normalizeCampaign(externalizeDriveAssets(campaign, campaign.activeCampaignId));
            const mergedCampaign = mergeCampaignPublication(current, campaignWithDriveAssets, user, actor);

            const driveFile = persistCampaignUnlocked(
              mergedCampaign,
              user.email,
              getCampaignRevision(current),
              request.operationId,
              { forceBackup: true },
            );
            const authorized = createAuthorizedCampaignView(mergedCampaign, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              capabilities: getClientCapabilities(),
              driveFile,
            });
          });
        }

        if (request.action === "repairCampaignAssets") {
          return withCampaignLock(() => {
            const current = loadCampaign();
            const campaignId = normalizeCampaignId(request.campaignId);
            const targetState = getCampaignStateForId(current, campaignId);
            const actor = decorateUser(user, targetState.access || current.access);
            if (!canManageCampaign(actor)) {
              throw new Error("No tens permisos per reparar els actius de la campanya.");
            }
            const repair = repairCampaignAssetReferences(current, campaignId);
            const driveFile = repair.changed
              ? persistCampaignUnlocked(current, user.email, getCampaignRevision(current), request.operationId, { forceBackup: true })
              : getCurrentCampaignFileInfo();
            const authorized = createAuthorizedCampaignView(current, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              assetDiagnostics: getDriveAssetDiagnostics(authorized.campaign),
              repaired: repair.repaired,
              unresolved: repair.unresolved,
              capabilities: getClientCapabilities(),
              driveFile,
            });
          });
        }
        if (request.action === "saveCharacter") {
          return withCampaignLock(() => {
            const current = loadCampaign();
            const campaignId = normalizeCampaignId(request.campaignId);
            const targetState = getCampaignStateForId(current, campaignId);
            const actor = decorateUser(user, targetState.access || current.access);
            const character = request.character || null;
            if (!character || !character.id) {
              throw new Error("Fitxa de personatge no valida.");
            }
            if (!canEditCharacter(actor, String(character.id))) {
              throw new Error("No tens permisos per editar aquesta fitxa.");
            }

            const currentCharacter = findCampaignItem(current, campaignId, "characters", String(character.id));
            if (!currentCharacter && !actor.permissions.editAnyCharacter) {
              throw new Error("No tens permisos per crear fitxes de personatge.");
            }
            const nextCharacter = request.preserveExistingPortrait && currentCharacter
              ? {
                ...currentCharacter,
                ...character,
                portrait: currentCharacter.portrait,
              }
              : externalizeDriveAssets(character, campaignId);
            assertDriveAssetReferencesAreAllowed(nextCharacter, targetState);
            updateCampaignItem(current, campaignId, "characters", nextCharacter);
            const driveFile = persistCampaignUnlocked(
              current,
              user.email,
              getCampaignRevision(current),
              request.operationId,
            );
            const authorized = createAuthorizedCampaignView(current, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              capabilities: getClientCapabilities(),
              driveFile,
            });
          });
        }

        if (request.action === "saveChronicle") {
          return withCampaignLock(() => {
            const current = loadCampaign();
            const campaignId = normalizeCampaignId(request.campaignId);
            const targetState = getCampaignStateForId(current, campaignId);
            const actor = decorateUser(user, targetState.access || current.access);
            const chronicle = request.chronicle || null;
            if (!chronicle || !chronicle.id) {
              throw new Error("Cronica no valida.");
            }
            const currentChronicle = findCampaignItem(current, campaignId, "chronicles", String(chronicle.id));
            if (!currentChronicle && !actor.permissions.editChronicles) {
              throw new Error("No tens permisos per crear croniques.");
            }
            if (!canEditChronicle(actor, currentChronicle || chronicle)) {
              throw new Error("No tens permisos per editar aquesta cronica.");
            }

            const nextChronicle = externalizeDriveAssets(chronicle, campaignId);
            assertDriveAssetReferencesAreAllowed(nextChronicle, targetState);
            updateCampaignItem(current, campaignId, "chronicles", nextChronicle);
            const driveFile = persistCampaignUnlocked(
              current,
              user.email,
              getCampaignRevision(current),
              request.operationId,
            );
            const authorized = createAuthorizedCampaignView(current, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              capabilities: getClientCapabilities(),
              driveFile,
            });
          });
        }

        if (request.action === "saveGlossaryEntry") {
          return withCampaignLock(() => {
            const current = loadCampaign();
            const campaignId = normalizeCampaignId(request.campaignId);
            const targetState = getCampaignStateForId(current, campaignId);
            const actor = decorateUser(user, targetState.access || current.access);
            const entry = request.entry || null;
            if (!entry || !entry.id) {
              throw new Error("Entrada de glossari no valida.");
            }
            const currentEntry = findCampaignItem(current, campaignId, "glossary", String(entry.id));
            if (!currentEntry && !actor.permissions.editGlossary) {
              throw new Error("No tens permisos per crear entrades del glossari.");
            }
            if (!canEditGlossaryEntry(actor, currentEntry || entry)) {
              throw new Error("No tens permisos per editar aquesta entrada del glossari.");
            }

            const nextEntry = request.preserveExistingImageAssets && currentEntry
              ? {
                ...currentEntry,
                ...entry,
                imageAssets: currentEntry.imageAssets,
              }
              : externalizeDriveAssets(entry, campaignId);
            assertDriveAssetReferencesAreAllowed(nextEntry, targetState);
            updateCampaignItem(current, campaignId, "glossary", nextEntry);
            const driveFile = persistCampaignUnlocked(
              current,
              user.email,
              getCampaignRevision(current),
              request.operationId,
            );
            const authorized = createAuthorizedCampaignView(current, user);
            return ok({
              user: authorized.user,
              campaign: authorized.campaign,
              capabilities: getClientCapabilities(),
              driveFile,
            });
          });
        }

        if (request.action === "deleteChronicle" || request.action === "deleteGlossaryEntry") {
          return withCampaignLock(() => {
            const current = loadCampaign();
            const campaignId = normalizeCampaignId(request.campaignId);
            const targetState = getCampaignStateForId(current, campaignId);
            const actor = decorateUser(user, targetState.access || current.access);
            const collectionName = request.action === "deleteChronicle" ? "chronicles" : "glossary";
            const itemId = String(request.itemId || "");
            const item = findCampaignItem(current, campaignId, collectionName, itemId);
            if (!item) throw new Error("No s'ha trobat l'element que vols esborrar.");
            const allowed = collectionName === "chronicles"
              ? canEditChronicle(actor, item)
              : canEditGlossaryEntry(actor, item);
            if (!allowed) throw new Error("No tens permisos per esborrar aquest element.");
            deleteCampaignItem(current, campaignId, collectionName, itemId);
            const driveFile = persistCampaignUnlocked(current, user.email, getCampaignRevision(current), request.operationId);
            const authorized = createAuthorizedCampaignView(current, user);
            return ok({ user: authorized.user, campaign: authorized.campaign, capabilities: getClientCapabilities(), driveFile });
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

    function createServerSession(request) {
      const user = verifyGoogleToken(request.idToken || "");
      const sessionToken = Utilities.getUuid();
      const cache = CacheService.getScriptCache();
      cache.put(`session:${sessionToken}`, JSON.stringify(user), SESSION_TTL_SECONDS);
      cache.put(`session-claim:${String(request.operationId || "")}`, sessionToken, SESSION_CLAIM_TTL_SECONDS);
      return ok({ operationId: String(request.operationId || "") });
    }

    function claimServerSession(request) {
      const cache = CacheService.getScriptCache();
      const claimKey = `session-claim:${String(request.operationId || "")}`;
      const sessionToken = cache.get(claimKey) || "";
      if (!sessionToken) throw new Error("La sessio segura no esta preparada.");
      cache.remove(claimKey);
      return ok({ sessionToken, expiresIn: SESSION_TTL_SECONDS });
    }

    function claimAssetUpload(request) {
      const cache = CacheService.getScriptCache();
      const claimKey = `asset-claim:${String(request.operationId || "")}`;
      const value = cache.get(claimKey) || "";
      if (!value) throw new Error("La pujada de la imatge no s'ha pogut confirmar.");
      cache.remove(claimKey);
      return ok(JSON.parse(value));
    }

    function assertCanUploadAsset(actor, campaign, campaignId, targetType, targetId) {
      const type = String(targetType || "campaign");
      const id = String(targetId || "");
      if (type === "campaign" && canManageCampaign(actor)) return;
      if (type === "character") {
        const item = findCampaignItem(campaign, campaignId, "characters", id);
        if (item && canEditCharacter(actor, id)) return;
      }
      if (type === "chronicle") {
        const item = findCampaignItem(campaign, campaignId, "chronicles", id);
        if (item && canEditChronicle(actor, item)) return;
      }
      if (type === "glossary") {
        const item = findCampaignItem(campaign, campaignId, "glossary", id);
        if ((item && canEditGlossaryEntry(actor, item)) || (!item && actor.permissions.editGlossary)) return;
      }
      throw new Error("No tens permisos per pujar imatges a aquest element.");
    }

    function persistDriveAsset(asset, campaignId, targetType, targetId) {
      const dataUrl = String(asset && asset.dataUrl || "");
      const match = dataUrl.match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/);
      if (!match) throw new Error("El contingut de la imatge no es valid.");
      const mimeType = String(asset.mimeType || match[1] || "application/octet-stream").toLowerCase();
      if (!ALLOWED_DRIVE_ASSET_MIME_TYPES.has(mimeType) || mimeType.indexOf("image/") !== 0) {
        throw new Error("El fitxer pujat no es una imatge compatible.");
      }
      if (estimateBase64Bytes(match[2]) > MAX_DRIVE_ASSET_BYTES) {
        throw new Error("El fitxer supera el limit de 12 MB.");
      }
      const prefix = [campaignId, targetType || "campaign", targetId || "general"]
        .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50))
        .join("__");
      const fileName = `asset-${prefix}-${hashAssetContent(match[2])}.${getAssetExtension(mimeType)}`;
      const folder = getAssetFolder();
      const existing = folder.getFilesByName(fileName);
      const file = existing.hasNext()
        ? existing.next()
        : folder.createFile(Utilities.newBlob(Utilities.base64Decode(match[2]), mimeType, fileName));
      return {
        assetRef: `drive-asset://${file.getId()}`,
        id: file.getId(),
        name: file.getName(),
        mimeType,
      };
    }

    function readDriveAsset(assetRef, options) {
      const fileId = String(assetRef || "").replace(/^drive-asset:\/\//, "");
      if (!fileId) throw new Error("Referencia d'imatge no valida.");
      const file = DriveApp.getFileById(fileId);
      const canonical = isCampaignAssetFile(file);
      const legacy = !canonical && isLegacyCampaignAssetFile(file) && options && options.allowLegacyReference === true;
      if (!canonical && !legacy) {
        throw new Error("El fitxer no pertany a la carpeta d'actius de la campanya.");
      }
      const blob = file.getBlob();
      const mimeType = String(blob.getContentType ? blob.getContentType() : "image/jpeg");
      return {
        assetRef: `drive-asset://${fileId}`,
        name: file.getName(),
        mimeType,
        legacy,
        dataUrl: `data:${mimeType};base64,${Utilities.base64Encode(blob.getBytes())}`,
      };
    }

    function campaignContainsAssetReference(state, assetRef) {
      return /^drive-asset:\/\/[a-zA-Z0-9_-]+$/.test(assetRef)
        && JSON.stringify(state || {}).includes(assetRef);
    }

    function resolveRequestUser(request) {
      const sessionToken = String(request.sessionToken || "");
      if (!sessionToken) return verifyGoogleToken(request.idToken || "");
      const cached = CacheService.getScriptCache().get(`session:${sessionToken}`);
      if (!cached) throw new Error("La sessio ha caducat. Torna a iniciar sessio.");
      return JSON.parse(cached);
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

    function withCampaignLock(callback) {
      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try {
        return callback();
      } finally {
        lock.releaseLock();
      }
    }

    function persistCampaignUnlocked(campaign, actorEmail, previousRevision, operationId, options) {
      const normalized = normalizeCampaign(campaign);
      stampServerWriteMetadata(normalized, actorEmail, previousRevision, operationId);
      campaign.serverSync = normalized.serverSync;
      const revision = Math.max(0, Number(previousRevision) || 0);
      if ((options && options.forceBackup) || revision % BACKUP_EVERY_REVISIONS === 0) {
        backupCampaign(actorEmail);
      }
      return getDriveFileInfo(writeCampaignFile(normalized));
    }

    function stampServerWriteMetadata(campaign, actorEmail, previousRevision, operationId) {
      campaign.serverSync = {
        revision: Math.max(0, Number(previousRevision) || 0) + 1,
        savedAt: new Date().toISOString(),
        savedBy: String(actorEmail || "").toLowerCase(),
        operationId: String(operationId || ""),
      };
    }

    function getCampaignRevision(campaign) {
      return Math.max(0, Number(campaign && campaign.serverSync && campaign.serverSync.revision) || 0);
    }

    function assertExpectedRevision(campaign, expectedRevision) {
      if (expectedRevision === undefined || expectedRevision === null || expectedRevision === "") {
        return;
      }
      const expected = Math.max(0, Number(expectedRevision) || 0);
      const current = getCampaignRevision(campaign);
      if (expected !== current) {
        throw new Error(`Conflicte de sincronitzacio: revisio esperada ${expected}, revisio actual ${current}. Recarrega abans de publicar.`);
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

    function getActiveCampaignState(campaign) {
      if (!Array.isArray(campaign.campaigns) || !campaign.activeCampaignId) {
        return campaign;
      }
      const active = campaign.campaigns.find((entry) => entry && entry.id === campaign.activeCampaignId);
      return active && active.state ? active.state : campaign;
    }

    function normalizeCampaignId(value) {
      return String(value || "").trim();
    }

    function resolveCampaignId(campaign, campaignId) {
      if (!Array.isArray(campaign.campaigns)) {
        return "";
      }
      const requestedId = normalizeCampaignId(campaignId);
      if (requestedId && campaign.campaigns.some((entry) => entry && entry.id === requestedId)) {
        return requestedId;
      }
      if (campaign.activeCampaignId && campaign.campaigns.some((entry) => entry && entry.id === campaign.activeCampaignId)) {
        return campaign.activeCampaignId;
      }
      return campaign.campaigns[0] && campaign.campaigns[0].id ? campaign.campaigns[0].id : "";
    }

    function getCampaignStateForId(campaign, campaignId) {
      if (!Array.isArray(campaign.campaigns)) {
        return campaign;
      }
      const targetId = resolveCampaignId(campaign, campaignId);
      const target = campaign.campaigns.find((entry) => entry && entry.id === targetId);
      return target && target.state ? target.state : getActiveCampaignState(campaign);
    }

    function findCampaignItem(campaign, campaignId, collectionName, itemId) {
      const targetState = getCampaignStateForId(campaign, campaignId);
      const collection = Array.isArray(targetState && targetState[collectionName])
        ? targetState[collectionName]
        : [];
      return collection.find((item) => item && String(item.id) === String(itemId)) || null;
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

    function updateCampaignItem(campaign, campaignId, collectionName, item) {
      if (!Array.isArray(campaign.campaigns)) {
        campaign[collectionName] = upsertById(campaign[collectionName], item);
        return;
      }

      const targetId = resolveCampaignId(campaign, campaignId);
      if (!targetId) {
        throw new Error("Campanya no trobada per desar l'element.");
      }
      const now = new Date().toISOString();
      let updated = false;

      campaign.campaigns = campaign.campaigns.map((entry) => {
        if (!entry || entry.id !== targetId || !entry.state) {
          return entry;
        }
        updated = true;

        return {
          ...entry,
          updatedAt: now,
          state: {
            ...entry.state,
            meta: {
              ...(entry.state.meta || {}),
              updatedAt: now,
            },
            [collectionName]: upsertById(entry.state[collectionName], item),
          },
        };
      });

      if (!updated) {
        throw new Error("Campanya no trobada per desar l'element.");
      }

      syncTopLevelCampaignFields(campaign);
    }

    function deleteCampaignItem(campaign, campaignId, collectionName, itemId) {
      const targetId = resolveCampaignId(campaign, campaignId);
      if (!targetId) throw new Error("Campanya no trobada per esborrar l'element.");
      const now = new Date().toISOString();
      campaign.campaigns = campaign.campaigns.map((entry) => {
        if (!entry || entry.id !== targetId || !entry.state) return entry;
        return {
          ...entry,
          updatedAt: now,
          state: {
            ...entry.state,
            meta: { ...(entry.state.meta || {}), updatedAt: now },
            [collectionName]: (entry.state[collectionName] || []).filter((item) => String(item && item.id) !== String(itemId)),
          },
        };
      });
      syncTopLevelCampaignFields(campaign);
    }
    function mergeCampaignPublication(currentCandidate, incomingCandidate, user, publicationActor) {
      const current = normalizeCampaign(cloneJson(currentCandidate));
      const incoming = normalizeCampaign(cloneJson(incomingCandidate));
      if (!Array.isArray(current.campaigns) || !Array.isArray(incoming.campaigns)) {
        if (!publicationActor.permissions.managePermissions) {
          incoming.access = current.access;
        }
        return incoming;
      }

      const incomingById = incoming.campaigns.reduce((map, entry) => {
        if (entry && entry.id) {
          map[String(entry.id)] = entry;
        }
        return map;
      }, {});
      const merged = [];

      current.campaigns.forEach((currentEntry) => {
        if (!currentEntry || !currentEntry.id) {
          return;
        }
        const actor = decorateUser(user, currentEntry.state && currentEntry.state.access || current.access);
        const replacement = incomingById[String(currentEntry.id)] || null;
        if (!actor.hasAccess) {
          merged.push(currentEntry);
          delete incomingById[String(currentEntry.id)];
          return;
        }
        if (!replacement) {
          if (!canManageCampaignCatalog(actor)) {
            merged.push(currentEntry);
          }
          return;
        }
        if (!canManageCampaign(actor)) {
          throw new Error(`No tens permisos per publicar la campanya ${currentEntry.name || currentEntry.id}.`);
        }
        merged.push(actor.permissions.managePermissions
          ? replacement
          : {
            ...replacement,
            state: {
              ...replacement.state,
              access: currentEntry.state && currentEntry.state.access || current.access,
            },
          });
        delete incomingById[String(currentEntry.id)];
      });

      const newEntries = Object.keys(incomingById).map((id) => incomingById[id]);
      if (newEntries.length && !canManageCampaignCatalog(publicationActor)) {
        throw new Error("No tens permisos per crear campanyes al cataleg compartit.");
      }
      merged.push(...newEntries);
      if (!merged.length) {
        throw new Error("El cataleg compartit no pot quedar buit.");
      }

      current.campaigns = merged;
      current.activeCampaignId = merged.some((entry) => entry.id === incoming.activeCampaignId)
        ? incoming.activeCampaignId
        : merged.some((entry) => entry.id === current.activeCampaignId)
          ? current.activeCampaignId
          : merged[0].id;
      syncTopLevelCampaignFields(current);
      return current;
    }

    function syncTopLevelCampaignFields(campaign) {
      if (!Array.isArray(campaign.campaigns)) {
        return;
      }
      const activeState = getActiveCampaignState(campaign);
      campaign.meta = activeState.meta || campaign.meta;
      campaign.characters = Array.isArray(activeState.characters) ? activeState.characters : [];
      campaign.chronicles = Array.isArray(activeState.chronicles) ? activeState.chronicles : [];
      campaign.glossary = Array.isArray(activeState.glossary) ? activeState.glossary : [];
      campaign.access = activeState.access || campaign.access;
      campaign.ui = activeState.ui || campaign.ui || {};
    }

    function decorateUser(user, access) {
      const email = String(user.email || "").toLowerCase();
      const normalizedAccess = normalizeCampaign({ access }).access;
      const configured = normalizedAccess.users[email] || null;
      const bootstrapAdmin = isBootstrapAdminEmail(email);
      const role = configured && configured.role
        ? configured.role
        : bootstrapAdmin
          ? "superadmin"
          : "player";
      const normalizedRole = normalizeRoleId(role);
      const permissions = normalizedAccess.roles[normalizedRole] || normalizedAccess.roles.player;

      return {
        ...user,
        hasAccess: Boolean(configured || bootstrapAdmin),
        role: normalizedRole,
        characterIds: Array.isArray(configured && configured.characterIds) ? configured.characterIds : [],
        permissions,
      };
    }

    function isBootstrapAdminEmail(email) {
      const normalizedEmail = String(email || "").toLowerCase();
      return CONFIG.BOOTSTRAP_ADMIN_EMAILS
        .map((item) => String(item || "").toLowerCase())
        .includes(normalizedEmail);
    }

    function createAuthorizedCampaignView(candidate, user) {
      const campaign = normalizeCampaign(cloneJson(candidate));
      if (!Array.isArray(campaign.campaigns)) {
        const actor = decorateUser(user, campaign.access);
        if (!actor.hasAccess) {
          throw new Error("No tens acces a aquesta campanya.");
        }
        campaign.access = filterAccessForActor(campaign.access, actor);
        return { campaign, user: actor };
      }

      const accessibleCampaigns = campaign.campaigns
        .map((entry) => {
          if (!entry || !entry.state) {
            return null;
          }
          const actor = decorateUser(user, entry.state.access || campaign.access);
          if (!actor.hasAccess) {
            return null;
          }
          return {
            ...entry,
            state: {
              ...entry.state,
              access: filterAccessForActor(entry.state.access || campaign.access, actor),
            },
          };
        })
        .filter(Boolean);

      if (!accessibleCampaigns.length) {
        throw new Error("No tens cap campanya assignada.");
      }

      campaign.campaigns = accessibleCampaigns;
      if (!accessibleCampaigns.some((entry) => entry.id === campaign.activeCampaignId)) {
        campaign.activeCampaignId = accessibleCampaigns[0].id;
      }
      syncTopLevelCampaignFields(campaign);
      const actor = decorateUser(user, campaign.access);
      return { campaign, user: actor };
    }

    function filterAccessForActor(access, actor) {
      const normalized = normalizeCampaign({ access }).access;
      if (actor && actor.permissions && actor.permissions.managePermissions) {
        return normalized;
      }

      const email = String(actor && actor.email || "").toLowerCase();
      const configured = email ? normalized.users[email] : null;
      return {
        roles: normalized.roles,
        users: configured ? { [email]: configured } : {},
      };
    }

    function cloneJson(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function canManageCampaign(user) {
      return Boolean(user && user.hasAccess && user.permissions && (user.permissions.publishCampaign || user.permissions.managePermissions));
    }

    function canManageCampaignCatalog(user) {
      return Boolean(user && user.hasAccess && user.permissions && user.permissions.manageCampaigns);
    }

    function canEditCharacter(user, characterId) {
      if (!user || !user.hasAccess || !user.permissions) {
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
      if (!user || !user.hasAccess || !user.permissions || !chronicle) {
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
      if (!user || !user.hasAccess || !user.permissions || !entry) {
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

    function externalizeDriveAssets(value, campaignId) {
      return externalizeDriveAssetValue(value, campaignId, "");
    }

    function externalizeDriveAssetValue(value, campaignId, key) {
      if (typeof value === "string") {
        const text = String(value || "");
        if (text.indexOf(LOCAL_ASSET_PREFIX) === 0 || text.indexOf("|asset://") >= 0) {
          throw new Error("Hi ha un actiu local sense fitxer. Torna a seleccionar la imatge abans de sincronitzar.");
        }
        if (DIRECT_MEDIA_KEYS.has(key)) {
          if (text.indexOf(DRIVE_ASSET_PREFIX) === 0) return text;
          if (text.indexOf("data:") === 0) return storeDriveAssetDataUrl(text, campaignId);
          if (text.trim()) {
            throw new Error("La imatge encara no esta allotjada a Drive. Torna a seleccionar-la i espera la confirmacio de pujada.");
          }
          return text;
        }
        if (text.indexOf("data:") === 0) {
          return storeDriveAssetDataUrl(text, campaignId);
        }
        return text.replace(RICH_MEDIA_TOKEN_PATTERN, (full, kind, label, source) => {
          const normalizedSource = String(source || "").trim();
          if (normalizedSource.indexOf(LOCAL_ASSET_PREFIX) === 0) {
            throw new Error("Hi ha un actiu local sense fitxer. Torna'l a seleccionar abans de sincronitzar.");
          }
          if (normalizedSource.indexOf(DRIVE_ASSET_PREFIX) === 0) return full;
          if (normalizedSource.indexOf("data:") === 0) {
            return `{{media:${kind}|${label}|${storeDriveAssetDataUrl(normalizedSource, campaignId)}}}`;
          }
          throw new Error("La referencia multimedia encara no esta allotjada a Drive.");
        });
      }
      if (Array.isArray(value)) {
        return value.map((item) => externalizeDriveAssetValue(item, campaignId, key));
      }
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([childKey, item]) => [childKey, externalizeDriveAssetValue(item, campaignId, childKey)]),
        );
      }
      return value;
    }

    function storeDriveAssetDataUrl(dataUrl, campaignId) {
      const parsed = parseAssetDataUrl(dataUrl);
      if (!ALLOWED_DRIVE_ASSET_MIME_TYPES.has(parsed.mimeType)) {
        throw new Error("El tipus de fitxer no es compatible amb Drive.");
      }
      if (estimateBase64Bytes(parsed.base64) > MAX_DRIVE_ASSET_BYTES) {
        throw new Error("El fitxer supera el limit de 12 MB.");
      }
      const extension = getAssetExtension(parsed.mimeType);
      const safeCampaignId = String(campaignId || "campaign").replace(/[^a-zA-Z0-9_-]/g, "-");
      const fileName = `asset-${safeCampaignId}-${hashAssetContent(parsed.base64)}.${extension}`;
      const folder = getAssetFolder();
      const existing = folder.getFilesByName(fileName);
      const file = existing.hasNext()
        ? existing.next()
        : folder.createFile(Utilities.newBlob(Utilities.base64Decode(parsed.base64), parsed.mimeType, fileName));
      return `${DRIVE_ASSET_PREFIX}${file.getId()}`;
    }

    function parseAssetDataUrl(dataUrl) {
      const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/);
      if (!match) throw new Error("Format d'actiu no compatible amb Drive.");
      return { mimeType: String(match[1] || "application/octet-stream"), base64: String(match[2] || "") };
    }

    function estimateBase64Bytes(value) {
      const text = String(value || "");
      const padding = text.endsWith("==") ? 2 : text.endsWith("=") ? 1 : 0;
      return Math.max(0, Math.floor(text.length * 3 / 4) - padding);
    }

    function hashAssetContent(value) {
      let hash = 2166136261;
      const text = String(value || "");
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16).padStart(8, "0");
    }

    function getAssetExtension(mimeType) {
      return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
        "video/mp4": "mp4",
        "application/pdf": "pdf",
      }[String(mimeType || "").toLowerCase()] || "bin";
    }

    function createDriveAssetBundle(value) {
      const tokens = collectDriveAssetTokens(value);
      const bundle = [];
      tokens.forEach((token) => {
        const fileId = token.slice(DRIVE_ASSET_PREFIX.length);
        try {
          const file = DriveApp.getFileById(fileId);
          if (!isCampaignAssetFile(file)) {
            throw new Error("El fitxer no pertany a la carpeta de la campanya.");
          }
          const blob = file.getBlob();
          const mimeType = String(blob.getContentType ? blob.getContentType() : "application/octet-stream");
          bundle.push({
            token,
            id: fileId,
            name: String(file.getName ? file.getName() : `asset-${fileId}`),
            mimeType,
            kind: getAssetKind(mimeType),
            dataUrl: `data:${mimeType};base64,${Utilities.base64Encode(blob.getBytes())}`,
          });
        } catch (error) {
          console.warn(`No s'ha pogut carregar l'actiu Drive ${fileId}: ${error}`);
        }
      });
      return bundle;
    }

    function assertDriveAssetReferencesAreAllowed(value, targetState) {
      collectDriveAssetTokens(value).forEach((token) => {
        const alreadyReferenced = campaignContainsAssetReference(targetState, token);
        const fileId = String(token).slice(DRIVE_ASSET_PREFIX.length);
        const file = DriveApp.getFileById(fileId);
        if (!alreadyReferenced && !isCampaignAssetFile(file)) {
          throw new Error("La referencia d'actiu Drive no pertany a aquesta campanya.");
        }
      });
    }

    function isLegacyCampaignAssetFile(file) {
      return Boolean(file && String(file.getName ? file.getName() : "").startsWith("asset-"));
    }

    function getDriveAssetDiagnostics(value) {
      const issues = [];
      collectDriveAssetTokens(value).forEach((token) => {
        try {
          const file = DriveApp.getFileById(String(token).slice(DRIVE_ASSET_PREFIX.length));
          if (!isCampaignAssetFile(file)) {
            issues.push({ token, status: isLegacyCampaignAssetFile(file) ? "legacy" : "invalid" });
          }
        } catch (error) {
          issues.push({ token, status: "missing" });
        }
      });
      return issues;
    }

    function repairCampaignAssetReferences(campaign, campaignId) {
      const targetState = getCampaignStateForId(campaign, campaignId);
      const replacements = {};
      const unresolved = [];
      collectDriveAssetTokens(targetState).forEach((token) => {
        try {
          const file = DriveApp.getFileById(String(token).slice(DRIVE_ASSET_PREFIX.length));
          if (isCampaignAssetFile(file)) return;
          if (!isLegacyCampaignAssetFile(file)) { unresolved.push(token); return; }
          const folder = getAssetFolder();
          const name = String(file.getName());
          const existing = folder.getFilesByName(name);
          const copied = existing.hasNext()
            ? existing.next()
            : folder.createFile(Utilities.newBlob(file.getBlob().getBytes(), file.getBlob().getContentType(), name));
          replacements[token] = `${DRIVE_ASSET_PREFIX}${copied.getId()}`;
        } catch (error) {
          unresolved.push(token);
        }
      });
      const tokens = Object.keys(replacements);
      if (!tokens.length) return { changed: false, repaired: 0, unresolved };
      const replace = (value) => {
        if (typeof value === "string") return tokens.reduce((text, token) => text.split(token).join(replacements[token]), value);
        if (Array.isArray(value)) return value.map(replace);
        if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)]));
        return value;
      };
      const targetId = resolveCampaignId(campaign, campaignId);
      campaign.campaigns = campaign.campaigns.map((entry) => entry && entry.id === targetId
        ? { ...entry, state: replace(entry.state), updatedAt: new Date().toISOString() }
        : entry);
      syncTopLevelCampaignFields(campaign);
      return { changed: true, repaired: tokens.length, unresolved };
    }
    function isCampaignAssetFile(file) {
      if (!file || !String(file.getName ? file.getName() : "").startsWith("asset-")) return false;
      const expectedFolderId = extractDriveId(CONFIG.DRIVE_FOLDER_ID);
      const assetFolderId = getExistingAssetFolderId();
      if (typeof file.getParents !== "function") return false;
      const parents = file.getParents();
      while (parents.hasNext()) {
        const parentId = String(parents.next().getId());
        if (parentId === expectedFolderId || (assetFolderId && parentId === assetFolderId)) return true;
      }
      return false;
    }

    function getExistingAssetFolderId() {
      const parent = getCampaignFolder();
      if (typeof parent.getFoldersByName !== "function") return "";
      const folders = parent.getFoldersByName(CONFIG.ASSET_FOLDER_NAME);
      return folders.hasNext() ? String(folders.next().getId()) : "";
    }

    function collectDriveAssetTokens(value) {
      const tokens = new Set();
      visit(value);
      return [...tokens];

      function visit(item) {
        if (typeof item === "string") {
          if (item.indexOf(DRIVE_ASSET_PREFIX) === 0) tokens.add(item);
          const pattern = /drive-asset:\/\/[a-zA-Z0-9_-]+/g;
          let match = pattern.exec(item);
          while (match) {
            tokens.add(match[0]);
            match = pattern.exec(item);
          }
          return;
        }
        if (Array.isArray(item)) {
          item.forEach(visit);
          return;
        }
        if (item && typeof item === "object") Object.values(item).forEach(visit);
      }
    }

    function getAssetKind(mimeType) {
      const normalized = String(mimeType || "").toLowerCase();
      if (normalized.indexOf("image/") === 0) return "image";
      if (normalized.indexOf("audio/") === 0) return "audio";
      if (normalized.indexOf("video/") === 0) return "video";
      return "file";
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

    function getCurrentCampaignFileInfo() {
      const file = getCampaignFile();
      return file ? getDriveFileInfo(file) : null;
    }

    function getDriveFileInfo(file) {
      if (!file) {
        return null;
      }

      return {
        folderId: extractDriveId(CONFIG.DRIVE_FOLDER_ID),
        id: file.getId(),
        name: file.getName(),
        updatedAt: file.getLastUpdated().toISOString(),
        url: file.getUrl(),
      };
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
      pruneCampaignBackups();
    }

    function pruneCampaignBackups() {
      const folder = getCampaignFolder();
      if (!folder || typeof folder.getFiles !== "function") return;
      const files = folder.getFiles();
      const backups = [];
      while (files.hasNext()) {
        const file = files.next();
        if (String(file.getName ? file.getName() : "").indexOf(CONFIG.BACKUP_PREFIX) !== 0) continue;
        const updatedAt = file.getLastUpdated ? file.getLastUpdated().getTime() : 0;
        backups.push({ file, updatedAt });
      }
      backups
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(MAX_BACKUP_FILES)
        .forEach((entry) => entry.file.setTrashed(true));
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

    function getAssetFolder() {
      const parent = getCampaignFolder();
      const folders = parent.getFoldersByName(CONFIG.ASSET_FOLDER_NAME);
      return folders.hasNext() ? folders.next() : parent.createFolder(CONFIG.ASSET_FOLDER_NAME);
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

    function getClientCapabilities() {
      return {
        backendVersion: BACKEND_VERSION,
        driveFolderId: extractDriveId(CONFIG.DRIVE_FOLDER_ID),
        atomicCampaignWrites: true,
        lazyDriveAssets: true,
        repairCampaignAssets: true,
        campaignRevisions: true,
        ephemeralServerSessions: true,
        preserveExistingCharacterPortrait: true,
        preserveExistingImageAssets: true,
        driveAssetFiles: true,
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
