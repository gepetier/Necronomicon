import { DATA_VERSION } from "../data.js";

export const BACKUP_KIND = "necronomicon-backup";

export function createBackupPayload(state, assetBundle = [], exportedAt = new Date().toISOString()) {
  return {
    kind: BACKUP_KIND,
    version: DATA_VERSION,
    exportedAt,
    state: structuredClone(state),
    assetBundle: Array.isArray(assetBundle) ? structuredClone(assetBundle) : [],
  };
}

export function readBackupStatePayload(payload) {
  if (
    payload
    && typeof payload === "object"
    && payload.kind === BACKUP_KIND
    && Object.prototype.hasOwnProperty.call(payload, "state")
  ) {
    return {
      version: Number(payload.version) || 0,
      state: payload.state,
    };
  }

  return payload;
}

export function readBackupAssetBundle(payload) {
  return Array.isArray(payload?.assetBundle) ? payload.assetBundle : [];
}
