"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { SyncStatus } from "@/lib/types";

function syncLabel(status: SyncStatus, lastSyncedMs: number): string {
  switch (status) {
    case "syncing":
      return "同期しています…";
    case "synced": {
      if (!lastSyncedMs) return "クラウドに保存中";
      const d = new Date(lastSyncedMs);
      return `クラウドに保存済み ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    case "offline":
      return "オフライン（この端末にのみ保存）";
    case "conflict":
      return "記録の食い違いを確認してください";
    default:
      return "この端末にのみ保存";
  }
}

export function AccountMenu({ onDeleteAccount, onContact, onLogin, syncStatus, lastSyncedMs }: {
  onDeleteAccount: () => void;
  onContact: () => void;
  onLogin: () => void;
  syncStatus: SyncStatus;
  lastSyncedMs: number;
}) {
  const { user, logOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="rm-menu" ref={ref}>
      <button
        type="button"
        className="rm-menu-btn"
        aria-label="アカウントメニュー"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
      {open && (
        <div className="rm-menu-panel" role="menu">
          <div className="rm-menu-email" title={user?.email ?? user?.displayName ?? undefined}>
            {user?.email ?? user?.displayName ?? "ゲスト"}
          </div>
          <div className={`rm-menu-sync${syncStatus === "offline" || syncStatus === "conflict" ? " warn" : ""}`}>
            {syncLabel(syncStatus, lastSyncedMs)}
          </div>
          <button type="button" className="rm-menu-item" role="menuitem"
            onClick={() => { setOpen(false); onContact(); }}>
            お問い合わせ
          </button>
          {user ? (
            <>
              <button type="button" className="rm-menu-item" role="menuitem"
                onClick={() => { setOpen(false); logOut(); }}>
                ログアウト
              </button>
              <button type="button" className="rm-menu-item danger" role="menuitem"
                onClick={() => { setOpen(false); onDeleteAccount(); }}>
                アカウントを削除
              </button>
            </>
          ) : (
            <button type="button" className="rm-menu-item" role="menuitem"
              onClick={() => { setOpen(false); onLogin(); }}>
              ログイン / 新規登録
            </button>
          )}
        </div>
      )}
    </div>
  );
}
