import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // T4（E1c）：裁内部信息——移除 X-Powered-By 响应头
  poweredByHeader: false,
  // T3（E1c）：全站安全响应头三件套
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 基线 CSP：default-src 'self' + 允许现有 Google Fonts CN 字体域；script/style 保留 Next 注入所需最小 unsafe-inline/eval，
          // img/connect/media 放开 https（images.remotePatterns 全域名）以防既有功能被搞挂。object 禁。
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.cn https://fonts.gstatic.com; font-src 'self' data: https://fonts.googleapis.cn https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' data: blob: https:; media-src 'self' blob: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // A01 旧 URL 兼容（20260924 修订：/chat 独立对话页已建，Lara 定性装修缺陷 A1；/xiaoxue 保留重定向至 /booking 真实小雪对话）
      { source: '/about', destination: '/about-qm', permanent: true },
      { source: '/xiaoxue', destination: '/booking', permanent: true },
      // EV5补修(20260924) EV3 patch2未落地重放: A01旧URL不404原则, 老rail目标308改向
      { source: '/explore', destination: '/knowledge', permanent: true },
      { source: '/memory', destination: '/treehole', permanent: true },
      { source: '/voice', destination: '/chat', permanent: true },
      { source: '/settings', destination: '/data-deletion', permanent: true },
      // 批3(20260923) 旧测评别名处置：/assessment 301 → /assessments（B4-TEST-003 旧入口按批准重定向）
      { source: '/assessment', destination: '/assessments', permanent: true },
      // 批3(20260923) MBTI 旧入口：/assessments/mbti(20题简版) 301 → /mbti 93题v3正式源（B4-TEST-F02）
      { source: '/assessments/mbti', destination: '/mbti', permanent: true },
      // D-P1-1 英文名拼错修正（20260922 波1）：旧派生图 URL 301 → 新文件名（percent-encoded source，兼容解码前后匹配）
      { source: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Elieen_list_desktop_640x640.jpg', destination: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Eileen_list_desktop_640x640.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Elieen_list_mobile_480x480.jpg', destination: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Eileen_list_mobile_480x480.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Elieen_detail_desktop_960x960.jpg', destination: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Eileen_detail_desktop_960x960.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Elieen_detail_mobile_640x640.jpg', destination: '/therapists/derivatives/T13_%E5%8F%B6%E4%BC%B6_Eileen_detail_mobile_640x640.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lliy_list_desktop_640x640.jpg', destination: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lily_list_desktop_640x640.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lliy_list_mobile_480x480.jpg', destination: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lily_list_mobile_480x480.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lliy_detail_desktop_960x960.jpg', destination: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lily_detail_desktop_960x960.jpg', statusCode: 301 },
      { source: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lliy_detail_mobile_640x640.jpg', destination: '/therapists/derivatives/T15_%E5%88%98%E7%A3%8A_Lily_detail_mobile_640x640.jpg', statusCode: 301 },
    ];
  },
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
