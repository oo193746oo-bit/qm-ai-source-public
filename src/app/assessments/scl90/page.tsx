'use client';

import { useState, useEffect } from 'react';
import {
  calculateScl90,
  checkCrisisRisk,
  type Scl90Answers,
} from '@/lib/assessments/scl90-scoring';
import {
  buildFactorStories,
  buildCombinedStory,
  buildWhisper,
  buildLifeScenes,
  buildSupportDirection,
  type FactorStory,
} from '@/lib/assessments/scl90-narrative';
import { scl90Factors } from '@/lib/assessments/scl90-data';

const QM_PURPLE = '#6B4C9A';
const QM_HOTLINE = '15001930070';
const QM_WECHAT = '';

export default function Scl90ResultPage() {
  const [answers, setAnswers] = useState<Scl90Answers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 URL query 或 localStorage 读取答案
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');

    let parsed: Scl90Answers | null = null;

    if (dataParam) {
      try {
        const decoded = atob(dataParam);
        parsed = JSON.parse(decoded);
      } catch (e) {
        console.warn('[SCL-90] Failed to parse base64 data', e);
      }
    }

    if (!parsed) {
      const local =
        typeof window !== 'undefined' ? localStorage.getItem('scl90_answers') : null;
      if (local) {
        try {
          parsed = JSON.parse(local);
        } catch (e) {
          console.warn('[SCL-90] Failed to parse local answers', e);
        }
      }
    }

    setAnswers(parsed);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
    );
  }

  if (!answers) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        <h2>暂无测评数据</h2>
        <p>请先完成 SCL-90 测评。</p>
      </div>
    );
  }

  const scoreResult = calculateScl90(answers);
  const { hasCrisisRisk } = checkCrisisRisk(answers);
  const factorStories = buildFactorStories(scoreResult.factorResults);
  const combinedStory = buildCombinedStory(factorStories);
  const whisper = buildWhisper(factorStories, scoreResult.totalMean);
  const lifeScenes = buildLifeScenes(factorStories);
  const supportDir = buildSupportDirection(factorStories);

  const handlePrint = () => {
    console.log('[SCL-90] 下载 PDF / 打印（占位实现）');
    window.print();
  };

  const handleSaveImage = () => {
    console.log('[SCL-90] 保存图片（占位实现，后续由专门模块完成）');
    alert('保存图片功能即将上线，敬请期待～');
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 20px 60px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1f2937',
        lineHeight: 1.7,
      }}
    >
      {/* 1. Hero + 非诊断说明 */}
      <Section>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: QM_PURPLE,
              margin: 0,
            }}
          >
            SCL-90 情绪自评
          </h1>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: 14 }}>
            90 题症状筛查与自我观察
          </p>
        </div>
        <DisclaimerBanner />
      </Section>

      {/* 安全覆盖：危机卡片 */}
      {hasCrisisRisk && <CrisisCard />}

      {/* 2. 综合指标 */}
      <Section title='综合指标'>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <MetricCard
            label='总分'
            value={scoreResult.totalScore.toFixed(0)}
            sub='90-450 范围'
          />
          <MetricCard
            label='筛查结果'
            value={scoreResult.screeningLabel}
            sub={scoreResult.screeningDescription}
            isHighlight
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          <MetricCard
            label='总均分'
            value={scoreResult.totalMean.toFixed(2)}
            sub='GSI 原始值'
            small
          />
          <MetricCard
            label='阳性题数'
            value={String(scoreResult.positiveItems)}
            sub='≥2 分 / 共 90 题'
            small
          />
          <MetricCard
            label='痛苦水平'
            value={scoreResult.psdi ? scoreResult.psdi.toFixed(2) : '—'}
            sub='PSDI 指数'
            small
          />
        </div>
        <p
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          ⚠ 筛查结果基于量表常模范围，不构成任何疾病诊断
        </p>
      </Section>

      {/* 3. 10 因子可视化 */}
      <Section title='10 个因子画像'>
        <FactorBars factorStories={factorStories} />
      </Section>

      {/* 4. 整体情绪与压力画像（联合叙事） */}
      <Section title='整体情绪与压力画像'>
        <p style={{ margin: 0, color: '#374151' }}>{combinedStory}</p>
      </Section>

      {/* 5. 10 因子场景解释 */}
      <Section title='因子场景解释'>
        <FactorStoriesList factorStories={factorStories} />
      </Section>

      {/* 6. 组合画像 */}
      <Section title='组合画像'>
        <CombinedPortrait factorStories={factorStories} />
      </Section>

      {/* 7. 小酷心理耳语 */}
      {!hasCrisisRisk && (
        <Section title='小酷心理耳语'>
          <WhisperCard whisper={whisper} />
        </Section>
      )}
      {hasCrisisRisk && (
        <Section title='小酷想对你说'>
          <SafetyWhisperCard />
        </Section>
      )}

      {/* 8. 生活场景镜像 */}
      <Section title='生活场景镜像'>
        <LifeScenesGrid scenes={lifeScenes} />
      </Section>

      {/* 9. 专业支持方向 */}
      <Section title='专业支持方向'>
        <SupportDirectionCard dir={supportDir} />
      </Section>

      {/* 10. 医疗评估提示 */}
      <Section title='什么时候考虑医疗评估'>
        <MedicalEvaluationCard />
      </Section>

      {/* 11. 下一步 */}
      <Section title='下一步'>
        <NextStepsCard onPrint={handlePrint} onSaveImage={handleSaveImage} />
      </Section>

      {/* 底部声明 */}
      <div
        style={{
          marginTop: 40,
          padding: '20px 0',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        <p>SCL-90 是自我观察工具，不是诊断工具。</p>
        <p>本结果仅反映你最近一周的感受，不构成任何医疗或心理诊断。</p>
        <p>如需专业支持，请联系 QM 上海酷儿心理咨询中心</p>
        <p style={{ fontWeight: 600, color: QM_PURPLE }}>
          热线：{QM_HOTLINE} ｜ 微信：{QM_WECHAT}
        </p>
      </div>
    </div>
  );
}

