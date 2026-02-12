import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-lg font-semibold">忘记密码 / 重置密码</h1>
        <p className="mb-4 text-xs text-slate-500">
          请输入管理员提供的重置令牌、新密码以及您的用户名。
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

