import type { Metadata } from 'next';
import './globals.css';
import RootErrorBoundary from '@/components/root-error-boundary';
import { OptionalFontResources } from '@/components/optional-font-resources';
import { LegacyDesktopHeader } from '@/components/qm-site-shell/legacy-desktop-header';

export const metadata: Metadata = {
  title: {
    default: 'QM AI - 心理支持助手',
    template: '%s | QM AI',
  },
  description:
    'QM AI 是面向多元性别人群的心理支持助手，提供安全、温暖的情绪支持空间。',
  keywords: ['心理支持', '情绪陪伴', '多元性别', 'LGBTQ+', '心理健康'],
  // P1.8 H12：分享与 SEO 基础项
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://queermental.coze.site',
    siteName: 'QM AI',
    title: 'QM AI - 心理支持助手',
    description: '面向多元性别人群的心理支持助手，提供安全、温暖的情绪支持空间。',
    images: [
      {
        url: 'https://queermental.coze.site/qm-v5/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QM AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QM AI - 心理支持助手',
    description: '面向多元性别人群的心理支持助手，提供安全、温暖的情绪支持空间。',
    images: ['https://queermental.coze.site/qm-v5/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <OptionalFontResources />
        <RootErrorBoundary>
          <LegacyDesktopHeader chatHasOwnHeader={process.env.QM_CHAT_DESKTOP_CANDIDATE === "true"} />
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  );
}
