const ROLE_IDS = ["superadmin", "gm", "player"];

export const DEFAULT_ACCESS_ROLES = {
  superadmin: {
    editAnyCharacter: true,
    editOwnCharacter: true,
    manageCharacters: true,
    deleteCharacters: true,
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
    manageCharacters: true,
    deleteCharacters: true,
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
    manageCharacters: false,
    deleteCharacters: false,
    editChronicles: false,
    editAssignedChronicles: true,
    editGlossary: false,
    editAssignedGlossary: true,
    managePermissions: false,
    manageCampaigns: false,
    publishCampaign: false,
  },
};

export function normalizeRoleId(roleId) {
  const role = String(roleId || "").toLowerCase();
  if (role === "dm") {
    return "gm";
  }
  if (role === "viewer") {
    return "player";
  }
  return ROLE_IDS.includes(role) ? role : "player";
}

export function normalizeAccessShape(access) {
  const sourceRoles = access?.roles && typeof access.roles === "object" ? access.roles : {};
  const sourceUsers = access?.users && typeof access.users === "object" ? access.users : {};
  const roles = {
    superadmin: {
      ...DEFAULT_ACCESS_ROLES.superadmin,
      ...(sourceRoles.superadmin || {}),
    },
    gm: {
      ...DEFAULT_ACCESS_ROLES.gm,
      ...(sourceRoles.gm || sourceRoles.dm || {}),
    },
    player: {
      ...DEFAULT_ACCESS_ROLES.player,
      ...(sourceRoles.player || sourceRoles.viewer || {}),
    },
    ...Object.fromEntries(
      Object.entries(sourceRoles).filter(([roleId]) => !["superadmin", "gm", "dm", "player", "viewer"].includes(roleId)),
    ),
  };
  const users = Object.fromEntries(
    Object.entries(sourceUsers)
      .filter(([email]) => typeof email === "string" && email.includes("@"))
      .map(([email, user]) => [
        email.toLowerCase(),
        {
          ...(user && typeof user === "object" ? user : {}),
          role: normalizeRoleId(user?.role || "player"),
          characterIds: Array.isArray(user?.characterIds) ? user.characterIds.map(String) : [],
          invitedAt: typeof user?.invitedAt === "string" ? user.invitedAt : "",
        },
      ]),
  );
  return { roles, users };
}

export function getUserAccessForCampaign({
  campaign,
  email = "",
  forceSuperadmin = false,
  cloudEnabled = true,
}) {
  const access = normalizeAccessShape(campaign?.access);
  const normalizedEmail = String(email || "").toLowerCase();
  if (forceSuperadmin || !cloudEnabled) {
    return {
      hasAccess: true,
      email: normalizedEmail || "local",
      role: "superadmin",
      characterIds: [],
      permissions: access.roles.superadmin,
    };
  }

  const configured = normalizedEmail ? access.users[normalizedEmail] : null;
  if (!configured) {
    return {
      hasAccess: false,
      email: normalizedEmail,
      role: "player",
      characterIds: [],
      permissions: access.roles.player,
    };
  }

  const role = normalizeRoleId(configured.role || "player");
  return {
    hasAccess: true,
    email: normalizedEmail,
    role,
    characterIds: Array.isArray(configured.characterIds) ? configured.characterIds : [],
    permissions: access.roles[role] || access.roles.player,
  };
}

export function resolveCurrentUserAccess({
  cloudEnabled = true,
  cloudUser = null,
  access,
  characters = [],
}) {
  const normalizedAccess = normalizeAccessShape(access);
  if (!cloudEnabled) {
    return {
      email: "local",
      role: "superadmin",
      characterIds: characters.map((character) => character.id),
      permissions: normalizedAccess.roles.superadmin,
    };
  }

  const email = String(cloudUser?.email || "").toLowerCase();
  const configured = email ? normalizedAccess.users[email] : null;
  const role = normalizeRoleId(configured?.role || cloudUser?.role || "player");
  return {
    ...(cloudUser || {}),
    email,
    role,
    characterIds: Array.isArray(configured?.characterIds)
      ? configured.characterIds
      : Array.isArray(cloudUser?.characterIds)
        ? cloudUser.characterIds
        : [],
    permissions: normalizedAccess.roles[role] || normalizedAccess.roles.player,
  };
}

export function canManagePermissions(userAccess) {
  return Boolean(userAccess?.permissions?.managePermissions);
}

export function canManageCampaigns(userAccess) {
  return Boolean(userAccess?.permissions?.manageCampaigns);
}

export function canPublishCampaign(userAccess) {
  const permissions = userAccess?.permissions || {};
  return Boolean(permissions.publishCampaign || permissions.managePermissions);
}

export function canEditAnyCharacter(userAccess) {
  return Boolean(userAccess?.permissions?.editAnyCharacter);
}

export function canManageCharacters(userAccess) {
  return Boolean(userAccess?.permissions?.manageCharacters);
}

export function canDeleteCharacter(userAccess, character) {
  return Boolean(character && userAccess?.permissions?.deleteCharacters);
}

export function canEditCharacter(userAccess, characterOrId) {
  const characterId = typeof characterOrId === "string" ? characterOrId : characterOrId?.id;
  const permissions = userAccess?.permissions || {};
  if (!characterId) {
    return false;
  }
  if (permissions.editAnyCharacter) {
    return true;
  }
  return Boolean(
    permissions.editOwnCharacter
      && Array.isArray(userAccess?.characterIds)
      && userAccess.characterIds.includes(characterId),
  );
}

export function canCreateChronicle(userAccess) {
  return Boolean(userAccess?.permissions?.editChronicles);
}

export function canDeleteChronicle(userAccess, chronicle) {
  return Boolean(chronicle && userAccess?.permissions?.editChronicles);
}

export function canEditChronicle(userAccess, chronicle) {
  const permissions = userAccess?.permissions || {};
  if (!chronicle) {
    return false;
  }
  if (permissions.editChronicles) {
    return true;
  }
  return Boolean(
    permissions.editAssignedChronicles
      && isUserAssignedToItem(userAccess, chronicle),
  );
}

export function canCreateGlossaryEntry(userAccess) {
  return Boolean(userAccess?.permissions?.editGlossary);
}

export function canDeleteGlossaryEntry(userAccess, entry) {
  return Boolean(entry && userAccess?.permissions?.editGlossary);
}

export function canEditGlossaryEntry(userAccess, entry) {
  const permissions = userAccess?.permissions || {};
  if (!entry) {
    return false;
  }
  if (permissions.editGlossary) {
    return true;
  }
  return Boolean(
    permissions.editAssignedGlossary
      && isUserAssignedToItem(userAccess, entry),
  );
}

export function isUserAssignedToItem(userAccess, item) {
  const email = String(userAccess?.email || "").toLowerCase();
  return Boolean(
    email
      && Array.isArray(item?.editableByUserEmails)
      && item.editableByUserEmails.map((value) => String(value || "").toLowerCase()).includes(email),
  );
}
