import type { Dispatch, SetStateAction } from "react";
import { CERTS, EXP_LEVELS } from "@/lib/data";
import type { AppState } from "@/lib/types";
import { estimate } from "@/lib/utils";

export function ExpPanel({ certId, state, setState }: { certId: string; state: AppState; setState: Dispatch<SetStateAction<AppState>> }) {
  const est = estimate(certId, state);
  if (!est) return null;
  const cur = (state.exp || {})[certId] || "basic";
  return (
    <>
      <div className="rm-lbl">この分野の経験</div>
      <div className="rm-exp">
        {EXP_LEVELS.map((e) => (
          <button key={e.id} className={`rm-expb ${cur === e.id ? "on" : ""}`}
            onClick={(ev) => { ev.stopPropagation(); setState((s) => ({ ...s, exp: { ...(s.exp || {}), [certId]: e.id } })); }}>
            <b>{e.name}</b><span>{e.desc}</span>
          </button>
        ))}
      </div>
      <div className="rm-calc">
        標準 <b>{est.base}h</b> × 経験 <b>{est.expFactor.toFixed(2)}</b> × 保有資格 <b>{est.holdFactor.toFixed(2)}</b>
        <strong>{est.hours}<small>h があなたの推定学習時間</small></strong>
        <div style={{ marginTop: 4 }}>
          {est.held.length + est.sameOrg.length === 0
            ? "順番が前の資格を取得すると、ここが自動で短くなります。"
            : `反映した保有資格：${[...est.held, ...est.sameOrg].map((k) => CERTS[k].name).join("、")}`}
        </div>
      </div>
    </>
  );
}
