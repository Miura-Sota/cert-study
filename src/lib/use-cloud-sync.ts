"use client";

import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { pullCloudState, pushCloudState } from "./cloud-sync";
import { mergeStates } from "./merge-state";
import { decidePull } from "./sync-decision";
import { isDirty, patchSyncMeta, readSyncMeta, writeSyncMeta } from "./sync-meta";
import type { AppState, CloudSnapshot, ConflictChoice, SyncStatus } from "./types";
import { DEFAULT_STATE } from "./utils";

/** 入力1文字ごとに書かないための待ち時間。localStorage と違い Firestore は課金対象。 */
const PUSH_DEBOUNCE_MS = 3000;
/** 復帰のたびに読みに行かないための間隔。 */
const PULL_THROTTLE_MS = 10000;

export type Conflict = { local: CloudSnapshot; cloud: CloudSnapshot };

export type CloudSync = {
  status: SyncStatus;
  lastSyncedMs: number;
  conflict: Conflict | null;
  notice: string;
  dismissNotice: () => void;
  resolveConflict: (choice: ConflictChoice) => Promise<void>;
};

export function useCloudSync({
  state,
  setState,
  ready,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  ready: boolean;
}): CloudSync {
  const { user, configured } = useAuth();
  const uid = user?.uid ?? null;

  const [status, setStatus] = useState<SyncStatus>("off");
  const [lastSyncedMs, setLastSyncedMs] = useState(0);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [notice, setNotice] = useState("");

  const stateRef = useRef(state);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const suppressRef = useRef(false);
  const lastPullAtRef = useRef(0);
  const conflictRef = useRef<Conflict | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const uidRef = useRef<string | null>(null);
  const baselineRef = useRef(false);

  // ref の更新はレンダー中に行わない。宣言順に実行されるので、
  // 以降の効果が読むときには常に最新になっている。
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    conflictRef.current = conflict;
  }, [conflict]);
  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  /** クラウドから受け取った状態を反映する。ローカル変更として扱わない。 */
  const applyRemote = useCallback(
    (next: AppState, accountId: string, pulledUpdatedAtMs: number) => {
      suppressRef.current = true;
      stateRef.current = next;
      setState(next);
      const now = Date.now();
      writeSyncMeta({
        uid: accountId,
        localUpdatedAtMs: now,
        lastPushedMs: now,
        lastPulledUpdatedAtMs: pulledUpdatedAtMs,
      });
      setLastSyncedMs(now);
      setStatus("synced");
    },
    [setState],
  );

  const doPush = useCallback(async (accountId: string, explicit?: AppState) => {
    const before = readSyncMeta();
    setStatus("syncing");
    const pushedAt = await pushCloudState(accountId, explicit ?? stateRef.current);
    patchSyncMeta({
      uid: accountId,
      // push 中に入った編集を未送信のまま残すため、開始前の時刻で確定させる。
      lastPushedMs: before.localUpdatedAtMs || pushedAt,
      lastPulledUpdatedAtMs: pushedAt,
    });
    setLastSyncedMs(pushedAt);
    setStatus("synced");
  }, []);

  const runPull = useCallback(async () => {
    if (!configured || !uid || busyRef.current || conflictRef.current) return;
    busyRef.current = true;
    lastPullAtRef.current = Date.now();
    try {
      const meta = readSyncMeta();
      const cloud = await pullCloudState(uid);
      const decision = decidePull({ uid, meta, cloud, local: stateRef.current });

      switch (decision.kind) {
        case "switch-account":
          applyRemote(cloud ? cloud.state : DEFAULT_STATE, uid, cloud?.updatedAtMs ?? 0);
          setNotice("別のアカウントの記録は、この端末から切り離しました。元のアカウントでログインすると元の記録に戻ります。");
          if (!cloud) await doPush(uid, DEFAULT_STATE);
          break;
        case "push":
          await doPush(uid);
          break;
        case "adopt-cloud":
          // adopt-cloud は cloud がある場合にしか返らない。
          if (cloud) applyRemote(cloud.state, uid, cloud.updatedAtMs);
          break;
        case "conflict":
          if (cloud) {
            setConflict({
              local: { state: stateRef.current, updatedAtMs: meta.localUpdatedAtMs || Date.now() },
              cloud,
            });
            setStatus("conflict");
          }
          break;
        case "idle":
          setStatus("synced");
          break;
      }
    } catch {
      setStatus("offline");
    } finally {
      busyRef.current = false;
    }
  }, [configured, uid, applyRemote, doPush]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!uid || busyRef.current || conflictRef.current) return;
    if (!isDirty(readSyncMeta())) return;
    busyRef.current = true;
    try {
      await doPush(uid);
    } catch {
      setStatus("offline");
    } finally {
      busyRef.current = false;
    }
  }, [uid, doPush]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // ローカルの変更を記録し、少し待ってからまとめて送る。
  //
  // 依存は state と ready だけに絞る。uid や flush を依存に入れると、
  // ログインしただけで「ローカルが変更された」と誤判定し、
  // 何も編集していないのに競合ダイアログが出てしまう。
  useEffect(() => {
    if (!ready) return;
    // localStorage から読み込んだ直後の1回。これは変更ではない。
    if (!baselineRef.current) {
      baselineRef.current = true;
      return;
    }
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    patchSyncMeta({ localUpdatedAtMs: Date.now() });
    if (!uidRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, PUSH_DEBOUNCE_MS);
  }, [state, ready]);

  // ログイン時とアカウント切替時に取り込む。
  //
  // コミット中に走らせず、次のタスクへ回す。認証状態が続けて変わったときは
  // 途中の状態での pull をキャンセルでき、最後の1回だけが実行される。
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      void runPull();
    }, 0);
    return () => clearTimeout(t);
  }, [ready, runPull]);

  // 端末を持ち替えたときに追いつく。復帰で pull、離脱で未送信をフラッシュ。
  useEffect(() => {
    if (!ready || !uid) return;
    const catchUp = () => {
      if (Date.now() - lastPullAtRef.current > PULL_THROTTLE_MS) void runPull();
    };
    const onVisible = () => {
      if (document.visibilityState === "hidden") void flush();
      else catchUp();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", catchUp);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", catchUp);
    };
  }, [ready, uid, runPull, flush]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resolveConflict = useCallback(
    async (choice: ConflictChoice) => {
      const c = conflictRef.current;
      if (!c || !uid) return;
      conflictRef.current = null;
      setConflict(null);
      busyRef.current = true;
      try {
        if (choice === "cloud") {
          applyRemote(c.cloud.state, uid, c.cloud.updatedAtMs);
        } else if (choice === "local") {
          await doPush(uid, c.local.state);
        } else {
          const merged = mergeStates(c.local, c.cloud);
          applyRemote(merged, uid, c.cloud.updatedAtMs);
          await doPush(uid, merged);
        }
      } catch {
        setStatus("offline");
      } finally {
        busyRef.current = false;
      }
    },
    [uid, applyRemote, doPush],
  );

  const dismissNotice = useCallback(() => setNotice(""), []);

  // 未ログイン・未設定は常に "off"。ログイン直後でまだ結果が出ていない間は "syncing"。
  // 効果の中で setState せずに済むよう、この2つはレンダー時に導出する。
  const effectiveStatus: SyncStatus =
    !configured || !uid ? "off" : status === "off" ? "syncing" : status;

  return { status: effectiveStatus, lastSyncedMs, conflict, notice, dismissNotice, resolveConflict };
}
