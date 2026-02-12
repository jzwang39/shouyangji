"use client";

import { useEffect, useState } from "react";

type Role = "super_admin" | "admin" | "user";

type UserInfo = {
  id: number;
  username: string;
  role: Role;
};

type AiSetting = {
  id: number;
  modelName: string;
  apiKey: string;
  theme: string;
  updatedAt: string;
} | null;

type UserRow = {
  id: number;
  username: string;
  role: Role;
  is_active: 0 | 1;
  is_deleted: 0 | 1;
  created_at: string;
};

type LogRow = {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  metadata: any;
  created_at: string;
};

type AgentRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

type AgentRole = {
  id: number;
  name: string;
  agentIds: number[];
};

type Props = {
  currentUser: UserInfo;
  initialAiSetting: AiSetting;
  initialUsers: UserRow[];
  initialLogs: LogRow[];
  initialAgents: AgentRow[];
};

export default function SettingsApp(props: Props) {
  const { currentUser, initialAiSetting, initialUsers, initialLogs, initialAgents } =
    props;
  const [tab, setTab] = useState<"ai" | "users" | "logs" | "roles" | "theme">("users");
  const [aiSetting, setAiSetting] = useState<AiSetting>(initialAiSetting);
  const [modelName, setModelName] = useState(
    initialAiSetting?.modelName ?? ""
  );
  const [apiKey, setApiKey] = useState(initialAiSetting?.apiKey ?? "");
  const [theme, setTheme] = useState(initialAiSetting?.theme ?? "blue");
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [agents] = useState<AgentRow[]>(initialAgents);
  const [agentRoles, setAgentRoles] = useState<AgentRole[]>([]);
  const [userRoleMap, setUserRoleMap] = useState<Record<number, number | null>>(
    {}
  );
  const [userPermissionDraft, setUserPermissionDraft] = useState<
    Record<number, Role>
  >({});
  const [userAgentRoleDraft, setUserAgentRoleDraft] = useState<
    Record<number, number | null>
  >({});
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleAgentIds, setNewRoleAgentIds] = useState<number[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user" as Role
  });
  const [newUserAgentRoleId, setNewUserAgentRoleId] = useState<number | null>(
    null
  );
  const [savingAi, setSavingAi] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<number, Role> = {};
    for (const user of users) {
      map[user.id] = user.role;
    }
    setUserPermissionDraft(map);
  }, [users]);

  useEffect(() => {
    const map: Record<number, number | null> = {};
    for (const user of users) {
      map[user.id] = userRoleMap[user.id] ?? null;
    }
    setUserAgentRoleDraft(map);
  }, [userRoleMap, users]);

  useEffect(() => {
    reloadRoles();
    reloadUserRoles();
  }, []);

  const reloadRoles = async () => {
    setLoadingRoles(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-roles");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const list: AgentRole[] = await res.json();
      setAgentRoles(list);
    } catch (e: any) {
      setError(e.message ?? "加载角色失败");
    } finally {
      setLoadingRoles(false);
    }
  };

  const reloadUserRoles = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/user-agent-roles");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const list: { userId: number; roleId: number }[] = await res.json();
      const map: Record<number, number | null> = {};
      for (const row of list) {
        map[row.userId] = row.roleId;
      }
      setUserRoleMap(map);
    } catch (e: any) {
      setError(e.message ?? "加载用户角色失败");
    }
  };

  const handleToggleNewRoleAgent = (agentId: number) => {
    setNewRoleAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreateRole = async () => {
    const name = newRoleName.trim();
    if (!name) {
      setError("角色名称不能为空");
      return;
    }
    if (newRoleAgentIds.length === 0) {
      setError("请至少选择一个智能体");
      return;
    }
    setCreatingRole(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          agentIds: newRoleAgentIds
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setNewRoleName("");
      setNewRoleAgentIds([]);
      await reloadRoles();
    } catch (e: any) {
      setError(e.message ?? "创建角色失败");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleSaveAi = async () => {
    setSavingAi(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName,
          apiKey,
          theme
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      alert("保存成功");
      window.location.reload();
    } catch (e: any) {
      setError(e.message ?? "保存失败");
    } finally {
      setSavingAi(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("用户名和初始密码不能为空");
      return;
    }
    setCreatingUser(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const usersRes = await fetch("/api/admin/users");
      const list: UserRow[] = await usersRes.json();
      setUsers(list);
      if (newUserAgentRoleId !== null) {
        const created = list.find(
          (user) => user.username === newUser.username
        );
        if (created) {
          await handleUpdateUserRole(created.id, newUserAgentRoleId);
        }
      }
      setNewUser({ username: "", password: "", role: "user" });
      setNewUserAgentRoleId(null);
    } catch (e: any) {
      setError(e.message ?? "创建用户失败");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, roleId: number | null) => {
    setError(null);
    try {
      const res = await fetch("/api/admin/user-agent-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          roleId
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await reloadUserRoles();
    } catch (e: any) {
      setError(e.message ?? "更新用户角色失败");
    }
  };

  const handleUpdateUser = async (
    userId: number,
    payload: Partial<{ role: Role; isActive: boolean; password: string }>
  ) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const usersRes = await fetch("/api/admin/users");
      const list: UserRow[] = await usersRes.json();
      setUsers(list);
    } catch (e: any) {
      setError(e.message ?? "更新用户失败");
    }
  };

  const handleSaveUserRow = async (userRow: UserRow) => {
    const currentPermission = userRow.role;
    const draftPermission =
      userPermissionDraft[userRow.id] ?? currentPermission;
    const currentAgentRole = userRoleMap[userRow.id] ?? null;
    const draftAgentRole = userAgentRoleDraft[userRow.id] ?? null;

    const permissionChanged = draftPermission !== currentPermission;
    const roleChanged = draftAgentRole !== currentAgentRole;

    if (!permissionChanged && !roleChanged) {
      setError("没有修改数据");
      return;
    }

    setError(null);

    if (permissionChanged) {
      await handleUpdateUser(userRow.id, { role: draftPermission });
    }
    if (roleChanged) {
      await handleUpdateUserRole(userRow.id, draftAgentRole);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("确定要删除该用户吗？")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const usersRes = await fetch("/api/admin/users");
      const list: UserRow[] = await usersRes.json();
      setUsers(list);
    } catch (e: any) {
      setError(e.message ?? "删除用户失败");
    }
  };

  const handleReloadLogs = async () => {
    setLoadingLogs(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/operation-logs");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const list: LogRow[] = await res.json();
      setLogs(list);
    } catch (e: any) {
      setError(e.message ?? "加载操作记录失败");
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 p-2 md:p-8">
      <div className="mx-auto w-full max-w-5xl h-full flex flex-col rounded-2xl bg-white p-4 md:p-8 shadow-xl overflow-hidden border border-slate-200/50">
        <div className="mb-8 flex flex-none items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">系统管理中心</h1>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              当前登录：<span className="font-semibold text-slate-700">{currentUser.username}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] border border-slate-200">{currentUser.role}</span>
            </p>
          </div>
          <button
            type="button"
            className="group flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-primary hover:text-white"
            onClick={() => {
              window.location.href = "/chat";
            }}
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回对话
          </button>
        </div>

        <div className="mb-6 flex flex-none gap-1 overflow-x-auto pb-2 custom-scrollbar">
          {[
            { id: "users", label: "用户管理", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { id: "roles", label: "角色权限", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { id: "logs", label: "审计日志", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
            { id: "ai", label: "AI 配置", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { id: "theme", label: "界面风格", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
              onClick={() => setTab(item.id as any)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-4 flex flex-none items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 shadow-sm animate-shake">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">

        {tab === "users" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 font-semibold">新增用户</div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    用户名
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={newUser.username}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        username: event.target.value
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    初始密码
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: event.target.value
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    权限
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser((prev) => ({
                        ...prev,
                        role: event.target.value as Role
                      }))
                    }
                  >
                    <option value="user">使用者</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    角色
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={
                      newUserAgentRoleId !== null
                        ? String(newUserAgentRoleId)
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value
                        ? Number(event.target.value)
                        : null;
                      setNewUserAgentRoleId(value);
                    }}
                  >
                    <option value="">（空）</option>
                    {agentRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={creatingUser}
                onClick={handleCreateUser}
              >
                {creatingUser ? "创建中..." : "创建用户"}
              </button>
            </div>

            <div>
              <div className="mb-2 font-semibold">用户列表</div>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border-b px-2 py-1 text-left">ID</th>
                      <th className="border-b px-2 py-1 text-left">用户名</th>
                      <th className="border-b px-2 py-1 text-left">权限</th>
                      <th className="border-b px-2 py-1 text-left">角色</th>
                      <th className="border-b px-2 py-1 text-left">状态</th>
                      <th className="border-b px-2 py-1 text-left">创建时间</th>
                      <th className="border-b px-2 py-1 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userRow) => (
                      <tr key={userRow.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border-b px-2 py-1">
                          {userRow.id}
                        </td>
                        <td className="border-b px-2 py-1">
                          {userRow.username}
                        </td>
                        <td className="border-b px-2 py-1">
                          <select
                            className="rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                            value={userPermissionDraft[userRow.id] ?? userRow.role}
                            disabled={
                              userRow.role === "super_admin" ||
                              currentUser.role === "user" ||
                              (currentUser.role === "admin" &&
                                userRow.role !== "user")
                            }
                            onChange={(event) =>
                              setUserPermissionDraft((prev) => ({
                                ...prev,
                                [userRow.id]: event.target.value as Role
                              }))
                            }
                          >
                            <option value="user">使用者</option>
                            {(currentUser.role === "admin" ||
                              currentUser.role === "super_admin") && (
                              <option value="admin">管理员</option>
                            )}
                            {currentUser.role === "super_admin" &&
                              userRow.id === currentUser.id && (
                                <option value="super_admin">超级管理员</option>
                              )}
                          </select>
                        </td>
                        <td className="border-b px-2 py-1">
                          <select
                            className="rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                            value={
                              userAgentRoleDraft[userRow.id] !== undefined &&
                              userAgentRoleDraft[userRow.id] !== null
                                ? String(userAgentRoleDraft[userRow.id])
                                : ""
                            }
                            disabled={userRow.role === "super_admin"}
                            onChange={(event) => {
                              const value = event.target.value
                                ? Number(event.target.value)
                                : null;
                              setUserAgentRoleDraft((prev) => ({
                                ...prev,
                                [userRow.id]: value
                              }));
                            }}
                          >
                            <option value="">（空）</option>
                            {agentRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-b px-2 py-1">
                          {userRow.is_deleted ? (
                            <span className="text-red-500">已删除</span>
                          ) : userRow.is_active ? (
                            <span className="text-green-600">可登录</span>
                          ) : (
                            <span className="text-slate-500">禁止登录</span>
                          )}
                        </td>
                        <td className="border-b px-2 py-1">
                          {new Date(userRow.created_at).toLocaleString()}
                        </td>
                        <td className="border-b px-2 py-1">
                          <div className="flex flex-wrap gap-1">
                            {!userRow.is_deleted ? (
                              <>
                                <button
                                  type="button"
                                  className="rounded border px-1 py-0.5"
                                  onClick={() => handleSaveUserRow(userRow)}
                                  disabled={userRow.role === "super_admin"}
                                >
                                  保存修改
                                </button>
                                <button
                                  type="button"
                                  className="rounded border px-1 py-0.5"
                                  onClick={() =>
                                    handleUpdateUser(userRow.id, {
                                      isActive: !userRow.is_active
                                    })
                                  }
                                  disabled={userRow.role === "super_admin"}
                                >
                                  {userRow.is_active ? "禁止登录" : "允许登录"}
                                </button>
                              </>
                            ) : null}
                            {!userRow.is_deleted &&
                            userRow.role !== "super_admin" ? (
                              <button
                                type="button"
                                className="rounded border px-1 py-0.5 text-red-500"
                                disabled={
                                  currentUser.role === "admin" &&
                                  userRow.role === "admin"
                                }
                                onClick={() => handleDeleteUser(userRow.id)}
                              >
                                删除
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "roles" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 font-semibold">新增角色</div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    角色名称
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 block text-[11px] text-slate-600">
                    包含的智能体
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agents.map((agent) => {
                      const selected = newRoleAgentIds.includes(agent.id);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          className={`rounded px-2 py-1 text-[11px] ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                          onClick={() => handleToggleNewRoleAgent(agent.id)}
                        >
                          {agent.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={creatingRole}
                onClick={handleCreateRole}
              >
                {creatingRole ? "创建中..." : "创建角色"}
              </button>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">角色列表</div>
                <button
                  type="button"
                  className="rounded border px-2 py-1"
                  onClick={reloadRoles}
                  disabled={loadingRoles}
                >
                  {loadingRoles ? "刷新中..." : "刷新"}
                </button>
              </div>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border-b px-2 py-1 text-left">角色名称</th>
                      <th className="border-b px-2 py-1 text-left">
                        包含的智能体
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentRoles.map((role) => {
                      const names = agents
                        .filter((agent) => role.agentIds.includes(agent.id))
                        .map((agent) => agent.name)
                        .join("、");
                      return (
                        <tr
                          key={role.id}
                          className="odd:bg-white even:bg-slate-50"
                        >
                          <td className="border-b px-2 py-1">{role.name}</td>
                          <td className="border-b px-2 py-1">
                            {names || "（未配置）"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "ai" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 font-semibold">AI 配置</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    模型名称
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={modelName}
                    onChange={(event) => setModelName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    API Key
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </div>
              </div>
              {aiSetting?.updatedAt ? (
                <div className="mt-2 text-[11px] text-slate-500">
                  上次更新时间：{new Date(aiSetting.updatedAt).toLocaleString()}
                </div>
              ) : null}
              <button
                type="button"
                className="mt-3 rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={savingAi}
                onClick={handleSaveAi}
              >
                {savingAi ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        ) : null}

        {tab === "theme" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded border border-slate-200 p-3">
              <div className="mb-2 font-semibold text-sm">选择界面风格</div>
              <div className="grid gap-6 md:grid-cols-3">
                <div 
                  className={`cursor-pointer rounded border-2 p-4 transition-all ${
                    theme === "orange" ? "border-primary bg-primary-light" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setTheme("orange")}
                >
                  <div className="mb-3 h-12 w-full rounded bg-[#E85D22]"></div>
                  <div className="font-semibold">爱马仕橙</div>
                  <div className="mt-1 text-[11px] text-slate-500">以橙色为主色调，彰显活力与尊贵</div>
                </div>
                <div 
                  className={`cursor-pointer rounded border-2 p-4 transition-all ${
                    theme === "blue" ? "border-primary bg-primary-light" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setTheme("blue")}
                >
                  <div className="mb-3 h-12 w-full rounded bg-[#0284c7]"></div>
                  <div className="font-semibold">经典蓝色</div>
                  <div className="mt-1 text-[11px] text-slate-500">以蓝色为主色调，简约专业且稳重</div>
                </div>
                <div 
                  className={`cursor-pointer rounded border-2 p-4 transition-all ${
                    theme === "green" ? "border-primary bg-primary-light" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setTheme("green")}
                >
                  <div className="mb-3 h-12 w-full rounded bg-[#07C160]"></div>
                  <div className="font-semibold">微信绿色</div>
                  <div className="mt-1 text-[11px] text-slate-500">以绿色为主色调，亲和力强且舒适</div>
                </div>
              </div>
              <button
                type="button"
                className="mt-6 rounded bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={savingAi}
                onClick={handleSaveAi}
              >
                {savingAi ? "保存中..." : "应用风格配置"}
              </button>
            </div>
          </div>
        ) : null}

        {tab === "logs" ? (
          <div className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="font-semibold">操作记录（最近 100 条）</div>
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={handleReloadLogs}
                disabled={loadingLogs}
              >
                {loadingLogs ? "刷新中..." : "刷新"}
              </button>
            </div>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b px-2 py-1 text-left">时间</th>
                    <th className="border-b px-2 py-1 text-left">用户</th>
                    <th className="border-b px-2 py-1 text-left">动作</th>
                    <th className="border-b px-2 py-1 text-left">对象</th>
                    <th className="border-b px-2 py-1 text-left">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border-b px-2 py-1">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="border-b px-2 py-1">
                        {log.username ?? "-"}
                      </td>
                      <td className="border-b px-2 py-1">{log.action}</td>
                      <td className="border-b px-2 py-1">
                        {log.target_type ?? "-"}
                        {log.target_id ? `#${log.target_id}` : ""}
                      </td>
                      <td className="border-b px-2 py-1">
                        {log.metadata
                          ? JSON.stringify(log.metadata)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
};
