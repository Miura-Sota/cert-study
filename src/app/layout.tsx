import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SHARE_TEXT, SHARE_TITLE } from "@/lib/share";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SHARE_TITLE,
  description: SHARE_TEXT,
  // 共有されたリンクが LINE や X で「ただの URL」ではなくカードとして出るようにする。
  openGraph: {
    type: "website",
    siteName: SHARE_TITLE,
    title: SHARE_TITLE,
    description: SHARE_TEXT,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: SHARE_TITLE,
    description: SHARE_TEXT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
