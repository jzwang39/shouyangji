"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("请输入新密码并确认");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setMessage("密码修改成功，请使用新密码重新登录");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e.message ?? "修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm text-slate-700">
          原密码
        </label>
        <input
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
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
      <div>
        <label className="mb-1 block text-sm text-slate-700">
          确认新密码
        </label>
        <input
          type="password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
        {loading ? "提交中..." : "保存"}
      </button>
    </form>
  );
}
