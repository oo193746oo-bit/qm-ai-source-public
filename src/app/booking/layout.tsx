import { redirect } from "next/navigation";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '预约咨询 - QM AI 心理支持平台',
  description: '预约 QM 酷儿心理的专业心理咨询师，获取一对一心理支持服务。',
};

/** Lara隐藏小雪决定：旧公开入口转到真人心理师；原页面/脑资产保留。 */
export default function BookingLayout() {
  redirect("/therapists");
}
