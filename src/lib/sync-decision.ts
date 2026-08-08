import { isDirty } from "./sync-meta";
import type { AppState, CloudSnapshot, SyncMeta } from "./types";
import { isPristineState } from "./utils";

/**
 * pull 時にとる行動。
 * ここを間違えると数ヶ月分の学習記録が黙って消えるため、
 * 判断だけを純関数に切り出してテストできるようにしている。
 */
export type PullDecision =
  /** ローカルは別アカウントの記録。統合は提案せず、切り離す。 */
  | { kind: "switch-account" }
  /** クラウドに無い、またはローカルに未送信の変更がある。 */
  | { kind: "push" }
  /** クラウドの内容をそのまま受け取る。 */
  | { kind: "adopt-cloud" }
  /** 両方が更新されている。ユーザーに選ばせる。 */
  | { kind: "conflict" }
  /** 何もしなくてよい。 */
  | { kind: "idle" };

export function decidePull({
  uid,
  meta,
  cloud,
  local,
}: {
  uid: string;
  meta: SyncMeta;
  cloud: CloudSnapshot | null;
  local: AppState;
}): PullDecision {
  // 別アカウント。ローカルは他人の記録なので、統合は絶対に提案しない。
  // これが無いと、A がログアウトして同じブラウザで B がログインしたとき、
  // A の学習記録を B のデータに統合しますかと聞いてしまう。
  if (meta.uid && meta.uid !== uid) return { kind: "switch-account" };

  // 初回ログイン。ゲストとして貯めた記録をそのまま引き上げる。
  if (!cloud) return { kind: "push" };

  // 新しい端末。ローカルは手つかずなので黙って受け取る。
  if (isPristineState(local)) return { kind: "adopt-cloud" };

  // 一度も push していないローカルの記録は未同期として扱う。
  // (同期機能より前から使っている端末は lastPushedMs が 0 のまま)
  const localUnsynced = isDirty(meta) || meta.lastPushedMs === 0;

  // クラウドに新しいものはない。
  if (cloud.updatedAtMs <= meta.lastPulledUpdatedAtMs) {
    return localUnsynced ? { kind: "push" } : { kind: "idle" };
  }

  // クラウドが進んでいる。ローカルにも未送信があれば食い違い。
  if (localUnsynced) return { kind: "conflict" };

  return { kind: "adopt-cloud" };
}
