type RingProps = {
  pct: number;
  color: string;
  label: string;
  sub: string;
};

export function Ring({ pct, color, label, sub }: RingProps) {
  const r = 38, C = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <div className="rm-ring">
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#EDE9E3" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${C * p} ${C}`} transform="rotate(-90 44 44)" />
      </svg>
      <b>{label}<i>{sub}</i></b>
    </div>
  );
}
