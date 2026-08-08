import { useState, type Dispatch, type SetStateAction } from "react";
import { CERTS, ROADMAPS } from "@/lib/data";
import type { AppState, Roadmap, Status } from "@/lib/types";
import { estimate, roadmapsWith } from "@/lib/utils";
import { ExpPanel } from "./ExpPanel";

export function MapTab({ state, setState, rm, goPlan }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; rm: Roadmap; goPlan: () => void }) {
  const [open, setOpen] = useState("");
  const { status } = state;
  const nextId = rm.order.find((id) => status[id] !== "done");

  return (
    <>
      <section className="rm-sec">
        <h2>目指す方向</h2>
        <div className="rm-goals">
          {ROADMAPS.map((r) => {
            const d = r.order.filter((c) => status[c] === "done").length;
            return (
              <button key={r.id} style={{ "--c": r.color } as React.CSSProperties} className={`rm-goalb ${r.id === rm.id ? "on" : ""}`}
                onClick={() => { setState((s) => ({ ...s, goal: r.id })); setOpen(""); }}>
                <i />{r.name}<em>{d}/{r.order.length}</em>
              </button>
            );
          })}
        </div>
        <p className="rm-note">{rm.goal}。下の順番は、前の資格で学んだことが次の土台になるように並べています。</p>
      </section>

      <section className="rm-sec">
        <h2>取る順番</h2>
        {rm.order.map((id, i) => {
          const c = CERTS[id];
          const st = status[id] || "todo";
          const last = i === rm.order.length - 1;
          const est = estimate(id, state);
          if (!est) return null;
          const prev = i > 0 ? CERTS[rm.order[i - 1]] : null;
          const shared = roadmapsWith(id).filter((r) => r.id !== rm.id);
          const isNext = nextId === id && st !== "done";
          return (
            <div className="rm-step" key={id}>
              <div className="rm-gut">
                <div className={`rm-mark ${st === "done" ? "done" : st === "doing" ? "doing" : isNext ? "next" : ""}`}>
                  {st === "done" ? "✓" : i + 1}
                </div>
                {!last && <div className={`rm-conn ${st === "done" ? "done" : ""}`} />}
              </div>
              <div className="rm-body">
                {prev && <div className="rm-pre">前提：{prev.name} で学んだ内容</div>}
                <div className={`rm-item ${open === id ? "open" : ""}`} role="button" tabIndex={0}
                  onClick={() => setOpen(open === id ? "" : id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(open === id ? "" : id); } }}
                  aria-expanded={open === id}>
                  <div className="rm-item-top">
                    <div className="rm-item-nm">{c.name}</div>
                    {st === "done" && <span className="rm-chip done">取得済み</span>}
                    {st === "doing" && <span className="rm-chip doing">学習中</span>}
                    {st === "todo" && isNext && <span className="rm-chip next">次の目標</span>}
                  </div>
                  <div className="rm-item-meta">
                    {c.org}・{c.level}・推定 {est.hours}h
                    {est.hours !== c.hours && <>（標準 {c.hours}h）</>}
                    {shared.length > 0 && <>　{shared.map((r) => r.name).join("・")}でも使える</>}
                  </div>

                  {open === id && (
                    <div className="rm-detail">
                      <p>{c.desc}</p>
                      {c.notice && <p className="rm-alert">{c.notice}</p>}
                      <dl className="rm-facts">
                        <div><dt>標準の目安</dt><dd>{c.hours}h</dd></div>
                        <div><dt>あなたの推定</dt><dd className={est.hours < c.hours ? "rm-good" : est.hours > c.hours ? "rm-bad" : ""}>{est.hours}h</dd></div>
                        <div><dt>受験料（目安）</dt><dd style={{ fontSize: 13 }}>{c.fee}</dd></div>
                      </dl>
                      <div className="rm-lbl">公式サイト</div>
                      <div className="rm-links">
                        {c.links.map((l) => (
                          <a key={l.url + l.label} className="rm-link" href={l.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}>{l.label}</a>
                        ))}
                      </div>
                      <div style={{ marginTop: 16 }}><ExpPanel certId={id} state={state} setState={setState} /></div>
                      <div className="rm-lbl" style={{ marginTop: 16 }}>主な学習トピック</div>
                      <div className="rm-topics">{c.topics.map((t) => <span key={t} className="rm-topic">{t}</span>)}</div>
                      <div className="rm-row" style={{ marginTop: 16 }}>
                        {(["todo", "doing", "done"] as Status[]).map((v) => (
                          <button key={v} className={`rm-btn sm ${st === v ? "on" : ""}`}
                            onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, status: { ...s.status, [id]: v } })); }}>
                            {v === "todo" ? "未着手" : v === "doing" ? "学習中" : "取得済み"}
                          </button>
                        ))}
                        <button className="rm-btn pri sm" style={{ marginLeft: "auto" }}
                          onClick={(e) => { e.stopPropagation(); setState((s) => ({ ...s, target: { ...s.target, certId: id } })); goPlan(); }}>
                          これを目標にする
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
