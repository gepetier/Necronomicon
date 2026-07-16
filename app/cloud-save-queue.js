export function createCloudSaveQueue() {
  const targets = new Map();

  return {
    enqueue(target) {
      const key = getCloudSaveTargetKey(target);
      if (!key) return false;
      if (key === "campaign") {
        targets.clear();
        targets.set(key, target);
        return true;
      }
      if (targets.has("campaign")) return false;
      targets.set(key, target);
      return true;
    },
    prepend(target) {
      const key = getCloudSaveTargetKey(target);
      if (!key || targets.has("campaign")) return false;
      const current = [...targets.entries()].filter(([entryKey]) => entryKey !== key);
      targets.clear();
      targets.set(key, target);
      current.forEach(([entryKey, entryTarget]) => targets.set(entryKey, entryTarget));
      return true;
    },
    take() {
      const next = targets.entries().next();
      if (next.done) return null;
      const [key, target] = next.value;
      targets.delete(key);
      return target;
    },
    clear() {
      targets.clear();
    },
    get size() {
      return targets.size;
    },
    snapshot() {
      return [...targets.values()];
    },
  };
}

export function getCloudSaveTargetKey(target) {
  if (!target || typeof target !== "object") return "";
  if (target.type === "campaign") return "campaign";
  const id = target.characterId
    || target.character?.id
    || target.chronicleId
    || target.chronicle?.id
    || target.entryId
    || target.entry?.id
    || "";
  return id && ["character", "chronicle", "glossary"].includes(target.type)
    ? `${target.type}:${id}`
    : "";
}
