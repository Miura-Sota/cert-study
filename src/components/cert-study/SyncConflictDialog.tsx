"use client";

import { useState } from "react";
import { summarizeState, type StateSummary } from "@/lib/merge-state";
import type { ConflictChoice } from "@/lib/types";
import type { Conflict } from "@/lib/use-cloud-sync";

const fmtWhen = (ms: number): string => {
  if (!ms) return "不明";
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function Side({ title, s }: { title: string; s: StateSummary }) {
  return (
    <div className="rm-conflict-side">
      <div className="rm-conflict-side-t">{title}</div>
      <div className="rm-conflict-side-v"><b>{s.logs}</b> 件の記録 / <b>{s.hours}</b>h</div>
      <div className="rm-conflict-side-v">教材 {s.materials} 件</div>
      <div className="rm-conflict-side-s">最終更新 {fmtWhen(s.updatedAtMs)}</div>
    </div>
  );
}

export function SyncConflictDialog({
  conflict,
  onResolve,
}: {
  conflict: Conflict | null;
  onResolve: (choice: ConflictChoice) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  if (!conflict) return null;

  const local = summarizeState(conflict.local.state, conflict.local.updatedAtMs);
  const cloud = summarizeState(conflict.cloud.state, conflict.cloud.updatedAtMs);

  const choose = async (choice: ConflictChoice) => {
    setBusy(true);
    try {
      await onResolve(choice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rm-dialog-backdrop" role="presentation">
      <div className="rm-dialog" role="dialog" aria-modal="true" aria-label="記録の食い違い">
        <h3>記録が2つに分かれています</h3>
        <p>
          この端末の記録と、クラウドに保存されている記録の両方が更新されています。どちらを使うか選んでください。選ばなかった方は上書きされます。
        </p>

        <div className="rm-conflict">
          <Side title="この端末" s={local} />
          <Side title="クラウド" s={cloud} />
        </div>

        <p className="rm-note">
          迷ったら「両方を統合する」を選んでください。学習記録・スコア・教材は両方から集められ、同じ記録が二重になることはありません。計画と目標は新しい方が使われます。
        </p>

        <div className="rm-conflict-actions">
          <button type="button" className="rm-btn pri" disabled={busy} onClick={() => choose("merge")}>
            両方を統合する
          </button>
          <button type="button" className="rm-btn" disabled={busy} onClick={() => choose("cloud")}>
            クラウドの記録を使う
          </button>
          <button type="button" className="rm-btn" disabled={busy} onClick={() => choose("local")}>
            この端末の記録を使う
          </button>
        </div>
        {busy && <p className="rm-note">反映しています…</p>}
      </div>
    </div>
  );
}
