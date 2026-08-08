import { fmtMD } from "@/lib/utils";
import type { ScoreEntry } from "@/lib/types";

type Week = { label: string; h: number };

export function WeekChart({ weeks, goal, color }: { weeks: Week[]; goal: number; color: string }) {
  const W = 620, H = 150, PL = 30, PB = 22, PT = 10;
  const max = Math.max(goal * 1.2, ...weeks.map((w) => w.h), 4);
  const bw = (W - PL - 8) / weeks.length;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="週ごとの学習時間">
      {[0, max].map((v, i) => (
        <g key={i}>
          <line x1={PL} x2={W - 4} y1={y(v)} y2={y(v)} stroke="#E6E2DC" />
          <text x={PL - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6B6A67" fontFamily="Roboto Mono, monospace">{v.toFixed(0)}</text>
        </g>
      ))}
      {goal > 0 && <>
        <line x1={PL} x2={W - 4} y1={y(goal)} y2={y(goal)} stroke="#17936A" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={W - 6} y={y(goal) - 5} textAnchor="end" fontSize="10" fill="#17936A" fontFamily="Roboto Mono, monospace">目標 {goal}h</text>
      </>}
      {weeks.map((w, i) => {
        const h = Math.max(0, (H - PT - PB) * (w.h / max));
        const hit = goal > 0 && w.h >= goal;
        return (
          <g key={i}>
            <rect x={PL + i * bw + bw * 0.2} y={H - PB - h} width={bw * 0.6} height={h}
              fill={hit ? "#17936A" : i === weeks.length - 1 ? color : "#C9C4BC"} rx="3" />
            <text x={PL + i * bw + bw / 2} y={H - 7} textAnchor="middle" fontSize="10" fill="#6B6A67" fontFamily="Roboto Mono, monospace">{w.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function ScoreChart({ data, pass, color, onRemove }: { data: ScoreEntry[]; pass: number; color: string; onRemove: (id: string) => void }) {
  const W = 620, H = 170, PL = 28, PB = 24, PT = 12;
  const x = (i: number) => PL + (data.length === 1 ? (W - PL - 12) / 2 : (i * (W - PL - 12)) / (data.length - 1));
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / 100);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="模試スコアの推移">
        {[0, 100].map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - 6} y1={y(v)} y2={y(v)} stroke="#E6E2DC" />
            <text x={PL - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6B6A67" fontFamily="Roboto Mono, monospace">{v}</text>
          </g>
        ))}
        <line x1={PL} x2={W - 6} y1={y(pass)} y2={y(pass)} stroke="#17936A" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={W - 8} y={y(pass) - 5} textAnchor="end" fontSize="10" fill="#17936A" fontFamily="Roboto Mono, monospace">目標 {pass}%</text>
        {data.length > 1 && (
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"
            points={data.map((d, i) => `${x(i)},${y(d.score)}`).join(" ")} />
        )}
        {data.map((d, i) => (
          <g key={d.id}>
            <circle cx={x(i)} cy={y(d.score)} r="5" fill={d.score >= pass ? "#17936A" : "#E39A12"} stroke="#fff" strokeWidth="2" />
            <text x={x(i)} y={y(d.score) - 11} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1C1B1A" fontFamily="Roboto Mono, monospace">{d.score}</text>
            <text x={x(i)} y={H - 7} textAnchor="middle" fontSize="10" fill="#6B6A67" fontFamily="Roboto Mono, monospace">{fmtMD(d.date)}</text>
          </g>
        ))}
      </svg>
      <table className="rm-tbl" style={{ marginTop: 8 }}>
        <tbody>
          {data.map((d) => (
            <tr key={d.id}>
              <td className="n" style={{ width: 56 }}>{fmtMD(d.date)}</td>
              <td>{d.name}</td>
              <td className="n" style={{ width: 52 }}>{d.score}%</td>
              <td style={{ width: 30, textAlign: "right" }}>
                <button className="rm-x" aria-label="削除" onClick={() => onRemove(d.id)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
