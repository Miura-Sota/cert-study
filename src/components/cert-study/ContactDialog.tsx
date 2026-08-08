"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const CONTACT_EMAIL = "4869miurasouta@gmail.com";

export function ContactDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setMessage("");
  };

  const send = () => {
    const subject = "資格ロードマップ お問い合わせ";
    const body = [message.trim(), "", `送信元: ${user?.email ?? "不明"}`].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    close();
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
        <p>
          ご意見・ご要望・不具合報告などを自由に書いてください。「メールで送信」を押すと、お使いのメールアプリが起動し、宛先と内容が入った下書きが開きます。実際の送信は、そのメールアプリ側で行ってください。
        </p>
        <textarea
          className="rm-contact-ta"
          rows={6}
          placeholder="内容を入力してください"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="rm-dialog-row">
          <button type="button" className="rm-btn quiet sm" onClick={close}>キャンセル</button>
          <button type="button" className="rm-btn sm pri" onClick={send} disabled={!message.trim()}>
            メールで送信
          </button>
        </div>
      </div>
    </div>
  );
}
