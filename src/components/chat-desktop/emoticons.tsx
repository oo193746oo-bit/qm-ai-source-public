import { Fragment } from "react";
// Human-approved sheet; not official WeChat artwork. CSS sprites retain original bytes.
export const emoticons = [
  ["开心", 284, 857],
  ["笑哭", 357, 857],
  ["爱心眼", 425, 857],
  ["生气", 495, 857],
  ["酷", 564, 857],
  ["哭泣", 633, 857],
  ["亲亲", 705, 857],
  ["露齿笑", 775, 857],
  ["睡觉", 850, 857],
  ["担心", 921, 857],
  ["捂嘴笑", 999, 857],
  ["满足", 1073, 857],
  ["惊讶", 285, 916],
  ["无语", 357, 916],
  ["白眼", 425, 916],
  ["晕", 495, 916],
  ["惊吓", 564, 916],
  ["骷髅", 633, 916],
  ["捂脸", 705, 916],
  ["嘘", 775, 916],
  ["合十", 850, 916],
  ["赞", 921, 916],
  ["爱心", 999, 916],
  ["心碎", 1073, 916],
  ["最近笑哭", 285, 790],
  ["最近微笑", 357, 790],
  ["最近爱心", 423, 790],
  ["最近委屈", 489, 790],
  ["最近赞", 555, 790],
  ["最近捂脸", 621, 790],
  ["最近哭泣", 687, 790],
  ["最近微笑二", 757, 790],
] as const;
export function Emoticon({ index }: { index: number }) {
  const item = emoticons[index];
  return (
    <span
      role="img"
      aria-label={item[0]}
      className="chat-emoticon"
      style={{
        display: "inline-block",
        width: 42,
        height: 42,
        verticalAlign: "middle",
        backgroundImage:
          "url(/visual/chat-desktop/approved-emoticon-panel.png)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${21 - item[1]}px ${21 - item[2]}px`,
        backgroundSize: "1586px 992px",
      }}
    />
  );
}
export function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[QM表情:\d+\]|\n)/g).map((part, i) => {
        const m = part.match(/^\[QM表情:(\d+)\]$/);
        const index = m ? Number(m[1]) : -1;
        return index >= 0 && index < emoticons.length ? (
          <Emoticon index={index} key={i} />
        ) : (
          <Fragment key={i}>{part === "\n" ? <br /> : part}</Fragment>
        );
      })}
    </>
  );
}
