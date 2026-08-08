export type CertLink = {
  label: string;
  url: string;
  apply?: boolean;
};

export type Cert = {
  name: string;
  org: string;
  level: string;
  hours: number;
  fee: string;
  links: CertLink[];
  desc: string;
  topics: string[];
  notice?: string;
};

export type Roadmap = {
  id: string;
  name: string;
  color: string;
  goal: string;
  order: string[];
};

export type Kind = {
  id: string;
  name: string;
  icon: string;
  unit: string;
  color: string;
  hint: string;
  defTotal: number;
};

export type ExpLevel = {
  id: string;
  name: string;
  desc: string;
  f: number;
};

export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Phase = {
  id: string;
  tpl?: string;
  name: string;
  purpose: string;
  from: string;
  to: string;
  hours: number;
  items: TaskItem[];
};

export type TemplatePhase = {
  name: string;
  purpose: string;
  items: (cert: Cert) => string[];
};

export type Template = {
  id: string;
  name: string;
  mix: string;
  desc: string;
  shares: number[];
  phases: TemplatePhase[];
};

export type Material = {
  id: string;
  certId: string;
  kind: string;
  name: string;
  total: number;
};

export type LogEntry = {
  id: string;
  date: string;
  minutes: number;
  certId: string;
  materialId: string;
  amount: number;
  topic: string;
  note: string;
};

export type ScoreEntry = {
  id: string;
  date: string;
  certId: string;
  name: string;
  score: number;
};

export type Status = "todo" | "doing" | "done";

export type Target = {
  certId: string;
  examDate: string;
  weeklyHours: number;
  passLine: number;
};

export type AppState = {
  goal: string;
  status: Record<string, Status>;
  exp: Record<string, string>;
  target: Target;
  plans: Record<string, Phase[]>;
  materials: Material[];
  logs: LogEntry[];
  scores: ScoreEntry[];
};

export type AppTab = "home" | "map" | "plan" | "mat" | "log";

export type Estimate = {
  base: number;
  expFactor: number;
  holdFactor: number;
  held: string[];
  sameOrg: string[];
  hours: number;
};

export type WeeklySlot = {
  id: string;
  dow: number;
  time: string;
  minutes: number;
};

/** 端末側に持つ同期メタデータ。localStorage の certstudy:sync:v1 に入る。 */
export type SyncMeta = {
  /** 最後に同期したアカウント。ゲストのみで使っていた場合は null。 */
  uid: string | null;
  /** ローカルの状態が最後に変わった時刻(ms)。競合時の新旧判定に使う。 */
  localUpdatedAtMs: number;
  /** 最後に push が成功した時刻(ms)。localUpdatedAtMs より小さければ未送信。 */
  lastPushedMs: number;
  /** 最後に取り込んだクラウド側の updatedAtMs。 */
  lastPulledUpdatedAtMs: number;
};

export type SyncStatus =
  | "off"       // 未ログイン、または Firebase 未設定
  | "syncing"   // 送受信中
  | "synced"    // 同期済み
  | "offline"   // 通信できず、この端末にのみ保存
  | "conflict"; // 競合ダイアログの応答待ち

/** クラウドから読んだ1件分の状態。 */
export type CloudSnapshot = {
  state: AppState;
  updatedAtMs: number;
};

/** 競合時にユーザーへ提示する選択肢。 */
export type ConflictChoice = "cloud" | "local" | "merge";
