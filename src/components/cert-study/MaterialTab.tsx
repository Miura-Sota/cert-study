import { useState, type Dispatch, type SetStateAction } from "react";
import { CERTS, KINDS, kindOf } from "@/lib/data";
import type { AppState } from "@/lib/types";
import { num, uid } from "@/lib/utils";
import { NumInput } from "./NumInput";

export function MaterialTab({ state, setState }: { state: AppState; setState: Dispatch<SetStateAction<AppState>> }) {
  const { materials, logs, target } = state;
  const [prevTargetCertId, setPrevTargetCertId] = useState(target.certId);
  const [certId, setCertId] = useState(target.certId || "AWS_SAA");
  if (target.certId && target.certId !== prevTargetCertId) {
    setPrevTargetCertId(target.certId);
    setCertId(target.certId);
  }
  const [form, setForm] = useState({ kind: "video", name: "", total: 900 });

  const list = materials.filter((m) => m.certId === certId);
  const progressOf = (m: (typeof materials)[number]) => logs.filter((l) => l.materialId === m.id).reduce((a, b) => a + num(b.amount), 0);

  const add = (kindId: string, name: string, total: number) => {
    const k = kindOf(kindId);
    setState((s) => ({ ...s, materials: [...s.materials, { id: uid(), certId, kind: kindId, name: name || k.name, total: num(total) || k.defTotal }] }));
  };

  return (
    <>
      <section className="rm-sec">
        <h2>教材を選ぶ</h2>
        <div className="rm-card">
          <label className="rm-f"><span>対象資格</span>
            <select className="rm-in" value={certId} onChange={(e) => setCertId(e.target.value)}>
              {Object.entries(CERTS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select></label>
          <div className="rm-lbl">よく使う教材をワンタップで追加</div>
          <div className="rm-kinds">
            {KINDS.map((k) => (
              <button key={k.id} className="rm-kindb" style={{ "--k": k.color } as React.CSSProperties}
                onClick={() => add(k.id, k.name, k.defTotal)}>
                <i>{k.icon}</i>
                <span><b>{k.name}</b><small>{k.hint}</small></span>
              </button>
            ))}
          </div>
          <p className="rm-note">追加してから名前や総量（{KINDS.map((k) => k.unit).join("・")}）を実際の教材に合わせて書き換えてください。</p>

          <div style={{ marginTop: 16, borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
            <div className="rm-lbl">自分で入力して追加</div>
            <div className="rm-2">
              <label className="rm-f"><span>種類</span>
                <select className="rm-in" value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value, total: kindOf(e.target.value).defTotal })}>
                  {KINDS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select></label>
              <label className="rm-f"><span>総量（{kindOf(form.kind).unit}）</span>
                <NumInput className="rm-in rm-mono" value={form.total} min={1} max={100000}
                  onCommit={(v) => setForm((f) => ({ ...f, total: v }))} /></label>
            </div>
            <label className="rm-f"><span>教材名</span>
              <input className="rm-in" type="text" value={form.name} placeholder="例：Udemy の対策講座、〇〇試験教科書"
                onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <button className="rm-btn pri" onClick={() => { add(form.kind, form.name, form.total); setForm({ ...form, name: "" }); }}>
              追加する
            </button>
          </div>
        </div>
      </section>

      <section className="rm-sec">
        <h2>登録済みの教材（{CERTS[certId].name}）</h2>
        {list.length === 0 ? (
          <div className="rm-card"><p className="rm-empty">まだ教材がありません。上のボタンから追加してください。</p></div>
        ) : list.map((m) => {
          const k = kindOf(m.kind);
          const p = progressOf(m);
          const pct = m.total > 0 ? Math.min(1, p / m.total) : 0;
          return (
            <div className="rm-mat" key={m.id} style={{ "--k": k.color } as React.CSSProperties}>
              <div className="rm-mat-k"><span>{k.icon}</span>{k.name}</div>
              <div className="rm-mat-b">
                <input className="rm-in" style={{ padding: "5px 8px", fontWeight: 700, fontSize: 13.5 }}
                  value={m.name} aria-label="教材名"
                  onChange={(e) => setState((s) => ({ ...s, materials: s.materials.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
                <div className="rm-mat-meta" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  進捗 {p} /
                  <NumInput className="rm-hrs" value={m.total} min={1} max={100000} aria-label="総量"
                    onCommit={(v) => setState((s) => ({ ...s, materials: s.materials.map((x) => x.id === m.id ? { ...x, total: v } : x) }))} />
                  {k.unit}（{Math.round(pct * 100)}%）
                </div>
                <div className="rm-mat-bar"><i style={{ width: `${pct * 100}%` }} /></div>
              </div>
              <button className="rm-x" aria-label="この教材を削除"
                onClick={() => { if (window.confirm("この教材を削除します。紐づく記録の教材欄は空になります。")) setState((s) => ({ ...s, materials: s.materials.filter((x) => x.id !== m.id) })); }}>×</button>
            </div>
          );
        })}
      </section>
    </>
  );
}
