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

type AgentPromptRow = {
  id: number;
  slug: string;
  name: string;
  systemPrompt: string;
};

type CourseRuleRow = {
  id: number;
  name: string;
  lesson_count: number;
  rule_content: string;
  created_at: string;
  updated_at: string;
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
  const [tab, setTab] = useState<
    "ai" | "users" | "logs" | "roles" | "theme" | "prompts" | "course-rules"
  >("users");
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
  const [editingRole, setEditingRole] = useState<AgentRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleAgentIds, setEditRoleAgentIds] = useState<number[]>([]);
  const [savingRoleEdit, setSavingRoleEdit] = useState(false);
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
  const [agentPrompts, setAgentPrompts] = useState<AgentPromptRow[] | null>(
    null
  );
  const [agentPromptDraft, setAgentPromptDraft] = useState<
    Record<string, string>
  >({});
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [savingPromptSlug, setSavingPromptSlug] = useState<string | null>(null);

  const [courseRules, setCourseRules] = useState<CourseRuleRow[]>([]);
  const [loadingCourseRules, setLoadingCourseRules] = useState(false);
  const [creatingCourseRule, setCreatingCourseRule] = useState(false);
  const [savingCourseRuleEdit, setSavingCourseRuleEdit] = useState(false);
  const [newCourseRule, setNewCourseRule] = useState({
    name: "",
    lesson_count: 0,
    rule_content: ""
  });
  const [editingCourseRule, setEditingCourseRule] = useState<CourseRuleRow | null>(
    null
  );

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

  useEffect(() => {
    if (currentUser.role !== "super_admin") return;
    if (tab !== "prompts") return;
    if (loadingPrompts) return;
    if (agentPrompts) return;
    reloadPrompts();
  }, [agentPrompts, currentUser.role, loadingPrompts, tab]);

  useEffect(() => {
    if (tab === "course-rules") {
      reloadCourseRules();
    }
  }, [tab]);

  const reloadCourseRules = async () => {
    setLoadingCourseRules(true);
    setError(null);
    try {
      const res = await fetch("/api/course-rules");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const list: CourseRuleRow[] = await res.json();
      setCourseRules(list);
    } catch (e: any) {
      setError(e.message ?? "加载课纲规则失败");
    } finally {
      setLoadingCourseRules(false);
    }
  };

  const handleCreateCourseRule = async () => {
    if (!newCourseRule.name || !newCourseRule.rule_content || newCourseRule.lesson_count <= 0) {
      setError("请填写所有字段，课纲节数必须大于0");
      return;
    }
    setCreatingCourseRule(true);
    setError(null);
    try {
      const res = await fetch("/api/course-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourseRule)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setNewCourseRule({ name: "", lesson_count: 0, rule_content: "" });
      await reloadCourseRules();
    } catch (e: any) {
      setError(e.message ?? "创建课纲规则失败");
    } finally {
      setCreatingCourseRule(false);
    }
  };

  const handleSaveCourseRuleEdit = async () => {
    if (!editingCourseRule) return;
    if (!editingCourseRule.name || !editingCourseRule.rule_content || editingCourseRule.lesson_count <= 0) {
      setError("请填写所有字段，课纲节数必须大于0");
      return;
    }
    setSavingCourseRuleEdit(true);
    setError(null);
    try {
      const res = await fetch(`/api/course-rules/${editingCourseRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourseRule)
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setEditingCourseRule(null);
      await reloadCourseRules();
    } catch (e: any) {
      setError(e.message ?? "更新课纲规则失败");
    } finally {
      setSavingCourseRuleEdit(false);
    }
  };

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

  const reloadPrompts = async () => {
    setLoadingPrompts(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agent-prompts?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const list: AgentPromptRow[] = await res.json();
      setAgentPrompts(list);
      const nextDraft: Record<string, string> = {};
      for (const item of list) {
        nextDraft[item.slug] = item.systemPrompt ?? "";
      }
      setAgentPromptDraft(nextDraft);
    } catch (e: any) {
      setError(e.message ?? "加载提示词失败");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleSavePrompt = async (slug: string) => {
    const systemPrompt = String(agentPromptDraft[slug] ?? "");
    if (!systemPrompt.trim()) {
      setError("提示词不能为空");
      return;
    }
    setSavingPromptSlug(slug);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, systemPrompt })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await reloadPrompts();
    } catch (e: any) {
      setError(e.message ?? "保存提示词失败");
    } finally {
      setSavingPromptSlug(null);
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

  const handleOpenEditRole = (role: AgentRole) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleAgentIds(role.agentIds);
    setError(null);
  };

  const handleToggleEditRoleAgent = (agentId: number) => {
    setEditRoleAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSaveRoleEdit = async () => {
    if (!editingRole) return;
    const name = editRoleName.trim();
    if (!name) {
      setError("角色名称不能为空");
      return;
    }
    if (editRoleAgentIds.length === 0) {
      setError("请至少选择一个智能体");
      return;
    }
    setSavingRoleEdit(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRole.id,
          name,
          agentIds: editRoleAgentIds
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setEditingRole(null);
      await reloadRoles();
    } catch (e: any) {
      setError(e.message ?? "修改角色失败");
    } finally {
      setSavingRoleEdit(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm("确定要删除该角色吗？")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleId })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await reloadRoles();
    } catch (e: any) {
      setError(e.message ?? "删除角色失败");
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
    <div className="flex h-screen w-screen overflow-hidden bg-sidebar p-2 md:p-8">
      <div className="mx-auto w-full max-w-5xl h-full flex flex-col rounded-2xl bg-white p-4 md:p-8 shadow-sm overflow-hidden border border-sidebar-active/40">
        <div className="mb-8 flex flex-none items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sidebar-text">系统管理中心</h1>
            <p className="mt-1.5 text-xs text-sidebar-text opacity-60 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              当前登录：<span className="font-semibold opacity-100">{currentUser.username}</span>
              <span className="px-1.5 py-0.5 rounded bg-sidebar border border-sidebar-active text-[10px]">{currentUser.role}</span>
            </p>
          </div>
          <button
            type="button"
            className="group flex items-center gap-2 rounded-xl border border-sidebar-active px-4 py-2 text-xs font-medium text-sidebar-text opacity-70 transition-all hover:opacity-100 hover:bg-sidebar"
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
            ...(currentUser.role === "super_admin"
              ? [
                  {
                    id: "prompts",
                    label: "提示词配置",
                    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  }
                ]
              : []),
            {
              id: "course-rules",
              label: "课纲规则设置",
              icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            },
            { id: "theme", label: "界面风格", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                tab === item.id
                  ? "bg-primary text-white"
                  : "text-sidebar-text opacity-60 hover:opacity-100 hover:bg-sidebar"
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
          <div className="mb-4 flex flex-none items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">

        {tab === "users" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-3 text-sm font-semibold text-sidebar-text">新增用户</div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    用户名
                  </label>
                  <input
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
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
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    初始密码
                  </label>
                  <input
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
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
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    权限
                  </label>
                  <select
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
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
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    角色
                  </label>
                  <select
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
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
                className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                disabled={creatingUser}
                onClick={handleCreateUser}
              >
                {creatingUser ? "创建中..." : "创建用户"}
              </button>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-sidebar-text">用户列表</div>
              <div className="overflow-x-auto rounded-xl border border-sidebar-active/40">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-sidebar">
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">ID</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">用户名</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">权限</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">角色</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">状态</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">创建时间</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userRow) => (
                      <tr key={userRow.id} className="border-b border-sidebar-active/20 hover:bg-sidebar/40 transition-colors">
                        <td className="px-3 py-2 text-sidebar-text">
                          {userRow.id}
                        </td>
                        <td className="px-3 py-2 font-medium text-sidebar-text">
                          {userRow.username}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="rounded-lg border border-sidebar-active/60 bg-white px-2 py-1 text-[11px] text-sidebar-text outline-none"
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
                        <td className="px-3 py-2">
                          <select
                            className="rounded-lg border border-sidebar-active/60 bg-white px-2 py-1 text-[11px] text-sidebar-text outline-none"
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
                        <td className="px-3 py-2">
                          {userRow.is_deleted ? (
                            <span className="text-red-500">已删除</span>
                          ) : userRow.is_active ? (
                            <span className="text-green-600">可登录</span>
                          ) : (
                            <span className="text-sidebar-text opacity-40">禁止登录</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sidebar-text opacity-60">
                          {new Date(userRow.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {!userRow.is_deleted ? (
                              <>
                                <button
                                  type="button"
                                  className="rounded-lg border border-sidebar-active/60 px-2 py-1 text-sidebar-text hover:bg-sidebar transition-colors disabled:opacity-30"
                                  onClick={() => handleSaveUserRow(userRow)}
                                  disabled={userRow.role === "super_admin"}
                                >
                                  保存修改
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-sidebar-active/60 px-2 py-1 text-sidebar-text hover:bg-sidebar transition-colors disabled:opacity-30"
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
                                className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
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
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-3 text-sm font-semibold text-sidebar-text">新增角色</div>
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
                          className={`rounded-lg px-3 py-1.5 text-[11px] transition-colors ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-sidebar-active/60 text-sidebar-text hover:bg-sidebar-active"
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
                className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                disabled={creatingRole}
                onClick={handleCreateRole}
              >
                {creatingRole ? "创建中..." : "创建角色"}
              </button>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-sidebar-text">角色列表</div>
                <button
                  type="button"
                  className="rounded-lg border border-sidebar-active/60 px-3 py-1.5 text-xs text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar transition-all"
                  onClick={reloadRoles}
                  disabled={loadingRoles}
                >
                  {loadingRoles ? "刷新中..." : "刷新"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-sidebar-active/40">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-sidebar">
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">角色名称</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">包含的智能体</th>
                      {(currentUser.role === "admin" ||
                        currentUser.role === "super_admin") && (
                        <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">操作</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {agentRoles.map((role) => {
                      const names = agents
                        .filter((agent) => role.agentIds.includes(agent.id))
                        .map((agent) => agent.name)
                        .join("、");
                      return (
                        <tr key={role.id} className="border-b border-sidebar-active/20 hover:bg-sidebar/40 transition-colors">
                          <td className="px-3 py-2 font-medium text-sidebar-text">{role.name}</td>
                          <td className="px-3 py-2 text-sidebar-text opacity-70">
                            {names || "（未配置）"}
                          </td>
                          {(currentUser.role === "admin" ||
                            currentUser.role === "super_admin") && (
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  className="rounded-lg border border-sidebar-active/60 px-2 py-1 text-sidebar-text hover:bg-sidebar transition-colors"
                                  onClick={() => handleOpenEditRole(role)}
                                >
                                  修改
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 transition-colors"
                                  onClick={() => handleDeleteRole(role.id)}
                                >
                                  删除
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {editingRole ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-sidebar-active/40">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-sidebar-text">
                      修改角色（#{editingRole.id}）
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-sidebar-active/60 px-3 py-1 text-xs text-sidebar-text opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => setEditingRole(null)}
                      disabled={savingRoleEdit}
                    >
                      关闭
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                        角色名称
                      </label>
                      <input
                        className="w-full rounded-lg border border-sidebar-active/60 bg-sidebar px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                        value={editRoleName}
                        onChange={(event) => setEditRoleName(event.target.value)}
                        disabled={savingRoleEdit}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                        包含的智能体
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agents.map((agent) => {
                          const selected = editRoleAgentIds.includes(agent.id);
                          return (
                            <button
                              key={agent.id}
                              type="button"
                              className={`rounded-lg px-3 py-1.5 text-[11px] transition-colors ${
                                selected
                                  ? "bg-primary text-white"
                                  : "bg-sidebar-active/60 text-sidebar-text hover:bg-sidebar-active"
                              }`}
                              onClick={() =>
                                handleToggleEditRoleAgent(agent.id)
                              }
                              disabled={savingRoleEdit}
                            >
                              {agent.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-sidebar-active/60 px-4 py-1.5 text-xs text-sidebar-text opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => setEditingRole(null)}
                      disabled={savingRoleEdit}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleSaveRoleEdit}
                      disabled={savingRoleEdit}
                    >
                      {savingRoleEdit ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "ai" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-3 text-sm font-semibold text-sidebar-text">AI 配置</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    模型名称
                  </label>
                  <input
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                    value={modelName}
                    onChange={(event) => setModelName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    API Key
                  </label>
                  <input
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </div>
              </div>
              {aiSetting?.updatedAt ? (
                <div className="mt-2 text-[11px] text-sidebar-text opacity-50">
                  上次更新时间：{new Date(aiSetting.updatedAt).toLocaleString()}
                </div>
              ) : null}
              <button
                type="button"
                className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                disabled={savingAi}
                onClick={handleSaveAi}
              >
                {savingAi ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>
        ) : null}

        {tab === "prompts" && currentUser.role === "super_admin" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-3 text-sm font-semibold text-sidebar-text">提示词配置</div>
              {loadingPrompts ? <div className="text-sidebar-text opacity-50">加载中...</div> : null}
              {!loadingPrompts && agentPrompts ? (
                <div className="space-y-4">
                  {agentPrompts.map((item) => (
                    <div key={item.slug} className="rounded-xl border border-sidebar-active/40 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-sidebar-text truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-sidebar-text opacity-50 truncate">
                            {item.slug}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-sidebar-active/60 px-3 py-1.5 text-xs text-sidebar-text opacity-70 hover:opacity-100 transition-opacity"
                            disabled={savingPromptSlug === item.slug}
                            onClick={() =>
                              setAgentPromptDraft((prev) => ({
                                ...prev,
                                [item.slug]: item.systemPrompt ?? ""
                              }))
                            }
                          >
                            恢复
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={savingPromptSlug === item.slug}
                            onClick={() => handleSavePrompt(item.slug)}
                          >
                            {savingPromptSlug === item.slug ? "保存中..." : "保存"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="w-full min-h-[220px] rounded-lg border border-sidebar-active/60 bg-sidebar px-3 py-2 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30 font-mono"
                        value={agentPromptDraft[item.slug] ?? ""}
                        onChange={(event) =>
                          setAgentPromptDraft((prev) => ({
                            ...prev,
                            [item.slug]: event.target.value
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "theme" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-4 text-sm font-semibold text-sidebar-text">选择界面风格</div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { id: "orange", label: "爱马仕橙", color: "#E85D22", desc: "以橙色为主色调，彰显活力与尊贵" },
                  { id: "blue",   label: "人文暖色", color: "#2D2D2D", desc: "以暖奶油为底色，精致内敛且高雅" },
                  { id: "green",  label: "微信绿色", color: "#07C160", desc: "以绿色为主色调，亲和力强且舒适" },
                ].map((t) => (
                  <div
                    key={t.id}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      theme === t.id
                        ? "border-primary bg-primary-light"
                        : "border-sidebar-active/40 hover:border-sidebar-active"
                    }`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div className="mb-3 h-10 w-full rounded-lg" style={{ backgroundColor: t.color }}></div>
                    <div className="font-semibold text-sidebar-text">{t.label}</div>
                    <div className="mt-1 text-[11px] text-sidebar-text opacity-50">{t.desc}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-6 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                disabled={savingAi}
                onClick={handleSaveAi}
              >
                {savingAi ? "保存中..." : "应用风格配置"}
              </button>
            </div>
          </div>
        ) : null}

        {tab === "logs" ? (
          <div className="space-y-4 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-sidebar-text">操作记录（最近 100 条）</div>
              <button
                type="button"
                className="rounded-lg border border-sidebar-active/60 px-3 py-1.5 text-xs text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar transition-all"
                onClick={handleReloadLogs}
                disabled={loadingLogs}
              >
                {loadingLogs ? "刷新中..." : "刷新"}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-sidebar-active/40">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-sidebar">
                    <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">时间</th>
                    <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">用户</th>
                    <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">动作</th>
                    <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">对象</th>
                    <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-sidebar-active/20 hover:bg-sidebar/40 transition-colors">
                      <td className="px-3 py-2 text-sidebar-text opacity-60">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-medium text-sidebar-text">
                        {log.username ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-sidebar-text">{log.action}</td>
                      <td className="px-3 py-2 text-sidebar-text opacity-70">
                        {log.target_type ?? "-"}
                        {log.target_id ? `#${log.target_id}` : ""}
                      </td>
                      <td className="px-3 py-2 text-sidebar-text opacity-60 max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "course-rules" ? (
          <div className="space-y-6 text-xs">
            <div className="rounded-xl border border-sidebar-active/40 bg-sidebar p-4">
              <div className="mb-3 text-sm font-semibold text-sidebar-text">
                {editingCourseRule ? "编辑课纲规则" : "增加课纲规则"}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    课纲规则名称
                  </label>
                  <input
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                    value={editingCourseRule ? editingCourseRule.name : newCourseRule.name}
                    onChange={(event) =>
                      editingCourseRule
                        ? setEditingCourseRule({ ...editingCourseRule, name: event.target.value })
                        : setNewCourseRule({ ...newCourseRule, name: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    课纲节数
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-sidebar-active/60 bg-white px-3 py-1.5 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                    value={editingCourseRule ? editingCourseRule.lesson_count : newCourseRule.lesson_count}
                    onChange={(event) =>
                      editingCourseRule
                        ? setEditingCourseRule({ ...editingCourseRule, lesson_count: Number(event.target.value) })
                        : setNewCourseRule({ ...newCourseRule, lesson_count: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-sidebar-text opacity-50">
                    课纲规则字段数据
                  </label>
                  <textarea
                    className="w-full h-32 rounded-lg border border-sidebar-active/60 bg-white px-3 py-2 text-xs text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30 font-mono"
                    value={editingCourseRule ? editingCourseRule.rule_content : newCourseRule.rule_content}
                    onChange={(event) =>
                      editingCourseRule
                        ? setEditingCourseRule({ ...editingCourseRule, rule_content: event.target.value })
                        : setNewCourseRule({ ...newCourseRule, rule_content: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={creatingCourseRule || savingCourseRuleEdit}
                  onClick={editingCourseRule ? handleSaveCourseRuleEdit : handleCreateCourseRule}
                >
                  {creatingCourseRule || savingCourseRuleEdit ? "保存中..." : editingCourseRule ? "保存修改" : "增加课纲规则"}
                </button>
                {editingCourseRule && (
                  <button
                    type="button"
                    className="rounded-lg border border-sidebar-active/60 px-4 py-1.5 text-xs text-sidebar-text opacity-70 hover:opacity-100 transition-opacity"
                    onClick={() => setEditingCourseRule(null)}
                  >
                    取消修改
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-sidebar-text">课纲规则列表</div>
              <div className="overflow-x-auto rounded-xl border border-sidebar-active/40">
                <table className="min-w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-sidebar">
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">ID</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">名称</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">节数</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">规则数据</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">创建时间</th>
                      <th className="border-b border-sidebar-active/30 px-3 py-2 text-left text-[10px] uppercase tracking-wider text-sidebar-text opacity-50 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCourseRules ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-sidebar-text opacity-50">
                          加载中...
                        </td>
                      </tr>
                    ) : courseRules.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-sidebar-text opacity-50">
                          暂无数据
                        </td>
                      </tr>
                    ) : (
                      courseRules.map((rule) => (
                        <tr key={rule.id} className="border-b border-sidebar-active/20 hover:bg-sidebar/40 transition-colors">
                          <td className="px-3 py-2 text-sidebar-text opacity-60">{rule.id}</td>
                          <td className="px-3 py-2 font-medium text-sidebar-text">{rule.name}</td>
                          <td className="px-3 py-2 text-sidebar-text">{rule.lesson_count}</td>
                          <td className="px-3 py-2 max-w-xs truncate text-sidebar-text opacity-60" title={rule.rule_content}>
                            {rule.rule_content}
                          </td>
                          <td className="px-3 py-2 text-sidebar-text opacity-60">
                            {new Date(rule.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="rounded-lg border border-sidebar-active/60 px-2 py-1 text-sidebar-text hover:bg-sidebar transition-colors"
                              onClick={() => {
                                setEditingCourseRule(rule);
                                const container = document.querySelector('.overflow-y-auto');
                                if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              修改
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
};
