"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

type Agent = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  system_prompt: string | null;
};

type Conversation = {
  id: number;
  title: string;
  agent_id: number;
  draft: string | null;
};

type Message = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type UserInfo = {
  id: number;
  username: string;
  role: "super_admin" | "admin" | "user";
};

type CourseRuleRow = {
  id: number;
  name: string;
  lesson_count: number;
  rule_content: string;
};

type Props = {
  user: UserInfo;
  agents: Agent[];
  initialConversations: Conversation[];
};

function AgentMenuIcon({ slug }: { slug: string }) {
  const className = "h-4 w-4 shrink-0 opacity-80";
  if (slug === "product-one-pager") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h8" />
        <path d="M8 9h2" />
      </svg>
    );
  }
  if (slug === "positioning-helper") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M12 12l4-2" />
      </svg>
    );
  }
  if (slug === "four-things") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }
  if (slug === "nine-grid") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    );
  }
  if (slug === "course-outline") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }
  if (slug === "course-transcript") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
        <path d="M12 18v4" />
        <path d="M8 22h8" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" />
      <path d="M7 22h10" />
      <path d="M12 15v7" />
      <path d="M3 15h18" />
    </svg>
  );
}

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "")
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/(\*|-|\+)\s+/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1");
}

function formatMarkdownForCopy(text: string) {
  let processed = text;

  // Code blocks: remove backticks but keep content
  processed = processed.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "")
  );

  // Headers: Make them stand out with spacing and brackets
  // # Header -> \n\n【Header】\n
  processed = processed.replace(/^#+\s+(.*$)/gm, "\n\n【$1】\n");

  // Bold/Italic: just strip markers
  processed = processed.replace(/\*\*(.*?)\*\*/g, "$1");
  processed = processed.replace(/__(.*?)__/g, "$1");
  processed = processed.replace(/\*(.*?)\*/g, "$1");
  processed = processed.replace(/_(.*?)_/g, "$1");

  // Lists: Unified bullets
  processed = processed.replace(/^[\s]*(\*|-|\+)\s+/gm, "• ");

  // Inline code: strip backticks
  processed = processed.replace(/`([^`]+)`/g, "$1");

  // Links: strip url
  processed = processed.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Cleanup whitespace
  processed = processed.replace(/\n{3,}/g, "\n\n").trim();

  return processed;
}

function buildFeishuClipboardHtml(sourceElement: HTMLElement) {
  const sanitizeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes)
      .map((child) => sanitizeNode(child))
      .join("");

    if (tag === "h1") {
      return `<h1 style="margin:16px 0 12px;font-size:24px;line-height:1.4;font-weight:700;">${children}</h1>`;
    }
    if (tag === "h2") {
      return `<h2 style="margin:14px 0 10px;font-size:20px;line-height:1.5;font-weight:700;">${children}</h2>`;
    }
    if (tag === "h3") {
      return `<h3 style="margin:12px 0 8px;font-size:18px;line-height:1.6;font-weight:700;">${children}</h3>`;
    }
    if (tag === "p") {
      return `<p style="margin:10px 0;line-height:1.8;">${children || "<br />"}</p>`;
    }
    if (tag === "strong" || tag === "b") {
      return `<strong style="font-weight:700;">${children}</strong>`;
    }
    if (tag === "em" || tag === "i") {
      return `<em>${children}</em>`;
    }
    if (tag === "ul") {
      return `<ul style="margin:10px 0 10px 22px;padding:0;list-style:disc;">${children}</ul>`;
    }
    if (tag === "ol") {
      return `<ol style="margin:10px 0 10px 22px;padding:0;list-style:decimal;">${children}</ol>`;
    }
    if (tag === "li") {
      return `<li style="margin:4px 0;line-height:1.8;">${children}</li>`;
    }
    if (tag === "hr") {
      return '<hr style="border:none;border-top:1px solid #d1d5db;margin:16px 0;" />';
    }
    if (tag === "blockquote") {
      return `<blockquote style="margin:12px 0;padding:8px 12px;border-left:4px solid #d1d5db;color:#4b5563;background:#f9fafb;">${children}</blockquote>`;
    }
    if (tag === "pre") {
      const content = element.textContent ?? "";
      return `<pre style="white-space:pre-wrap;margin:12px 0;padding:12px;border-radius:8px;background:#f3f4f6;color:#111827;font-size:13px;line-height:1.7;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${content}</pre>`;
    }
    if (tag === "code") {
      return `<code style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:#f3f4f6;padding:1px 4px;border-radius:4px;">${children}</code>`;
    }
    if (tag === "br") {
      return "<br />";
    }
    if (tag === "a") {
      const href = element.getAttribute("href");
      if (href) {
        return `<a href="${href}" style="color:#2563eb;text-decoration:underline;">${children}</a>`;
      }
      return children;
    }

    return children;
  };

  const fragment = Array.from(sourceElement.childNodes)
    .map((node) => sanitizeNode(node))
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <!--StartFragment-->
    <div style="color:#1f2937;font-size:14px;line-height:1.75;">${fragment}</div>
    <!--EndFragment-->
  </body>
