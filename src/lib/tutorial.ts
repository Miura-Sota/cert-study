import type { AppState, AppTab } from "./types";

export const TUTORIAL_KEY = "certstudy:tutorial:v1";

export const TAB_LABEL: Record<AppTab, string> = {
  home: "ホーム",
  map: "ロードマップ",
  plan: "計画",
  mat: "教材",
  log: "記録",
};

export type TutorialStep = {
  id: string;
  tab: AppTab;
  title: string;
  body: string;
  kind: "info" | "action";
  isDone?: (state: AppState) => boolean;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    tab: "home",
    kind: "info",
    title: "資格ロードマップへようこそ",
    body: "資格取得までの計画・教材・学習記録を1か所でつなげるノートです。5つのタブを順番に見ていきましょう。",
  },
  {
    id: "tabs",
    tab: "home",
    kind: "info",
    title: "5つのタブ",
    body: "ホーム(進捗の一覧)、ロードマップ(取る資格の順番)、計画(学習スケジュール)、教材(教材ごとの進み具合)、記録(日々の学習ログ)。まずはロードマップから目標を決めましょう。",
  },
  {
    id: "set-goal",
    tab: "map",
    kind: "action",
    title: "目標にする資格を選ぶ",
    body: "資格カードをクリックして詳細を開き、「これを目標にする」を押してみてください。",
    isDone: (state) => !!state.target.certId,
  },
  {
    id: "make-plan",
    tab: "plan",
    kind: "action",
    title: "学習計画をつくる",
    body: "テンプレートを1つ選ぶと、フェーズと項目が自動でできます。あとから自由に編集できるので、気軽に選んでください。",
    isDone: (state) => (state.plans[state.target.certId]?.length ?? 0) > 0,
  },
  {
    id: "log-study",
    tab: "log",
    kind: "action",
    title: "学習を記録する",
    body: "学習時間を入力して「追加する」を押してみましょう。15分でも記録すると、ホームの積み上げグラフに反映されます。",
    // 直近ログ数との比較で判定するため、コンポーネント側で特別扱いする
  },
  {
    id: "materials",
    tab: "mat",
    kind: "info",
    title: "教材の進捗も管理できる",
    body: "動画講座や問題集などの教材を登録すると、ページ数や問題数の進み具合を記録できます。",
  },
  {
    id: "done",
    tab: "home",
    kind: "info",
    title: "準備完了です",
    body: "ここまでの操作で、目標・計画・記録がひとつながりになりました。あとは学習を続けて、ホームの進捗を育てていくだけです。",
  },
];
