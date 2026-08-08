import { CERTS, ROADMAPS, expF } from "./data";
import type { AppState, Estimate, LogEntry, Roadmap } from "./types";

export const uid = (): string => Math.random().toString(36).slice(2, 9);
export const pad2 = (n: number): string => String(n).padStart(2, "0");
export const toISO = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayISO = (): string => toISO(new Date());
export const parseISO = (s: string): Date => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const fmtMD = (s: string): string => {
  const d = parseISO(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const daysBetween = (a: string, b: string): number => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
export const mondayOf = (d: Date): Date => {
  const x = new Date(d);
  const w = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - w);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const roadmapsWith = (id: string): Roadmap[] => ROADMAPS.filter((r) => r.order.includes(id));
export const num = (v: unknown): number => (isNaN(parseFloat(String(v))) ? 0 : parseFloat(String(v)));
export const compact = (s: string): string => String(s).replace(/-/g, "");

export function priorOf(certId: string): string[] {
  const set = new Set<string>();
  roadmapsWith(certId).forEach((r) => {
    const i = r.order.indexOf(certId);
    r.order.slice(0, i).forEach((s) => set.add(s));
  });
  return [...set];
}

export function estimate(certId: string, state: AppState): Estimate | null {
  const cert = CERTS[certId];
  if (!cert) return null;
  const e = expF((state.exp || {})[certId]);
  const held = priorOf(certId).filter((p) => state.status[p] === "done");
  const sameOrg = Object.keys(state.status).filter(
    (k) => state.status[k] === "done" && k !== certId && CERTS[k] && CERTS[k].org === cert.org && !held.includes(k)
  );
  const discount = Math.min(0.25, held.length * 0.08) + Math.min(0.1, sameOrg.length * 0.04);
  const h = Math.max(1 - discount, 0.65);
  return {
    base: cert.hours,
    expFactor: e,
    holdFactor: h,
    held,
    sameOrg,
    hours: Math.max(Math.round(cert.hours * 0.5), Math.round(cert.hours * e * h)),
  };
}

export function streakOf(logs: LogEntry[]): number {
  const days = new Set(logs.map((l) => l.date));
  let d = new Date();
  let n = 0;
  if (!days.has(toISO(d))) {
    d = addDays(d, -1);
    if (!days.has(toISO(d))) return 0;
  }
  while (days.has(toISO(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export const DEFAULT_STATE: AppState = {
  goal: "cloud",
  status: {},
  exp: {},
  target: { certId: "", examDate: "", weeklyHours: 10, passLine: 70 },
  plans: {},
  materials: [],
  logs: [],
  scores: [],
};

/** 保存先(localStorage / クラウド)から読んだ値を AppState の形に整える。 */
export function normalizeState(raw: unknown): AppState {
  const v = (raw ?? {}) as Partial<AppState>;
  return {
    ...DEFAULT_STATE,
    ...v,
    target: { ...DEFAULT_STATE.target, ...(v.target || {}) },
    status: v.status || {},
    exp: v.exp || {},
    plans: v.plans || {},
    materials: Array.isArray(v.materials) ? v.materials : [],
    logs: Array.isArray(v.logs) ? v.logs : [],
    scores: Array.isArray(v.scores) ? v.scores : [],
  };
}

/** 一度も触られていない初期状態か。同期の初回判定に使う。 */
export function isPristineState(s: AppState): boolean {
  return (
    s.logs.length === 0 &&
    s.scores.length === 0 &&
    s.materials.length === 0 &&
    Object.keys(s.plans).length === 0 &&
    Object.keys(s.status).length === 0 &&
    Object.keys(s.exp).length === 0 &&
    s.target.certId === "" &&
    s.target.examDate === ""
  );
}
