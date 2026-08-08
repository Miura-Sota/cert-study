This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Data storage and cloud sync

学習データ（計画・教材・記録・スコア）は `localStorage` の `certstudy:v1` を正とし、Firestore はそのミラーとして扱う（ローカルファースト）。オフラインでも全機能が動く。

- **未ログイン**: 全機能を使えるが、記録はその端末にのみ残る。
- **ログイン時**: `users/{uid}` に `AppState` を JSON 文字列で1ドキュメントとして保存し、ログイン時とウィンドウ復帰時に取り込む。書き込みは3秒デバウンス＋離脱時フラッシュ。
- **競合時**: 端末とクラウドの両方が更新されていた場合、「クラウド / この端末 / 統合」を選ぶダイアログが出る。統合の規則は `src/lib/merge-state.ts` を参照。

ライブ購読（`onSnapshot`）は使っていない。編集中のフォームを上書きする事故を避けるため、取り込みはログイン時と復帰時に限定している。

セキュリティルールは `firestore.rules` にあり、`firebase deploy --only firestore:rules` で反映する。

### ルールのテスト

```bash
npm run test:rules
```

Firestore エミュレータ上で `firestore.rules` を検証する（本人以外の `users/{uid}` へのアクセス拒否、`contacts` の create 限定など17項目）。実アカウントは不要で、認証はモックトークンで表現している。

エミュレータには Java が要る。入っていなければ `brew install openjdk` のうえ、`export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"` を通してから実行する。

## Authentication setup (Firebase)

ログインは任意（email/password + Google）。サーバーを持たない完全な静的エクスポートなので、認証は [Firebase Authentication](https://firebase.google.com/docs/auth) を使ってクライアント側だけで動く。

1. Create a project at [Firebase console](https://console.firebase.google.com/).
2. **Build > Authentication > Sign-in method** で「メール/パスワード」と「Google」を有効化する。
3. **プロジェクトの設定 > 全般 > マイアプリ** でウェブアプリを追加し、表示された `firebaseConfig` の値を控える。
4. `.env.local.example` を `.env.local` にコピーし、控えた値を入力する。
5. Google ログインをローカルの `http://localhost:3000` や本番ドメインで使う場合、Firebase console の **Authentication > Settings > 承認済みドメイン** にそのドメインを追加する。
6. `.env.local` を設定しないままアプリを開くと、ログイン画面に「Firebase が未設定です」という案内が出てログインできません。

Apple でのログインは、Apple Developer Program(年額 $99)への登録が必要なため未実装です。登録後、Firebase の Sign-in method で「Apple」を有効化し、`src/components/auth/LoginScreen.tsx` の Apple ボタンを有効化・実装してください。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
