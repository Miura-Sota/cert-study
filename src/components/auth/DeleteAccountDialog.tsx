"use client";

import { useState } from "react";
import { toAuthErrorMessage, useAuth } from "@/lib/auth-context";
import { deleteCloudState } from "@/lib/cloud-sync";
import { clearSyncMeta } from "@/lib/sync-meta";
import { TUTORIAL_KEY } from "@/lib/tutorial";

const APP_STATE_KEY = "certstudy:v1";

type Step = "confirm" | "reauth-password" | "reauth-google";

export function DeleteAccountDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user, deleteAccount, reauthWithPassword, reauthWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("confirm");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setStep("confirm");
    setPassword("");
    setError("");
    setBusy(false);
  };

  const usesPassword = user?.providerData.some((p) => p.providerId === "password") ?? false;

  async function finishDelete() {
    // クラウド上の記録は auth ユーザーより先に消す。
    // deleteUser() の後はこのドキュメントへの権限が無くなり、孤児が残る。
    const uid = user?.uid;
    if (uid) {
      try {
        await deleteCloudState(uid);
      } catch {
        // 権限エラー以外(通信断など)でアカウント削除まで止めない。
        // 残った場合もルール上、本人以外からは読めない。
      }
    }
    await deleteAccount();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(APP_STATE_KEY);
      window.localStorage.removeItem(TUTORIAL_KEY);
    }
    clearSyncMeta();
    close();
  }

  // 先にクラウドの記録を消す必要がある一方、本人確認は取り消せる。
  // 順番を「本人確認 → 削除」に固定して、取り消した場合に記録だけ消える状態を防ぐ。
  function handleConfirm() {
    setError("");
    setStep(usesPassword ? "reauth-password" : "reauth-google");
  }

  async function handleReauthPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await reauthWithPassword(password);
      await finishDelete();
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReauthGoogle() {
    setBusy(true);
    setError("");
    try {
      await reauthWithGoogle();
      await finishDelete();
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rm-dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="rm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="アカウントを削除"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "confirm" && (
          <>
            <h3>アカウントを削除しますか？</h3>
            <p>
              アカウント（{user?.email ?? user?.displayName ?? "このアカウント"}）を削除すると、ログインができなくなり、<b>クラウドに保存された記録も、この端末に保存された計画・教材・記録も、すべて削除されます</b>。他の端末に残っている記録も次回の同期で消えます。元に戻すことはできません。
            </p>
            {error && <p className="rm-note rm-bad">{error}</p>}
            <div className="rm-dialog-row">
              <button type="button" className="rm-btn quiet sm" onClick={close} disabled={busy}>キャンセル</button>
              <button type="button" className="rm-btn sm rm-danger" onClick={handleConfirm} disabled={busy}>
                削除に進む
              </button>
            </div>
          </>
        )}

        {step === "reauth-password" && (
          <>
            <h3>本人確認が必要です</h3>
            <p>セキュリティのため、パスワードを再入力してから削除してください。</p>
            <form onSubmit={handleReauthPassword} className="rm-auth-form">
              <label className="rm-auth-label">
                パスワード
                <input
                  className="rm-in"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && <p className="rm-note rm-bad">{error}</p>}
              <div className="rm-dialog-row">
                <button type="button" className="rm-btn quiet sm" onClick={close} disabled={busy}>キャンセル</button>
                <button type="submit" className="rm-btn sm rm-danger" disabled={busy}>
                  {busy ? "削除しています…" : "確認して削除する"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "reauth-google" && (
          <>
            <h3>本人確認が必要です</h3>
            <p>セキュリティのため、Google で再度サインインしてから削除してください。</p>
            {error && <p className="rm-note rm-bad">{error}</p>}
            <div className="rm-dialog-row">
              <button type="button" className="rm-btn quiet sm" onClick={close} disabled={busy}>キャンセル</button>
              <button type="button" className="rm-btn sm rm-danger" onClick={handleReauthGoogle} disabled={busy}>
                {busy ? "削除しています…" : "Google で確認して削除する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