// ==================== 子组件 ====================

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      {title && (
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: QM_PURPLE,
            marginBottom: 16,
            paddingBottom: 8,
            borderBottom: '2px solid #e9d5ff',
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function DisclaimerBanner() {
  return (
    <div
      style={{
        backgroundColor: '#faf5ff',
        border: '1px solid #e9d5ff',
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 13,
        color: '#6b21a8',
        marginTop: 16,
      }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>📌 重要说明</p>
      <p style={{ margin: '6px 0 0 0', fontSize: 12 }}>
        SCL-90 是一份症状筛查与<strong>自我观察工具</strong>，
        <strong>不是诊断工具</strong>。它不能判断你是否患有某种心理障碍或疾病。
        分数反映的是你最近一周的感受强度，帮助你更了解自己当下的状态。
        如有困扰，建议寻求专业支持。
      </p>
    </div>
  );
}

function CrisisCard() {
  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        border: '2px solid #ef4444',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 32,
      }}
    >
      <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: 16 }}>
        ⚠️ 如果你此刻正在经历困难
      </h3>
      <p style={{ margin: '0 0 10px 0', fontSize: 14, color: '#7f1d1d' }}>
        如果你有伤害自己的想法，请一定记得：你不是一个人，也有很多人在乎你。
        请立即联系：
      </p>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
        <p style={{ margin: '4px 0' }}>📞 QM 心理援助热线：{QM_HOTLINE}</p>
        <p style={{ margin: '4px 0' }}>💬 微信客服：{QM_WECHAT}</p>
        <p style={{ margin: '4px 0' }}>👥 或联系你身边信任的人</p>
      </div>
      <p style={{ margin: '10px 0 0 0', fontSize: 12, color: '#991b1b' }}>
        请记住：这些感受虽然强烈，但它们是可以变化的。你值得被帮助，也值得好好活下去。
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  isHighlight,
  small,
}: {
  label: string;
  value: string;
  sub: string;
  isHighlight?: boolean;
  small?: boolean;
}) {
  const bgColor = isHighlight ? '#faf5ff' : '#fff';
  const borderColor = isHighlight ? QM_PURPLE : '#e5e7eb';
  const valueColor = isHighlight ? QM_PURPLE : QM_PURPLE;
  const valueSize = small ? 18 : 24;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: small ? '10px 6px' : '16px 8px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: small ? 11 : 12,
          color: '#6b7280',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: valueSize,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: small ? 10 : 11,
          color: '#9ca3af',
          marginTop: 2,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function FactorBars({ factorStories }: { factorStories: FactorStory[] }) {
  const maxMean = 5;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {factorStories.map((fs) => {
        const factor = scl90Factors.find((f) => f.code === fs.factorCode);
        const percentage = (fs.mean / maxMean) * 100;
        return (
          <div key={fs.factorCode}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 500 }}>{fs.factorName}</span>
              <span style={{ color: '#6b7280' }}>
                {fs.mean.toFixed(2)} 分
              </span>
            </div>
            <div
              style={{
                height: 8,
                backgroundColor: '#f3f4f6',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: factor?.color || QM_PURPLE,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FactorStoriesList({
  factorStories,
}: {
  factorStories: FactorStory[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {factorStories.map((fs) => {
        const factor = scl90Factors.find((f) => f.code === fs.factorCode);
        const tierLabel =
          fs.tier === 'low' ? '相对低' : fs.tier === 'mid' ? '中等' : '相对高';
        return (
          <div
            key={fs.factorCode}
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              borderLeft: `4px solid ${factor?.color || QM_PURPLE}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: QM_PURPLE,
                  margin: 0,
                }}
              >
                {fs.factorName}
              </h3>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {fs.mean.toFixed(2)} 分 · {tierLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#374151' }}>
              <p style={{ margin: '8px 0' }}>
                <strong>💭 日常感受：</strong>
                {fs.narrative.whatItMayFeelLike}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>🏠 生活场景：</strong>
                {fs.narrative.inDailyLife}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>👀 值得观察：</strong>
                {fs.narrative.whatToNotice}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CombinedPortrait({
  factorStories,
}: {
  factorStories: FactorStory[];
}) {
  const sorted = [...factorStories].sort((a, b) => b.mean - a.mean);
  const top3 = sorted.slice(0, 3);
  const topNames = top3.map((f) => f.factorName).join('、');
  return (
    <div
      style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
        borderRadius: 12,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: '#5b21b6',
          lineHeight: 1.8,
        }}
      >
        从你的答题结果来看，<strong>{topNames}</strong>
        这几个维度相对更突出一些。它们可能相互关联、彼此影响，
        构成了你此刻独特的心理画像。请记得：这只是你<strong>当下</strong>
        状态的一个快照，不代表你就是这样的人。人是流动的，状态也是会变化的。
      </p>
    </div>
  );
}

function WhisperCard({
  whisper,
}: {
  whisper: ReturnType<typeof buildWhisper>;
}) {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#fdf4ff',
        borderRadius: 16,
        border: `1px solid ${QM_PURPLE}20`,
      }}
    >
      <div
        style={{
          fontStyle: 'italic',
          color: QM_PURPLE,
          fontSize: 14,
          lineHeight: 2,
        }}
      >
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>✨ 我看见——</strong>
          {whisper.iSee}
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>💜 我怎么理解——</strong>
          {whisper.iUnderstand}
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>👁️ 需要认真看一眼的地方——</strong>
          {whisper.lookCloser}
        </p>
        <p style={{ margin: 0 }}>
          <strong>❓ 一个问题——</strong>
          {whisper.oneQuestion}
        </p>
      </div>
    </div>
  );
}

function SafetyWhisperCard() {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#fef2f2',
        borderRadius: 16,
        border: '1px solid #fecaca',
      }}
    >
      <div style={{ color: '#dc2626', fontSize: 14, lineHeight: 2 }}>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>你现在可能正在经历非常痛苦的时刻。</strong>
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          请知道：这些感受虽然真实而强烈，但它们不会永远这样。
          你值得被帮助，也值得好好活下去。
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>如果你有伤害自己的想法，请立刻联系：</strong>
        </p>
        <p style={{ margin: '4px 0', fontWeight: 600 }}>
          📞 QM 心理援助热线：{QM_HOTLINE}
        </p>
        <p style={{ margin: '4px 0', fontWeight: 600 }}>
          💬 微信客服：{QM_WECHAT}
        </p>
        <p style={{ margin: '4px 0' }}>或联系身边信任的人，让他们陪着你。</p>
      </div>
    </div>
  );
}

function LifeScenesGrid({
  scenes,
}: {
  scenes: ReturnType<typeof buildLifeScenes>;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
      }}
    >
      {scenes.map((scene, i) => (
        <div
          key={i}
          style={{
            padding: '14px',
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
          }}
        >
          <h4
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: QM_PURPLE,
              margin: '0 0 6px 0',
            }}
          >
            {scene.area}
          </h4>
          <p
            style={{
              fontSize: 12,
              color: '#4b5563',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {scene.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function SupportDirectionCard({
  dir,
}: {
  dir: ReturnType<typeof buildSupportDirection>;
}) {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
      }}
    >
      <h3 style={{ fontSize: 15, color: '#166534', margin: '0 0 10px 0' }}>
        💬 你可以这样对心理师说
      </h3>
      <p
        style={{
          fontSize: 13,
          color: '#14532d',
          fontStyle: 'italic',
          margin: '0 0 16px 0',
        }}
      >
        {dir.howToSay}
      </p>
      <h3 style={{ fontSize: 15, color: '#166534', margin: '0 0 8px 0' }}>
        📝 可以讨论的方向
      </h3>
      <ul
        style={{
          fontSize: 13,
          color: '#14532d',
          margin: 0,
          paddingLeft: 20,
        }}
      >
        {dir.discussionTopics.map((topic, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {topic}
          </li>
        ))}
      </ul>
      <p
        style={{
          fontSize: 11,
          color: '#166534',
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        ⚠ 以上仅为参考方向，不构成治疗方案建议。具体的咨询方式请与你的专业人员共同讨论。
      </p>
    </div>
  );
}

function MedicalEvaluationCard() {
  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 12,
      }}
    >
      <p
        style={{
          fontSize: 13,
          color: '#78350f',
          margin: 0,
          lineHeight: 1.8,
        }}
      >
        <strong>考虑医疗评估的情况：</strong>
        <br />• 症状持续两周以上，且没有明显缓解
        <br />• 严重影响了睡眠、饮食、工作或人际关系
        <br />• 出现了伤害自己或他人的想法
        <br />• 有一些别人无法理解的感知或想法，并感到很困扰
        <br />
        <br />
        如果你不确定，也可以先和 QM 的咨询师聊聊，他们会帮你评估下一步的方向。
      </p>
    </div>
  );
}

function NextStepsCard({
  onPrint,
  onSaveImage,
}: {
  onPrint: () => void;
  onSaveImage: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        onClick={onPrint}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: QM_PURPLE,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        📄 下载 PDF / 打印
      </button>
      <button
        onClick={onSaveImage}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#fff',
          color: QM_PURPLE,
          border: `1px solid ${QM_PURPLE}`,
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        🖼️ 保存图片
      </button>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          💬 和小酷聊
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          🔄 重测
        </button>
      </div>
      <div
        style={{
          marginTop: 8,
          padding: '12px',
          backgroundColor: '#fef3c7',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 13,
          color: '#92400e',
        }}
      >
        📞 遇到危机？请拨打 QM 心理援助热线：
        <strong>{QM_HOTLINE}</strong>
      </div>
    </div>
  );
}
