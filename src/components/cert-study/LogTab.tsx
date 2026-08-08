import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { CERTS, kindOf } from "@/lib/data";
import type { AppState, Roadmap } from "@/lib/types";
import { addDays, fmtMD, mondayOf, num, parseISO, todayISO, uid } from "@/lib/utils";
import { Hero } from "./Hero";
import { NumInput } from "./NumInput";
import { WeekChart, ScoreChart } from "./charts";

export function LogTab({ state, setState, rm, goMat }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; rm: Roadmap; goMat: () => void }) {
  const { logs, scores, materials, target } = state;
  const [prevTargetCertId, setPrevTargetCertId] = useState(target.certId);
  const [form, setForm] = useState({ date: todayISO(), amount: 60, unit: "min", certId: target.certId || "AWS_SAA", materialId: "", progress: 0, topic: "", note: "" });
  const [sf, setSf] = useState({ date: todayISO(), certId: target.certId || "AWS_SAA", name: "模試①", score: 70 });
  const [showScore, setShowScore] = useState(false);
  if (target.certId && target.certId !== prevTargetCertId) {
    setPrevTargetCertId(target.certId);
    setForm((f) => ({ ...f, certId: target.certId, materialId: "" }));
    setSf((f) => ({ ...f, certId: target.certId }));
  }

  const cert = CERTS[form.certId];
  const mats = materials.filter((m) => m.certId === form.certId);
  const mat = mats.find((m) => m.id === form.materialId);
  const unit = mat ? kindOf(mat.kind).unit : "";

  const add = () => {
    const m = Math.round(form.unit === "h" ? num(form.amount) * 60 : num(form.amount));
    if (!form.date || m <= 0) return;
    setState((s) => ({ ...s, logs: [{ id: uid(), date: form.date, minutes: m, certId: form.certId,
      materialId: form.materialId, amount: num(form.progress), topic: form.topic, note: form.note }, ...s.logs] }));
    setForm((f) => ({ ...f, note: "", progress: 0 }));
  };

  const weeks = useMemo(() => {
    const base = mondayOf(new Date());
    return Array.from({ length: 8 }, (_, i) => {
      const from = addDays(base, (i - 7) * 7), to = addDays(from, 7);
      const h = logs.filter((l) => { const d = parseISO(l.date); return d >= from && d < to; }).reduce((a, b) => a + b.minutes, 0) / 60;
      return { label: `${from.getMonth() + 1}/${from.getDate()}`, h };
    });
  }, [logs]);

  const viewCert = target.certId || sf.certId;
  const relevant = scores.filter((s) => s.certId === viewCert).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <section className="rm-sec"><Hero state={state} rm={rm} /></section>

      <section className="rm-sec">
        <h2>記録する</h2>
        <div className="rm-card">
          <div className="rm-2">
            <label className="rm-f"><span>日付</span>
              <input className="rm-in" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label className="rm-f"><span>学習時間</span>
              <div className="rm-inline">
                <NumInput className="rm-in rm-mono" value={form.amount} min={0} max={1440}
                  onCommit={(v) => setForm((f) => ({ ...f, amount: v }))} placeholder="例：90 / 1.5" />
                <select className="rm-in" style={{ flex: "0 0 76px" }} value={form.unit} aria-label="単位"
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option value="min">分</option><option value="h">時間</option>
                </select>
              </div></label>
          </div>
          <div className="rm-chips">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <button key={m} className="rm-chipbtn" onClick={() => setForm((f) => ({ ...f, amount: m, unit: "min" }))}>{m}分</button>
            ))}
          </div>
          <div className="rm-2">
            <label className="rm-f"><span>対象資格</span>
              <select className="rm-in" value={form.certId} onChange={(e) => setForm({ ...form, certId: e.target.value, topic: "", materialId: "" })}>
                {Object.entries(CERTS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select></label>
            <label className="rm-f"><span>教材</span>
              <select className="rm-in" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                <option value="">（指定しない）</option>
                {mats.map((m) => <option key={m.id} value={m.id}>{kindOf(m.kind).name}｜{m.name}</option>)}
              </select></label>
          </div>
          {mats.length === 0 && (
            <p className="rm-note" style={{ marginTop: -4, marginBottom: 12 }}>
              この資格の教材がまだ登録されていません。<button className="rm-btn quiet sm" onClick={goMat}>教材を追加する</button>
            </p>
          )}
          <div className="rm-2">
            {mat && (
              <label className="rm-f"><span>進んだ量（{unit}）</span>
                <NumInput className="rm-in rm-mono" value={form.progress} min={0} max={100000}
                  onCommit={(v) => setForm((f) => ({ ...f, progress: v }))} placeholder={`例：${kindOf(mat.kind).id === "book" ? "24" : "1"}`} /></label>
            )}
            <label className="rm-f"><span>分野</span>
              <select className="rm-in" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                <option value="">（未指定）</option>
                {cert && cert.topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></label>
          </div>
          <label className="rm-f"><span>メモ</span>
            <input className="rm-in" type="text" placeholder="つまずいた点、次に確認すること" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          <button className="rm-btn pri" onClick={add}>追加する</button>
        </div>
      </section>

      <section className="rm-sec">
        <h2>週ごとの学習時間</h2>
        <div className="rm-card"><WeekChart weeks={weeks} goal={num(target.weeklyHours)} color={rm.color} /></div>
      </section>

      <section className="rm-sec">
        <h2>記録一覧</h2>
        {logs.length === 0 ? (
          <div className="rm-card"><p className="rm-empty">まだ記録がありません。</p></div>
        ) : (
          <div className="rm-card" style={{ padding: "6px 10px" }}>
            <table className="rm-tbl">
              <thead><tr><th>日付</th><th>時間</th><th>教材 / 分野</th><th>メモ</th><th /></tr></thead>
              <tbody>
                {logs.slice(0, 60).map((l) => {
                  const m = materials.find((x) => x.id === l.materialId);
                  const k = m ? kindOf(m.kind) : null;
                  return (
                    <tr key={l.id}>
                      <td className="n">{fmtMD(l.date)}</td>
                      <td className="n">{(l.minutes / 60).toFixed(1)}h</td>
                      <td>
                        {k && <span className="rm-tag" style={{ "--k": k.color } as React.CSSProperties}>{k.name}</span>}
                        {m ? m.name : (CERTS[l.certId] ? CERTS[l.certId].name : l.certId)}
                        {m && num(l.amount) > 0 && <span className="rm-mono" style={{ fontSize: 11, color: "var(--sub)" }}>　+{l.amount}{kindOf(m.kind).unit}</span>}
                        {l.topic && <div style={{ fontSize: 11, color: "var(--sub)" }}>{l.topic}</div>}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--sub)" }}>{l.note}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="rm-x" aria-label="削除"
                          onClick={() => setState((s) => ({ ...s, logs: s.logs.filter((x) => x.id !== l.id) }))}>×</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rm-sec">
        <h2>模試スコア<span className="r">
          <button className="rm-btn sm" onClick={() => setShowScore((v) => !v)}>{showScore ? "閉じる" : "スコアを追加"}</button></span></h2>
        <div className="rm-card">
          <div className="rm-lbl" style={{ marginBottom: 8 }}>{CERTS[viewCert] ? CERTS[viewCert].name : ""}</div>
          {relevant.length === 0
            ? <p className="rm-empty" style={{ padding: "8px 0" }}>この資格の模試スコアはまだありません。</p>
            : <ScoreChart data={relevant} pass={num(target.passLine)} color={rm.color}
                onRemove={(id) => setState((s) => ({ ...s, scores: s.scores.filter((x) => x.id !== id) }))} />}
          {showScore && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--hair)", paddingTop: 16 }}>
              <div className="rm-2">
                <label className="rm-f"><span>受験日</span>
                  <input className="rm-in" type="date" value={sf.date} onChange={(e) => setSf({ ...sf, date: e.target.value })} /></label>
                <label className="rm-f"><span>スコア（%）</span>
                  <NumInput className="rm-in rm-mono" value={sf.score} min={0} max={100} onCommit={(v) => setSf((x) => ({ ...x, score: v }))} /></label>
              </div>
              <div className="rm-2">
                <label className="rm-f"><span>模試名</span>
                  <input className="rm-in" type="text" value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} /></label>
                <label className="rm-f"><span>目標ライン（%）</span>
                  <NumInput className="rm-in rm-mono" value={target.passLine} min={0} max={100}
                    onCommit={(v) => setState((s) => ({ ...s, target: { ...s.target, passLine: v } }))} /></label>
              </div>
              <button className="rm-btn pri" onClick={() => sf.date && setState((s) => ({ ...s, scores: [...s.scores, { ...sf, id: uid(), score: num(sf.score) }] }))}>
                追加する
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
