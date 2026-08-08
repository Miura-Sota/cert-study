/**
 * Firestore セキュリティルールのテスト。
 *
 *   npm run test:rules
 *
 * エミュレータ上で動くので、実アカウントもパスワードも要らない。
 * 認証は authenticatedContext() が発行するモックトークンで表現する。
 */
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs } from "firebase/firestore";

const results = [];
const t = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  FAIL ${name}\n       ${err.message?.split("\n")[0]}`);
  }
};

const env = await initializeTestEnvironment({
  projectId: "cert-study-rules-test",
  firestore: {
    rules: readFileSync("firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8080,
  },
});

await env.clearFirestore();

const alice = env.authenticatedContext("alice").firestore();
const bob = env.authenticatedContext("bob").firestore();
const anon = env.unauthenticatedContext().firestore();

const payload = { state: '{"logs":[]}', schema: 1, updatedAtMs: 1 };

console.log("\n[users/{uid} — 本人のみ]");
await t("本人は自分のドキュメントを書ける", () =>
  assertSucceeds(setDoc(doc(alice, "users/alice"), payload)));
await t("本人は自分のドキュメントを読める", () =>
  assertSucceeds(getDoc(doc(alice, "users/alice"))));
await t("本人は自分のドキュメントを消せる（アカウント削除で必要）", async () => {
  await assertSucceeds(setDoc(doc(alice, "users/alice"), payload));
  await assertSucceeds(deleteDoc(doc(alice, "users/alice")));
});
await t("他人のドキュメントは読めない", () =>
  assertFails(getDoc(doc(bob, "users/alice"))));
await t("他人のドキュメントは書けない", () =>
  assertFails(setDoc(doc(bob, "users/alice"), payload)));
await t("他人のドキュメントは消せない", () =>
  assertFails(deleteDoc(doc(bob, "users/alice"))));
await t("未ログインでは読めない", () =>
  assertFails(getDoc(doc(anon, "users/alice"))));
await t("未ログインでは書けない", () =>
  assertFails(setDoc(doc(anon, "users/alice"), payload)));

console.log("\n[contacts — 未ログインでも送信でき、読み出しは不可]");
await t("未ログインでも問い合わせを送れる（既存の挙動を維持）", () =>
  assertSucceeds(addDoc(collection(anon, "contacts"), { message: "テスト", createdAt: null })));
await t("ログイン済みでも送れる", () =>
  assertSucceeds(addDoc(collection(alice, "contacts"), { message: "テスト", uid: "alice" })));
await t("空メッセージは弾く", () =>
  assertFails(addDoc(collection(anon, "contacts"), { message: "" })));
await t("message が文字列でなければ弾く", () =>
  assertFails(addDoc(collection(anon, "contacts"), { message: 12345 })));
await t("4000字を超えるものは弾く", () =>
  assertFails(addDoc(collection(anon, "contacts"), { message: "あ".repeat(4001) })));
await t("問い合わせを一覧できない", () =>
  assertFails(getDocs(collection(anon, "contacts"))));
await t("ログイン済みでも他人の問い合わせを読めない", () =>
  assertFails(getDocs(collection(alice, "contacts"))));

console.log("\n[それ以外は全て拒否]");
await t("未知のコレクションは書けない", () =>
  assertFails(setDoc(doc(alice, "secrets/x"), { a: 1 })));
await t("未知のコレクションは読めない", () =>
  assertFails(getDoc(doc(alice, "secrets/x"))));

await env.cleanup();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
