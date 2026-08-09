"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildShareTargets, SHARE_TITLE, shareMessage, siteUrl } from "@/lib/share";

type CopyState = "idle" | "done" | "manual";

export function ShareDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [copied, setCopied] = useState<CopyState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setCopied("idle");
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (copied !== "done") return;
    const t = setTimeout(() => setCopied("idle"), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  if (!open) return null;

  // ダイアログが開いているのは操作後だけなので、ここで読んでも SSR と食い違わない。
  const url = siteUrl();
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      // 権限が下りない、または安全なコンテキストでない場合。手でコピーできるよう選択しておく。
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopied("manual");
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: shareMessage(), url });
    } catch {
      // ユーザーが共有をやめた場合も例外になるため、何も知らせない。
    }
  };

  return (
    <div className="rm-dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="rm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="このサイトを共有"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>このサイトを共有</h3>
        <p>このサイトのリンクです。コピーするか、そのまま他のアプリに送れます。</p>

        <div className="rm-share-url">
          <input ref={inputRef} type="text" readOnly value={url} aria-label="共有するリンク"
            onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="rm-btn sm" onClick={copy}>コピー</button>
        </div>
        <p className="rm-note" aria-live="polite">
          {copied === "done" && "リンクをコピーしました。"}
          {copied === "manual" && "自動でコピーできませんでした。選択したリンクをコピーしてください。"}
        </p>

        {canShare && (
          <button type="button" className="rm-btn pri rm-share-native" onClick={shareNative}>
            他のアプリで共有
          </button>
        )}

        <div className="rm-share-targets">
          {buildShareTargets(url).map((t) => (
            <a
              key={t.key}
              className="rm-share-t"
              href={t.url}
              {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {t.label}
            </a>
          ))}
        </div>

        <div className="rm-dialog-row">
          <button type="button" className="rm-btn quiet sm" onClick={close}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
