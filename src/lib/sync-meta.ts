import type { SyncMeta } from "./types";

export const SYNC_META_KEY = "certstudy:sync:v1";

export const DEFAULT_SYNC_META: SyncMeta = {
  uid: null,
  localUpdatedAtMs: 0,
  lastPushedMs: 0,
  lastPulledUpdatedAtMs: 0,
};

export function readSyncMeta(): SyncMeta {
  if (typeof window === "undefined") return { ...DEFAULT_SYNC_META };
  try {
    const raw = window.localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { ...DEFAULT_SYNC_META };
    const v = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      uid: typeof v.uid === "string" ? v.uid : null,
      localUpdatedAtMs: Number(v.localUpdatedAtMs) || 0,
      lastPushedMs: Number(v.lastPushedMs) || 0,
      lastPulledUpdatedAtMs: Number(v.lastPulledUpdatedAtMs) || 0,
    };
  } catch {
    return { ...DEFAULT_SYNC_META };
  }
}

export function writeSyncMeta(meta: SyncMeta): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    /* 保存できなくても同期以外の動作は続ける */
  }
}

export function patchSyncMeta(patch: Partial<SyncMeta>): SyncMeta {
  const next = { ...readSyncMeta(), ...patch };
  writeSyncMeta(next);
  return next;
}

export function clearSyncMeta(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SYNC_META_KEY);
  } catch {
    /* noop */
  }
}

/** 最後の push 以降にローカルが変更されているか。 */
export function isDirty(meta: SyncMeta): boolean {
  return meta.localUpdatedAtMs > meta.lastPushedMs;
}
