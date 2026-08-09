/**
 * サイトのシンボル。認定バッジ（六角形）の中を、道が水平から登って到達点に着く。
 * 到達点の色は選んでいるロードマップの色（--c）に追従する。
 * 24px 未満で使う場合は線がつぶれるので、簡略版を置いてある src/app/icon.svg を使う。
 */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "0 0 auto", display: "block" }}
    >
      <path d="M12 2.4 L20.4 7.2 V16.8 L12 21.6 L3.6 16.8 V7.2 Z" strokeWidth={1.7} />
      <path d="M7.6 15.2 L11.4 15.2 L15.4 11.2" strokeWidth={1.9} />
      <circle cx="16" cy="10.6" r="2.5" fill="var(--c, #2563C9)" stroke="none" />
    </svg>
  );
}
