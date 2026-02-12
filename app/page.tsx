"use client";

import { useEffect, useMemo, useState } from "react";
import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (!loginOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoginOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loginOpen]);

  return (
    <div className="min-h-screen bg-primary-light">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            AI
          </div>
          <div className="leading-tight">
            <div className="text-4xl font-semibold text-slate-900">
              策划大师
            </div>
            <div className="text-xs text-slate-500">多智能体 · 知识工作流</div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-black/5 hover:bg-slate-50"
          onClick={() => setLoginOpen(true)}
        >
          登录
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
              更快地写作、规划与产出
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
              用一套清晰的智能体能力，帮你把想法变成可执行方案。从产品一页纸到课程逐字稿，少走弯路，稳定交付。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-primary inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm"
                onClick={() => setLoginOpen(true)}
              >
                开始使用
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="rounded-xl bg-white/70 p-4 ring-1 ring-black/5">
                <div className="text-slate-900 font-semibold">结构化产出</div>
                <div className="mt-1">用模板与流程稳定生成高质量内容</div>
              </div>
              <div className="rounded-xl bg-white/70 p-4 ring-1 ring-black/5">
                <div className="text-slate-900 font-semibold">可控可复用</div>
                <div className="mt-1">历史对话沉淀为资产，随时复盘</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-white/40 blur-2xl" />
            <div className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  预览
                </div>
                <div className="text-xs text-slate-500">一键开始</div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-primary-light p-4">
                  <div className="text-xs font-semibold text-slate-700">
                    产品一页纸
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    用 1 页说明清楚：用户、场景、价值与里程碑
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-700">
                    四件事
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    目标 · 路径 · 阻碍 · 行动，马上落地
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-700">
                    课程逐字稿
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    讲给用户听的版本：更顺、更清晰、更有节奏
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
                <div className="text-sm font-semibold">准备好了吗？</div>
                <button
                  type="button"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                  onClick={() => setLoginOpen(true)}
                >
                  登录开始
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-14 flex w-full max-w-6xl items-center border-t border-black/5 px-0 pt-6 text-xs text-slate-500">
          <div>© {year} 策划大师</div>
        </footer>
      </main>

      {loginOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 md:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setLoginOpen(false)}
            aria-label="关闭"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/10">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-base font-semibold text-slate-900">
                登录
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setLoginOpen(false)}
              >
                关闭
              </button>
            </div>
            <LoginForm />
          </div>
        </div>
      ) : null}
    </div>
  );
}
