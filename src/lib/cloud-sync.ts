import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { AppState, CloudSnapshot } from "./types";
import { normalizeState } from "./utils";

/** クラウドに保存するドキュメントのスキーマ版。 */
export const CLOUD_SCHEMA = 1;

/**
 * users/{uid} に AppState を JSON 文字列として1件だけ持つ。
 * AppState はネストが深く(plans の中にさらに items 配列がある)、
 * 文字列にしておくと Firestore の型制約や undefined の扱いを気にせず済む。
 * ログ1件は約150バイトなので、1MB のドキュメント上限には十分収まる。
 */
function userDoc(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

/** クラウドの状態を読む。まだ一度も保存されていなければ null。 */
export async function pullCloudState(uid: string): Promise<CloudSnapshot | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  const raw = typeof data.state === "string" ? data.state : "";
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 壊れたドキュメントでローカルを潰さない。存在しない扱いにする。
    return null;
  }

  return {
    state: normalizeState(parsed),
    updatedAtMs: Number(data.updatedAtMs) || 0,
  };
}

/**
 * クラウドへ状態を書く。書き込んだ updatedAtMs を返す。
 *
 * updatedAt(serverTimestamp) は監査用。書き込み直後には読み出せないため、
 * 比較には常にクライアント時刻の updatedAtMs を使う。
 */
export async function pushCloudState(uid: string, state: AppState): Promise<number> {
  const updatedAtMs = Date.now();
  await setDoc(userDoc(uid), {
    state: JSON.stringify(state),
    schema: CLOUD_SCHEMA,
    updatedAt: serverTimestamp(),
    updatedAtMs,
  });
  return updatedAtMs;
}

/**
 * クラウドの状態を消す。
 * アカウント削除では、必ず deleteUser() より前に呼ぶこと。
 * auth ユーザーを消した後はこのドキュメントへの権限が無くなり、孤児が残る。
 */
export async function deleteCloudState(uid: string): Promise<void> {
  await deleteDoc(userDoc(uid));
}
