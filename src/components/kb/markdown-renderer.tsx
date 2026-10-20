"use client";

import React from "react";
import Link from "next/link";

/**
 * 轻量级 Markdown 渲染器 v2.0 (QA04)
 * 支持：H1-H4、段落、引用块（含PracticeCard/WhisperCard/SafetyCard特殊区块）、
 *       无序列表、有序列表、粗体、斜体、行内代码、分隔线、链接、表格
 * 专为 QM 知识库文章排版设计，无需外部依赖
 */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 行内格式解析：粗体、斜体、行内代码、链接
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // 匹配 **bold**、*italic*、`code`、[text](url)
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      // bold
      nodes.push(
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-[#2D2D2D]">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // italic
      nodes.push(
        <em key={`${keyBase}-i-${i}`} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4] !== undefined) {
      // inline code
      nodes.push(
        <code
          key={`${keyBase}-c-${i}`}
          className="px-1.5 py-0.5 bg-gray-100 text-[#6B4C9A] rounded text-sm font-mono"
        >
          {match[4]}
        </code>
      );
    } else if (match[5] !== undefined && match[6] !== undefined) {
      // link
      const href = match[6];
      const isInternal = href.startsWith("/") || href.startsWith("#");
      nodes.push(
        isInternal ? (
          <a
            key={`${keyBase}-l-${i}`}
            href={href}
            className="text-[#6B4C9A] underline underline-offset-2 hover:text-[#62428B]"
          >
            {match[5]}
          </a>
        ) : (
          <a
            key={`${keyBase}-l-${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B4C9A] underline underline-offset-2 hover:text-[#62428B]"
          >
            {match[5]}
          </a>
        )
      );
    }
    lastIndex = regex.lastIndex;
    i++;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

// 将标题文本转换为URL安全的slug（用于TOC锚点）
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 检测blockquote是否为练习卡
function isPracticeBlock(quoteText: string): boolean {
  const stripped = quoteText.replace(/^\*\*/, "").trim();
  return stripped.startsWith("练习") || stripped.startsWith("小练习");
}

// 检测是否为表格行
function isTableRow(line: string): boolean {
  return /^\|.*\|$/.test(line.trim()) && line.includes("|");
}

// 检测是否为表格分隔行
function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

// 解析表格行
function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行跳过
    if (line.trim() === "") {
      i++;
      continue;
    }

    // H1 (文章内H1不重复渲染，因为页面标题已显示)
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      const text = line.slice(3);
      const headingId = slugify(text);

      // 特殊区块样式：小酷心理耳语 WhisperCard
      if (text.includes("小酷心理耳语")) {
        blocks.push(
          <div
            key={blockKey++}
            className="mt-8 p-5 rounded-2xl"
            style={{ background: "#F8F6FA", border: "1px solid #E8DEFA", borderLeft: "4px solid #6B4C9A" }}
          >
            <h2 className="text-lg font-semibold text-[#6B4C9A] mb-3 flex items-center gap-2">
              💬 {text.replace("💬 ", "").replace("小酷心理耳语", "小酷心理耳语")}
            </h2>
            {renderWhisperBody(lines, i + 1, blockKey)}
          </div>
        );
        i = skipUntilNextBlock(lines, i + 1);
        blockKey += 10;
        continue;
      }

      // 特殊区块：安全提示 SafetyCard（暖金/灰紫配色，非红色）
      if (text.includes("什么时候需要更多支持") || text.includes("专业边界") || text.includes("安全提示")) {
        blocks.push(
          <div
            key={blockKey++}
            className="mt-8 p-5 rounded-2xl"
            style={{ background: "#F8F6FA", border: "1px solid #E8DEFA", borderLeft: "4px solid #C9A96E" }}
          >
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "#4E376F" }}>
              ⚠️ {renderInline(text, `safety-title-${blockKey}`)}
            </h2>
            {renderSafetyBody(lines, i + 1, blockKey)}
          </div>
        );
        i = skipUntilNextBlock(lines, i + 1);
        blockKey += 10;
        continue;
      }

      // 特殊区块：带走一个问题 QuestionCard
      if (text.includes("带走一个问题")) {
        blocks.push(
          <div
            key={blockKey++}
            className="mt-8 p-6 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #EEE8F6 0%, #F8F6FA 100%)", border: "1px solid #D8C9EC" }}
          >
            <h2 className="text-lg font-semibold text-[#6B4C9A] mb-3 flex items-center gap-2">
              ✨ {renderInline(text, `question-title-${blockKey}`)}
            </h2>
            {renderQuestionBody(lines, i + 1, blockKey)}
          </div>
        );
        i = skipUntilNextBlock(lines, i + 1);
        blockKey += 10;
        continue;
      }

      // 特殊区块：两分钟复盘
      if (text.includes("两分钟复盘")) {
        blocks.push(
          <div key={blockKey++} className="mt-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              📝 {renderInline(text, `review-title-${blockKey}`)}
            </h2>
            {renderGenericBody(lines, i + 1, blockKey)}
          </div>
        );
        i = skipUntilNextBlock(lines, i + 1);
        blockKey += 10;
        continue;
      }

      // 特殊区块：下一步
      if (text.includes("下一步")) {
        blocks.push(
          <div key={blockKey++} className="mt-8 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-3">下一步</h3>
            {renderNextSteps(lines, i + 1, blockKey)}
          </div>
        );
        i = skipUntilNextBlock(lines, i + 1);
        blockKey += 10;
        continue;
      }

      // 普通H2：带ID供TOC锚点
      blocks.push(
        <h2
          key={blockKey++}
          id={headingId}
          className="text-[22px] md:text-[26px] font-semibold text-[#2D2D2D] mt-8 mb-4 leading-[1.35] scroll-mt-20"
        >
          {renderInline(text, `h2-${blockKey}`)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={blockKey++} className="text-[18px] md:text-[20px] font-medium text-[#4E376F] mt-5 mb-2 leading-[1.45]">
          {renderInline(line.slice(4), `h3-${blockKey}`)}
        </h3>
      );
      i++;
      continue;
    }

    // H4
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4 key={blockKey++} className="text-base font-semibold text-[#6B4C9A] mt-5 mb-2">
          {renderInline(line.slice(5), `h4-${blockKey}`)}
        </h4>
      );
      i++;
      continue;
    }

    // 表格
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerCells = parseTableRow(line);
      i += 2; // 跳过表头和分隔行

      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }

      blocks.push(
        <div key={blockKey++} className="my-6 overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse text-sm min-w-[400px]">
            <thead>
              <tr className="border-b-2 border-[#6B4C9A]/20">
                {headerCells.map((cell, ci) => (
                  <th
                    key={ci}
                    className="text-left py-2.5 px-3 font-semibold text-[#4E376F] whitespace-nowrap"
                  >
                    {renderInline(cell, `th-${blockKey}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 hover:bg-[#F8F6FA]/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2.5 px-3 text-gray-700 leading-relaxed">
                      {renderInline(cell, `td-${blockKey}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const quoteText = quoteLines.join(" ");

      // 检查是否是meta头
      if (quoteText.includes("QM知识库") || quoteText.includes("阅读时间")) {
        continue;
      }

      // PracticeCard: > **练习** 或 > **小练习** 开头
      if (isPracticeBlock(quoteText)) {
        blocks.push(
          <div
            key={blockKey++}
            className="my-6 p-5 rounded-2xl"
            style={{ background: "#EEE8F6", border: "1px solid #D8C9EC", borderLeft: "4px solid #6B4C9A" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-semibold text-[#6B4C9A]">练习</span>
            </div>
            <div className="space-y-2">
              {quoteLines.map((ql, qi) => {
                // 移除开头的 **练习** 或 **小练习** 标记
                const cleaned = ql.replace(/^\*\*(小?练习)\*\*[：:]?\s*/, "");
                if (!cleaned.trim()) return null;
                return (
                  <p key={qi} className="text-[#4E376F] leading-[1.8] text-[15px]">
                    {renderInline(cleaned, `practice-${blockKey}-${qi}`)}
                  </p>
                );
              })}
            </div>
          </div>
        );
        continue;
      }

      // 普通blockquote
      blocks.push(
        <blockquote
          key={blockKey++}
          className="my-4 pl-4 border-l-4 border-[#6B4C9A]/30 text-[#6F6876] italic"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{renderInline(ql, `bq-${blockKey}-${qi}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // HR
    if (line.startsWith("---")) {
      blocks.push(<hr key={blockKey++} className="my-8 border-gray-100" />);
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={blockKey++} className="my-3 space-y-1.5 list-none pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-[#2D2D2D] leading-[1.8]">
              <span className="text-[#6B4C9A] mt-1.5 shrink-0">•</span>
              <span>{renderInline(item, `ul-${blockKey}-${ii}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol key={blockKey++} className="my-3 space-y-2 list-none pl-1 counter-reset-step">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-3 text-[#2D2D2D] leading-[1.8]">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#6B4C9A]/10 text-[#6B4C9A] text-xs font-medium flex items-center justify-center mt-0.5">
                {ii + 1}
              </span>
              <span className="pt-0.5">{renderInline(item, `ol-${blockKey}-${ii}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // meta_description / related / batch / status (skip - 不显示后台字段)
    if (
      line.startsWith("meta_description:") ||
      line.startsWith("related:") ||
      line.startsWith("batch:") ||
      line.startsWith("status:")
    ) {
      i++;
      continue;
    }

    // Regular paragraph (collect consecutive non-empty, non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("- ") &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("---") &&
      !isTableRow(lines[i]) &&
      !lines[i].startsWith("meta_description:") &&
      !lines[i].startsWith("related:") &&
      !lines[i].startsWith("batch:") &&
      !lines[i].startsWith("status:")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={blockKey++} className="my-3 text-[#2D2D2D] leading-[1.8] text-[16px] md:text-[17px]">
          {renderInline(paraLines.join(" "), `p-${blockKey}`)}
        </p>
      );
    }
  }

  return <div className={`qm-article-body ${className}`}>{blocks}</div>;
}

// Helper: skip lines until next H2 or HR or end
function skipUntilNextBlock(lines: string[], startIdx: number): number {
  let idx = startIdx;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    idx++;
  }
  return idx;
}

// Render whisper body (between H2 and next H2/HR)
function renderWhisperBody(lines: string[], startIdx: number, keyBase: number): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let idx = startIdx;
  let pKey = 0;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    if (l.trim() === "") { idx++; continue; }
    if (l.startsWith("- ")) {
      const items: string[] = [];
      while (idx < lines.length && lines[idx].startsWith("- ")) {
        items.push(lines[idx].slice(2)); idx++;
      }
      nodes.push(
        <ul key={`w-${keyBase}-${pKey++}`} className="space-y-1 pl-1">
          {items.map((it, ii) => <li key={ii} className="text-[#2D2D2D] leading-[1.8]">• {renderInline(it, `wul-${keyBase}-${ii}`)}</li>)}
        </ul>
      );
      continue;
    }
    nodes.push(
      <p key={`w-${keyBase}-${pKey++}`} className="text-[#2D2D2D] leading-[1.8] mb-2 last:mb-0">
        {renderInline(l, `wp-${keyBase}-${pKey}`)}
      </p>
    );
    idx++;
  }
  return <>{nodes}</>;
}

function renderSafetyBody(lines: string[], startIdx: number, keyBase: number): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let idx = startIdx;
  let pKey = 0;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    if (l.trim() === "") { idx++; continue; }
    nodes.push(
      <p key={`s-${keyBase}-${pKey++}`} className="text-[#4E376F] leading-[1.8] mb-2 last:mb-0 text-sm">
        {renderInline(l, `sp-${keyBase}-${pKey}`)}
      </p>
    );
    idx++;
  }
  return <>{nodes}</>;
}

function renderQuestionBody(lines: string[], startIdx: number, keyBase: number): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let idx = startIdx;
  let pKey = 0;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    if (l.trim() === "") { idx++; continue; }
    if (l.startsWith("> ")) {
      nodes.push(
        <p key={`q-${keyBase}-${pKey++}`} className="text-lg text-[#6B4C9A] font-medium leading-relaxed">
          {renderInline(l.slice(2), `qq-${keyBase}-${pKey}`)}
        </p>
      );
      idx++;
      continue;
    }
    nodes.push(<p key={`q-${keyBase}-${pKey++}`}>{l}</p>);
    idx++;
  }
  return <>{nodes}</>;
}

