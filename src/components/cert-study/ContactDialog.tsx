"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDb } from "@/lib/firebase";

const LAST_SENT_KEY = "certstudy:contact-last-sent";
const COOLDOWN_MS = 60_000;

export function ContactDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState(user?.email ?? "");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setMessage("");
    setHp("");
    setError("");
    setDone(false);
  };

  const send = async () => {
    if (hp.trim()) {
      close();
      return;
    }
    const lastSent = Number(window.localStorage.getItem(LAST_SENT_KEY) || "0");
    if (Date.now() - lastSent < COOLDOWN_MS) {
      setError("送信間隔が短すぎます。少し時間をおいてからもう一度お試しください。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const write = addDoc(collection(getFirebaseDb(), "contacts"), {
        message: message.trim(),
        replyEmail: replyEmail.trim() || null,
        uid: user?.uid ?? null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        createdAt: serverTimestamp(),
      });
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15_000));
      await Promise.race([write, timeout]);
      window.localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      setDone(true);
    } catch {
      setError("送信に失敗しました。通信状態を確認して、もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rm-dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="rm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="お問い合わせ"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>お問い合わせ</h3>
        {done ? (
          <>
            <p className="rm-note rm-good">送信しました。ありがとうございます。</p>
            <div className="rm-dialog-row">
              <button type="button" className="rm-btn sm pri" onClick={close}>閉じる</button>
            </div>
          </>
        ) : (
          <>
            <p>
              ご意見・ご要望・不具合報告などを自由に書いてください。「送信する」を押すと、メールアプリを起動せずそのまま開発者に届きます。
            </p>
            <textarea
              className="rm-contact-ta"
              rows={6}
              placeholder="内容を入力してください"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <label className="rm-f" style={{ marginTop: 10 }}>
              <span>返信先メールアドレス（任意）</span>
              <input
                className="rm-in"
                type="email"
                placeholder="返信が必要な場合のみ入力してください"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
              />
            </label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />
            {error && <p className="rm-note rm-bad">{error}</p>}
            <div className="rm-dialog-row">
              <button type="button" className="rm-btn quiet sm" onClick={close} disabled={busy}>キャンセル</button>
              <button type="button" className="rm-btn sm pri" onClick={send} disabled={!message.trim() || busy}>
                {busy ? "送信中…" : "送信する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
