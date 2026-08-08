"use client";

import {
  type User,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reauthWithPassword: (password: string) => Promise<void>;
  reauthWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "メールアドレスの形式が正しくありません。",
  "auth/user-disabled": "このアカウントは無効になっています。",
  "auth/user-not-found": "メールアドレスまたはパスワードが違います。",
  "auth/wrong-password": "メールアドレスまたはパスワードが違います。",
  "auth/invalid-credential": "メールアドレスまたはパスワードが違います。",
  "auth/email-already-in-use": "このメールアドレスは既に登録されています。",
  "auth/weak-password": "パスワードは6文字以上で入力してください。",
  "auth/popup-closed-by-user": "ログインがキャンセルされました。",
  "auth/network-request-failed": "通信に失敗しました。接続を確認してください。",
  "auth/requires-recent-login": "セキュリティのため、再度ログイン確認が必要です。",
  "auth/wrong-password-or-recent-login": "パスワードが正しくないか、再ログインが必要です。",
};

export function toAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  return "エラーが発生しました。しばらくしてからもう一度お試しください。";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    configured: isFirebaseConfigured,
    async signUpWithEmail(email, password) {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    },
    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    },
    async signInWithGoogle() {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
    },
    async logOut() {
      await signOut(getFirebaseAuth());
    },
    async deleteAccount() {
      const current = getFirebaseAuth().currentUser;
      if (!current) throw new Error("ログインしていません。");
      await deleteUser(current);
    },
    async reauthWithPassword(password) {
      const current = getFirebaseAuth().currentUser;
      if (!current?.email) throw new Error("ログインしていません。");
      const credential = EmailAuthProvider.credential(current.email, password);
      await reauthenticateWithCredential(current, credential);
    },
    async reauthWithGoogle() {
      const current = getFirebaseAuth().currentUser;
      if (!current) throw new Error("ログインしていません。");
      await reauthenticateWithPopup(current, googleProvider);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の内側で使ってください。");
  return ctx;
}