</html>`;
}

const PENDING_PREFIX = "正在生成，请稍候...";
const VIRTUAL_CONVERSATION_ID = -1;

function stripPendingPrefix(text: string) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith(PENDING_PREFIX)) return String(text ?? "");
  const rest = normalized.slice(PENDING_PREFIX.length).replace(/^\s+/, "");
  return rest ? rest : PENDING_PREFIX;
}

function extractProductOnePagerSaveContent(text: string) {
  const source = String(text ?? "");
  const marker = "产品基本信息一页纸";
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return source;
  }
  return source.slice(markerIndex).trim();
}

export default function ChatApp(props: Props) {
  // Update timestamp: 2026-03-05 17:35
  const { user, agents, initialConversations } = props;

  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantContentRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrollConversationIdRef = useRef<number | null>(null);
  const activePollConversationIdRef = useRef<number | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(conversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState("");
  const [currentAgentId, setCurrentAgentId] = useState(
    agents[0]?.id ?? null
  );
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesReloadKey, setMessagesReloadKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<Record<number, string>>({});
  const [renamingConversationId, setRenamingConversationId] = useState<
    number | null
  >(null);
  const [renamingConversationTitle, setRenamingConversationTitle] =
    useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [saveForm, setSaveForm] = useState<{
    productName: string;
    agentName: string;
    lessonCount: string;
    resultContent: string;
    createdAt?: string;
    updatedAt?: string;
  } | null>(null);
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [saveDialogOpenedAt, setSaveDialogOpenedAt] = useState<string | null>(
    null
  );
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [referenceForm, setReferenceForm] = useState<{
    productName: string;
    content: string;
    positioningContent?: string;
    fourThingsContent?: string;
    nineGridContent?: string;
    courseOutlineContent?: string;
    currentLesson?: string;
    currentLessonOutline?: string;
    courseLessonCount?: string;
    courseRuleContent?: string;
  } | null>(null);
  const [courseRules, setCourseRules] = useState<CourseRuleRow[]>([]);
  const [generatingConversationId, setGeneratingConversationId] = useState<
    number | null
  >(null);
  const currentConversationIdRef = useRef<number | null>(null);

  const getErrorMessage = useCallback((e: any, fallback: string) => {
    if (e && typeof e.message === "string") {
      const message = e.message.trim();
      if (!message) return fallback;
      if (message.includes("<") || message.includes("&lt;")) return fallback;
      return message;
    }
    return fallback;
  }, []);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );

  const selectedAgentId = useMemo(
    () => currentConversation?.agent_id ?? currentAgentId,
    [currentConversation, currentAgentId]
  );

  const currentAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const courseTranscriptLessonOptions = useMemo(() => {
    if (!currentAgent || currentAgent.slug !== "course-transcript") {
      return [];
    }
    if (!referenceForm || !referenceForm.courseOutlineContent) {
      return [];
    }
    const text = referenceForm.courseOutlineContent;
    const headerRegex = /^#{2,4}\s*(?:\*\*)?第(\d+)节.*$/gm;
    const lessonNumbers = Array.from(text.matchAll(headerRegex))
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0);
    let count = lessonNumbers.length > 0 ? Math.max(...lessonNumbers) : 0;
    if (count <= 0) {
      const match = text.match(/(\d+)\s*节[^\n]*课程大纲/);
      if (match) {
        count = Number(match[1]);
      }
    }
    if (!Number.isFinite(count) || count <= 0) return [];
    return Array.from({ length: count }, (_, index) => ({
      value: String(index + 1),
      label: `第${index + 1}节`
    }));
  }, [currentAgent, referenceForm?.courseOutlineContent]);

  const courseTranscriptCurrentLessonOutline = useMemo(() => {
    if (!currentAgent || currentAgent.slug !== "course-transcript") {
      return "";
    }
    if (!referenceForm || !referenceForm.courseOutlineContent) {
      return "";
    }
    if (!referenceForm.currentLesson) {
      return "";
    }
    const lessonIndex = Number(referenceForm.currentLesson);
    if (!Number.isFinite(lessonIndex) || lessonIndex <= 0) {
      return "";
    }
    const text = referenceForm.courseOutlineContent;
    const regex = /^#{2,4}\s*(?:\*\*)?第(\d+)节.*$/gm;
    const matches = Array.from(text.matchAll(regex));
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      const value = Number(match[1]);
      if (value !== lessonIndex) continue;
      const start = match.index ?? 0;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      return text.slice(start, end).trim();
    }
    return "";
  }, [currentAgent, referenceForm?.courseOutlineContent, referenceForm?.currentLesson]);

  const courseTranscriptPreviousLessonOutline = useMemo(() => {
    if (!currentAgent || currentAgent.slug !== "course-transcript") {
      return "";
    }
    if (!referenceForm || !referenceForm.courseOutlineContent) {
      return "";
    }
    if (!referenceForm.currentLesson) {
      return "";
    }
    const currentIndex = Number(referenceForm.currentLesson);
    const lessonIndex = currentIndex - 1;
    if (!Number.isFinite(lessonIndex) || lessonIndex <= 0) {
      return "";
    }
    const text = referenceForm.courseOutlineContent;
    const regex = /^#{2,4}\s*(?:\*\*)?第(\d+)节.*$/gm;
    const matches = Array.from(text.matchAll(regex));
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      const value = Number(match[1]);
      if (value !== lessonIndex) continue;
      const start = match.index ?? 0;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
      return text.slice(start, end).trim();
    }
    return "";
  }, [currentAgent, referenceForm?.courseOutlineContent, referenceForm?.currentLesson]);

  const courseTranscriptFourThingsNineGridMapping = useMemo(() => {
    if (!currentAgent || currentAgent.slug !== "course-transcript") {
      return "";
    }
    if (!referenceForm || !referenceForm.courseOutlineContent) {
      return "";
    }
    if (!referenceForm.currentLesson) {
      return "";
    }
    const text = referenceForm.courseOutlineContent;
    const regex = /^## .*四件事与九宫格对应关系[\s\S]*?(?=^---|\Z)/m;
    const match = text.match(regex);
    if (match && match[0]) {
      return match[0].trim();
    }
    return "";
  }, [currentAgent, referenceForm?.courseOutlineContent, referenceForm?.currentLesson]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragging) return;
      const newWidth = Math.min(Math.max(event.clientX, 200), 420);
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!currentConversationId || currentConversationId === VIRTUAL_CONVERSATION_ID) {
      setLoadingMessages(false);
      setMessages([]);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoadingMessages(true);
      setError(null);
      let isTimeout = false;
      const timeoutId = setTimeout(() => {
        isTimeout = true;
        controller.abort();
      }, 20000); // 20s timeout for slow compilation

      try {
        const res = await fetch(
          `/api/conversations/${currentConversationId}/messages`,
          { signal: controller.signal }
        );
        if (res.status === 404) {
          setMessages([]);
          setCurrentConversationId(null);
          return;
        }
        if (!res.ok) {
          const contentType = res.headers.get("content-type") ?? "";
          let details = "";
          if (contentType.includes("application/json")) {
            try {
              const data = (await res.json()) as { error?: unknown; message?: unknown };
              if (typeof data.error === "string") details = data.error;
              else if (typeof data.message === "string") details = data.message;
            } catch {
            }
          } else {
            details = (await res.text()).trim();
          }
          const safeDetails =
            details && !details.includes("<") && !details.includes("&lt;")
              ? details
              : "";
          let hint = "";
          if (res.status === 504) hint = "网关超时";
          if (res.status === 502) hint = "网关错误";
          if (res.status === 503) hint = "服务不可用";
          if (res.status === 401) hint = "未登录";
          if (res.status === 403) hint = "无权限";
          const message = safeDetails || `加载消息失败（HTTP ${res.status}${hint ? `：${hint}` : ""}）`;
          throw new Error(message);
        }
        const data: Message[] = await res.json();
        setMessages((prev) => {
          const optimistic = prev.filter((m) => typeof m.id === "number" && m.id < 0);
          if (optimistic.length === 0) return data;
          const remaining = optimistic.filter(
            (m) => !data.some((d) => d.role === m.role && d.content === m.content)
          );
          if (remaining.length === 0) return data;
          return [...data, ...remaining];
        });
        const lastAssistant = [...data]
          .reverse()
          .find((message) => message.role === "assistant");
        const pending =
          !!lastAssistant &&
          typeof lastAssistant.content === "string" &&
          lastAssistant.content.includes("正在生成");
        setGeneratingConversationId((prev) => {
          if (pending) return currentConversationId;
          if (prev === currentConversationId) return null;
          return prev;
        });
      } catch (e: any) {
        if (e?.name === "AbortError") {
          if (isTimeout) {
            setError("加载消息超时，请刷新页面重试");
          }
          return;
        }
        setError(getErrorMessage(e, "加载消息失败"));
      } finally {
        clearTimeout(timeoutId);
        setLoadingMessages(false);
      }
    };

    load();
    return () => {
      controller.abort();
    };
  }, [currentConversationId, getErrorMessage, messagesReloadKey]);

  useEffect(() => {
    if (!loadingMessages) return;
    const timeoutId = setTimeout(() => {
      setLoadingMessages(false);
      setError("加载消息超时，请刷新页面重试");
    }, 25000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadingMessages]);

  useEffect(() => {
    if (!saveDialogOpen || !saveForm) return;
    const productName = saveForm.productName.trim();
    const agentName = saveForm.agentName.trim();
    const lessonCountValue = saveForm.lessonCount.trim();
    if (!productName || !agentName || !lessonCountValue) return;
    const lessonCount = Number(lessonCountValue);
    if (!Number.isFinite(lessonCount) || lessonCount < 0) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const params = new URLSearchParams({
          productName,
          agentName,
          lessonCount: String(lessonCount)
        });
        const res = await fetch(`/api/results?${params.toString()}`, {
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        if (!data) {
          const nowIso = new Date().toISOString();
          setSaveForm((prev) =>
            prev
              ? {
                  ...prev,
                  createdAt: nowIso
                }
              : prev
          );
          return;
        }
        setSaveForm((prev) =>
          prev
            ? {
                ...prev,
                createdAt: data.createdAt
              }
            : prev
        );
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(getErrorMessage(e, "加载创建时间失败"));
      }
    };
    load();
    return () => {
      controller.abort();
    };
  }, [saveDialogOpen, saveForm?.productName, saveForm?.agentName, saveForm?.lessonCount, getErrorMessage]);

  useEffect(() => {
    if (!referenceDialogOpen || !referenceForm) return;
    const name = referenceForm.productName.trim();
    if (!name) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        if (!currentAgent) return;
        if (
          currentAgent.slug === "course-outline" ||
          currentAgent.slug === "course-transcript" ||
          currentAgent.slug === "four-things" ||
          currentAgent.slug === "nine-grid"
        ) {
          const queries: {
            key:
              | "content"
              | "fourThingsContent"
              | "nineGridContent"
              | "courseOutlineContent"
              | "positioningContent";
            agentName: string;
          }[] =
            currentAgent.slug === "course-outline"
              ? [
                  { key: "content", agentName: "产品一页纸" },
                  { key: "fourThingsContent", agentName: "四件事" },
                  { key: "nineGridContent", agentName: "九宫格" }
                ]
              : currentAgent.slug === "course-transcript"
              ? [
                  { key: "content", agentName: "产品一页纸" },
                  { key: "fourThingsContent", agentName: "四件事" },
                  { key: "nineGridContent", agentName: "九宫格" },
                  { key: "courseOutlineContent", agentName: "课纲" }
                ]
              : [
                  { key: "content", agentName: "产品一页纸" },
                  { key: "positioningContent", agentName: "定位" }
                ];
          const results = await Promise.all(
            queries.map(async ({ key, agentName }) => {
              const params = new URLSearchParams({
                productName: name,
                agentName
              });
              const res = await fetch(`/api/results?${params.toString()}`, {
                signal: controller.signal
              });
              if (!res.ok) {
                throw new Error(await res.text());
              }
              const data = await res.json();
              const content = data ? data.resultContent ?? "" : "";
              return { key, content };
            })
          );
          setReferenceForm((prev) =>
            prev
              ? results.reduce(
                  (acc, { key, content }) => ({
                    ...acc,
                    [key]: content
                  }),
                  prev
                )
              : prev
          );
        } else {
          const params = new URLSearchParams({
            productName: name,
            agentName: "产品一页纸"
          });
          const res = await fetch(`/api/results?${params.toString()}`, {
            signal: controller.signal
          });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = await res.json();
          if (!data) {
            setReferenceForm((prev) =>
              prev
                ? {
                    ...prev,
                    content: ""
                  }
                : prev
            );
            return;
          }
          setReferenceForm((prev) =>
            prev
              ? {
                  ...prev,
                  content: data.resultContent ?? ""
                }
              : prev
          );
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(getErrorMessage(e, "加载产品一页纸结果失败"));
      }
    };
    load();
    return () => {
      controller.abort();
    };
  }, [referenceDialogOpen, referenceForm?.productName, currentAgent, getErrorMessage]);

  useEffect(() => {
    if (!currentConversationId) {
      setCurrentInput("");
      return;
    }
    setCurrentInput("");
  }, [currentConversationId]);

  const saveDraft = useCallback(
    async (conversationId: number, draft: string) => {
      setDrafts((prev) => ({ ...prev, [conversationId]: draft }));
      if (conversationId === VIRTUAL_CONVERSATION_ID) return;
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft })
      });
    },
    []
  );

  const cleanupCurrentConversationIfEmpty = useCallback(async () => {
    if (
      !currentConversationId ||
      currentConversationId === VIRTUAL_CONVERSATION_ID
    ) {
      return;
    }
    if (loadingMessages) return;
    if (messages.length > 0) return;
    if (error) return;

    const currentConv = conversations.find(
      (c) => c.id === currentConversationId
    );
    if (!currentConv || currentConv.title !== "新对话") return;

    setConversations((prev) =>
      prev.filter((c) => c.id !== currentConversationId)
    );

    try {
      await fetch(`/api/conversations/${currentConversationId}`, {
        method: "DELETE",
        keepalive: true
      });
    } catch (e) {
      console.error("Auto-delete failed", e);
    }
  }, [
    currentConversationId,
    loadingMessages,
    messages,
    error,
    conversations
  ]);

  const handleSelectConversation = (conversationId: number) => {
    if (conversationId === currentConversationId) return;
    void cleanupCurrentConversationIfEmpty();
    setCurrentConversationId(conversationId);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const handleNewConversation = () => {
    if (!selectedAgentId) return;
    void cleanupCurrentConversationIfEmpty();
    setCurrentAgentId(selectedAgentId);
    setCurrentConversationId(VIRTUAL_CONVERSATION_ID);
    setMessages([]);
    setCurrentInput("");
    setMobileSidebarOpen(false);
  };

  const handleSelectAgent = (agentId: number) => {
    setCurrentAgentId(agentId);
    if (!currentConversationId) {
      return;
    }
    // If we are already in virtual mode, just update agent (done above)
    if (currentConversationId === VIRTUAL_CONVERSATION_ID) {
      return;
    }
    const conv = conversations.find(
      (conversation) => conversation.id === currentConversationId
    );
    if (!conv || conv.agent_id === agentId) {
      return;
    }

    // Switch to virtual mode for new agent
    void cleanupCurrentConversationIfEmpty();
    setCurrentConversationId(VIRTUAL_CONVERSATION_ID);
    setMessages([]);
    setCurrentInput("");
  };

  const pollConversationMessages = useCallback(
    async (conversationId: number, assistantMessageId: number) => {
      if (activePollConversationIdRef.current === conversationId) return;
      activePollConversationIdRef.current = conversationId;
      setGeneratingConversationId(conversationId);
      const startedAt = Date.now();
      const maxPollMs = 12 * 60 * 1000;
      try {
        while (Date.now() - startedAt < maxPollMs) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 1500);
          });
          if (currentConversationIdRef.current !== conversationId) {
            return;
          }
          try {
            const res = await fetch(
              `/api/conversations/${conversationId}/messages`
            );
            if (!res.ok) {
              return;
            }
            const data: Message[] = await res.json();
            if (currentConversationIdRef.current !== conversationId) {
              return;
            }
            setMessages(data);
            const target = data.find((m) => m.id === assistantMessageId);
            if (!target) {
              continue;
            }
            if (typeof target.content === "string" && target.content.trim()) {
              if (!target.content.includes("正在生成")) {
                setGeneratingConversationId((prev) =>
                  prev === conversationId ? null : prev
                );
                return;
              }
            }
          } catch {
            return;
          }
        }

        if (currentConversationIdRef.current !== conversationId) {
          return;
        }
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages`
          );
          if (!res.ok) {
            setError("生成超时，请刷新页面重试");
            return;
          }
          const data: Message[] = await res.json();
          if (currentConversationIdRef.current !== conversationId) {
            return;
          }
          setMessages(data);
          const target = data.find((m) => m.id === assistantMessageId);
          if (target && typeof target.content === "string") {
            if (target.content.trim() && !target.content.includes("正在生成")) {
              setGeneratingConversationId((prev) =>
                prev === conversationId ? null : prev
              );
              return;
            }
          }
        } catch {
        }
        setError("生成超时，请刷新页面重试");
      } finally {
        if (activePollConversationIdRef.current === conversationId) {
          activePollConversationIdRef.current = null;
        }
      }
    },
    []
  );

  const handleSend = async () => {
    if (!currentInput.trim() || sending) return;
    if (!selectedAgentId) {
      setError("请先选择智能体");
      return;
    }
    const content = currentInput;
    const tempId = -Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content,
        created_at: new Date().toISOString()
      }
    ]);
    setCurrentInput("");
    let conversationId = currentConversationId;
    if (!conversationId || conversationId === VIRTUAL_CONVERSATION_ID) {
      try {
        const convRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: selectedAgentId })
        });
        if (!convRes.ok) {
          throw new Error(await convRes.text());
        }
        const conv: Conversation = await convRes.json();
        conversationId = conv.id;
        setConversations((prev) => [conv, ...prev]);
        setCurrentConversationId(conv.id);
      } catch (e: any) {
        setError(getErrorMessage(e, "新建对话失败"));
        return;
      }
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream"
          },
          body: JSON.stringify({ content, stream: true })
        }
      );
      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        let details = "";
        if (contentType.includes("application/json")) {
          try {
            const data = (await res.json()) as { error?: unknown; message?: unknown };
            if (typeof data.error === "string") details = data.error;
            else if (typeof data.message === "string") details = data.message;
          } catch {
          }
        } else {
          details = (await res.text()).trim();
        }
        const safeDetails =
          details && !details.includes("<") && !details.includes("&lt;")
            ? details
            : "";
        let hint = "";
        if (res.status === 504) hint = "网关超时";
        if (res.status === 502) hint = "网关错误";
        if (res.status === 503) hint = "服务不可用";
        const message = safeDetails || `发送失败（HTTP ${res.status}${hint ? `：${hint}` : ""}）`;
        throw new Error(message);
      }
      setDrafts((prev) =>
        conversationId ? { ...prev, [conversationId]: "" } : prev
      );

      let newConversationTitle: string | null = null;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        setGeneratingConversationId(conversationId);
        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("流式响应不可读");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantId: number | null = null;

        const handlePayload = (payload: any) => {
          if (!payload || typeof payload !== "object") return;
          if (payload.type === "meta") {
            const serverMessage: Message = payload.message;
            const aiReply: Message | null = payload.aiReply ?? null;
            const promptText: string | null = payload.aiPrompt ?? null;
            if (payload.conversationTitle) {
              newConversationTitle = payload.conversationTitle;
              setConversations((prev) =>
                prev.map((conversation) => {
                  if (conversation.id !== conversationId) return conversation;
                  return { ...conversation, title: payload.conversationTitle };
                })
              );
            }
            if (aiReply) {
              assistantId = aiReply.id;
            }
            setMessages((prev) => {
              const replaced = prev.map((m) =>
                m.id === tempId ? (serverMessage || m) : m
              );
              if (!aiReply) return replaced;
              return [...replaced, { ...aiReply, content: PENDING_PREFIX }];
            });
            if (aiReply && promptText) {
              setAiPrompts((prev) => ({ ...prev, [aiReply.id]: promptText }));
            }
            return;
          }
          if (payload.type === "delta") {
            const delta = typeof payload.delta === "string" ? payload.delta : "";
            if (!delta) return;
            if (!assistantId) return;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const prevContent = typeof m.content === "string" ? m.content : "";
                const newContent = prevContent === PENDING_PREFIX ? delta : prevContent + delta;
                return { ...m, content: newContent };
              })
            );
            return;
          }
          if (payload.type === "final") {
            const text =
              typeof payload.content === "string" ? payload.content : "";
            if (!assistantId || !text) return;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
            );
            return;
          }
          if (payload.type === "error") {
            const text = typeof payload.message === "string" ? payload.message : "";
            if (assistantId && text) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
              );
            }
            return;
          }
        };

        const consumeSseText = (text: string, force: boolean) => {
          let local = text;
          while (true) {
            const index = local.indexOf("\n\n");
            if (index === -1) break;
            const rawEvent = local.slice(0, index);
            local = local.slice(index + 2);
            const lines = rawEvent.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice("data:".length).trim();
              if (!data) continue;
              try {
                const payload = JSON.parse(data);
                handlePayload(payload);
              } catch {
              }
            }
          }
          if (force) {
            const rawEvent = local.trim();
            if (rawEvent) {
              const lines = rawEvent.split(/\r?\n/);
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice("data:".length).trim();
                if (!data) continue;
                try {
                  const payload = JSON.parse(data);
                  handlePayload(payload);
                } catch {
                }
              }
            }
            return "";
          }
          return local;
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = consumeSseText(buffer, false);
        }
        consumeSseText(buffer, true);

        setGeneratingConversationId((prev) =>
          prev === conversationId ? null : prev
        );
      } else {
        const data = await res.json();
        const message: Message = data.message;
        const aiReply: Message | null = data.aiReply ?? null;
        const prompt: string | null = data.aiPrompt ?? null;
        const aiReplyPending: boolean = data.aiReplyPending === true;
        if (data.conversationTitle) {
          newConversationTitle = data.conversationTitle;
        }
        if (aiReplyPending) {
          setGeneratingConversationId(conversationId);
        } else {
          setGeneratingConversationId((prev) =>
            prev === conversationId ? null : prev
          );
        }
        setMessages((prev) => {
          const replaced = prev.map((m) => (m.id === tempId ? message : m));
          return aiReply ? [...replaced, aiReply] : replaced;
        });
        if (aiReply && prompt) {
          setAiPrompts((prev) => ({ ...prev, [aiReply.id]: prompt }));
        }
        if (aiReply && aiReplyPending) {
          void pollConversationMessages(conversationId, aiReply.id);
        }
      }
      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== conversationId) {
            return conversation;
          }
          if (conversation.title !== "新对话") {
            return conversation;
          }
          if (newConversationTitle) {
            return {
              ...conversation,
              title: newConversationTitle
            };
          }
          return {
            ...conversation,
            title: content.slice(0, 30)
          };
        })
      );
    } catch (e: any) {
      setError(getErrorMessage(e, "发送失败"));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setConversations((prev) =>
        prev.filter((conversation) => conversation.id !== conversationId)
      );
      if (currentConversationId === conversationId) {
        const next = conversations.find(
          (conversation) => conversation.id !== conversationId
        );
        setCurrentConversationId(next ? next.id : null);
        setMessages([]);
        setCurrentInput("");
      }
    } catch (e: any) {
      setError(getErrorMessage(e, "删除对话失败"));
    }
  };

  const handleRenameConversation = async (
    conversationId: number,
    title: string
  ) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const updated: Conversation = await res.json();
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId ? updated : conversation
        )
      );
    } catch (e: any) {
      setError(getErrorMessage(e, "重命名失败"));
    }
  };

  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const updated: Message = await res.json();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, content: updated.content } : message
        )
      );
    } catch (e: any) {
      setError(getErrorMessage(e, "编辑消息失败"));
    }
  };

  const handleClearConversation = async () => {
    if (!currentConversationId) return;
    try {
      const res = await fetch(
        `/api/conversations/${currentConversationId}/clear`,
        {
          method: "POST"
        }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setMessages([]);
    } catch (e: any) {
      setError(getErrorMessage(e, "清除会话失败"));
    }
  };

  const handleExportConversation = async () => {
    if (!currentConversationId || messages.length === 0) return;
    try {
      const res = await fetch(
        `/api/conversations/${currentConversationId}/export`
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${currentConversationId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(getErrorMessage(e, "导出失败"));
    }
  };

  const handleCopy = async (message: Message) => {
    try {
      const text = stripMarkdown(stripPendingPrefix(message.content));
      await navigator.clipboard.writeText(text);
      await fetch("/api/operations/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy_message",
          targetType: "message",
          targetId: message.id
        })
      });
    } catch (e: any) {
      setError(getErrorMessage(e, "复制失败"));
    }
  };

  const handleCopyVisibleResult = async (message: Message) => {
    try {
      const text = formatMarkdownForCopy(stripPendingPrefix(message.content));
      const renderedNode = document.querySelector(
        `[data-copy-result-id="${message.id}"]`
      ) as HTMLElement | null;

      if (
        renderedNode &&
        navigator.clipboard &&
        "write" in navigator.clipboard &&
        typeof ClipboardItem !== "undefined"
      ) {
        const html = buildFeishuClipboardHtml(renderedNode);
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" })
          })
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      await fetch("/api/operations/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "copy_visible_result",
          targetType: "message",
          targetId: message.id
        })
      });
    } catch (e: any) {
      setError(getErrorMessage(e, "复制失败"));
    }
  };

  const handleRegenerate = async () => {
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!lastAssistant) return;
    try {
      const res = await fetch(
        `/api/messages/${lastAssistant.id}/regenerate`,
        { method: "POST" }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
    } catch (e: any) {
      setError(getErrorMessage(e, "重新生成失败"));
    }
  };

  const lastAssistantId = useMemo(() => {
    const last = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return last?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!currentConversationId) return;
    if (loadingMessages) return;
    if (messages.length === 0) return;
    if (generatingConversationId === currentConversationId) return;
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!lastAssistant) {
      setGeneratingConversationId((prev) =>
        prev === currentConversationId ? null : prev
      );
      return;
    }
    const pending =
      typeof lastAssistant.content === "string" &&
      lastAssistant.content.includes("正在生成");
    if (!pending) {
      setGeneratingConversationId((prev) =>
        prev === currentConversationId ? null : prev
      );
      return;
    }
    setGeneratingConversationId(currentConversationId);
    void pollConversationMessages(currentConversationId, lastAssistant.id);
  }, [
    currentConversationId,
    generatingConversationId,
    loadingMessages,
    messages,
    pollConversationMessages
  ]);

  useEffect(() => {
    lastAssistantContentRef.current = null;
  }, [currentConversationId]);

  useEffect(() => {
    if (!currentConversationId) return;
    if (loadingMessages) return;
    if (messages.length === 0) return;
    if (lastAutoScrollConversationIdRef.current === currentConversationId) return;

    lastAutoScrollConversationIdRef.current = currentConversationId;
    requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({ block: "end" });
      if (lastAssistantContentRef.current) {
        lastAssistantContentRef.current.scrollTop =
          lastAssistantContentRef.current.scrollHeight;
      }
    });
  }, [currentConversationId, loadingMessages, messages.length]);

  useEffect(() => {
    if (!currentConversationId) return;
    if (loadingMessages) return;
    if (currentAgent?.slug !== "product-one-pager") return;
    if (generatingConversationId !== currentConversationId) return;

    requestAnimationFrame(() => {
      bottomAnchorRef.current?.scrollIntoView({ block: "end" });
      if (lastAssistantContentRef.current) {
        lastAssistantContentRef.current.scrollTop =
          lastAssistantContentRef.current.scrollHeight;
      }
    });
  }, [
    currentAgent?.slug,
    currentConversationId,
    generatingConversationId,
    loadingMessages,
    messages
  ]);

  const handleLogout = async () => {
    void cleanupCurrentConversationIfEmpty();
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  const resolveAgentDisplayName = useCallback(
    (slug: string, fallback: string) => {
      if (slug === "product-one-pager") return "产品一页纸";
      if (slug === "positioning-helper") return "定位";
      if (slug === "four-things") return "四件事";
      if (slug === "nine-grid") return "九宫格";
      if (slug === "course-outline") return "课纲";
      if (slug === "course-transcript") return "课程";
      return fallback;
    },
    []
  );

  const handleOpenSaveResult = useCallback(
    async (message: Message) => {
      if (!currentAgent) return;
      const agentDisplayName = resolveAgentDisplayName(
        currentAgent.slug,
        currentAgent.name
      );
      const normalizedContent = stripPendingPrefix(message.content);
      const resultContent =
        currentAgent.slug === "product-one-pager"
          ? extractProductOnePagerSaveContent(normalizedContent)
          : normalizedContent;
      const nowIso = new Date().toISOString();
      setSaveForm({
        productName: "",
        agentName: agentDisplayName,
        lessonCount: "0",
        resultContent,
        createdAt: nowIso,
        updatedAt: nowIso
      });
      setSaveDialogOpen(true);
      setSaveDialogOpenedAt(nowIso);
      try {
        const res = await fetch("/api/results");
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data: string[] = await res.json();
        setProductNameOptions(data);
      } catch (e: any) {
        setError(getErrorMessage(e, "加载产品名称失败"));
      }
    },
    [currentAgent, resolveAgentDisplayName]
  );

  const handleOpenReferenceData = useCallback(async () => {
    if (
      !currentAgent ||
      (currentAgent.slug !== "positioning-helper" &&
        currentAgent.slug !== "four-things" &&
        currentAgent.slug !== "nine-grid" &&
        currentAgent.slug !== "course-outline" &&
        currentAgent.slug !== "course-transcript")
    ) {
      return;
    }
    setReferenceForm({
      productName: "",
      content: "",
      fourThingsContent: "",
      nineGridContent: "",
      courseOutlineContent: "",
      currentLesson: "",
      currentLessonOutline: "",
      courseLessonCount: "",
      courseRuleContent: ""
    });
    setReferenceDialogOpen(true);
    try {
      const res = await fetch("/api/results");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: string[] = await res.json();
      setProductNameOptions(data);
      if (currentAgent.slug === "course-outline") {
        const rulesRes = await fetch("/api/course-rules");
        if (rulesRes.ok) {
          const rulesData: CourseRuleRow[] = await rulesRes.json();
          setCourseRules(rulesData);
        }
      }
    } catch (e: any) {
      setError(getErrorMessage(e, "加载产品名称失败"));
    }
  }, [currentAgent, getErrorMessage]);

  const handleSaveResult = useCallback(async () => {
    if (!saveForm) return;
    const productName = saveForm.productName.trim();
    const agentName = saveForm.agentName.trim();
    const lessonCountValue = saveForm.lessonCount.trim();
    const resultContent = saveForm.resultContent.trim();
    if (!productName) {
      setError("请填写产品名称");
      return;
    }
    if (!agentName) {
      setError("请选择智能体名称");
      return;
    }
    const lessonCount = Number(lessonCountValue);
    if (!Number.isFinite(lessonCount) || lessonCount < 0) {
      setError("课程节数必须为大于等于 0 的数字");
      return;
    }
    if (!resultContent) {
      setError("结果内容不能为空");
      return;
    }
    setSavingResult(true);
    setError(null);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          agentName,
          lessonCount,
          resultContent
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setSaveForm((prev) =>
        prev
          ? {
              ...prev,
              createdAt: prev.createdAt ?? data.createdAt
            }
          : prev
      );
      setSaveDialogOpen(false);
      setSaveDialogOpenedAt(null);
    } catch (e: any) {
      setError(getErrorMessage(e, "保存结果失败"));
    } finally {
      setSavingResult(false);
    }
  }, [saveForm]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* 桌面端侧边栏 */}
      <div
        className={`bg-sidebar text-sidebar-text hidden h-screen flex-col border-r border-sidebar-active/40 md:flex ${
          sidebarCollapsed ? "w-16" : ""
        } relative transition-all duration-300 ease-in-out overflow-hidden rounded-tr-[40px] rounded-br-[40px]`}
        style={sidebarCollapsed ? undefined : { width: sidebarWidth }}
      >
        <div className="flex flex-none items-center justify-between px-5 py-5 border-b border-sidebar-active/40">
          <Link href="/" className="text-base font-bold tracking-wide hover:opacity-70 transition-opacity">策划大师</Link>
        </div>
        {!sidebarCollapsed ? (
          <div className="flex-1 overflow-y-scroll min-h-0 py-5 custom-scrollbar">
            <div className="px-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest opacity-50">智能体</div>
              <div className="space-y-0.5">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    disabled={sending}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all duration-200 ${
                      selectedAgentId === agent.id
                        ? "bg-sidebar-active font-medium"
                        : "hover:bg-sidebar-hover"
                    }`}
                    onClick={() => handleSelectAgent(agent.id)}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <AgentMenuIcon slug={agent.slug} />
                      <span className="truncate">{agent.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 px-5 pb-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest opacity-50">对话历史</span>
                <button
                  type="button"
                  className="rounded-md border border-sidebar-active px-2.5 py-1 text-[10px] font-medium hover:bg-sidebar-active transition-all active:scale-95"
                  onClick={handleNewConversation}
                >
                  新建
                </button>
              </div>
              <div className="space-y-0.5">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-200 group ${
                      currentConversationId === conversation.id
                        ? "bg-sidebar-active"
                        : "hover:bg-sidebar-hover"
                    }`}
                    onClick={() =>
                      handleSelectConversation(conversation.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      {renamingConversationId === conversation.id ? (
                        <div className="flex w-full gap-1">
                          <input
                            className="flex-1 rounded bg-black/20 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-white/20"
                            value={renamingConversationTitle}
                            onChange={(event) =>
                              setRenamingConversationTitle(event.target.value)
                            }
                            onClick={(event) => event.stopPropagation()}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="rounded bg-primary px-2 py-1 text-[10px]"
                            onClick={async (event) => {
                              event.stopPropagation();
                              const title = renamingConversationTitle.trim();
                              if (!title) return;
                              await handleRenameConversation(
                                conversation.id,
                                title
                              );
                              setRenamingConversationId(null);
                            }}
                          >
                            存
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="truncate pr-2 font-medium">{conversation.title}</div>
                          <span
                            className="cursor-pointer opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRenamingConversationId(conversation.id);
                              setRenamingConversationTitle(conversation.title);
                            }}
                          >
                            ✎
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-40 group-hover:opacity-60 transition-opacity">
                      <span>
                        {
                          agents.find(
                            (agent) => agent.id === conversation.agent_id
                          )?.name
                        }
                      </span>
                      <span
                        className="cursor-pointer hover:text-red-400"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                      >
                        删除
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex-none border-t border-sidebar-active/40 px-5 py-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-active flex items-center justify-center font-bold text-sm" style={{color: 'var(--sidebar-text)'}}>
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar">{user.username}</span>
                <button
                  type="button"
                  className="text-[10px] text-left opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    void cleanupCurrentConversationIfEmpty();
                    window.location.href = "/account/password";
                  }}
                >
                  修改密码
                </button>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-sidebar-active transition-colors opacity-50 hover:opacity-100"
              onClick={handleLogout}
              title="退出登录"
            >
              <svg className="h-4 w-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
          {(user.role === "admin" || user.role === "super_admin") && (
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-active py-2.5 text-xs font-medium hover:bg-sidebar-active transition-all active:scale-[0.98]"
              onClick={() => {
                void cleanupCurrentConversationIfEmpty();
                window.location.href = "/settings";
              }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              系统设置
            </button>
          )}
        </div>
        <div
          className="relative hidden h-full md:block"
          style={{
            width: 4,
            cursor: "col-resize",
            position: "absolute",
            top: 0,
            right: -2,
            bottom: 0,
            zIndex: 10
          }}
          onMouseDown={() => setDragging(true)}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2 md:hidden">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
          >
            菜单
          </button>
          <div className="text-sm font-semibold">
            {currentConversation?.title || "AI 对话"}
          </div>
          {(user.role === "admin" || user.role === "super_admin") && (
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => {
                void cleanupCurrentConversationIfEmpty();
                window.location.href = "/settings";
              }}
            >
              设置
            </button>
          )}
        </div>

        {mobileSidebarOpen ? (
          <div className="flex max-h-[60vh] flex-col overflow-y-scroll border-b bg-sidebar p-3 text-sidebar-text custom-scrollbar md:hidden">
            <div className="mb-2 text-xs opacity-60">智能体</div>
            <div className="mb-4 flex flex-wrap gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  disabled={sending}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    selectedAgentId === agent.id
                      ? "bg-sidebar-active"
                      : "bg-sidebar-hover"
                  }`}
                  onClick={() => handleSelectAgent(agent.id)}
                >
                  <span className="flex items-center gap-1.5">
                    <AgentMenuIcon slug={agent.slug} />
                    <span className="truncate">{agent.name}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs opacity-60">对话</span>
              <button
                type="button"
                className="rounded bg-sidebar-active px-2 py-1 text-xs hover:bg-sidebar-hover transition-colors"
                onClick={handleNewConversation}
              >
                新建
              </button>
            </div>
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`w-full rounded px-2 py-2 text-left text-xs transition-colors ${
                    currentConversationId === conversation.id
                      ? "bg-sidebar-active"
                      : "bg-sidebar-hover"
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    {renamingConversationId === conversation.id ? (
                      <>
                        <input
                          className="w-full rounded bg-black/10 px-1 py-0.5 text-xs outline-none"
                          value={renamingConversationTitle}
                          onChange={(event) =>
                            setRenamingConversationTitle(event.target.value)
                          }
                          onClick={(event) => event.stopPropagation()}
                          autoFocus
                        />
                        <div className="ml-2 flex gap-1">
                          <button
                            type="button"
                            className="rounded bg-primary px-1 py-0.5 text-[11px] text-white"
                            onClick={async (event) => {
                              event.stopPropagation();
                              const title = renamingConversationTitle.trim();
                              if (!title) return;
                              await handleRenameConversation(
                                conversation.id,
                                title
                              );
                              setRenamingConversationId(null);
                              setRenamingConversationTitle("");
                            }}
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            className="rounded px-1 py-0.5 text-[11px] hover:bg-black/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRenamingConversationId(null);
                              setRenamingConversationTitle("");
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="truncate pr-2">{conversation.title}</div>
                        <span
                          className="cursor-pointer opacity-40 hover:opacity-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRenamingConversationId(conversation.id);
                            setRenamingConversationTitle(conversation.title);
                          }}
                        >
                          ✎
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] opacity-60">
                    <span>
                      {
                        agents.find(
                          (agent) => agent.id === conversation.agent_id
                        )?.name
                      }
                    </span>
                    <span
                      className="cursor-pointer hover:text-red-400"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      删除
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f3efe9]">
          <div className="flex items-center justify-between rounded-bl-[28px] border-b border-[#ded7cc] bg-[#faf8f4] px-6 py-3">
            <div className="flex flex-col">
              <div className="text-base font-semibold text-sidebar-text">
                {currentConversation?.title || "开始新的对话"}
              </div>
              {currentAgent ? (
                <div className="mt-0.5 text-xs text-sidebar-text opacity-50">
                  当前智能体：{currentAgent.name}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {(user.role === "admin" || user.role === "super_admin") ? (
                <label className="flex items-center gap-1.5 text-sidebar-text opacity-60 cursor-pointer hover:opacity-100 transition-opacity">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={devMode}
                    onChange={(event) => setDevMode(event.target.checked)}
                  />
                  <span>开发者模式</span>
                </label>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-sidebar-active px-3 py-1.5 text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar-active transition-all disabled:opacity-30"
                onClick={handleClearConversation}
                disabled={!currentConversationId}
              >
                清除当前会话
              </button>
              <button
                type="button"
                className="rounded-lg border border-sidebar-active px-3 py-1.5 text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar-active transition-all disabled:opacity-30"
                onClick={handleExportConversation}
                disabled={!currentConversationId || messages.length === 0}
              >
                导出
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-scroll rounded-tl-[28px] px-6 py-6 custom-scrollbar bg-[#f3efe9]">
            <div className="mx-auto w-full max-w-4xl">
            {error ? (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600">
                {error}
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => setMessagesReloadKey((prev) => prev + 1)}
                >
                  重试
                </button>
              </div>
            ) : null}
            {generatingConversationId === currentConversationId ? (
              <div className="mb-4 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-xs text-sky-700">
                任务已提交，正在生成结果，请稍候...
              </div>
            ) : null}

            {loadingMessages ? (
              <div className="text-xs text-slate-400">加载中...</div>
            ) : null}

            {!loadingMessages && messages.length === 0 ? (
              <div className="mt-12 text-center text-sm text-slate-400">
                {currentAgent?.slug === "product-one-pager"
                  ? '我是一位大健康产品策划顾问，专门帮助产品团队梳理"产品基本信息一页纸"，可以输入：开始'
                  : "还没有消息，输入内容开始对话"}
              </div>
            ) : null}

            <div className="space-y-4">
              {messages.map((message) => {
                const prompt =
                  message.role === "assistant" ? aiPrompts[message.id] : null;
                const showPromptToggle = devMode && !!prompt;
                const displayedContent =
                  message.role === "assistant" &&
                  typeof message.content === "string"
                    ? stripPendingPrefix(message.content)
                    : message.content;
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className={`space-y-1 ${message.role === "user" ? "max-w-[75%]" : "w-full"}`}>
                      <div
                        ref={(node) => {
                          if (message.id === lastAssistantId) {
                            lastAssistantContentRef.current = node;
                          }
                        }}
                        className={`max-h-[70vh] overflow-y-scroll text-sm custom-scrollbar ${
                          message.role === "user"
                            ? "px-4 py-3 rounded-[28px] bg-sidebar-active text-sidebar-text"
                            : "w-full px-5 py-4 rounded-[28px] bg-white shadow-sm border border-black/5 text-slate-800"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="mb-2 flex items-center justify-end gap-3 text-[11px] text-slate-400">
                            {(currentAgent?.slug === "nine-grid" ||
                              currentAgent?.slug === "positioning-helper" ||
                              currentAgent?.slug === "four-things" ||
                              currentAgent?.slug === "product-one-pager" ||
                              currentAgent?.slug === "course-outline") ? (
                              <button
                                type="button"
                                className="hover:text-slate-700 transition-colors"
                                onClick={() => handleOpenSaveResult(message)}
                              >
                                保存
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="hover:text-slate-700 transition-colors"
                              onClick={() => handleCopy(message)}
                            >
                              点击复制内容
                            </button>
                            {message.id === lastAssistantId ? (
                              <button
                                type="button"
                                className="hover:text-slate-700 transition-colors"
                                onClick={() => handleCopyVisibleResult(message)}
                              >
                                结果拷贝
                              </button>
                            ) : null}
                          </div>
                        )}
                        <div
                          data-copy-result-id={
                            message.role === "assistant" ? String(message.id) : undefined
                          }
                          className={`prose prose-sm max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-p:my-3 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base ${
                            message.role === "user"
                              ? "prose-headings:text-sidebar-text prose-p:text-sidebar-text text-sidebar-text"
                              : "prose-headings:text-slate-800 prose-li:marker:text-slate-400 text-slate-700"
                          }`}
                        >
                          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                            {displayedContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {showPromptToggle ? (
                        <details className="w-full">
                          <summary className="cursor-pointer text-[11px] text-slate-500 underline">
                            查看本次 prompt
                          </summary>
                          <pre className="mt-1 max-h-60 overflow-y-scroll rounded bg-slate-900 p-2 text-[11px] text-slate-100 custom-scrollbar">
                            {prompt}
                          </pre>
                        </details>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomAnchorRef} />
            </div>
            </div>
          </div>

          <div className="border-t border-[#e7dfd5] rounded-tl-[36px] rounded-tr-[36px] bg-[#f8f5f1] px-6 py-4">
            <div className="mx-auto w-full max-w-4xl">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-sidebar-text opacity-40">
              <span>Enter 发送，Shift+Enter 换行</span>
              <div className="flex items-center gap-3">
                {sending ? <span>发送中...</span> : null}
                {!sending && generatingConversationId === currentConversationId ? (
                  <span>已提交，生成中...</span>
                ) : null}
                {(currentAgent?.slug === "positioning-helper" ||
                  currentAgent?.slug === "four-things" ||
                  currentAgent?.slug === "nine-grid" ||
                  currentAgent?.slug === "course-outline" ||
                  currentAgent?.slug === "course-transcript") ? (
                  <button
                    type="button"
                    className="underline normal-case text-[11px] opacity-100"
                    onClick={handleOpenReferenceData}
                  >
                    引用数据
                  </button>
                ) : null}
              </div>
            </div>
            <textarea
              className="w-full min-h-24 max-h-60 overflow-y-scroll resize-none rounded-2xl border border-sidebar-active/60 bg-white px-4 py-3 text-sm text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30 custom-scrollbar placeholder:text-sidebar-text/30"
              placeholder="您可以输入您的需求，让AI为您生成..."
              value={currentInput}
              disabled={sending}
              onChange={(event) => {
                const value = event.target.value;
                setCurrentInput(value);
                if (currentConversationId) {
                  saveDraft(currentConversationId, value);
                }
              }}
              onKeyDown={handleKeyDown}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {sending
                  ? "正在发送..."
                  : generatingConversationId === currentConversationId
                    ? "已提交，正在生成回复..."
                    : ""}
              </div>
              <div className="flex items-center gap-2">
                {sending ? (
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setSending(false)}
                  >
                    停止生成
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={handleSend}
                  disabled={
                    sending ||
                    generatingConversationId === currentConversationId ||
                    !currentInput.trim()
                  }
                >
                  {sending
                    ? "发送中..."
                    : generatingConversationId === currentConversationId
                      ? "生成中..."
                      : "发送"}
                </button>
              </div>
            </div>
            {!currentConversationId ? (
              <div className="mt-2 text-xs text-slate-400">
                请选择智能体并输入内容开始新的对话
              </div>
            ) : null}
            </div>
          </div>
          {referenceDialogOpen && referenceForm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg max-h-[80vh] overflow-y-scroll rounded bg-white p-4 text-xs text-slate-900 custom-scrollbar">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">引用产品一页纸结果</div>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                    onClick={() => {
                      setReferenceDialogOpen(false);
                      setReferenceForm(null);
                    }}
                  >
                    关闭
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      产品名称
                    </label>
                    <input
                      list="product-name-options"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={referenceForm.productName}
                      onChange={(event) =>
                        setReferenceForm((prev) =>
                          prev
                            ? { ...prev, productName: event.target.value }
                            : prev
                        )
                      }
                    />
                    <datalist id="product-name-options">
                      {productNameOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      当前操作人
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={user.username}
                      disabled
                    />
                  </div>
                  {currentAgent && currentAgent.slug === "course-outline" ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          产品一页纸结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.content}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? { ...prev, content: event.target.value }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          四件事结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.fourThingsContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fourThingsContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          九宫格结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.nineGridContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    nineGridContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲规则
                        </label>
                        <select
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          onChange={(e) => {
                            const ruleId = Number(e.target.value);
                            const rule = courseRules.find((r) => r.id === ruleId);
                            if (rule) {
                              setReferenceForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      courseLessonCount: String(rule.lesson_count),
                                      courseRuleContent: rule.rule_content
                                    }
                                  : prev
                              );
                            }
                          }}
                        >
                          <option value="">请选择课纲规则</option>
                          {courseRules.map((rule) => (
                            <option key={rule.id} value={rule.id}>
                              {rule.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲节数
                        </label>
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.courseLessonCount ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    courseLessonCount: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲规则说明
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.courseRuleContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    courseRuleContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                    </>
                  ) : currentAgent && currentAgent.slug === "course-transcript" ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          产品一页纸结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.content}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? { ...prev, content: event.target.value }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          四件事结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.fourThingsContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fourThingsContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          九宫格结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.nineGridContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    nineGridContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲结果内容
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.courseOutlineContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    courseOutlineContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课程当前节数
                        </label>
                        <select
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.currentLesson ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? { ...prev, currentLesson: event.target.value }
                                : prev
                            )
                          }
                        >
                          <option value="">请选择</option>
                          {courseTranscriptLessonOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          四件事和九宫格对应关系
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={courseTranscriptFourThingsNineGridMapping}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲当前第几节
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={courseTranscriptCurrentLessonOutline}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          课纲的上一节课纲
                        </label>
                        <textarea
                          className="h-32 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={courseTranscriptPreviousLessonOutline}
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          产品一页纸结果内容
                        </label>
                        <textarea
                          className="h-40 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.content}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? { ...prev, content: event.target.value }
                                : prev
                            )
                          }
                        />
                      </div>
                      {currentAgent &&
                        (currentAgent.slug === "four-things" ||
                          currentAgent.slug === "nine-grid") && (
                        <div>
                          <label className="mb-1 block text-[11px] text-slate-600">
                            定位结果内容
                          </label>
                          <textarea
                            className="h-40 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            value={referenceForm.positioningContent ?? ""}
                            onChange={(event) =>
                              setReferenceForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      positioningContent: event.target.value
                                    }
                                  : prev
                              )
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1 text-xs"
                    onClick={() => {
                      setReferenceDialogOpen(false);
                      setReferenceForm(null);
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
                    onClick={() => {
                      if (referenceForm) {
                        let text = referenceForm.content;
                        if (currentAgent) {
                          if (
                            currentAgent.slug === "four-things" ||
                            currentAgent.slug === "nine-grid"
                          ) {
                            const posContent = (
                              referenceForm.positioningContent ?? ""
                            ).trim();
                            if (posContent) {
                              text = text
                                ? `${text}\n\n定位信息：\n${posContent}`
                                : `定位信息：\n${posContent}`;
                            }
                          }
                          if (
                            currentAgent.slug === "course-outline" ||
                            currentAgent.slug === "course-transcript"
                          ) {
                            if (currentAgent.slug === "course-outline") {
                              const sections: string[] = [];
                              const productContent = referenceForm.content.trim();
                              const fourThings = (referenceForm.fourThingsContent ?? "").trim();
                              const nineGrid = (referenceForm.nineGridContent ?? "").trim();
                              if (productContent) {
                                sections.push(
                                  `产品信息\n${productContent}`
                                );
                              }
                              if (fourThings) {
                                sections.push(`四件事\n${fourThings}`);
                              }
                              if (nineGrid) {
                                sections.push(`九宫格\n${nineGrid}`);
                              }
                              const lessonCount = (
                                referenceForm.courseLessonCount ?? ""
                              ).trim();
                              const ruleContent = (
                                referenceForm.courseRuleContent ?? ""
                              ).trim();
                              if (lessonCount) {
                                sections.push(`课纲节数\n${lessonCount}`);
                              }
                              if (ruleContent) {
                                sections.push(`课纲规则\n${ruleContent}`);
                              }
                              text = sections.join("\n\n");
                            } else {
                                const sections: string[] = [];
                                const productContent = referenceForm.content.trim();
                                const fourThings = (referenceForm.fourThingsContent ?? "").trim();
                                const nineGrid = (referenceForm.nineGridContent ?? "").trim();
                                if (productContent) {
                                  sections.push(
                                    `产品信息\n${productContent}`
                                  );
                                }
                                if (fourThings) {
                                  sections.push(`四件事\n${fourThings}`);
                                }
                                if (nineGrid) {
                                  sections.push(`九宫格\n${nineGrid}`);
                                }
                                text = sections.join("\n\n");
                            }
                          }
                          if (currentAgent.slug === "course-transcript") {
                            const extraSections: string[] = [];
                            const mapping = courseTranscriptFourThingsNineGridMapping.trim();
                            const currentOutline = courseTranscriptCurrentLessonOutline.trim();
                            const previousOutline = courseTranscriptPreviousLessonOutline.trim();
                            if (mapping) {
                              extraSections.push(
                                `四件事和九宫格关系\n${mapping}`
                              );
                            }
                            if (currentOutline) {
                              extraSections.push(
                                `本节课大纲\n${currentOutline}`
                              );
                            }
                            if (previousOutline) {
                              extraSections.push(
                                `上一节课大纲\n${previousOutline}`
                              );
                            }
                            if (extraSections.length > 0) {
                              const prefix = text.trim();
                              text =
                                prefix.length > 0
                                  ? `${prefix}\n\n${extraSections.join(
                                      "\n\n"
                                    )}`
                                  : extraSections.join("\n\n");
                            }
                          }
                        }
                        setCurrentInput(text);
                        if (currentConversationId) {
                          saveDraft(currentConversationId, text);
                        }
                      }
                      setReferenceDialogOpen(false);
                      setReferenceForm(null);
                    }}
                  >
                    引用数据
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {saveDialogOpen && saveForm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-scroll rounded bg-white p-4 text-xs text-slate-900 custom-scrollbar">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">结果数据保存</div>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setSaveDialogOpenedAt(null);
                    }}
                  >
                    关闭
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      产品名称
                    </label>
                    <input
                      list="product-name-options"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={saveForm.productName}
                      onChange={(event) =>
                        setSaveForm((prev) =>
                          prev
                            ? { ...prev, productName: event.target.value }
                            : prev
                        )
                      }
                    />
                    <datalist id="product-name-options">
                      {productNameOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      智能体名称
                    </label>
                    <select
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={saveForm.agentName}
                      onChange={(event) =>
                        setSaveForm((prev) =>
                          prev
                            ? { ...prev, agentName: event.target.value }
                            : prev
                        )
                      }
                    >
                      <option value="">请选择</option>
                      <option value="产品一页纸">产品一页纸</option>
                      <option value="定位">定位</option>
                      <option value="四件事">四件事</option>
                      <option value="九宫格">九宫格</option>
                      <option value="课纲">课纲</option>
                      <option value="课程">课程</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      课程节数
                    </label>
                    <input
                      type="number"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={saveForm.lessonCount}
                      onChange={(event) =>
                        setSaveForm((prev) =>
                          prev
                            ? { ...prev, lessonCount: event.target.value }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      当前操作人
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={user.username}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      结果内容
                    </label>
                    <textarea
                      className="h-40 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      value={saveForm.resultContent}
                      onChange={(event) =>
                        setSaveForm((prev) =>
                          prev
                            ? { ...prev, resultContent: event.target.value }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-600">
                        创建时间
                      </label>
                      <input
                        className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                        value={
                          saveForm.createdAt
                            ? new Date(saveForm.createdAt).toLocaleString()
                            : ""
                        }
                        disabled
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-600">
                        修改时间
                      </label>
                      <input
                        className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                        value={
                          saveDialogOpenedAt
                            ? new Date(saveDialogOpenedAt).toLocaleString()
                            : ""
                        }
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1 text-xs"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setSaveDialogOpenedAt(null);
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                    onClick={handleSaveResult}
                    disabled={savingResult}
                  >
                    {savingResult ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
