import type { Cert, Phase, Template } from "./types";
import { addDays, daysBetween, parseISO, toISO, todayISO, uid } from "./utils";

export const TEMPLATES: Template[] = [
  { id: "standard", name: "王道 3フェーズ", mix: "インプット 40 / 演習 35 / 仕上げ 25",
    desc: "はじめての分野に。全体を一周してから演習に入る。", shares: [0.4, 0.35, 0.25],
    phases: [
      { name: "インプット", purpose: "出題範囲の地図を作る。穴を潰すより、まず全体を一周する。", items: (c: Cert) => c.topics.map((t) => `${t} を一周する`) },
      { name: "演習・ハンズオン", purpose: "手を動かして定着させる。設定の理由を自分の言葉で言えるところまで。", items: (c: Cert) => c.topics.slice(0, 5).map((t) => `${t} の演習・ハンズオン`).concat(["苦手分野を書き出す"]) },
      { name: "模試と弱点補強", purpose: "本番形式で時間を計り、外した設問を分野別に潰す。", items: () => ["模擬試験①（通しで時間を計る）", "誤答を分野別に分類する", "弱点分野の再インプット", "模擬試験②（目標スコア超えまで）", "前日：会場・持ち物・本人確認書類の確認"] },
    ] },
  { id: "sprint", name: "短期集中", mix: "インプット 25 / 演習 30 / 模試 45",
    desc: "試験日が近いとき。早めに問題を解いて間違いから逆算する。", shares: [0.25, 0.3, 0.45],
    phases: [
      { name: "速習インプット", purpose: "頻出領域だけ先に。細部は後回しにして全体像を掴む。", items: (c: Cert) => c.topics.slice(0, 4).map((t) => `${t}（頻出だけ）`) },
      { name: "問題演習", purpose: "問題を解きながら知識を埋める。解説を読む時間を惜しまない。", items: (c: Cert) => c.topics.map((t) => `${t} の問題演習`) },
      { name: "模試ループ", purpose: "模試 → 誤答分析 → 再演習を回数で回す。", items: () => ["模擬試験①", "誤答分析①", "模擬試験②", "誤答分析②", "模擬試験③", "直前総復習"] },
    ] },
  { id: "experienced", name: "実務経験者向け", mix: "洗い出し 20 / 重点演習 45 / 仕上げ 35",
    desc: "業務で触っている領域があるとき。知らない所だけに時間を寄せる。", shares: [0.2, 0.45, 0.35],
    phases: [
      { name: "弱点の洗い出し", purpose: "先に模試を1本解いて、業務でカバーできていない領域を特定する。", items: (c: Cert) => ["試験ガイドで出題範囲を確認する", "模擬試験（現状把握）", ...c.topics.slice(0, 3).map((t) => `${t} の理解度をチェック`)] },
      { name: "弱点の重点演習", purpose: "洗い出した領域だけを深く。知っている領域は流す。", items: (c: Cert) => c.topics.map((t) => `${t}（必要なら深掘り）`) },
      { name: "仕上げ", purpose: "本番の時間配分に慣らす。", items: () => ["模擬試験（時間配分の確認）", "誤答分析", "設問の読み方を固める", "前日：会場・持ち物の確認"] },
    ] },
  { id: "blank", name: "白紙から作る", mix: "フェーズ 1 のみ",
    desc: "自分の型がある人向け。空のフェーズだけ用意します。", shares: [1],
    phases: [{ name: "フェーズ 1", purpose: "", items: () => [""] }] },
];

export function buildFromTemplate(tplId: string, cert: Cert, examDate: string, totalHours: number): Phase[] {
  const tpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
  const start = todayISO();
  const total = Math.max(tpl.shares.length, daysBetween(start, examDate) || 60);
  let cursor = 0;
  return tpl.phases.map((p, i) => {
    const share = tpl.shares[i];
    const days = i === tpl.phases.length - 1 ? total - cursor : Math.max(1, Math.round(total * share));
    const from = addDays(parseISO(start), cursor);
    const to = addDays(parseISO(start), Math.min(total, cursor + days) - 1);
    cursor += days;
    return {
      id: uid(), tpl: tpl.id, name: p.name, purpose: p.purpose,
      from: toISO(from), to: toISO(to), hours: Math.round(totalHours * share),
      items: p.items(cert).map((text) => ({ id: uid(), text, done: false })),
    };
  });
}
