import "./globals.css";
import type { ReactNode } from "react";
import { query } from "@/lib/db";

export const metadata = {
  title: "AI 对话应用",
  description: "基于 Next.js 的多智能体对话系统"
};

async function getTheme() {
  try {
    const rows = await query("SELECT theme FROM ai_settings ORDER BY id DESC LIMIT 1");
    return rows[0]?.theme || "blue";
  } catch (e) {
    return "blue";
  }
}

export default async function RootLayout(props: { children: ReactNode }) {
  const { children } = props;
  const theme = await getTheme();

  return (
    <html lang="zh-CN" className={theme}>
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}

