"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/storage";
import type { AppState } from "@/lib/types";

const SNOOZE_KEY = "certstudy:sync-prompt:v1";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

/** これだけ貯まると、失ったときの痛みが登録の手間を上回る。 */
const MIN_LOGS = 7;
const MIN_MINUTES = 600;

export function BackupPrompt({ state, onLogin }: { state: AppState; onLogin: () => void }) {
  const { user, configured } = useAuth();
  // 保存済みの値を読むまでは出さない。静的プリレンダーとの不一致も避けられる。
  const [snoozed, setSnoozed] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await storage.get(SNOOZE_KEY);
      const at = Number(r?.value);
      const until = Number.isFinite(at) && at > 0 ? at + SNOOZE_MS : 0;
      if (alive) setSnoozed(Date.now() < until);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!configured || user || snoozed) return null;

  const minutes = state.logs.reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  if (state.logs.length < MIN_LOGS && minutes < MIN_MINUTES) return null;

  const days = new Set(state.logs.map((l) => l.date)).size;
  const hours = Math.round((minutes / 60) * 10) / 10;

  const later = () => {
    setSnoozed(true);
    void storage.set(SNOOZE_KEY, String(Date.now()));
  };

  return (
    <section className="rm-sec">
      <div className="rm-backup">
        <h3>この記録は、この端末にしか残っていません</h3>
        <p>
          {days}日分・合計{hours}時間の学習記録が貯まりました。ブラウザのデータを消したり、機種を変更すると、すべて失われます。
        </p>
        <p>
          無料のアカウントを作ると、記録がクラウドに保存され、スマホとPCの両方から同じ計画・教材・記録を使えます。通勤中にスマホで記録して、家のPCで計画を直す、という使い方ができます。
        </p>
        <div className="rm-backup-actions">
          <button type="button" className="rm-btn pri" onClick={onLogin}>無料でアカウントを作る</button>
          <button type="button" className="rm-btn quiet sm" onClick={later}>あとで</button>
        </div>
      </div>
    </section>
  );
}
