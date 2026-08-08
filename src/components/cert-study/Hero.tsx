import { CERTS } from "@/lib/data";
import type { AppState, Roadmap } from "@/lib/types";
import { estimate, mondayOf, num, parseISO, streakOf, todayISO, daysBetween } from "@/lib/utils";
import { Ring } from "./Ring";

export function Hero({ state, rm }: { state: AppState; rm: Roadmap }) {
  const { target, logs } = state;
  const cert = CERTS[target.certId];
  const est = cert ? estimate(target.certId, state) : null;
  const doneH = cert ? logs.filter((l) => l.certId === target.certId).reduce((a, b) => a + b.minutes, 0) / 60 : 0;
  const daysLeft = target.examDate ? daysBetween(todayISO(), target.examDate) : null;
  const pct = est ? doneH / est.hours : 0;
  const streak = streakOf(logs);
  const week = logs.filter((l) => parseISO(l.date) >= mondayOf(new Date())).reduce((a, b) => a + b.minutes, 0) / 60;

  if (!cert || !est) {
    return (
      <div className="rm-hero">
        <div className="rm-hero-l">
          <div className="rm-hero-tag">目標が未設定</div>
          <div className="rm-hero-nm">まずは次に取る資格を決めましょう</div>
          <div className="rm-hero-sub">ロードマップから選ぶと、ここに残り日数と進捗が出ます。</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rm-hero">
      <div className="rm-hero-l">
        <div className="rm-hero-tag">次の目標</div>
        <div className="rm-hero-nm">{cert.name}</div>
        <div className="rm-hero-sub">
          {daysLeft === null ? "試験日は未設定" : daysLeft >= 0 ? `試験日まで ${daysLeft} 日` : "試験日を過ぎています"}
          ・推定 {est.hours}h のうち {doneH.toFixed(1)}h 完了
        </div>
        <dl className="rm-kpis" style={{ marginTop: 10 }}>
          <div className="rm-kpi rm-streak"><dt>連続学習</dt><dd>{streak}<small>日</small></dd></div>
          <div className="rm-kpi"><dt>今週</dt><dd className={week >= num(state.target.weeklyHours) ? "rm-good" : ""}>{week.toFixed(1)}<small>/{state.target.weeklyHours}h</small></dd></div>
          <div className="rm-kpi"><dt>取得済み</dt><dd>{Object.values(state.status).filter((v) => v === "done").length}<small>件</small></dd></div>
        </dl>
      </div>
      <div className="rm-hero-r">
        <Ring pct={pct} color={rm.color} label={`${Math.round(pct * 100)}%`} sub="学習時間" />
      </div>
    </div>
  );
}
