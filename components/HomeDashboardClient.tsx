"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Agent = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  system_prompt: string | null;
};

type MenuKey = "outline-extraction" | "data-management";

type Props = {
  user: {
    username: string;
    role: "super_admin" | "admin" | "user";
  };
  agents: Agent[];
  allowedMenuKeys: string[];
};

type HomeCardItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  href: string;
};

const COURSE_SLUGS = new Set([
  "product-one-pager",
  "positioning-helper",
  "four-things",
  "nine-grid",
  "guixin-transaction",
  "course-outline",
  "course-transcript",
  "product-one-pager-series",
  "course-outline-single-methodology",
  "course-transcript-single-methodology",
  "product-one-pager-xingyuefeng",
  "course-outline-xingyuefeng",
  "course-transcript-xingyuefeng"
]);

const TRUST_SLUGS = new Set([
  "trust-blueprint",
  "trust-persona",
  "trust-warning",
  "trust-decrypt",
  "trust-product",
  "trust-barrier",
  "trust-negotiation",
  "trust-transaction"
]);

const MATERIAL_SLUGS = new Set([
  "material-tagging-assistant",
  "deterministic-material-capture-assistant",
  "crisis-material-capture-assistant",
  "science-popularization-material-capture-assistant",
  "keyword-material-capture-assistant"
]);

const CONTENT_SLUGS = new Set(["article-clone"]);
const EXPERIMENT_SLUGS = new Set(["experiment-design-assistant"]);
const FEATURED_SLUGS = [
  "new-chat-agent",
  "product-one-pager",
  "course-outline",
  "trust-transaction"
];

const AGENT_DESCRIPTION_FALLBACKS: Record<string, string> = {
  "new-chat-agent": "适用于开放式问答、分析、写作和通用业务支持，适合作为默认起点。",
  "product-one-pager": "快速生成单一产品的一页纸方案，沉淀清晰、可执行的产品表达。",
  "positioning-helper": "梳理定位、价值与差异化，明确产品或方案的核心表达。",
  "four-things": "围绕关键框架输出清晰策略，快速得到结构化结果。",
  "nine-grid": "用九宫格方式组织复杂信息，提升方案可读性与传播力。",
  "guixin-transaction": "围绕归心成交逻辑，输出更聚焦的成交表达与承接方案。",
  "course-outline": "生成多方法论课程大纲，帮助快速搭建完整课程结构。",
  "course-transcript": "生成多方法论课程逐字稿，适合直接用于讲解与表达。",
  "product-one-pager-series": "面向产品系列场景，输出统一又有层次的产品表达。",
  "course-outline-single-methodology": "生成产品系列课纲，适合单方法论或产品系列课程设计。",
  "course-transcript-single-methodology": "生成产品系列逐字稿，适合直接落地讲解。",
  "product-one-pager-xingyuefeng": "面向星月蜂场景快速生成一页纸表达内容。",
  "course-outline-xingyuefeng": "生成星月蜂专用课程大纲。",
  "course-transcript-xingyuefeng": "生成星月蜂专用课程逐字稿。",
  "article-clone": "拆解原文风格并生成高相似表达，用于仿写、迁移与再创作。",
  "material-tagging-assistant": "对素材进行结构化标记与整理，方便后续检索与加工。",
  "deterministic-material-capture-assistant": "从来源内容中稳定、准确地提取目标素材。",
  "crisis-material-capture-assistant": "提取危机相关素材与风险信息，便于后续应对与复盘。",
  "science-popularization-material-capture-assistant": "抓取与整理科普内容，方便后续内容生产。",
  "keyword-material-capture-assistant": "围绕关键词精准抓取素材，提升筛选效率。",
  "experiment-design-assistant": "设计现场演示实验与验证方案，帮助快速构建实验思路。",
  "trust-blueprint": "围绕信任建立路径，输出系统化的信任蓝图。",
  "trust-persona": "打造可信的人设表达，强化讲师或品牌的专业与说服力。",
  "trust-warning": "通过风险提醒与认知警醒，建立转化前的信任基础。",
  "trust-decrypt": "拆解用户信任机制，明确影响决策的关键因子。",
  "trust-product": "放大产品价值与证据链，提升产品层面的信任感。",
  "trust-barrier": "构建差异化与壁垒表达，强化不可替代性。",
  "trust-negotiation": "围绕异议处理与谈判场景，提升成交推进效率。",
  "trust-transaction": "聚焦临门成交表达，强化收口与转化动作。"
};

