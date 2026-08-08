"use client";

import { useState } from "react";
import { toAuthErrorMessage, useAuth } from "@/lib/auth-context";

type Mode = "signin" | "signup";

export function LoginScreen({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { configured, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setMode("signin");
    setEmail("");
    setPassword("");
    setError("");
    setBusy(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setError("Firebase が未設定のため、ログインできません。管理者に連絡してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      close();
    } catch (err) {
      setError(toAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    if (!configured) {
      setError("Firebase が未設定のため、ログインできません。管理者に連絡してください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      close();
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
        aria-label={mode === "signin" ? "ログイン" : "新規登録"}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{mode === "signin" ? "ログイン" : "新規登録"}</h3>
        <p>
          アカウントを作ると、計画・教材・学習記録がクラウドに保存されます。ブラウザのデータを消しても機種を変えても記録は残り、スマホとPCの両方から同じ内容を使えます。
        </p>
        <ul className="rm-auth-benefits">
          <li>記録のバックアップ（端末が変わっても失われません）</li>
          <li>スマホとPCで同期（通勤中に記録して、家で計画を直せます）</li>
        </ul>
        <p className="rm-note">
          ログインしなくても全ての機能を使えます。その場合、記録はこの端末にのみ保存されます。
        </p>

        {!configured && (
          <p className="rm-note rm-bad">
            Firebase が未設定です。.env.local に NEXT_PUBLIC_FIREBASE_* を設定してください。
          </p>
        )}

        <form onSubmit={handleSubmit} className="rm-auth-form">
          <label className="rm-auth-label">
            メールアドレス
            <input
              className="rm-in"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="rm-auth-label">
            パスワード
            <input
              className="rm-in"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="rm-note rm-bad">{error}</p>}

          <button type="submit" className="rm-btn pri rm-auth-submit" disabled={busy}>
            {mode === "signin" ? "ログイン" : "登録する"}
          </button>
        </form>

        <button
          type="button"
          className="rm-btn quiet sm"
          onClick={() => {
            setError("");
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin" ? "アカウントをお持ちでない方はこちら" : "既にアカウントをお持ちの方はこちら"}
        </button>

        <div className="rm-auth-divider"><span>または</span></div>

        <div className="rm-auth-social">
          <button type="button" className="rm-btn rm-auth-social-btn" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon />
            Googleでログイン
          </button>
          <button type="button" className="rm-btn rm-auth-social-btn" disabled title="Apple Developer Program 登録後に対応予定です">
            <AppleIcon />
            Appleでログイン(準備中)
          </button>
        </div>

        <div className="rm-dialog-row">
          <button type="button" className="rm-btn quiet sm" onClick={close} disabled={busy}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 17 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.9 10.6c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.9.9-3.6 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.8 2.3 1.1 0 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.7-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.5-1-2.5-3.7zM11.6 3.9c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"
      />
    </svg>
  );
}
