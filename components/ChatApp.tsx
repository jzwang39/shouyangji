"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
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

type ActivePanel = "chat" | "data-management";

type ManagedResultRow = {
  id: number;
  productName: string;
  agentName: string;
  lessonCount: number;
  operatorUserId: number;
  operatorName: string;
  resultContent: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  user: UserInfo;
  agents: Agent[];
  allowedMenuKeys: string[];
  initialConversations: Conversation[];
};

const PRODUCT_ONE_PAGER_AGENT_NAME = "产品一页纸「单一产品」";
const COURSE_OUTLINE_AGENT_NAME = "课纲助手「多方法论」";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

const markdownComponents: Components = {
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-slate-50">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-slate-100">{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="align-top even:bg-slate-50/40">{children}</tr>;
  },
  th({ children }) {
    return (
      <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-b border-slate-100 px-3 py-2 whitespace-pre-wrap text-sm text-slate-700">
        {children}
      </td>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 rounded-r-xl border-l-4 border-slate-300 bg-slate-50 px-4 py-3 text-slate-700">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="my-6 border-slate-200" />;
  },
  pre({ children }) {
    return (
      <pre className="my-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
        {children}
      </pre>
    );
  },
  code({ className, children, ...props }) {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800"
        {...props}
      >
        {children}
      </code>
    );
  }
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
  if (slug === "material-tagging-assistant") {
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
        <path d="M20 12V7a2 2 0 0 0-2-2h-5l-7 7 6 6 7-7v-5z" />
        <circle cx="15" cy="9" r="1" />
      </svg>
    );
  }
  if (slug === "deterministic-material-capture-assistant") {
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
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
        <path d="M8 11l2 2 4-4" />
      </svg>
    );
  }
  if (slug === "crisis-material-capture-assistant") {
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
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }
  if (slug === "keyword-material-capture-assistant") {
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
        <path d="M10 13a5 5 0 1 1 3.54-8.54A5 5 0 0 1 10 13z" />
        <path d="m14 14 7 7" />
        <path d="M10 8v4" />
        <path d="M8 10h4" />
      </svg>
    );
  }
  if (slug === "experiment-design-assistant") {
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
        <path d="M10 2v6l-5.5 9.5A2 2 0 0 0 6.24 21h11.52a2 2 0 0 0 1.74-3.5L14 8V2" />
        <path d="M8.5 2h7" />
        <path d="M8 14h8" />
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
const EMPTY_AI_REPLY_FALLBACK = "【系统提示】本次生成未返回内容，请重试。";
const VIRTUAL_CONVERSATION_ID = -1;
const REVISION_ENABLED_SLUGS = new Set([
  "positioning-helper",
  "positioning",
  "positioning-assistant",
  "position-helper",
  "four-things",
  "nine-grid",
  "course-outline",
  "experiment-design-assistant",
  "deterministic-material-capture-assistant",
  "crisis-material-capture-assistant",
  "science-popularization-material-capture-assistant",
  "keyword-material-capture-assistant"
]);

function isRevisionEnabledAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = String(agent.slug ?? "")
    .trim()
    .toLowerCase();
  if (REVISION_ENABLED_SLUGS.has(slug)) return true;
  const name = String(agent.name ?? "").trim();
  if (!name) return false;
  return (
    name.includes("定位") ||
    name.includes("四件事") ||
    name.includes("九宫格") ||
    name.includes("课纲") ||
    name.includes("实验设计") ||
    name.includes("实验") ||
    name.includes("确定性素材抓取") ||
    name.includes("危机素材抓取") ||
    name.includes("科普素材抓取") ||
    name.includes("重点词素材抓取")
  );
}

function normalizeAgentSlug(slug: string | null | undefined) {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function isPositioningAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "positioning-helper" ||
    slug === "positioning" ||
    slug === "positioning-assistant" ||
    slug === "position-helper"
  ) {
    return true;
  }
  return String(agent.name ?? "").includes("定位");
}

function isFourThingsAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (slug === "four-things" || slug === "fourthings" || slug === "four_things") {
    return true;
  }
  return String(agent.name ?? "").includes("四件事");
}

function isNineGridAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (slug === "nine-grid" || slug === "ninegrid" || slug === "nine_grid") {
    return true;
  }
  return String(agent.name ?? "").includes("九宫格");
}

function isCourseOutlineAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (slug === "course-outline" || slug === "courseoutline" || slug === "course_outline") {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("课纲助手") || name === "课纲";
}

function isCourseTranscriptAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "course-transcript" ||
    slug === "course-transcript-single-methodology" ||
    slug === "coursetranscript" ||
    slug === "course_transcript"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("课程逐字稿") || name.includes("逐字稿");
}

function isMaterialTaggingAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "material-tagging-assistant" ||
    slug === "material-tagging" ||
    slug === "material_tagging"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("素材标记");
}

function isDeterministicMaterialCaptureAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "deterministic-material-capture-assistant" ||
    slug === "deterministic-material-capture" ||
    slug === "deterministic_material_capture"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("确定性素材抓取");
}

function isCrisisMaterialCaptureAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "crisis-material-capture-assistant" ||
    slug === "crisis-material-capture" ||
    slug === "crisis_material_capture"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("危机素材抓取");
}

function isSciencePopularizationMaterialCaptureAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "science-popularization-material-capture-assistant" ||
    slug === "science-popularization-material-capture" ||
    slug === "science_popularization_material_capture"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("科普素材抓取");
}

function isKeywordMaterialCaptureAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "keyword-material-capture-assistant" ||
    slug === "keyword-material-capture" ||
    slug === "keyword_material_capture"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("重点词素材抓取");
}

function isExperimentDesignAgent(agent: Agent | null | undefined) {
  if (!agent) return false;
  const slug = normalizeAgentSlug(agent.slug);
  if (
    slug === "experiment-design-assistant" ||
    slug === "experiment-design" ||
    slug === "experiment_design"
  ) {
    return true;
  }
  const name = String(agent.name ?? "");
  return name.includes("实验设计助手") || name.includes("实验设计");
}

function isAnyMaterialCaptureAgent(agent: Agent | null | undefined) {
  return (
    isDeterministicMaterialCaptureAgent(agent) ||
    isCrisisMaterialCaptureAgent(agent) ||
    isSciencePopularizationMaterialCaptureAgent(agent) ||
    isKeywordMaterialCaptureAgent(agent)
  );
}

function stripPendingPrefix(text: string) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith(PENDING_PREFIX)) return String(text ?? "");
  const rest = normalized.slice(PENDING_PREFIX.length).replace(/^\s+/, "");
  return rest ? rest : PENDING_PREFIX;
}

function isPendingAssistantContent(text: string) {
  return stripPendingPrefix(text) === PENDING_PREFIX;
}

function mergeAssistantContent(previous: string, current: string) {
  const previousText = stripPendingPrefix(previous);
  const currentText = stripPendingPrefix(current);

  if (previousText === PENDING_PREFIX) {
    return currentText;
  }
  if (currentText === PENDING_PREFIX) {
    return previousText;
  }
  if (!previousText.trim()) {
    return currentText;
  }
  if (!currentText.trim()) {
    return previousText;
  }

  return `${previousText.replace(/\s+$/, "")}\n\n${currentText.replace(/^\s+/, "")}`;
}

function normalizeMessagesForDisplay(
  messages: Message[],
  agent: Agent | null | undefined
) {
  if (!isMaterialTaggingAgent(agent) && !isAnyMaterialCaptureAgent(agent)) {
    return messages;
  }

  const merged: Message[] = [];
  for (const message of messages) {
    const last = merged[merged.length - 1];
    if (message.role === "assistant" && last?.role === "assistant") {
      merged[merged.length - 1] = {
        ...message,
        created_at: last.created_at,
        content: mergeAssistantContent(last.content, message.content)
      };
      continue;
    }
    merged.push(message);
  }
  return merged;
}

function parseChineseLessonNumber(value: string) {
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  if (/^\d+$/.test(text)) return Number(text);

  const normalized = text.replace(/两/g, "二");
  const digitMap: Record<string, number> = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9
  };

  if (normalized === "十") return 10;
  if (normalized.startsWith("十")) {
    const tail = normalized.slice(1);
    const tailValue = digitMap[tail];
    return Number.isFinite(tailValue) ? 10 + tailValue : NaN;
  }
  if (normalized.endsWith("十")) {
    const head = normalized.slice(0, -1);
    const headValue = digitMap[head];
    return Number.isFinite(headValue) ? headValue * 10 : NaN;
  }
  const tenIndex = normalized.indexOf("十");
  if (tenIndex > 0) {
    const head = normalized.slice(0, tenIndex);
    const tail = normalized.slice(tenIndex + 1);
    const headValue = digitMap[head];
    const tailValue = digitMap[tail];
    if (Number.isFinite(headValue) && Number.isFinite(tailValue)) {
      return headValue * 10 + tailValue;
    }
  }
  const directValue = digitMap[normalized];
  return Number.isFinite(directValue) ? directValue : NaN;
}

function getCourseOutlineLessonMatches(text: string) {
  const source = String(text ?? "");
  const regex =
    /^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:\d+\s*[.、]\s*)?第\s*([0-9一二三四五六七八九十两〇零]+)\s*(?:节|课)(?:课)?(?:\*\*)?\s*[：:：\-—]?.*$/gm;
  return Array.from(source.matchAll(regex)).filter((match) => {
    const value = parseChineseLessonNumber(match[1]);
    return Number.isFinite(value) && value > 0;
  });
}

