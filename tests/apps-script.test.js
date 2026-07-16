import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const APPS_SCRIPT_SOURCE = readFileSync(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const CLIENT_ID = "386167885974-voguggv8fbvmqioec1p38vu3qf1fj33f.apps.googleusercontent.com";

function createAccess(users = {}) {
  return { users };
}

function createCampaignLibrary(options = {}) {
  const accessA = createAccess(options.usersA || {});
  const accessB = createAccess(options.usersB || {});
  const campaigns = [
    {
      id: "campaign-a",
      name: "Campaign A",
      system: "D&D 5e",
      state: {
        access: accessA,
        characters: [{ id: "hero-a", name: "Hero A" }],
        chronicles: [],
        glossary: [],
        ui: {},
      },
    },
    {
      id: "campaign-b",
      name: "Campaign B",
      system: "Savage Worlds",
      state: {
        access: accessB,
        characters: [
          { id: "hero-b", name: "Hero B" },
          { id: "hero-b-2", name: "Hero B 2" },
        ],
        chronicles: [
          { id: "session-assigned", title: "Assigned", editableByUserEmails: ["player@example.com"] },
          { id: "session-private", title: "Private", editableByUserEmails: [] },
        ],
        glossary: [
          { id: "entry-assigned", name: "Assigned", editableByUserEmails: ["player@example.com"] },
          { id: "entry-private", name: "Private", editableByUserEmails: [] },
        ],
        ui: {},
      },
    },
  ];
  const active = campaigns[0];
  return {
    kind: "necronomicon-campaign-library",
    version: 9,
    activeCampaignId: active.id,
    campaigns,
    access: active.state.access,
    characters: active.state.characters,
    chronicles: [],
    glossary: [],
    ui: {},
    serverSync: { revision: options.revision || 0 },
  };
}

function createAppsScriptHarness(initialCampaign, tokenEmails = {}) {
  let campaignContent = JSON.stringify(initialCampaign);
  const events = [];
  const backups = [];
  const cacheValues = new Map();
  let locked = false;

  const campaignFile = {
    getBlob() {
      events.push("read");
      return { getDataAsString: () => campaignContent };
    },
    setContent(content) {
      events.push("write");
      assert.equal(locked, true, "Drive writes must happen while the script lock is held");
      campaignContent = content;
    },
    getId: () => "campaign-file-id",
    getName: () => "campaign.json",
    getLastUpdated: () => new Date("2026-07-15T12:00:00.000Z"),
    getUrl: () => "https://drive.google.com/file/d/campaign-file-id/view",
  };

  const folder = {
    getFilesByName(name) {
      let available = name === "campaign.json";
      return {
        hasNext: () => available,
        next() {
          available = false;
          return campaignFile;
        },
      };
    },
    createFile(name, content) {
      backups.push({ name, content });
      return campaignFile;
    },
  };

  const context = {
    console,
    MimeType: { PLAIN_TEXT: "text/plain" },
    Utilities: { formatDate: () => "20260715-120000", getUuid: () => "server-session-token" },
    CacheService: {
      getScriptCache: () => ({
        put: (key, value) => cacheValues.set(key, String(value)),
        get: (key) => cacheValues.get(key) || null,
        remove: (key) => cacheValues.delete(key),
      }),
    },
    DriveApp: { getFolderById: () => folder },
    LockService: {
      getScriptLock: () => ({
        waitLock() {
          assert.equal(locked, false, "The script lock cannot be acquired twice");
          locked = true;
          events.push("lock");
        },
        releaseLock() {
          events.push("unlock");
          locked = false;
        },
      }),
    },
    UrlFetchApp: {
      fetch(url) {
        const token = new URL(url).searchParams.get("id_token");
        const email = tokenEmails[token] || "";
        return {
          getResponseCode: () => email ? 200 : 401,
          getContentText: () => JSON.stringify({
            aud: CLIENT_ID,
            email_verified: "true",
            email,
            name: email,
          }),
        };
      },
    },
  };

  vm.createContext(context);
  vm.runInContext(APPS_SCRIPT_SOURCE, context);
  return {
    handleRequest: (request) => JSON.parse(JSON.stringify(context.handleRequest(request))),
    readCampaign: () => JSON.parse(campaignContent),
    events,
    backups,
  };
}

test("Apps Script exchanges the Google token for an opaque one-time claimed session", () => {
  const campaign = createCampaignLibrary({ usersA: { "admin@example.com": { role: "superadmin" } } });
  const harness = createAppsScriptHarness(campaign, { admin: "admin@example.com" });
  const created = harness.handleRequest({ action: "createSession", idToken: "admin", operationId: "claim-1" });
  const claimed = harness.handleRequest({ action: "claimSession", operationId: "claim-1" });
  const loaded = harness.handleRequest({ action: "loadCampaign", sessionToken: claimed.sessionToken });
  assert.equal(created.ok, true);
  assert.equal(claimed.sessionToken, "server-session-token");
  assert.equal(loaded.ok, true);
  assert.equal(harness.handleRequest({ action: "claimSession", operationId: "claim-1" }).ok, false);
});

test("Apps Script rejects a valid Google user without campaign access", () => {
  const harness = createAppsScriptHarness(createCampaignLibrary(), { stranger: "stranger@example.com" });
  const response = harness.handleRequest({ action: "loadCampaign", idToken: "stranger" });

  assert.equal(response.ok, false);
  assert.match(response.error, /cap campanya assignada|No tens acces/);
});

test("Apps Script only returns campaigns and access rows assigned to the user", () => {
  const campaign = createCampaignLibrary({
    usersA: { "admin@example.com": { role: "superadmin" } },
    usersB: {
      "player@example.com": { role: "player", characterIds: ["hero-b"] },
      "other@example.com": { role: "player" },
    },
  });
  const harness = createAppsScriptHarness(campaign, { player: "player@example.com" });
  const response = harness.handleRequest({ action: "loadCampaign", idToken: "player" });

  assert.equal(response.ok, true);
  assert.equal(response.campaign.activeCampaignId, "campaign-b");
  assert.deepEqual(response.campaign.campaigns.map((entry) => entry.id), ["campaign-b"]);
  assert.deepEqual(Object.keys(response.campaign.campaigns[0].state.access.users), ["player@example.com"]);
});

test("Apps Script holds the lock across read, mutation, backup and write", () => {
  const campaign = createCampaignLibrary({
    usersB: { "player@example.com": { role: "player", characterIds: ["hero-b"] } },
  });
  const harness = createAppsScriptHarness(campaign, { player: "player@example.com" });
  const response = harness.handleRequest({
    action: "saveCharacter",
    idToken: "player",
    campaignId: "campaign-b",
    operationId: "operation-1",
    character: { id: "hero-b", name: "Updated Hero" },
  });

  assert.equal(response.ok, true);
  assert.equal(harness.readCampaign().campaigns[1].state.characters[0].name, "Updated Hero");
  assert.equal(harness.readCampaign().serverSync.revision, 1);
  assert.equal(harness.readCampaign().serverSync.operationId, "operation-1");
  assert.ok(harness.events.indexOf("lock") < harness.events.indexOf("read"));
  assert.ok(harness.events.indexOf("write") < harness.events.lastIndexOf("unlock"));
  assert.equal(harness.backups.length, 1);
});

test("Apps Script throttles item-level backups between revision milestones", () => {
  const campaign = createCampaignLibrary({
    usersB: { "player@example.com": { role: "player", characterIds: ["hero-b"] } },
  });
  const harness = createAppsScriptHarness(campaign, { player: "player@example.com" });
  for (const name of ["Hero 1", "Hero 2"]) {
    const response = harness.handleRequest({
      action: "saveCharacter",
      idToken: "player",
      campaignId: "campaign-b",
      character: { id: "hero-b", name },
    });
    assert.equal(response.ok, true);
  }
  assert.equal(harness.backups.length, 1);
});

test("Apps Script rejects stale full publications without changing Drive", () => {
  const campaign = createCampaignLibrary({
    revision: 5,
    usersA: { "admin@example.com": { role: "superadmin" } },
  });
  const harness = createAppsScriptHarness(campaign, { admin: "admin@example.com" });
  const response = harness.handleRequest({
    action: "saveCampaign",
    idToken: "admin",
    expectedRevision: 4,
    campaign,
  });

  assert.equal(response.ok, false);
  assert.match(response.error, /Conflicte de sincronitzacio/);
  assert.equal(harness.readCampaign().serverSync.revision, 5);
  assert.equal(harness.events.includes("write"), false);
});

test("full publication preserves campaigns the manager cannot access", () => {
  const campaign = createCampaignLibrary({
    usersA: { "admin@example.com": { role: "superadmin" } },
    usersB: { "other@example.com": { role: "superadmin" } },
  });
  const incoming = structuredClone(campaign);
  incoming.campaigns = [{ ...incoming.campaigns[0], name: "Campaign A updated" }];
  const harness = createAppsScriptHarness(campaign, { admin: "admin@example.com" });
  const response = harness.handleRequest({
    action: "saveCampaign",
    idToken: "admin",
    expectedRevision: 0,
    operationId: "operation-2",
    campaign: incoming,
  });

  assert.equal(response.ok, true);
  assert.equal(harness.readCampaign().campaigns.length, 2);
  assert.equal(harness.readCampaign().campaigns[0].name, "Campaign A updated");
  assert.equal(harness.readCampaign().campaigns[1].id, "campaign-b");
});

test("campaign publication cannot escalate a GM to permission manager", () => {
  const campaign = createCampaignLibrary({
    usersA: { "gm@example.com": { role: "gm" } },
  });
  const incoming = structuredClone(campaign);
  incoming.campaigns[0].state.access.users["gm@example.com"] = { role: "superadmin" };
  incoming.campaigns[0].state.access.users["attacker@example.com"] = { role: "superadmin" };
  const harness = createAppsScriptHarness(campaign, { gm: "gm@example.com" });
  const response = harness.handleRequest({
    action: "saveCampaign",
    idToken: "gm",
    expectedRevision: 0,
    campaign: incoming,
  });

  assert.equal(response.ok, true);
  const storedUsers = harness.readCampaign().campaigns[0].state.access.users;
  assert.deepEqual(storedUsers, { "gm@example.com": { role: "gm" } });
});

test("assigned players cannot create records by assigning the new record to themselves", () => {
  const campaign = createCampaignLibrary({
    usersB: { "player@example.com": { role: "player", characterIds: ["hero-b"] } },
  });

  for (const [action, key, item] of [
    ["saveChronicle", "chronicle", { id: "new-chronicle", editableByUserEmails: ["player@example.com"] }],
    ["saveGlossaryEntry", "entry", { id: "new-entry", editableByUserEmails: ["player@example.com"] }],
  ]) {
    const harness = createAppsScriptHarness(campaign, { player: "player@example.com" });
    const response = harness.handleRequest({
      action,
      idToken: "player",
      campaignId: "campaign-b",
      [key]: item,
    });

    assert.equal(response.ok, false);
    assert.match(response.error, /No tens permisos per crear/);
    assert.equal(harness.events.includes("write"), false);
  }
});

test("virtual users enforce the complete server-side role matrix", async (t) => {
  const campaign = createCampaignLibrary({
    usersB: {
      "admin@example.com": { role: "superadmin" },
      "gm@example.com": { role: "gm" },
      "player@example.com": { role: "player", characterIds: ["hero-b"] },
      "other@example.com": { role: "player", characterIds: ["hero-b-2"] },
    },
  });
  const tokens = {
    admin: "admin@example.com",
    gm: "gm@example.com",
    player: "player@example.com",
    stranger: "stranger@example.com",
  };

  function requestAs(idToken, request) {
    const harness = createAppsScriptHarness(campaign, tokens);
    return {
      harness,
      response: harness.handleRequest({ idToken, ...request }),
    };
  }

  await t.test("superadmin sees permission rows and can change them", () => {
    const loaded = requestAs("admin", { action: "loadCampaign" }).response;
    assert.equal(loaded.ok, true);
    assert.deepEqual(
      Object.keys(loaded.campaign.campaigns[0].state.access.users).sort(),
      ["admin@example.com", "gm@example.com", "other@example.com", "player@example.com"],
    );

    const incoming = structuredClone(loaded.campaign);
    incoming.campaigns[0].state.access.users["other@example.com"].role = "gm";
    incoming.campaigns.push({
      id: "campaign-c",
      name: "Campaign C",
      system: "D&D 5e",
      state: {
        access: createAccess({ "admin@example.com": { role: "superadmin" } }),
        characters: [],
        chronicles: [],
        glossary: [],
        ui: {},
      },
    });
    const { harness, response } = requestAs("admin", {
      action: "saveCampaign",
      expectedRevision: 0,
      campaign: incoming,
    });
    assert.equal(response.ok, true);
    assert.equal(
      harness.readCampaign().campaigns[1].state.access.users["other@example.com"].role,
      "gm",
    );
    assert.equal(harness.readCampaign().campaigns.some((entry) => entry.id === "campaign-c"), true);
  });

  await t.test("gm can edit and publish content but cannot see or replace permissions", () => {
    const loaded = requestAs("gm", { action: "loadCampaign" }).response;
    assert.equal(loaded.ok, true);
    assert.deepEqual(Object.keys(loaded.campaign.campaigns[0].state.access.users), ["gm@example.com"]);

    for (const request of [
      { action: "saveCharacter", campaignId: "campaign-b", character: { id: "hero-b-2", name: "GM edit" } },
      { action: "saveChronicle", campaignId: "campaign-b", chronicle: { id: "new-session", title: "GM creates" } },
      { action: "saveGlossaryEntry", campaignId: "campaign-b", entry: { id: "new-entry", name: "GM creates" } },
    ]) {
      assert.equal(requestAs("gm", request).response.ok, true);
    }

    const incoming = structuredClone(loaded.campaign);
    incoming.campaigns[0].name = "GM content publication";
    incoming.campaigns[0].state.access.users["gm@example.com"].role = "superadmin";
    const { harness, response } = requestAs("gm", {
      action: "saveCampaign",
      expectedRevision: 0,
      campaign: incoming,
    });
    assert.equal(response.ok, true);
    assert.equal(harness.readCampaign().campaigns[1].name, "GM content publication");
    assert.equal(harness.readCampaign().campaigns[1].state.access.users["gm@example.com"].role, "gm");
    assert.equal(harness.readCampaign().campaigns[1].state.access.users["player@example.com"].role, "player");

    incoming.campaigns.push({
      id: "gm-created-campaign",
      name: "Denied campaign",
      state: {
        access: createAccess({ "gm@example.com": { role: "gm" } }),
        characters: [],
        chronicles: [],
        glossary: [],
        ui: {},
      },
    });
    assert.equal(requestAs("gm", {
      action: "saveCampaign",
      expectedRevision: 0,
      campaign: incoming,
    }).response.ok, false);
  });

  await t.test("player can edit only explicitly assigned existing content", () => {
    const allowedRequests = [
      { action: "saveCharacter", campaignId: "campaign-b", character: { id: "hero-b", name: "Player edit" } },
      {
        action: "saveChronicle",
        campaignId: "campaign-b",
        chronicle: { id: "session-assigned", title: "Player edit", editableByUserEmails: ["player@example.com"] },
      },
      {
        action: "saveGlossaryEntry",
        campaignId: "campaign-b",
        entry: { id: "entry-assigned", name: "Player edit", editableByUserEmails: ["player@example.com"] },
      },
    ];
    allowedRequests.forEach((request) => assert.equal(requestAs("player", request).response.ok, true));

    const deniedRequests = [
      { action: "saveCharacter", campaignId: "campaign-b", character: { id: "hero-b-2", name: "Denied" } },
      { action: "saveCharacter", campaignId: "campaign-a", character: { id: "hero-a", name: "Denied" } },
      {
        action: "saveChronicle",
        campaignId: "campaign-b",
        chronicle: { id: "session-private", title: "Denied", editableByUserEmails: [] },
      },
      {
        action: "saveGlossaryEntry",
        campaignId: "campaign-b",
        entry: { id: "entry-private", name: "Denied", editableByUserEmails: [] },
      },
      { action: "saveCampaign", expectedRevision: 0, campaign },
    ];
    deniedRequests.forEach((request) => assert.equal(requestAs("player", request).response.ok, false));
  });

  await t.test("unassigned authenticated user cannot load any campaign", () => {
    const response = requestAs("stranger", { action: "loadCampaign" }).response;
    assert.equal(response.ok, false);
    assert.match(response.error, /cap campanya assignada|No tens acces/);
  });
});
