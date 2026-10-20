/** 只格式化已由业务层给出的公历日期键，不决定用户时区或跨日政策。 */
export function desktopDateLabel(key:string,withWeekday=false):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key))throw new Error("记录日期格式无效");
  const date=new Date(key+"T00:00:00Z");
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==key)throw new Error("记录日期无效");
  const [year,month,day]=key.split("-").map(Number);
  const label=`${year}年${month}月${day}日`;
  return withWeekday?`${label} · 星期${["日","一","二","三","四","五","六"][date.getUTCDay()]}`:label;
}