function getCourseOutlineLessonSection(text: string, lessonIndex: number) {
  if (!Number.isFinite(lessonIndex) || lessonIndex <= 0) return "";
  const source = String(text ?? "");
  const matches = getCourseOutlineLessonMatches(source);
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const value = parseChineseLessonNumber(match[1]);
    if (value !== lessonIndex) continue;
    const start = match.index ?? 0;
    const end =
      i + 1 < matches.length ? (matches[i + 1].index ?? source.length) : source.length;
    return source.slice(start, end).trim();
  }
  return "";
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

function isRevisionIntent(input: string) {
  const text = input.trim();
  if (!text) return false;
  const patterns = [
    /再来一版/,
    /再出一版/,
    /再生成/,
    /重新(来|写|生成)?/,
    /重写/,
    /改(一下|下|成|为|成更)?/,
    /修改/,
    /调整/,
    /优化/,
    /润色/,
    /补充/,
    /精简/,
    /简化/,
    /细化/,
    /能不能/,
    /可以(帮我)?/,
    /把.+改/
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function isLikelyFullInitialInput(input: string) {
  const text = input.trim();
  if (!text) return false;
  if (text.length >= 140) return true;
  const lineCount = text.split(/\r?\n/).filter((line) => line.trim()).length;
  if (lineCount >= 4) return true;
  const markers = [
    "产品信息",
    "产品描述",
    "核心成分",
    "目标用户",
    "核心愿景",
    "解决方案",
    "核心观点",
    "关键词",
    "最终成果",
    "四件事",
    "九宫格",
    "课纲",
    "课程目标"
  ];
  const hitCount = markers.filter((marker) => text.includes(marker)).length;
  return hitCount >= 2;
}

function buildRevisionPrompt(params: {
  agentName: string;
  userInput: string;
  lastResult: string;
  lastPrompt: string;
  referencedContext: string;
}) {
  const { agentName, userInput, lastResult, lastPrompt, referencedContext } = params;
  return `你是一位资深的大健康营销内容专家。当前任务是修订“${agentName}”智能体的结果。
请基于“上一版结果 + 客户本次修改意见 + 当前会话引用过的数据 + 对应提示词”，生成一版修订后的完整结果。

严格要求：
1. 输出必须沿用【上一版结果】的版式和结构（标题名称、层级顺序、分段风格、列表样式都保持一致）。
2. 只修改客户提出的内容，不要随意改写未被要求修改的部分。
3. 必须输出完整结果，不要只给“修改建议”或“差异点”。
4. 若客户意见与旧内容冲突，以客户最新意见为准。
5. 若客户意见不明确，按最小改动原则修订。

【上一版结果】
${lastResult}

【客户本次修改意见】
${userInput}

【当前会话引用过的数据】
${referencedContext || "（本次会话暂无引用数据）"}

【对应提示词（仅作约束参考，输出结构仍以“上一版结果”为准）】
${lastPrompt || "（提示词缺失）"}`;
}

export default function ChatApp(props: Props) {
  // Update timestamp: 2026-03-05 17:35
  const { user, agents, allowedMenuKeys, initialConversations } = props;

  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantContentRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrollConversationIdRef = useRef<number | null>(null);
  const activePollConversationIdRef = useRef<number | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
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
    materialTaggingContent?: string;
  } | null>(null);
  const [courseRules, setCourseRules] = useState<CourseRuleRow[]>([]);
  const [generatingConversationId, setGeneratingConversationId] = useState<
    number | null
  >(null);
  const [referencedContextByConversation, setReferencedContextByConversation] =
    useState<Record<number, string>>({});
  const [dataManagementFilters, setDataManagementFilters] = useState({
    productName: "",
    operatorName: "",
    agentName: ""
  });
  const [managedResults, setManagedResults] = useState<ManagedResultRow[]>([]);
  const [loadingManagedResults, setLoadingManagedResults] = useState(false);
  const [editingManagedResult, setEditingManagedResult] =
    useState<ManagedResultRow | null>(null);
  const [editingManagedResultContent, setEditingManagedResultContent] =
    useState("");
  const [savingManagedResult, setSavingManagedResult] = useState(false);
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

  const resizeMessageInput = useCallback(() => {
    const textarea = messageInputRef.current;
    if (!textarea) return;
    const maxHeight = 320;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    resizeMessageInput();
  }, [currentInput, resizeMessageInput]);

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
  const canAccessDataManagement = allowedMenuKeys.includes("data-management");

  const isAdminViewer = user.role === "admin" || user.role === "super_admin";

  const loadManagedResults = useCallback(
    async (filters: {
      productName: string;
      operatorName: string;
      agentName: string;
    }) => {
      setLoadingManagedResults(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const productName = filters.productName.trim();
        const operatorName = filters.operatorName.trim();
        const agentName = filters.agentName.trim();
        if (productName) params.set("productName", productName);
        if (operatorName) params.set("operatorName", operatorName);
        if (agentName) params.set("agentName", agentName);
        const queryString = params.toString();
        const res = await fetch(
          `/api/results/manage${queryString ? `?${queryString}` : ""}`
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data: ManagedResultRow[] = await res.json();
        setManagedResults(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(getErrorMessage(e, "加载结果数据失败"));
      } finally {
        setLoadingManagedResults(false);
      }
    },
    [getErrorMessage]
  );

  const courseTranscriptLessonOptions = useMemo(() => {
    if (!isCourseTranscriptAgent(currentAgent)) {
      return [];
    }
    if (!referenceForm || !referenceForm.courseOutlineContent) {
      return [];
    }
    const text = referenceForm.courseOutlineContent;
    const lessonNumbers = getCourseOutlineLessonMatches(text)
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
    if (!isCourseTranscriptAgent(currentAgent)) {
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
    return getCourseOutlineLessonSection(
      referenceForm.courseOutlineContent,
      lessonIndex
    );
  }, [currentAgent, referenceForm?.courseOutlineContent, referenceForm?.currentLesson]);

  const courseTranscriptPreviousLessonOutline = useMemo(() => {
    if (!isCourseTranscriptAgent(currentAgent)) {
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
    return getCourseOutlineLessonSection(
      referenceForm.courseOutlineContent,
      lessonIndex
    );
  }, [currentAgent, referenceForm?.courseOutlineContent, referenceForm?.currentLesson]);

  const courseTranscriptFourThingsNineGridMapping = useMemo(() => {
    if (!isCourseTranscriptAgent(currentAgent)) {
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
        const normalizedData = normalizeMessagesForDisplay(data, currentAgent);
        setMessages((prev) => {
          const optimistic = prev.filter((m) => typeof m.id === "number" && m.id < 0);
          if (optimistic.length === 0) return normalizedData;
          const remaining = optimistic.filter(
            (m) => !data.some((d) => d.role === m.role && d.content === m.content)
          );
          if (remaining.length === 0) return normalizedData;
          return [...normalizedData, ...remaining];
        });
        const lastAssistant = [...normalizedData]
          .reverse()
          .find((message) => message.role === "assistant");
        const pending =
          !!lastAssistant &&
          typeof lastAssistant.content === "string" &&
          isPendingAssistantContent(lastAssistant.content);
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
  }, [currentConversationId, currentAgent, getErrorMessage, messagesReloadKey]);

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
          isCourseOutlineAgent(currentAgent) ||
          isCourseTranscriptAgent(currentAgent) ||
          isFourThingsAgent(currentAgent) ||
          isNineGridAgent(currentAgent) ||
          isAnyMaterialCaptureAgent(currentAgent)
        ) {
          const queries: {
            key:
              | "content"
              | "fourThingsContent"
              | "nineGridContent"
              | "courseOutlineContent"
              | "positioningContent"
              | "materialTaggingContent";
            agentName: string;
          }[] =
            isCourseOutlineAgent(currentAgent)
              ? [
                  { key: "content", agentName: PRODUCT_ONE_PAGER_AGENT_NAME },
                  { key: "fourThingsContent", agentName: "四件事" },
                  { key: "nineGridContent", agentName: "九宫格" }
                ]
              : isCourseTranscriptAgent(currentAgent)
              ? [
                  { key: "content", agentName: PRODUCT_ONE_PAGER_AGENT_NAME },
                  { key: "fourThingsContent", agentName: "四件事" },
                  { key: "nineGridContent", agentName: "九宫格" },
                  { key: "courseOutlineContent", agentName: COURSE_OUTLINE_AGENT_NAME }
                ]
              : isFourThingsAgent(currentAgent) || isNineGridAgent(currentAgent)
              ? [
                  { key: "content", agentName: PRODUCT_ONE_PAGER_AGENT_NAME },
                  { key: "positioningContent", agentName: "定位" }
                ]
              : isAnyMaterialCaptureAgent(currentAgent)
              ? [
                  { key: "materialTaggingContent", agentName: "素材标记" }
                ]
              : [
                  { key: "content", agentName: PRODUCT_ONE_PAGER_AGENT_NAME }
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
                  (prevForm, { key, content }) => ({
                    ...prevForm,
                    [key]: content
                  }),
                  prev
                )
              : prev
          );
        } else {
          const params = new URLSearchParams({
            productName: name,
            agentName: PRODUCT_ONE_PAGER_AGENT_NAME
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
        setError(getErrorMessage(e, `加载${PRODUCT_ONE_PAGER_AGENT_NAME}结果失败`));
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
    setActivePanel("chat");
    setCurrentConversationId(conversationId);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const handleNewConversation = () => {
    if (!selectedAgentId) return;
    void cleanupCurrentConversationIfEmpty();
    setActivePanel("chat");
    setCurrentAgentId(selectedAgentId);
    setCurrentConversationId(VIRTUAL_CONVERSATION_ID);
    setMessages([]);
    setCurrentInput("");
    setMobileSidebarOpen(false);
  };

  const handleSelectAgent = (agentId: number) => {
    setActivePanel("chat");
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

  const handleOpenDataManagement = useCallback(() => {
    if (!canAccessDataManagement) return;
    void cleanupCurrentConversationIfEmpty();
    setActivePanel("data-management");
    setMobileSidebarOpen(false);
    void loadManagedResults(dataManagementFilters);
  }, [
    canAccessDataManagement,
    cleanupCurrentConversationIfEmpty,
    dataManagementFilters,
    loadManagedResults
  ]);

  const handleSearchManagedResults = useCallback(() => {
    void loadManagedResults(dataManagementFilters);
  }, [dataManagementFilters, loadManagedResults]);

  const handleResetManagedResults = useCallback(() => {
    const nextFilters = {
      productName: "",
      operatorName: "",
      agentName: ""
    };
    setDataManagementFilters(nextFilters);
    void loadManagedResults(nextFilters);
  }, [loadManagedResults]);

  const handleOpenManagedResultEdit = useCallback((row: ManagedResultRow) => {
    setEditingManagedResult(row);
    setEditingManagedResultContent(row.resultContent);
  }, []);

  const handleSaveManagedResultEdit = useCallback(async () => {
    if (!editingManagedResult) return;
    const resultContent = editingManagedResultContent.trim();
    if (!resultContent) {
      setError("结果内容不能为空");
      return;
    }
    setSavingManagedResult(true);
    setError(null);
    try {
      const res = await fetch("/api/results/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingManagedResult.id,
          resultContent
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: ManagedResultRow = await res.json();
      setManagedResults((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      );
      setEditingManagedResult(null);
      setEditingManagedResultContent("");
    } catch (e: any) {
      setError(getErrorMessage(e, "更新结果内容失败"));
    } finally {
      setSavingManagedResult(false);
    }
  }, [editingManagedResult, editingManagedResultContent, getErrorMessage]);

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
            const normalizedData = normalizeMessagesForDisplay(data, currentAgent);
            if (currentConversationIdRef.current !== conversationId) {
              return;
            }
            setMessages(normalizedData);
            const target = data.find((m) => m.id === assistantMessageId);
            if (!target) {
              continue;
            }
            if (typeof target.content === "string") {
              if (!isPendingAssistantContent(target.content)) {
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
          const normalizedData = normalizeMessagesForDisplay(data, currentAgent);
          if (currentConversationIdRef.current !== conversationId) {
            return;
          }
          setMessages(normalizedData);
          const target = data.find((m) => m.id === assistantMessageId);
          if (target && typeof target.content === "string") {
            if (!isPendingAssistantContent(target.content)) {
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
    [currentAgent]
  );

  const handleSend = async () => {
    if (!currentInput.trim() || sending) return;
    if (!selectedAgentId) {
      setError("请先选择智能体");
      return;
    }
    const content = currentInput;
    const trimmedContent = content.trim();
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => {
        if (message.role !== "assistant") return false;
        const normalized = stripPendingPrefix(String(message.content ?? "")).trim();
        if (!normalized) return false;
        if (normalized === PENDING_PREFIX) return false;
        return true;
      });
    let promptOverride: string | undefined;
    let followupResultContext: string | undefined;
    if (
      isRevisionEnabledAgent(currentAgent) &&
      !isAnyMaterialCaptureAgent(currentAgent) &&
      !isExperimentDesignAgent(currentAgent)
    ) {
      const shouldUseRevisionMode =
        !!lastAssistant &&
        (isRevisionIntent(trimmedContent) ||
          !isLikelyFullInitialInput(trimmedContent));
      if (lastAssistant && shouldUseRevisionMode) {
        const lastResult = stripPendingPrefix(String(lastAssistant.content ?? "")).trim();
        const lastPrompt = aiPrompts[lastAssistant.id] ?? "";
        const lookupConversationId =
          currentConversationId ?? VIRTUAL_CONVERSATION_ID;
        const referencedContext =
          referencedContextByConversation[lookupConversationId] ?? "";
        if (lastResult) {
          promptOverride = buildRevisionPrompt({
            agentName: currentAgent?.name ?? "当前智能体",
            userInput: trimmedContent,
            lastResult,
            lastPrompt,
            referencedContext
          });
        }
      }
    }
    if ((isMaterialTaggingAgent(currentAgent) || isAnyMaterialCaptureAgent(currentAgent)) && lastAssistant) {
      const shouldUseFollowupMode =
        isRevisionIntent(trimmedContent) || !isLikelyFullInitialInput(trimmedContent);
      if (shouldUseFollowupMode) {
        const lastResult = stripPendingPrefix(String(lastAssistant.content ?? "")).trim();
        if (lastResult) {
          followupResultContext = lastResult;
        }
      }
    }
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
        if (
          currentAgent &&
          isRevisionEnabledAgent(currentAgent) &&
          referencedContextByConversation[VIRTUAL_CONVERSATION_ID]
        ) {
          const value = referencedContextByConversation[VIRTUAL_CONVERSATION_ID];
          setReferencedContextByConversation((prev) => ({ ...prev, [conv.id]: value }));
        }
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
          body: JSON.stringify({
            content,
            stream: true,
            promptOverride,
            followupResultContext
          })
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
            const textRaw =
              typeof payload.content === "string" ? payload.content : "";
            const text = textRaw.trim() ? textRaw : EMPTY_AI_REPLY_FALLBACK;
            if (!assistantId) return;
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
      isPendingAssistantContent(lastAssistant.content);
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
      if (slug === "product-one-pager") return PRODUCT_ONE_PAGER_AGENT_NAME;
      if (slug === "positioning-helper") return "定位助手「单一产品」";
      if (slug === "four-things") return "四件事";
      if (slug === "nine-grid") return "九宫格";
      if (slug === "course-outline") return COURSE_OUTLINE_AGENT_NAME;
      if (slug === "course-transcript-single-methodology") return "课程逐字稿「单方法论」";
      if (slug === "course-transcript") return "课程逐字稿「多方法论」";
      if (slug === "material-tagging-assistant") return "素材标记";
      if (slug === "deterministic-material-capture-assistant") return "确定性素材抓取";
      if (slug === "crisis-material-capture-assistant") return "危机素材抓取";
      if (slug === "science-popularization-material-capture-assistant") return "科普素材抓取";
      if (slug === "keyword-material-capture-assistant") return "重点词素材抓取";
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
      (!isPositioningAgent(currentAgent) &&
        !isFourThingsAgent(currentAgent) &&
        !isNineGridAgent(currentAgent) &&
        !isCourseOutlineAgent(currentAgent) &&
        !isCourseTranscriptAgent(currentAgent) &&
        !isAnyMaterialCaptureAgent(currentAgent))
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
      courseRuleContent: "",
      materialTaggingContent: ""
    });
    setReferenceDialogOpen(true);
    try {
      const res = await fetch("/api/results");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: string[] = await res.json();
      setProductNameOptions(data);
      if (isCourseOutlineAgent(currentAgent)) {
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
                      activePanel === "chat" && selectedAgentId === agent.id
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
                {canAccessDataManagement ? (
                  <button
                    type="button"
                    className={`flex w-full items-center rounded-lg px-3 py-2.5 text-xs transition-all duration-200 ${
                      activePanel === "data-management"
                        ? "bg-sidebar-active font-medium"
                        : "hover:bg-sidebar-hover"
                    }`}
                    onClick={handleOpenDataManagement}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
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
                      <span className="truncate">数据管理</span>
                    </span>
                  </button>
                ) : null}
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
                      activePanel === "chat" && currentConversationId === conversation.id
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
            {activePanel === "data-management"
              ? "数据管理"
              : currentConversation?.title || "AI 对话"}
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
                    activePanel === "chat" && selectedAgentId === agent.id
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
              {canAccessDataManagement ? (
                <button
                  type="button"
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    activePanel === "data-management"
                      ? "bg-sidebar-active"
                      : "bg-sidebar-hover"
                  }`}
                  onClick={handleOpenDataManagement}
                >
                  <span className="flex items-center gap-1.5">
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
                    <span className="truncate">数据管理</span>
                  </span>
                </button>
              ) : null}
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
                    activePanel === "chat" && currentConversationId === conversation.id
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
                {activePanel === "data-management"
                  ? "数据管理"
                  : currentConversation?.title || "开始新的对话"}
              </div>
              {activePanel === "data-management" ? (
                <div className="mt-0.5 text-xs text-sidebar-text opacity-50">
                  {isAdminViewer
                    ? "当前为管理员视角，可查看全部已保存结果数据"
                    : "当前仅显示您自己保存的结果数据"}
                </div>
              ) : currentAgent ? (
                <div className="mt-0.5 text-xs text-sidebar-text opacity-50">
                  当前智能体：{currentAgent.name}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {activePanel === "data-management" ? (
                <button
                  type="button"
                  className="rounded-lg border border-sidebar-active px-3 py-1.5 text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar-active transition-all"
                  onClick={handleSearchManagedResults}
                  disabled={loadingManagedResults}
                >
                  {loadingManagedResults ? "加载中..." : "刷新列表"}
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {activePanel === "data-management" ? (
            <div className="min-h-0 flex-1 overflow-y-scroll rounded-tl-[28px] px-6 py-6 custom-scrollbar bg-[#f3efe9]">
              <div className="mx-auto w-full max-w-6xl space-y-4">
                {error ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                  </div>
                ) : null}
                <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
                  <div className="mb-4 text-sm font-semibold text-slate-800">
                    搜索条件
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        产品名称
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                        value={dataManagementFilters.productName}
                        onChange={(event) =>
                          setDataManagementFilters((prev) => ({
                            ...prev,
                            productName: event.target.value
                          }))
                        }
                        placeholder="请输入产品名称"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        操作人
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                        value={dataManagementFilters.operatorName}
                        onChange={(event) =>
                          setDataManagementFilters((prev) => ({
                            ...prev,
                            operatorName: event.target.value
                          }))
                        }
                        placeholder="请输入操作人"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-slate-500">
                        智能体名称
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30"
                        value={dataManagementFilters.agentName}
                        onChange={(event) =>
                          setDataManagementFilters((prev) => ({
                            ...prev,
                            agentName: event.target.value
                          }))
                        }
                        placeholder="请输入智能体名称"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                      onClick={handleResetManagedResults}
                      disabled={loadingManagedResults}
                    >
                      重置
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
                      onClick={handleSearchManagedResults}
                      disabled={loadingManagedResults}
                    >
                      {loadingManagedResults ? "查询中..." : "搜索"}
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="text-sm font-semibold text-slate-800">
                      已保存结果数据
                    </div>
                    <div className="text-xs text-slate-400">
                      {loadingManagedResults
                        ? "正在加载..."
                        : `共 ${managedResults.length} 条`}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">产品名称</th>
                          <th className="px-4 py-3 font-medium">智能体名称</th>
                          <th className="px-4 py-3 font-medium">课程节数</th>
                          <th className="px-4 py-3 font-medium">操作人</th>
                          <th className="px-4 py-3 font-medium">创建时间</th>
                          <th className="px-4 py-3 font-medium">修改时间</th>
                          <th className="px-4 py-3 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managedResults.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-10 text-center text-sm text-slate-400"
                            >
                              {loadingManagedResults
                                ? "结果数据加载中..."
                                : "暂无符合条件的数据"}
                            </td>
                          </tr>
                        ) : (
                          managedResults.map((row) => (
                            <tr
                              key={row.id}
                              className="border-t border-slate-100 align-top"
                            >
                              <td className="px-4 py-3">{row.productName}</td>
                              <td className="px-4 py-3">{row.agentName}</td>
                              <td className="px-4 py-3">{row.lessonCount}</td>
                              <td className="px-4 py-3">{row.operatorName}</td>
                              <td className="px-4 py-3">
                                {formatDateTime(row.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                {formatDateTime(row.updatedAt)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  className="rounded-lg border border-sidebar-active px-3 py-1.5 text-xs text-sidebar-text transition-all hover:bg-sidebar-active"
                                  onClick={() => handleOpenManagedResultEdit(row)}
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
            </div>
          ) : (
            <>
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
                      ? `我是一位大健康产品策划顾问，专门帮助产品团队梳理"${PRODUCT_ONE_PAGER_AGENT_NAME}"，可以输入：开始`
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
                                  currentAgent?.slug === "course-outline" ||
                                  currentAgent?.slug === "material-tagging-assistant") ? (
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
                              className={`prose prose-sm max-w-none prose-headings:mb-3 prose-headings:font-bold prose-p:leading-7 prose-p:my-3 prose-li:my-1 prose-ul:my-3 prose-ol:my-3 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-hr:my-6 prose-code:before:content-none prose-code:after:content-none prose-pre:my-4 prose-pre:bg-transparent prose-pre:p-0 ${
                                message.role === "user"
                                  ? "prose-headings:text-sidebar-text prose-p:text-sidebar-text text-sidebar-text"
                                  : "prose-headings:text-slate-800 prose-strong:text-slate-900 prose-li:marker:text-slate-400 prose-p:text-slate-700 text-slate-700"
                              }`}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={markdownComponents}
                              >
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
                    {(isPositioningAgent(currentAgent) ||
                      isFourThingsAgent(currentAgent) ||
                      isNineGridAgent(currentAgent) ||
                      isCourseOutlineAgent(currentAgent) ||
                      isCourseTranscriptAgent(currentAgent) ||
                      isAnyMaterialCaptureAgent(currentAgent)) ? (
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
                  ref={messageInputRef}
                  className="w-full min-h-24 rounded-2xl border border-sidebar-active/60 bg-white px-4 py-3 text-sm text-sidebar-text outline-none focus:border-sidebar-active focus:ring-1 focus:ring-sidebar-active/30 custom-scrollbar placeholder:text-sidebar-text/30"
                  placeholder="您可以输入您的需求，让AI为您生成..."
                  value={currentInput}
                  disabled={sending}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCurrentInput(value);
                    resizeMessageInput();
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
            </>
          )}
          {referenceDialogOpen && referenceForm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-lg max-h-[80vh] overflow-y-scroll rounded bg-white p-4 text-xs text-slate-900 custom-scrollbar">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {currentAgent && isAnyMaterialCaptureAgent(currentAgent)
                      ? "引用素材标记结果"
                      : `引用${PRODUCT_ONE_PAGER_AGENT_NAME}结果`}
                  </div>
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
                  {isCourseOutlineAgent(currentAgent) ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          {PRODUCT_ONE_PAGER_AGENT_NAME}结果内容
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
                  ) : isCourseTranscriptAgent(currentAgent) ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          {PRODUCT_ONE_PAGER_AGENT_NAME}结果内容
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
                          {COURSE_OUTLINE_AGENT_NAME}结果内容
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
                  ) : isAnyMaterialCaptureAgent(currentAgent) ? (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          素材标记结果内容
                        </label>
                        <textarea
                          className="h-40 w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          value={referenceForm.materialTaggingContent ?? ""}
                          onChange={(event) =>
                            setReferenceForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    materialTaggingContent: event.target.value
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-600">
                          {PRODUCT_ONE_PAGER_AGENT_NAME}结果内容
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
                        (isFourThingsAgent(currentAgent) ||
                          isNineGridAgent(currentAgent)) && (
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
                            isFourThingsAgent(currentAgent) ||
                            isNineGridAgent(currentAgent)
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
                            isCourseOutlineAgent(currentAgent) ||
                            isCourseTranscriptAgent(currentAgent)
                          ) {
                            if (isCourseOutlineAgent(currentAgent)) {
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
                          if (isCourseTranscriptAgent(currentAgent)) {
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
                          if (isAnyMaterialCaptureAgent(currentAgent)) {
                            const materialTaggingContent = (
                              referenceForm.materialTaggingContent ?? ""
                            ).trim();
                            if (materialTaggingContent) {
                              text = materialTaggingContent;
                            }
                          }
                        }
                        setCurrentInput(text);
                        if (currentConversationId) {
                          saveDraft(currentConversationId, text);
                        }
                        if (
                          currentAgent &&
                          isRevisionEnabledAgent(currentAgent)
                        ) {
                          const referencedContext = text.trim();
                          if (referencedContext) {
                            const key = currentConversationId ?? VIRTUAL_CONVERSATION_ID;
                            setReferencedContextByConversation((prev) => ({
                              ...prev,
                              [key]: referencedContext
                            }));
                          }
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
                      <option value={PRODUCT_ONE_PAGER_AGENT_NAME}>
                        {PRODUCT_ONE_PAGER_AGENT_NAME}
                      </option>
                      <option value="定位">定位</option>
                      <option value="四件事">四件事</option>
                      <option value="九宫格">九宫格</option>
                      <option value={COURSE_OUTLINE_AGENT_NAME}>
                        {COURSE_OUTLINE_AGENT_NAME}
                      </option>
                      <option value="课程">课程</option>
                      <option value="素材标记">素材标记</option>
                      <option value="确定性素材抓取">确定性素材抓取</option>
                      <option value="危机素材抓取">危机素材抓取</option>
                      <option value="科普素材抓取">科普素材抓取</option>
                      <option value="重点词素材抓取">重点词素材抓取</option>
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
          {editingManagedResult ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-scroll rounded bg-white p-4 text-xs text-slate-900 custom-scrollbar">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">修改结果内容</div>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                    onClick={() => {
                      setEditingManagedResult(null);
                      setEditingManagedResultContent("");
                    }}
                  >
                    关闭
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      产品名称
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={editingManagedResult.productName}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      智能体名称
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={editingManagedResult.agentName}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      课程节数
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={String(editingManagedResult.lessonCount)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      操作人
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={editingManagedResult.operatorName}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      创建时间
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={formatDateTime(editingManagedResult.createdAt)}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      修改时间
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      value={formatDateTime(editingManagedResult.updatedAt)}
                      disabled
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] text-slate-600">
                    结果内容
                  </label>
                  <textarea
                    className="h-80 w-full rounded border border-slate-300 px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={editingManagedResultContent}
                    onChange={(event) =>
                      setEditingManagedResultContent(event.target.value)
                    }
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1 text-xs"
                    onClick={() => {
                      setEditingManagedResult(null);
                      setEditingManagedResultContent("");
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                    onClick={handleSaveManagedResultEdit}
                    disabled={savingManagedResult}
                  >
                    {savingManagedResult ? "保存中..." : "保存"}
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
