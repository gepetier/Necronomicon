import test from "node:test";
import assert from "node:assert/strict";

import {
  canCreateChronicle,
  canCreateGlossaryEntry,
  canEditCharacter,
  canEditChronicle,
  canEditGlossaryEntry,
  canManageCampaigns,
  canManagePermissions,
  canPublishCampaign,
  getUserAccessForCampaign,
  normalizeAccessShape,
  normalizeRoleId,
  resolveCurrentUserAccess,
} from "../app/permissions.js";

const access = normalizeAccessShape({
  users: {
    "admin@example.com": { role: "superadmin" },
    "gm@example.com": { role: "gm" },
    "player@example.com": { role: "player", characterIds: ["ilu"] },
    "legacy-dm@example.com": { role: "dm" },
    "legacy-viewer@example.com": { role: "viewer", characterIds: ["nelthan"] },
  },
});

const campaign = { access };
const assignedChronicle = { id: "session-1", editableByUserEmails: ["player@example.com"] };
const unassignedChronicle = { id: "session-2", editableByUserEmails: [] };
const assignedGlossary = { id: "uric", editableByUserEmails: ["PLAYER@example.com"] };
const unassignedGlossary = { id: "nishaar", editableByUserEmails: [] };

test("role aliases normalize to the canonical three roles", () => {
  assert.equal(normalizeRoleId("superadmin"), "superadmin");
  assert.equal(normalizeRoleId("dm"), "gm");
  assert.equal(normalizeRoleId("viewer"), "player");
  assert.equal(normalizeRoleId("unknown"), "player");
});

test("superadmin can manage, publish and edit everything", () => {
  const user = getUserAccessForCampaign({
    campaign,
    email: "admin@example.com",
    cloudEnabled: true,
  });

  assert.equal(user.hasAccess, true);
  assert.equal(user.role, "superadmin");
  assert.equal(canManagePermissions(user), true);
  assert.equal(canManageCampaigns(user), true);
  assert.equal(canPublishCampaign(user), true);
  assert.equal(canEditCharacter(user, "any-character"), true);
  assert.equal(canCreateChronicle(user), true);
  assert.equal(canEditChronicle(user, unassignedChronicle), true);
  assert.equal(canCreateGlossaryEntry(user), true);
  assert.equal(canEditGlossaryEntry(user, unassignedGlossary), true);
});

test("gm can manipulate campaign content but cannot manage permissions or campaigns", () => {
  const user = getUserAccessForCampaign({
    campaign,
    email: "gm@example.com",
    cloudEnabled: true,
  });

  assert.equal(user.hasAccess, true);
  assert.equal(user.role, "gm");
  assert.equal(canManagePermissions(user), false);
  assert.equal(canManageCampaigns(user), false);
  assert.equal(canPublishCampaign(user), true);
  assert.equal(canEditCharacter(user, "nelthan"), true);
  assert.equal(canCreateChronicle(user), true);
  assert.equal(canEditChronicle(user, unassignedChronicle), true);
  assert.equal(canCreateGlossaryEntry(user), true);
  assert.equal(canEditGlossaryEntry(user, unassignedGlossary), true);
});

test("player can only edit assigned character, chronicle and glossary entries", () => {
  const user = getUserAccessForCampaign({
    campaign,
    email: "player@example.com",
    cloudEnabled: true,
  });

  assert.equal(user.hasAccess, true);
  assert.equal(user.role, "player");
  assert.equal(canManagePermissions(user), false);
  assert.equal(canManageCampaigns(user), false);
  assert.equal(canPublishCampaign(user), false);
  assert.equal(canEditCharacter(user, "ilu"), true);
  assert.equal(canEditCharacter(user, "nelthan"), false);
  assert.equal(canCreateChronicle(user), false);
  assert.equal(canEditChronicle(user, assignedChronicle), true);
  assert.equal(canEditChronicle(user, unassignedChronicle), false);
  assert.equal(canCreateGlossaryEntry(user), false);
  assert.equal(canEditGlossaryEntry(user, assignedGlossary), true);
  assert.equal(canEditGlossaryEntry(user, unassignedGlossary), false);
});

test("unassigned cloud user cannot access a campaign", () => {
  const user = getUserAccessForCampaign({
    campaign,
    email: "stranger@example.com",
    cloudEnabled: true,
  });

  assert.equal(user.hasAccess, false);
  assert.equal(user.role, "player");
  assert.equal(canEditCharacter(user, "ilu"), false);
});

test("local mode resolves as superadmin without requiring cloud users", () => {
  const user = resolveCurrentUserAccess({
    cloudEnabled: false,
    cloudUser: null,
    access,
    characters: [{ id: "ilu" }, { id: "nelthan" }],
  });

  assert.equal(user.email, "local");
  assert.equal(user.role, "superadmin");
  assert.deepEqual(user.characterIds, ["ilu", "nelthan"]);
  assert.equal(canManageCampaigns(user), true);
  assert.equal(canEditCharacter(user, "nelthan"), true);
});
