"use client";

import { useState } from "react";

export default function ResetPasswordForm() {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token, newPassword })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setMessage("密码已重置，请使用新密码登录");
      setUsername("");
      setToken("");
      setNewPassword("");
    } catch (e: any) {
      setError(e.message ?? "重置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm text-slate-700">
          用户名
        </label>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-700">
          重置令牌
        </label>
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-700">
          新密码
        </label>
        <input
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-600">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "提交中..." : "重置密码"}
      </button>
    </form>
  );
}

