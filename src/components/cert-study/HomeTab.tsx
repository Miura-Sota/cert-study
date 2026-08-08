import { useMemo, type Dispatch, type SetStateAction } from "react";
import { CERTS, ROADMAPS, kindOf } from "@/lib/data";
import type { AppState, AppTab, Roadmap } from "@/lib/types";
import { addDays, fmtMD, mondayOf, num, parseISO } from "@/lib/utils";
import { Hero } from "./Hero";
import { WeekChart } from "./charts";

export function HomeTab({ state, rm, go }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; rm: Roadmap; go: (tab: AppTab) => void }) {
  const { logs, target } = state;
  const weeks = useMemo(() => {
    const base = mondayOf(new Date());
    return Array.from({ length: 8 }, (_, i) => {
      const from = addDays(base, (i - 7) * 7), to = addDays(from, 7);
      const h = logs.filter((l) => { const d = parseISO(l.date); return d >= from && d < to; }).reduce((a, b) => a + b.minutes, 0) / 60;
      return { label: `${from.getMonth() + 1}/${from.getDate()}`, h };
    });
  }, [logs]);
  const recent = logs.slice(0, 5);

  return (
    <>
      <section className="rm-sec"><Hero state={state} rm={rm} onSetGoal={() => go("map")} /></section>

      <section className="rm-sec">
        <h2>週ごとの学習時間<span className="r"><button className="rm-btn sm" onClick={() => go("log")}>記録する</button></span></h2>
        <div className="rm-card"><WeekChart weeks={weeks} goal={num(target.weeklyHours)} color={rm.color} /></div>
      </section>

      <section className="rm-sec">
        <h2>最近の記録</h2>
        <div className="rm-card">
          {recent.length === 0
            ? <p className="rm-empty">まだ記録がありません。15分でも入れておくと、積み上げが見えます。</p>
            : recent.map((l) => {
              const m = state.materials.find((x) => x.id === l.materialId);
              const k = m ? kindOf(m.kind) : null;
              return (
                <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid #F3F0EB" }}>
                  <span className="rm-mono" style={{ fontSize: 12, color: "var(--sub)", flex: "0 0 40px" }}>{fmtMD(l.date)}</span>
                  <span className="rm-mono" style={{ fontSize: 13, fontWeight: 700, flex: "0 0 48px" }}>{(l.minutes / 60).toFixed(1)}h</span>
                  <span style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                    {k && <span className="rm-tag" style={{ "--k": k.color } as React.CSSProperties}>{k.name}</span>}
                    {m ? m.name : (CERTS[l.certId] ? CERTS[l.certId].name : "")}
                    {l.note && <span style={{ color: "var(--sub)", fontSize: 12 }}>　{l.note}</span>}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      <section className="rm-sec">
        <h2>方向別の進み具合</h2>
        <div className="rm-card">
          {ROADMAPS.map((r) => {
            const d = r.order.filter((c) => state.status[c] === "done").length;
            return (
              <div className="rm-bar" key={r.id} style={{ "--c": r.color } as React.CSSProperties}>
                <div className="rm-bar-n">{r.name}</div>
                <div className="rm-bar-t"><i style={{ width: `${(d / r.order.length) * 100}%` }} /></div>
                <div className="rm-bar-v">{d}/{r.order.length}</div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