const FUNCTION_CARDS: Array<{
  key: MenuKey;
  name: string;
  description: string;
}> = [
  {
    key: "outline-extraction",
    name: "大纲提取",
    description: "自动合并章节文稿并提炼大纲，适合快速整理多份内容。"
  },
  {
    key: "data-management",
    name: "数据管理",
    description: "统一查看和管理已保存结果，方便检索、复用与二次加工。"
  }
];

const SECTION_CONFIG = [
  {
    id: "featured",
    label: "核心入口",
    description: "优先展示最常用的起始能力和高频工作流。"
  },
  {
    id: "course",
    label: "系列产品",
    description: "围绕产品表达、定位、课纲和逐字稿等场景快速启动。"
  },
  {
    id: "trust",
    label: "信任成交",
    description: "覆盖信任建立、壁垒设计、谈判推进与临门成交。"
  },
  {
    id: "material",
    label: "素材管理",
    description: "围绕素材标记、抓取、整理和科普内容生产进行分工。"
  },
  {
    id: "content",
    label: "内容创作",
    description: "聚焦文章风格迁移、克隆与再创作。"
  },
  {
    id: "experiment",
    label: "实验设计",
    description: "面向演示实验设计与表达验证场景。"
  },
  {
    id: "functions",
    label: "功能模块",
    description: "进入系统功能型工作区，统一处理提取与管理任务。"
  }
] as const;

function buildAgentHref(slug: string) {
  return `/chat?agent=${encodeURIComponent(slug)}&mode=new`;
}

function buildFunctionHref(key: MenuKey) {
  return `/chat?panel=${encodeURIComponent(key)}`;
}

function getAgentDescription(agent: Agent) {
  const description = String(agent.description ?? "").trim();
  if (description) return description;
  return AGENT_DESCRIPTION_FALLBACKS[agent.slug] ?? "点击后进入对应能力的新建工作区。";
}

function getSectionAgents(agents: Agent[], slugs: Set<string>) {
  return agents.filter((agent) => slugs.has(agent.slug));
}

function toHomeCardItems(agents: Agent[]): HomeCardItem[] {
  return agents.map((agent) => ({
    id: String(agent.id),
    title: agent.name,
    slug: agent.slug,
    description: getAgentDescription(agent),
    href: buildAgentHref(agent.slug)
  }));
}

function MenuIcon({ type }: { type: "home" | "function" | "settings" | "logout" }) {
  if (type === "home") {
    return (
      <svg
        className="h-4 w-4 shrink-0 opacity-80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }
  if (type === "settings") {
    return (
      <svg
        className="h-4 w-4 shrink-0 opacity-80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    );
  }
  if (type === "logout") {
    return (
      <svg
        className="h-4 w-4 shrink-0 opacity-80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 16l4-4-4-4" />
        <path d="M21 12H9" />
        <path d="M13 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7" />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 shrink-0 opacity-80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M8 3v4" />
      <path d="M16 10v4" />
      <path d="M12 17v4" />
    </svg>
  );
}

function DashboardIcon({
  slug,
  className
}: {
  slug: string;
  className?: string;
}) {
  const iconClassName = className ?? "h-5 w-5";

  if (slug === "new-chat-agent") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (TRUST_SLUGS.has(slug)) {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }

  if (MATERIAL_SLUGS.has(slug)) {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
        <path d="m17 14 3 3-3 3" />
      </svg>
    );
  }

  if (slug === "experiment-design-assistant") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2v7.31" />
        <path d="M14 9.3V2" />
        <path d="M8.5 2h7" />
        <path d="M14 9.3 19.74 19a1 1 0 0 1-.86 1.5H5.12A1 1 0 0 1 4.26 19L10 9.3" />
      </svg>
    );
  }

  if (slug === "article-clone") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 4h6v6" />
        <path d="M10 20H4v-6" />
        <path d="M20 4 9 15" />
        <path d="m14 20 6-6" />
        <path d="M4 10 10 4" />
      </svg>
    );
  }

  if (slug === "outline-extraction") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
        <path d="M15 3v6h6" />
        <path d="M8 12h8" />
        <path d="M8 16h6" />
      </svg>
    );
  }

  if (slug === "data-management") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h16" />
        <path d="M8 3v4" />
        <path d="M16 10v4" />
        <path d="M12 17v4" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClassName}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function getIconWrapperClass(slug: string) {
  if (slug === "new-chat-agent") return "bg-blue-50 text-blue-600";
  if (TRUST_SLUGS.has(slug)) return "bg-emerald-50 text-emerald-600";
  if (MATERIAL_SLUGS.has(slug)) return "bg-amber-50 text-amber-600";
  if (slug === "experiment-design-assistant") return "bg-violet-50 text-violet-600";
  if (slug === "article-clone") return "bg-pink-50 text-pink-600";
  if (slug === "outline-extraction" || slug === "data-management") {
    return "bg-slate-100 text-slate-700";
  }
  return "bg-primary-light text-primary";
}

