export const SHARE_TITLE = "資格ロードマップ";
export const SHARE_TEXT = "働きながら資格を取るための、計画・教材・記録がつながるノート。";

export type ShareTarget = {
  key: string;
  label: string;
  url: string;
  /** http(s) の共有ページは新しいタブで開く。mailto:/sms: は同じタブでアプリに渡す。 */
  external: boolean;
};

/** 共有するリンク。クエリやハッシュを落とした、このサイトのトップを返す。 */
export function siteUrl(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return origin + pathname.replace(/index\.html$/, "");
}

export function shareMessage(): string {
  return `${SHARE_TITLE}｜${SHARE_TEXT}`;
}

export function buildShareTargets(url: string): ShareTarget[] {
  const text = shareMessage();
  const enc = encodeURIComponent;
  return [
    {
      key: "line",
      label: "LINE",
      url: `https://social-plugins.line.me/lineit/share?url=${enc(url)}&text=${enc(text)}`,
      external: true,
    },
    {
      key: "x",
      label: "X",
      url: `https://x.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
      external: true,
    },
    {
      key: "mail",
      label: "メール",
      url: `mailto:?subject=${enc(SHARE_TITLE)}&body=${enc(`${text}\n${url}`)}`,
      external: false,
    },
    {
      // iOS と Android のどちらでも本文が入る書き方。
      key: "sms",
      label: "SMS",
      url: `sms:?&body=${enc(`${text} ${url}`)}`,
      external: false,
    },
  ];
}