function renderGenericBody(lines: string[], startIdx: number, keyBase: number): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let idx = startIdx;
  let pKey = 0;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    if (l.trim() === "") { idx++; continue; }
    nodes.push(
      <p key={`g-${keyBase}-${pKey++}`} className="text-[#6F6876] leading-[1.8] mb-2 last:mb-0 text-sm">
        {renderInline(l, `gp-${keyBase}-${pKey}`)}
      </p>
    );
    idx++;
  }
  return <>{nodes}</>;
}

function renderNextSteps(lines: string[], startIdx: number, keyBase: number): React.ReactNode {
  const items: React.ReactNode[] = [];
  let idx = startIdx;
  let pKey = 0;
  while (idx < lines.length) {
    const l = lines[idx];
    if (l.startsWith("## ") && !l.startsWith("### ")) break;
    if (l.startsWith("---")) break;
    if (l.trim() === "") { idx++; continue; }
    if (l.startsWith("- **") && l.includes("聊")) {
      items.push(
        <Link
          key={`ns-${keyBase}-${pKey++}`}
          href="/chat"
          className="flex items-center gap-3 p-3 rounded-xl bg-[#6B4C9A]/5 hover:bg-[#6B4C9A]/10 transition-colors group"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm text-[#2D2D2D] group-hover:text-[#6B4C9A]">
            {renderInline(l.slice(2).replace(/\*\*/g, ""), `nsl-${keyBase}-${pKey}`)}
          </span>
        </Link>
      );
    } else if (l.startsWith("- **") && l.includes("测评")) {
      items.push(
        <Link
          key={`ns-${keyBase}-${pKey++}`}
          href="/assessments"
          className="flex items-center gap-3 p-3 rounded-xl bg-[#6B4C9A]/5 hover:bg-[#6B4C9A]/10 transition-colors group"
        >
          <span className="text-lg">📊</span>
          <span className="text-sm text-[#2D2D2D] group-hover:text-[#6B4C9A]">
            {renderInline(l.slice(2).replace(/\*\*/g, ""), `nsa-${keyBase}-${pKey}`)}
          </span>
        </Link>
      );
    } else if (l.startsWith("- **") && (l.includes("预约") || l.includes("小雪"))) {
      items.push(
        <Link
          key={`ns-${keyBase}-${pKey++}`}
          href="/therapists"
          className="flex items-center gap-3 p-3 rounded-xl bg-[#6B4C9A]/5 hover:bg-[#6B4C9A]/10 transition-colors group"
        >
          <span className="text-lg">📅</span>
          <span className="text-sm text-[#2D2D2D] group-hover:text-[#6B4C9A]">
            {renderInline(l.slice(2).replace(/\*\*/g, ""), `nsb-${keyBase}-${pKey}`)}
          </span>
        </Link>
      );
    } else if (l.startsWith("- **") && l.includes("知识库")) {
      items.push(
        <Link
          key={`ns-${keyBase}-${pKey++}`}
          href="/knowledge"
          className="flex items-center gap-3 p-3 rounded-xl bg-[#6B4C9A]/5 hover:bg-[#6B4C9A]/10 transition-colors group"
        >
          <span className="text-lg">📚</span>
          <span className="text-sm text-[#2D2D2D] group-hover:text-[#6B4C9A]">
            {renderInline(l.slice(2).replace(/\*\*/g, ""), `nsk-${keyBase}-${pKey}`)}
          </span>
        </Link>
      );
    } else if (l.startsWith("- ")) {
      items.push(
        <div key={`ns-${keyBase}-${pKey++}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <span className="text-sm text-[#6F6876]">{renderInline(l.slice(2), `nso-${keyBase}-${pKey}`)}</span>
        </div>
      );
    }
    idx++;
  }
  return <div className="space-y-2">{items}</div>;
}
