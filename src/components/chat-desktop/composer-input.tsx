"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
  type CompositionEvent,
} from "react";
import { emoticons } from "./emoticons";
export function readComposer(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node instanceof HTMLElement && node.dataset.emoticon !== undefined)
    return `[QM表情:${node.dataset.emoticon}]`;
  if (node.nodeName === "BR") return "\n";
  const children = [...node.childNodes].filter(
    (child) => child.nodeType !== Node.TEXT_NODE || child.textContent !== "",
  );
  // Browsers keep a BR in an empty editable or empty block. Line separators
  // belong between blocks; that placeholder is not an extra user newline.
  if (children.length === 1 && children[0].nodeName === "BR") return "";
  return children
    .map((child, i) => {
      const block = /^(DIV|P)$/.test(child.nodeName);
      const previousBlock = i > 0 && /^(DIV|P)$/.test(children[i - 1].nodeName);
      const placeholderBreak = child.nodeName === "BR" &&
        (i === children.length - 1 ||
          ((i === 0 || previousBlock) && /^(DIV|P)$/.test(children[i + 1].nodeName)));
      return (i > 0 && (block || previousBlock) ? "\n" : "") +
        (placeholderBreak ? "" : readComposer(child));
    })
    .join("");
}
function adjacentEmoticon(node: HTMLElement, backwards: boolean): HTMLElement | null {
  const selection = getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.startContainer)) return null;
  let neighbor: Node | null = null;
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    if (backwards && range.startOffset === 0)
      neighbor = range.startContainer.previousSibling;
    if (!backwards && range.startOffset === range.startContainer.textContent?.length)
      neighbor = range.startContainer.nextSibling;
  } else {
    const index = range.startOffset - (backwards ? 1 : 0);
    neighbor = range.startContainer.childNodes[index] ?? null;
  }
  while (neighbor?.nodeType === Node.TEXT_NODE && !neighbor.textContent)
    neighbor = backwards ? neighbor.previousSibling : neighbor.nextSibling;
  if (!(neighbor instanceof HTMLElement) || neighbor.dataset.emoticon === undefined || !node.contains(neighbor))
    return null;
  return neighbor;
}
function deleteAdjacentEmoticon(node: HTMLElement, backwards: boolean): boolean {
  const neighbor = adjacentEmoticon(node, backwards);
  const selection = getSelection();
  if (!neighbor || !selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  range.selectNode(neighbor);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("delete");
  return true;
}
function tokenNode(index: number): HTMLElement {
  const item = emoticons[index];
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.emoticon = String(index);
  span.role = "img";
  span.setAttribute("aria-label", item[0]);
  span.className = "chat-input-emoticon";
  Object.assign(span.style, {
    display: "inline-block",
    width: "26px",
    height: "26px",
    verticalAlign: "middle",
    backgroundImage: "url(/visual/chat-desktop/approved-emoticon-panel.png)",
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${13 - item[1] * 0.619}px ${13 - item[2] * 0.619}px`,
    backgroundSize: `${1586 * 0.619}px ${992 * 0.619}px`,
  });
  return span;
}
// Flatten browser-created line blocks before inserting atomic clipboard nodes.
// Otherwise Chromium can lift an inline sprite out of the current DIV and add a line.
function flattenForAtomicPaste(node: HTMLElement) {
  const selection = getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.startContainer) || !node.contains(range.endContainer)) return;
  const prefix = document.createRange();
  prefix.selectNodeContents(node);
  prefix.setEnd(range.startContainer, range.startOffset);
  const start = readComposer(prefix.cloneContents()).length;
  prefix.setEnd(range.endContainer, range.endOffset);
  const end = readComposer(prefix.cloneContents()).length;
  const text = readComposer(node);
  node.replaceChildren();
  for (const part of text.split(/(\[QM表情:\d+\])/g)) {
    const match = part.match(/^\[QM表情:(\d+)\]$/);
    const index = match ? Number(match[1]) : -1;
    node.append(emoticons[index] ? tokenNode(index) : document.createTextNode(part));
  }
  function point(offset: number): [Node, number] {
    let used = 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      const size = readComposer(child).length;
      if (offset <= used + size) {
        if (child.nodeType === Node.TEXT_NODE) return [child, Math.max(0, offset - used)];
        return [node, offset === used ? i : i + 1];
      }
      used += size;
    }
    return [node, node.childNodes.length];
  }
  const next = document.createRange();
  next.setStart(...point(start));
  next.setEnd(...point(end));
  selection.removeAllRanges();
  selection.addRange(next);
}
export interface ComposerHandle {
  insert: (index: number) => void;
  erase: () => void;
}
interface Props {
  hidden?: boolean;
  value: string;
  onChange: (text: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onCompositionStart: (event: CompositionEvent<HTMLDivElement>) => void;
  onCompositionEnd: (event: CompositionEvent<HTMLDivElement>) => void;
}
export const ComposerInput = forwardRef<ComposerHandle, Props>(
  function ComposerInput(
    {
      hidden,
      value,
      onChange,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
    },
    forwardedRef,
  ) {
    const ref = useRef<HTMLDivElement>(null);
    const caret = useRef<Range | null>(null);
    const focusVersion = useRef(0);
    const pointerFocus = useRef(false);
    const previousHidden = useRef(hidden);
    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      const replaceFullSelection = (event: InputEvent) => {
        if (event.isComposing || !event.inputType.startsWith("insert")) return;
        const selection = getSelection();
        if (!selection?.rangeCount || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const contents = document.createRange();
        contents.selectNodeContents(node);
        if (
          range.compareBoundaryPoints(Range.START_TO_START, contents) !== 0 ||
          range.compareBoundaryPoints(Range.END_TO_END, contents) !== 0
        ) return;
        // Native replacement can preserve a trailing newline even when the
        // DOM range covers it. Use the browser's edit command so deleting and
        // replacing the selection remain in the native undo history.
        if (document.execCommand("delete")) return;
        range.deleteContents();
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      };
      node.addEventListener("beforeinput", replaceFullSelection);
      return () => node.removeEventListener("beforeinput", replaceFullSelection);
    }, []);
    useEffect(() => {
      const wasHidden = previousHidden.current;
      previousHidden.current = hidden;
      if (wasHidden && !hidden && ref.current) {
        ref.current.focus();
        const range = caret.current;
        if (range && ref.current.contains(range.startContainer)) {
          const selection = getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }, [hidden]);
    useImperativeHandle(
      forwardedRef,
      () => ({
        erase() {
          const node = ref.current;
          if (!node) return;
          node.focus();
          const range = caret.current;
          if (range && node.contains(range.startContainer)) {
            const selection = getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
          focusVersion.current++;
          if (!deleteAdjacentEmoticon(node, true)) document.execCommand("delete");
          onChange(readComposer(node));
        },
        insert(index) {
          const node = ref.current;
          if (!node || !emoticons[index]) return;
          let range = caret.current;
          if (!range || !node.contains(range.startContainer)) {
            range = document.createRange();
            range.selectNodeContents(node);
            range.collapse(false);
          }
          const token = tokenNode(index);
          range.deleteContents();
          range.insertNode(token);
          range.setStartAfter(token);
          range.collapse(true);
          node.focus();
          const selection = getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          focusVersion.current++;
          caret.current = range.cloneRange();
          onChange(readComposer(node));
        },
      }),
      [onChange],
    );
    useEffect(() => {
      const node = ref.current;
      if (!node || readComposer(node) === value) return;
      const active = document.activeElement === node;
      node.replaceChildren();
      caret.current = null;
      for (const part of value.split(/(\[QM表情:\d+\])/g)) {
        const m = part.match(/^\[QM表情:(\d+)\]$/);
        const index = m ? Number(m[1]) : -1;
        node.append(
          emoticons[index] ? tokenNode(index) : document.createTextNode(part),
        );
      }
      if (active) {
        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        const selection = getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        caret.current = range.cloneRange();
      }
    }, [value]);
    return (
      <div
        className="chat-input chat-editable"
        style={hidden ? { display: "none" } : undefined}
        contentEditable
        suppressContentEditableWarning
        ref={ref}
        role="textbox"
        aria-label="消息输入"
        aria-multiline="true"
        data-value={value}
        data-placeholder="想说什么，都可以从这里开始…"
        onInput={(e) => {
          focusVersion.current++;
          onChange(readComposer(e.currentTarget));
        }}
        onPointerDown={() => {
          pointerFocus.current = true;
          focusVersion.current++;
        }}
        onPointerUp={() => { pointerFocus.current = false; }}
        onPointerCancel={() => { pointerFocus.current = false; }}
        onFocus={() => {
          const node = ref.current;
          const range = caret.current?.cloneRange();
          const version = ++focusVersion.current;
          const byPointer = pointerFocus.current;
          pointerFocus.current = false;
          if (!node || !range || byPointer) return;
          // Native focus can reset selection after the focus handler returns.
          // An explicit insert/input invalidates this deferred restoration.
          queueMicrotask(() => {
            if (
              version === focusVersion.current &&
              document.activeElement === node &&
              node.contains(range.startContainer) &&
              node.contains(range.endContainer)
            ) {
              const selection = getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
          });
        }}
        onBlur={() => {
          const selection = getSelection();
          if (
            selection?.rangeCount &&
            ref.current?.contains(selection.anchorNode)
          )
            caret.current = selection.getRangeAt(0).cloneRange();
        }}
        onKeyDown={(event) => {
          // Chromium's native select-all can omit a trailing newline in a
          // contenteditable text node. Include every draft node so replacement
          // and copy do not silently retain or lose the user's final line.
          if (
            event.key.toLowerCase() === "a" &&
            (event.ctrlKey || event.metaKey) && !event.altKey &&
            !event.nativeEvent.isComposing
          ) {
            const selection = getSelection();
            if (selection) {
              event.preventDefault();
              focusVersion.current++;
              const range = document.createRange();
              range.selectNodeContents(event.currentTarget);
              selection.removeAllRanges();
              selection.addRange(range);
              caret.current = range.cloneRange();
            }
            return;
          }
          if (
            (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
            !event.ctrlKey && !event.metaKey && !event.altKey &&
            !event.nativeEvent.isComposing
          ) {
            const node = ref.current;
            const neighbor = node && adjacentEmoticon(node, event.key === "ArrowLeft");
            const selection = getSelection();
            if (neighbor && selection?.rangeCount) {
              event.preventDefault();
              const range = selection.getRangeAt(0).cloneRange();
              if (event.key === "ArrowLeft") range.setStartBefore(neighbor);
              else range.setStartAfter(neighbor);
              range.collapse(true);
              if (event.shiftKey) selection.extend(range.startContainer, range.startOffset);
              else {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              caret.current = selection.getRangeAt(0).cloneRange();
              return;
            }
          }
          if (event.key === "Enter" && event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            document.execCommand("insertText", false, "\n");
            onChange(readComposer(event.currentTarget));
            return;
          }
          if (
            (event.key === "Backspace" || event.key === "Delete") &&
            !event.ctrlKey && !event.metaKey && !event.altKey &&
            !event.nativeEvent.isComposing
          ) {
            const node = ref.current;
            if (node && deleteAdjacentEmoticon(node, event.key === "Backspace")) {
              event.preventDefault();
              const selection = getSelection();
              caret.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
              onChange(readComposer(node));
              return;
            }
          }
          onKeyDown(event);
        }}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onCopy={(e) => {
          const selection = getSelection();
          if (!selection?.rangeCount || selection.isCollapsed) return;
          const range = selection.getRangeAt(0);
          if (!e.currentTarget.contains(range.startContainer) || !e.currentTarget.contains(range.endContainer)) return;
          const text = readComposer(range.cloneContents());
          e.preventDefault();
          e.clipboardData.setData("application/x-qm-composer", JSON.stringify({ version: 1, text }));
          e.clipboardData.setData("text/plain", text.replace(/\[QM表情:(\d+)\]/g, (token, index) => emoticons[Number(index)] ? `[${emoticons[Number(index)][0]}]` : token));
        }}
        onCut={(e) => {
          const selection = getSelection();
          if (!selection?.rangeCount || selection.isCollapsed) return;
          const range = selection.getRangeAt(0);
          if (!e.currentTarget.contains(range.startContainer) || !e.currentTarget.contains(range.endContainer)) return;
          const text = readComposer(range.cloneContents());
          e.preventDefault();
          e.clipboardData.setData("application/x-qm-composer", JSON.stringify({ version: 1, text }));
          e.clipboardData.setData("text/plain", text.replace(/\[QM表情:(\d+)\]/g, (token, index) => emoticons[Number(index)] ? `[${emoticons[Number(index)][0]}]` : token));
          document.execCommand("delete");
          onChange(readComposer(e.currentTarget));
        }}
        onPaste={(e) => {
          e.preventDefault();
          const internal = e.clipboardData.getData("application/x-qm-composer");
          let text: string | null = null;
          if (internal && internal.length <= 100000) {
            try {
              const data = JSON.parse(internal);
              if (data?.version === 1 && typeof data.text === "string") text = data.text;
            } catch { /* Invalid clipboard metadata falls back to plain text. */ }
          }
          if (text !== null) {
            flattenForAtomicPaste(e.currentTarget);
            const fragment = document.createElement("span");
            for (const part of text.split(/(\[QM表情:\d+\])/g)) {
              const match = part.match(/^\[QM表情:(\d+)\]$/);
              const index = match ? Number(match[1]) : -1;
              fragment.append(emoticons[index] ? tokenNode(index) : document.createTextNode(part));
            }
            document.execCommand("insertHTML", false, fragment.outerHTML);
          } else {
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }
          onChange(readComposer(e.currentTarget));
        }}
        onDrop={(e) => e.preventDefault()}
      />
    );
  },
);