function AgentSidebarButton({
  agent,
  compact = false
}: {
  agent: Agent;
  compact?: boolean;
}) {
  return (
    <Link
      href={buildAgentHref(agent.slug)}
      className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-hover ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-2.5 text-xs"
      }`}
    >
      <DashboardIcon slug={agent.slug} className="h-4 w-4 shrink-0 opacity-80" />
      <span className="truncate">{agent.name}</span>
    </Link>
  );
}

function FunctionSidebarButton({
  label,
  href,
  compact = false
}: {
  label: string;
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-hover ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-2.5 text-xs"
      }`}
    >
      <MenuIcon type="function" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function HomeDashboardClient(props: Props) {
  const { user, agents, allowedMenuKeys } = props;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const featuredAgents = useMemo(
    () =>
      FEATURED_SLUGS.map((slug) => agents.find((agent) => agent.slug === slug)).filter(
        (agent): agent is Agent => !!agent
      ),
    [agents]
  );
  const functionCards = useMemo(
    () => FUNCTION_CARDS.filter((item) => allowedMenuKeys.includes(item.key)),
    [allowedMenuKeys]
  );
  const sidebarFunctionCards = useMemo(
    () => functionCards.filter((item) => item.key !== "outline-extraction"),
    [functionCards]
  );
  const canAccessOutlineExtraction = functionCards.some(
    (item) => item.key === "outline-extraction"
  );
  const outlineExtractionDescription =
    FUNCTION_CARDS.find((item) => item.key === "outline-extraction")?.description ??
    "自动合并章节文稿并提炼大纲，适合快速整理多份内容。";
  const outlineExtractionCard = canAccessOutlineExtraction
    ? {
        id: "outline-extraction",
        title: "大纲提取",
        slug: "outline-extraction",
        description: outlineExtractionDescription,
        href: buildFunctionHref("outline-extraction")
      }
    : null;

  const sections = useMemo(
    () => [
      {
        id: "course",
        label: "系列产品",
        description: "围绕产品表达、定位、课纲和逐字稿等场景快速启动。",
        items: toHomeCardItems(getSectionAgents(agents, COURSE_SLUGS))
      },
      {
        id: "trust",
        label: "信任成交",
        description: "覆盖信任建立、壁垒设计、谈判推进与临门成交。",
        items: toHomeCardItems(getSectionAgents(agents, TRUST_SLUGS))
      },
      {
        id: "material",
        label: "素材管理",
        description: "围绕素材标记、抓取、整理和科普内容生产进行分工。",
        items: toHomeCardItems(getSectionAgents(agents, MATERIAL_SLUGS))
      },
      {
        id: "content",
        label: "内容创作",
        description: "聚焦文章风格迁移、克隆与再创作。",
        items: [
          ...toHomeCardItems(getSectionAgents(agents, CONTENT_SLUGS)),
          ...(outlineExtractionCard ? [outlineExtractionCard] : [])
        ]
      },
      {
        id: "experiment",
        label: "实验设计",
        description: "面向演示实验设计与表达验证场景。",
        items: toHomeCardItems(getSectionAgents(agents, EXPERIMENT_SLUGS))
      }
    ].filter((section) => section.items.length > 0),
    [agents, outlineExtractionCard]
  );

  const agentEntryCount = agents.length + (canAccessOutlineExtraction ? 1 : 0);
  const totalEntryCount = agentEntryCount + sidebarFunctionCards.length;
  const sectionAnchors = [
    ...(featuredAgents.length > 0 ? [SECTION_CONFIG[0]] : []),
    ...sections.map((section) => ({
      id: section.id,
      label: section.label,
      description: section.description
    })),
    ...(sidebarFunctionCards.length > 0 ? [SECTION_CONFIG[6]] : [])
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="hidden w-[280px] flex-col border-r border-sidebar-active/40 bg-sidebar text-sidebar-text md:flex">
        <div className="flex items-center justify-between border-b border-sidebar-active/40 px-5 py-5">
          <div className="text-base font-bold tracking-wide">策划大师</div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 custom-scrollbar">
          <div className="px-5">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest opacity-50">
              菜单
            </div>
            <Link
              href="/home"
              className="mb-2 flex items-center gap-2.5 rounded-lg bg-sidebar-active px-3 py-2.5 text-xs font-medium"
            >
              <MenuIcon type="home" />
              <span>首页</span>
            </Link>

            <div className="my-2 border-t border-sidebar-active/40" />
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest opacity-50">
              智能体
            </div>
            <div className="space-y-0.5">
              {agents.map((agent) => (
                <div key={agent.id}>
                  {agent.slug === "product-one-pager-series" ||
                  agent.slug === "experiment-design-assistant" ? (
                    <div className="my-2 border-t border-sidebar-active/40" />
                  ) : null}
                  <AgentSidebarButton agent={agent} />
                  {agent.slug === "new-chat-agent" ||
                  agent.slug === "trust-transaction" ||
                  agent.slug === "course-transcript-single-methodology" ||
                  agent.slug === "experiment-design-assistant" ? (
                    <div className="my-2 border-t border-sidebar-active/40" />
                  ) : null}
                </div>
              ))}
            </div>

            {canAccessOutlineExtraction ? (
              <div>
                <Link
                  href={buildFunctionHref("outline-extraction")}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs transition-all duration-200 hover:bg-sidebar-hover"
                >
                  <DashboardIcon
                    slug="outline-extraction"
                    className="h-4 w-4 shrink-0 opacity-80"
                  />
                  <span>大纲提取</span>
                </Link>
              </div>
            ) : null}

            {sidebarFunctionCards.length > 0 ? (
              <div>
                <div className="my-2 border-t border-sidebar-active/40" />
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest opacity-50">
                  功能
                </div>
                <div className="space-y-0.5">
                  {sidebarFunctionCards.map((item) => (
                    <FunctionSidebarButton
                      key={item.key}
                      label={item.name}
                      href={buildFunctionHref(item.key)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-sidebar-active/40 px-5 py-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-3"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-active font-bold text-sm"
                style={{ color: "var(--sidebar-text)" }}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-sidebar">{user.username}</div>
                <Link
                  href="/account/password"
                  className="text-[10px] opacity-50 transition-opacity hover:opacity-100"
                >
                  修改密码
                </Link>
              </div>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 opacity-50 transition-colors hover:bg-sidebar-active hover:opacity-100"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="退出登录"
            >
              <MenuIcon type="logout" />
            </button>
          </div>

          {(user.role === "admin" || user.role === "super_admin") && (
            <Link
              href="/settings"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-active py-2.5 text-xs font-medium transition-all active:scale-[0.98] hover:bg-sidebar-active"
            >
              <MenuIcon type="settings" />
              系统设置
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-[#f6f8fb]">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
          >
            菜单
          </button>
          <div className="text-sm font-semibold">首页</div>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            退出
          </button>
        </div>

        {mobileSidebarOpen ? (
          <div className="flex max-h-[60vh] flex-col overflow-y-auto border-b bg-sidebar p-3 text-sidebar-text custom-scrollbar md:hidden">
            <div className="mb-2 text-xs opacity-60">菜单</div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Link href="/home" className="rounded bg-sidebar-active px-2 py-1 text-xs">
                <span className="flex items-center gap-1.5">
                  <MenuIcon type="home" />
                  <span>首页</span>
                </span>
              </Link>
            </div>

            <div className="mb-3 h-px w-full bg-sidebar-active/40" />
            <div className="mb-2 text-xs opacity-60">智能体</div>
            <div className="mb-4 flex flex-wrap gap-2">
              {agents.map((agent) => (
                <div key={agent.id} className="contents">
                  {agent.slug === "product-one-pager-series" ||
                  agent.slug === "experiment-design-assistant" ? (
                    <div className="my-1 h-px w-full basis-full bg-sidebar-active/40" />
                  ) : null}
                  <AgentSidebarButton agent={agent} compact />
                  {agent.slug === "new-chat-agent" ||
                  agent.slug === "trust-transaction" ||
                  agent.slug === "course-transcript-single-methodology" ||
                  agent.slug === "experiment-design-assistant" ? (
                    <div className="my-1 h-px w-full basis-full bg-sidebar-active/40" />
                  ) : null}
                </div>
              ))}
            </div>

            {canAccessOutlineExtraction ? (
              <div className="mb-3">
                <Link
                  href={buildFunctionHref("outline-extraction")}
                  className="rounded bg-sidebar-hover px-2 py-1 text-xs transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <DashboardIcon
                      slug="outline-extraction"
                      className="h-4 w-4 shrink-0 opacity-80"
                    />
                    <span>大纲提取</span>
                  </span>
                </Link>
              </div>
            ) : null}

            {sidebarFunctionCards.length > 0 ? (
              <div>
                <div className="mb-2 text-xs opacity-60">功能</div>
                <div className="flex flex-wrap gap-2">
                  {sidebarFunctionCards.map((item) => (
                    <FunctionSidebarButton
                      key={item.key}
                      label={item.name}
                      href={buildFunctionHref(item.key)}
                      compact
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-4 md:px-6">
            <section className="overflow-hidden rounded-[24px] bg-gradient-to-r from-[#3157ff] via-[#445cff] to-[#5c5bff] px-5 py-5 text-white shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85">
                    AI 工作台
                  </div>
                  <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-[30px]">
                    你好，{user.username}，今天想规划点什么？
                  </h1>
                  <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-white/80">
                    首页聚合了你当前账号可访问的全部智能体和功能入口。点击任意卡片，都会直接进入对应的新建聊天页或功能工作区。
                  </p>
                </div>

                <div className="min-w-[168px] rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                  <div className="text-[11px] uppercase tracking-widest text-white/70">
                    智能体总数
                  </div>
                  <div className="mt-1.5 text-3xl font-semibold">{agentEntryCount}</div>
                  <div className="mt-1.5 text-[11px] text-white/70">
                    可用入口共 {totalEntryCount} 个
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4 flex flex-wrap items-center gap-2">
              {sectionAnchors.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {item.label}
                </a>
              ))}
            </section>

            {featuredAgents.length > 0 ? (
              <section id="featured" className="mt-7">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900">核心入口</div>
                    <div className="mt-1 text-[12px] text-slate-500">
                      第一屏优先展示常用入口，接近你截图里的快捷工作区形态。
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {featuredAgents.length} 个快捷入口
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {featuredAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={buildAgentHref(agent.slug)}
                      className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconWrapperClass(
                            agent.slug
                          )}`}
                        >
                          <DashboardIcon slug={agent.slug} className="h-4 w-4" />
                        </div>
                        <div className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                          新建
                        </div>
                      </div>
                      <div className="mt-3 text-[13px] font-semibold text-slate-900">
                        {agent.name}
                      </div>
                      <div className="mt-1.5 line-clamp-3 text-[12px] leading-5 text-slate-600">
                        {getAgentDescription(agent)}
                      </div>
                      <div className="mt-3 text-[11px] font-medium text-primary">进入工作区</div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-7 space-y-7">
              {sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {section.label}
                      </div>
                      <div className="mt-1 text-[12px] text-slate-500">
                        {section.description}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                    {section.items.length} 个入口
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {section.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconWrapperClass(
                              item.slug
                            )}`}
                          >
                            <DashboardIcon slug={item.slug} className="h-4 w-4" />
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                            进入
                          </div>
                        </div>
                        <div className="mt-3 line-clamp-1 text-[13px] font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-1.5 line-clamp-3 text-[12px] leading-5 text-slate-600">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {sidebarFunctionCards.length > 0 ? (
                <section id="functions">
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        功能模块
                      </div>
                      <div className="mt-1 text-[12px] text-slate-500">
                        直接进入系统功能型工作区，保持和左侧“功能”区一致。
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {sidebarFunctionCards.length} 个入口
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {sidebarFunctionCards.map((item) => (
                      <Link
                        key={item.key}
                        href={buildFunctionHref(item.key)}
                        className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconWrapperClass(
                              item.key
                            )}`}
                          >
                            <DashboardIcon slug={item.key} className="h-4 w-4" />
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                            打开
                          </div>
                        </div>
                        <div className="mt-3 text-[13px] font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="mt-1.5 line-clamp-3 text-[12px] leading-5 text-slate-600">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
