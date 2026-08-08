import type { AppState, CloudSnapshot } from "./types";

function mergeById<T extends { id: string }>(older: T[], newer: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of older) map.set(x.id, x);
  // 同じ id は新しい側で上書きする。Map は既存キーの位置を保つため、
  // 元の並び順は崩れず、新しい側にしかない要素だけが末尾に足される。
  for (const x of newer) map.set(x.id, x);
  return [...map.values()];
}

/**
 * ローカルとクラウドの状態を統合する。
 *
 * 配列(logs / scores / materials)は id で和集合を取り、同じ id は新しい側を採用する。
 * id は utils.ts の uid() で約 7.8e10 通りあり、1ユーザーのデータ内で衝突する確率は無視できる。
 *
 * plans は certId 単位で新しい側を丸ごと採用する。フェーズ配列は編集の単位であり、
 * 要素単位でマージすると期間もフェーズ構成も噛み合わない計画ができてしまう。
 */
export function mergeStates(local: CloudSnapshot, cloud: CloudSnapshot): AppState {
  const [older, newer] =
    local.updatedAtMs >= cloud.updatedAtMs ? [cloud, local] : [local, cloud];
  const o = older.state;
  const n = newer.state;

  return {
    goal: n.goal,
    target: n.target,
    status: { ...o.status, ...n.status },
    exp: { ...o.exp, ...n.exp },
    plans: { ...o.plans, ...n.plans },
    materials: mergeById(o.materials, n.materials),
    // ホーム/記録タブは logs が新しい順に並んでいる前提で slice している。
    logs: mergeById(o.logs, n.logs).sort((a, b) => b.date.localeCompare(a.date)),
    scores: mergeById(o.scores, n.scores).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export type StateSummary = {
  logs: number;
  hours: number;
  materials: number;
  updatedAtMs: number;
};

/** 競合ダイアログで両者を並べて見せるための要約。 */
export function summarizeState(state: AppState, updatedAtMs: number): StateSummary {
  const minutes = state.logs.reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  return {
    logs: state.logs.length,
    hours: Math.round((minutes / 60) * 10) / 10,
    materials: state.materials.length,
    updatedAtMs,
  };
}
