import { useState, type Dispatch, type SetStateAction } from "react";
import { CERTS } from "@/lib/data";
import { TEMPLATES, buildFromTemplate } from "@/lib/templates";
import { buildCalendarEvents } from "@/lib/calendar";
import type { AppState, Phase, Roadmap, WeeklySlot } from "@/lib/types";
import { addDays, daysBetween, estimate, num, todayISO, toISO, uid } from "@/lib/utils";
import { Hero } from "./Hero";
import { ExpPanel } from "./ExpPanel";
import { NumInput } from "./NumInput";

export function PlanTab({ state, setState, rm, goMap }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; rm: Roadmap; goMap: () => void }) {
  const { target, plans, logs } = state;
  const cert = CERTS[target.certId];
  const phases = plans[target.certId] || null;
  const [prevTargetCertId, setPrevTargetCertId] = useState(target.certId);
  const [showTpl, setShowTpl] = useState(false);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([{ id: uid(), dow: 5, time: "09:00", minutes: 120 }]);
  if (target.certId !== prevTargetCertId) {
    setPrevTargetCertId(target.certId);
    setShowTpl(false);
  }

  const setT = (p: Partial<AppState["target"]>) => setState((s) => ({ ...s, target: { ...s.target, ...p } }));
  const setPhases = (fn: (phases: Phase[]) => Phase[]) =>
    setState((s) => ({ ...s, plans: { ...s.plans, [s.target.certId]: fn(s.plans[s.target.certId] || []) } }));

  if (!cert) {
    return (
      <section className="rm-sec"><h2>計画</h2>
        <div className="rm-card" style={{ textAlign: "center" }}>
          <p className="rm-note" style={{ margin: 0 }}>目標の資格がまだ決まっていません。</p>
          <button className="rm-btn pri" style={{ marginTop: 14 }} onClick={goMap}>ロードマップから選ぶ</button>
        </div>
      </section>
    );
  }

  const est = estimate(target.certId, state);
  if (!est) return null;
  const planHours = phases ? phases.reduce((a, p) => a + num(p.hours), 0) : est.hours;
  const doneH = logs.filter((l) => l.certId === target.certId).reduce((a, b) => a + b.minutes, 0) / 60;
  const daysLeft = target.examDate ? daysBetween(todayISO(), target.examDate) : null;
  const weeksLeft = daysLeft && daysLeft > 0 ? daysLeft / 7 : null;
  const needWeekly = weeksLeft ? Math.max(0, (planHours - doneH) / weeksLeft) : null;
  const onPace = needWeekly !== null && needWeekly <= num(target.weeklyHours);
  const allItems = phases ? phases.flatMap((p) => p.items) : [];
  const doneItems = allItems.filter((i) => i.done).length;
  const apply = (cert.links || []).find((l) => l.apply);
  const curTpl = phases && phases[0] && phases[0].tpl ? TEMPLATES.find((t) => t.id === phases[0].tpl) : null;
  const calEvents = buildCalendarEvents(cert, target, phases, weeklySlots);
  const openAllCalendarEvents = () => calEvents.forEach((ev) => window.open(ev.url, "_blank", "noopener,noreferrer"));

  const applyTemplate = (tplId: string) => {
    const t = TEMPLATES.find((x) => x.id === tplId);
    if (!t) return;
    if (phases && !window.confirm(`「${t.name}」で作り直します。いまの計画（チェック状態を含む）は置き換わります。`)) return;
    setState((s) => ({ ...s, plans: { ...s.plans, [target.certId]: buildFromTemplate(tplId, cert, target.examDate || toISO(addDays(new Date(), 60)), estimate(target.certId, s)!.hours) } }));
    setShowTpl(false);
  };
  const redistribute = () => setPhases((ps) => {
    const sum = ps.reduce((a, p) => a + num(p.hours), 0) || 1;
    return ps.map((p) => ({ ...p, hours: Math.round(est.hours * (num(p.hours) / sum)) }));
  });
  return (
    <>
      <section className="rm-sec"><Hero state={state} rm={rm} /></section>

      <section className="rm-sec">
        <h2>前提</h2>
        <div className="rm-card">
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{cert.name}</div>
          <div className="rm-links" style={{ marginTop: 6 }}>
            {cert.links.map((l) => <a key={l.url + l.label} className="rm-link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
          </div>
          {cert.notice && <p className="rm-alert">{cert.notice}</p>}
          <div className="rm-2" style={{ marginTop: 18 }}>
            <label className="rm-f"><span>試験日</span>
              <input className="rm-in" type="date" value={target.examDate} onChange={(e) => setT({ examDate: e.target.value })} /></label>
            <label className="rm-f"><span>週に確保できる時間（h）</span>
              <NumInput className="rm-in rm-mono" value={target.weeklyHours} min={0.5} max={100}
                onCommit={(v) => setT({ weeklyHours: v })} placeholder="例：12.5" /></label>
          </div>
          <div className="rm-chips">
            {[5, 8, 10, 12, 15, 20].map((h) => <button key={h} className="rm-chipbtn" onClick={() => setT({ weeklyHours: h })}>{h}h/週</button>)}
          </div>
          <ExpPanel certId={target.certId} state={state} setState={setState} />
          <button className="rm-btn quiet sm" style={{ marginTop: 14 }} onClick={goMap}>別の資格に切り替える</button>
        </div>
      </section>

      {phases && (
        <section className="rm-sec">
          <h2>ペース</h2>
          <div className="rm-card">
            <dl className="rm-stats">
              <div><dt>残り日数</dt><dd>{daysLeft !== null ? Math.max(0, daysLeft) : "—"}<small>日</small></dd></div>
              <div><dt>計画の合計</dt><dd>{planHours}<small>h</small></dd></div>
              <div><dt>推定学習時間</dt><dd>{est.hours}<small>h</small></dd></div>
              <div><dt>累計</dt><dd>{doneH.toFixed(1)}<small>h</small></dd></div>
              <div><dt>必要な週ペース</dt><dd className={needWeekly === null ? "" : onPace ? "rm-good" : "rm-bad"}>
                {needWeekly === null ? "—" : needWeekly.toFixed(1)}<small>h/週</small></dd></div>
              <div><dt>チェック消化</dt><dd>{doneItems}<small>/{allItems.length}</small></dd></div>
            </dl>
            <p className="rm-note">
              {needWeekly === null ? "試験日を入れると、残り日数から必要な週ペースを計算します。"
                : onPace ? `週 ${target.weeklyHours}h の確保でペースは足ります。`
                  : `週 ${target.weeklyHours}h では ${(needWeekly - num(target.weeklyHours)).toFixed(1)}h/週 足りません。確保時間を増やすか、計画を削るか、試験日をずらすかの判断が要ります。`}
              {planHours !== est.hours && (<> 　計画の合計が推定（{est.hours}h）とずれています。
                <button className="rm-btn sm" style={{ marginLeft: 6 }} onClick={redistribute}>推定に合わせて再配分</button></>)}
            </p>
          </div>
        </section>
      )}

      <section className="rm-sec">
        <h2>
          {phases ? "計画（すべて編集できます）" : "テンプレートを選ぶ"}
          {phases && <span className="r"><button className="rm-btn sm" onClick={() => setShowTpl((v) => !v)}>
            {showTpl ? "閉じる" : "テンプレートを選び直す"}</button></span>}
        </h2>

        {(!phases || showTpl) && (
          <div className={phases ? "rm-tplbox" : ""}>
            {phases && <p className="rm-note" style={{ margin: "0 0 10px" }}>
              いまのテンプレート：<b>{curTpl ? curTpl.name : "カスタム"}</b>。選び直すと現在の計画は置き換わります。</p>}
            <div className="rm-tpls">
              {TEMPLATES.map((t) => (
                <button key={t.id} className="rm-tpl" onClick={() => applyTemplate(t.id)}>
                  <b>{t.name}{curTpl && curTpl.id === t.id && "（使用中）"}</b>
                  <span>{t.desc}</span><em>{t.mix}　合計 {est.hours}h</em>
                </button>
              ))}
            </div>
            {!phases && <p className="rm-note">テンプレートは下書きです。作ったあとに中身をすべて書き換えられますし、あとから別のテンプレートに切り替えられます。</p>}
          </div>
        )}

        {phases && phases.map((p, pi) => (
          <div className="rm-ph" key={p.id}>
            <div className="rm-ph-h">
              <span className="rm-ph-n">{pi + 1}</span>
              <input className="rm-ph-nm" value={p.name} aria-label="フェーズ名"
                onChange={(e) => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))} />
              <span className="rm-ph-m">
                <input className="rm-date" type="date" value={p.from} aria-label="開始日"
                  onChange={(e) => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, from: e.target.value } : x))} />
                –
                <input className="rm-date" type="date" value={p.to} aria-label="終了日"
                  onChange={(e) => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, to: e.target.value } : x))} />
                <NumInput className="rm-hrs" value={p.hours} min={0} max={2000} aria-label="このフェーズの時間"
                  onCommit={(v) => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, hours: v } : x))} />h
              </span>
              <span className="rm-tools">
                <button className="rm-ico" aria-label="上へ移動" disabled={pi === 0}
                  onClick={() => setPhases((ps) => { const a = [...ps]; [a[pi - 1], a[pi]] = [a[pi], a[pi - 1]]; return a; })}>↑</button>
                <button className="rm-ico" aria-label="下へ移動" disabled={pi === phases.length - 1}
                  onClick={() => setPhases((ps) => { const a = [...ps]; [a[pi + 1], a[pi]] = [a[pi], a[pi + 1]]; return a; })}>↓</button>
                <button className="rm-ico warn" aria-label="このフェーズを削除"
                  onClick={() => setPhases((ps) => ps.filter((x) => x.id !== p.id))}>×</button>
              </span>
            </div>
            <textarea className="rm-purpose" value={p.purpose} placeholder="このフェーズでやりたいこと（自由記入）"
              onChange={(e) => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, purpose: e.target.value } : x))} />
            {p.items.map((it) => (
              <div className={`rm-task ${it.done ? "on" : ""}`} key={it.id}>
                <input type="checkbox" checked={it.done} aria-label="完了"
                  onChange={() => setPhases((ps) => ps.map((x) => x.id === p.id
                    ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, done: !y.done } : y) } : x))} />
                <input className="rm-task-tx" value={it.text} placeholder="やることを書く"
                  onChange={(e) => setPhases((ps) => ps.map((x) => x.id === p.id
                    ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, text: e.target.value } : y) } : x))} />
                <button className="rm-ico warn" aria-label="この項目を削除"
                  onClick={() => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, items: x.items.filter((y) => y.id !== it.id) } : x))}>×</button>
              </div>
            ))}
            <button className="rm-addtask"
              onClick={() => setPhases((ps) => ps.map((x) => x.id === p.id ? { ...x, items: [...x.items, { id: uid(), text: "", done: false }] } : x))}>
              ＋ 項目を追加
            </button>
          </div>
        ))}

        {phases && (
          <div className="rm-row" style={{ marginTop: 12 }}>
            <button className="rm-btn"
              onClick={() => setPhases((ps) => [...ps, { id: uid(), name: `フェーズ ${ps.length + 1}`, purpose: "", from: todayISO(), to: target.examDate || todayISO(), hours: 0, items: [{ id: uid(), text: "", done: false }] }])}>
              ＋ フェーズを追加
            </button>
            {apply && <a className="rm-btn" href={apply.url} target="_blank" rel="noopener noreferrer">試験を申し込む ↗</a>}
            <button className="rm-btn quiet" style={{ marginLeft: "auto" }}
              onClick={() => { if (window.confirm("この資格の計画を削除して、テンプレート選択に戻します。")) setState((s) => { const n = { ...s.plans }; delete n[target.certId]; return { ...s, plans: n }; }); }}>
              計画を破棄して最初から
            </button>
          </div>
        )}
      </section>

      <section className="rm-sec">
        <h2>カレンダーに入れる</h2>
        <div className="rm-card">
          <p className="rm-note" style={{ marginTop: 0 }}>
            試験日・フェーズの期間・毎週の学習枠を Google カレンダーに登録できます。iPhone の標準カレンダーで見たい場合は、標準カレンダーアプリの「アカウント」設定から Google アカウントを追加すると、同じ予定がそのまま表示されます。
          </p>

          <div style={{ marginTop: 16, borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
            <div className="rm-row" style={{ marginBottom: 10, justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>毎週の学習枠</span>
              <button className="rm-btn sm"
                onClick={() => setWeeklySlots((ws) => [...ws, { id: uid(), dow: 5, time: "09:00", minutes: 120 }])}>
                ＋ 枠を追加
              </button>
            </div>
            {weeklySlots.length === 0 && (
              <p className="rm-note" style={{ marginTop: 0 }}>学習枠はまだありません。「＋ 枠を追加」から自由に追加できます（複数追加できます）。</p>
            )}
            {weeklySlots.map((slot) => (
              <div className="rm-2" key={slot.id} style={{ alignItems: "end" }}>
                <label className="rm-f"><span>曜日</span>
                  <select className="rm-in" value={slot.dow}
                    onChange={(e) => setWeeklySlots((ws) => ws.map((w) => w.id === slot.id ? { ...w, dow: Number(e.target.value) } : w))}>
                    {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => <option key={d} value={i}>{d}曜日</option>)}
                  </select></label>
                <label className="rm-f"><span>開始時刻</span>
                  <input className="rm-in rm-mono" type="time" value={slot.time}
                    onChange={(e) => setWeeklySlots((ws) => ws.map((w) => w.id === slot.id ? { ...w, time: e.target.value } : w))} /></label>
                <label className="rm-f" style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--sub)", marginBottom: 5 }}>1回の長さ（分）</span>
                    <NumInput className="rm-in rm-mono" value={slot.minutes} min={15} max={600}
                      onCommit={(v) => setWeeklySlots((ws) => ws.map((w) => w.id === slot.id ? { ...w, minutes: v } : w))} />
                  </span>
                  <button className="rm-ico warn" style={{ marginBottom: 13 }} aria-label="この学習枠を削除"
                    onClick={() => setWeeklySlots((ws) => ws.filter((w) => w.id !== slot.id))}>×</button>
                </label>
              </div>
            ))}
            {weeklySlots.length > 0 && !target.examDate && (
              <p className="rm-note rm-bad">毎週の予定は試験日までの繰り返しとして作るため、試験日の入力が必要です。</p>
            )}
          </div>

          <div style={{ marginTop: 16, borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
            <div className="rm-row" style={{ marginBottom: 10, justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>登録する予定（{calEvents.length}件）</span>
              <button className="rm-btn pri sm" onClick={openAllCalendarEvents} disabled={calEvents.length === 0}>
                まとめて Google カレンダーに登録 ↗
              </button>
            </div>
            {calEvents.length === 0 ? (
              <p className="rm-note" style={{ marginTop: 0 }}>試験日・フェーズ・学習枠のいずれかを設定すると、ここに登録候補の一覧が出ます。</p>
            ) : (
              <ul className="rm-cal-list">
                {calEvents.map((ev) => (
                  <li key={ev.key}>
                    <span>{ev.label}</span>
                    <a className="rm-btn sm" href={ev.url} target="_blank" rel="noopener noreferrer">追加 ↗</a>
                  </li>
                ))}
              </ul>
            )}
            <p className="rm-note">「まとめて登録」は予定の数だけタブを開きます。ブラウザにブロックされた場合は、一覧から1件ずつ「追加」を押してください。開いた Google カレンダーの画面で内容を確認して保存してください。</p>
          </div>
        </div>
      </section>
    </>
  );
}
