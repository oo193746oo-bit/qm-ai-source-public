'use client';

import { Component } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

const HOTLINES: { label: string; note: string }[] = [
  { label: '12356', note: '全国心理援助热线，7×24 小时' },
  { label: '15001930070', note: 'QM 24 小时危机热线' },
  { label: '12355', note: '未成年人心理服务热线' },
];

const CRISIS_SUPPORT_HINT =
  '页面遇到了一些问题。你的安全始终是第一位的。需要即时支持时，可拨打以下热线：';

export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[QM_ERR] rendering error:', error);
    console.error('[QM_ERR] component stack:', info?.componentStack ?? '');
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #fdf0f7 0%, #fff7ec 100%)',
            fontFamily: "'Noto Sans SC', sans-serif",
            color: '#3a2e2a',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#ffffff',
              borderRadius: 24,
              padding: '32px 28px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
            <h2 style={{ fontSize: 20, margin: '0 0 12px', color: '#bf4d5f' }}>
              页面暂时出了点小问题
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8a7b74', margin: '0 0 16px' }}>
              {CRISIS_SUPPORT_HINT}
            </p>
            <div style={{ textAlign: 'left', margin: '0 0 20px' }}>
              {HOTLINES.map((h) => (
                <div
                  key={h.label}
                  style={{ fontSize: 14, lineHeight: 1.8, color: '#3a2e2a' }}
                >
                  <span style={{ fontWeight: 600, color: '#bf4d5f' }}>📞 {h.label}</span>
                  <span style={{ color: '#8a7b74' }}>（{h.note}）</span>
                </div>
              ))}
              <div style={{ fontSize: 14, lineHeight: 1.8, color: '#3a2e2a' }}>
                <span style={{ fontWeight: 600, color: '#bf4d5f' }}>⚠️ 紧急危险</span>
                <span style={{ color: '#8a7b74' }}>请拨 110 / 120</span>
              </div>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #f4b8c4 0%, #ffd9a8 100%)',
                color: '#5b3a33',
                border: 'none',
                borderRadius: 999,
                padding: '10px 28px',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              重新加载
            </button>
            <p style={{ fontSize: 12, color: '#b3a69f', marginTop: 20, lineHeight: 1.6 }}>
              若持续出现，可在首页或我的账号中找到帮助入口
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}