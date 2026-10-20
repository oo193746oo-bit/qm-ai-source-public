// QM 心理师推荐引擎 v4.0
import { THERAPISTS, THERAPIST_ORDER, findTherapistByName } from './data';
import type { Therapist, TherapistRecommendation, BookingFields } from './types';

// ==================== 核心推荐逻辑 ====================

/**
 * 根据用户填写的信息推荐2-3位心理师
 * 综合匹配：核心需求、语言、预算、身份偏好、服务方式
 * 不使用"匹配度98%"等伪精确分数
 */
export function recommendTherapists(fields: BookingFields): TherapistRecommendation[] {
  let candidates = [...THERAPISTS].filter((t) => t.role === '心理师');

  // 1. 预算过滤
  if (fields.budget && fields.budget > 0) {
    candidates = candidates.filter((t) => t.price <= fields.budget!);
  }

  // 2. 性别偏好
  if (fields.gender_preference && fields.gender_preference !== 'no_preference') {
    // 简化：根据中文名大致判断性别偏好
    // 注：实际系统应有明确的心理师性别字段
    // 这里只做基本过滤，不保证精确
    const femaleNames = [
      '彭瑞', '舒瑱', '瑞琪', '天岚', '万从容', '丁怡', '徐玮伶',
      '闫雪', '陈一明', '叶伶', '麦兜', '张菁', '王艳', '潘新瑞',
      '周传美', '汪芳',
    ];
    const maleNames = [
      '范晓', '墨瑞', '祖迪', '刘磊', '徐凯', '许安', '柳宇哲',
    ];

    if (fields.gender_preference === 'female') {
      candidates = candidates.filter((t) => femaleNames.includes(t.name));
    } else if (fields.gender_preference === 'male') {
      candidates = candidates.filter((t) => maleNames.includes(t.name));
    }
  }

  // 3. 语言偏好
  if (fields.language_preference && fields.language_preference.length > 0) {
    const wantEnglish = fields.language_preference.some((l) =>
      l.toLowerCase().includes('english') || l === '英语',
    );
    const wantShanghainese = fields.language_preference.some((l) =>
      l.includes('沪') || l.includes('上海') || l === 'shanghainese',
    );
    const wantCantonese = fields.language_preference.some((l) =>
      l.includes('粤') || l === 'cantonese',
    );

    if (wantEnglish) {
      const englishTherapists = candidates.filter((t) =>
        t.languages.some((lang) => lang.includes('英语') || lang.includes('英文') || lang.includes('English')),
      );
      if (englishTherapists.length > 0) {
        candidates = englishTherapists;
      }
    }
    if (wantShanghainese) {
      const shanghaiTherapists = candidates.filter((t) =>
        t.languages.some((lang) => lang.includes('沪语')),
      );
      if (shanghaiTherapists.length > 0) {
        candidates = shanghaiTherapists;
      }
    }
    if (wantCantonese) {
      const cantoTherapists = candidates.filter((t) =>
        t.languages.some((lang) => lang.includes('粤语')),
      );
      if (cantoTherapists.length > 0) {
        candidates = cantoTherapists;
      }
    }
  }

  // 4. 核心议题匹配（计算相关度但不输出分数）
  const topics = fields.core_topics || [];
  const topicKeywords: Record<string, string[]> = {
    anxiety: ['抑郁焦虑', '情绪问题', '情绪管理', '情绪困境', '情绪障碍', '焦虑/压力'],
    relationship: ['情感恋爱', '亲密关系', '婚恋情感', '多元伴侣', '失恋分手'],
    family: ['婚姻家庭', '亲子教育', '亲子关系', '原生家庭', '家庭/原生家庭'],
    work: ['职场课题', '职业发展', '职场发展', '职业转型', '职场探索', '生涯发展', '职场规划', '职场教练'],
    trauma: ['心理创伤', '性之创伤', '创伤相关'],
    adhd: ['ADHD'],
    lgbtq: ['LGBTQ+', '性别多元', '性别多元LGBTQ+', 'LGBTQ+/性别多元'],
    identity: ['身份认同', '自我认同', '自我成长', '自我探索', '身份探索'],
    depression: ['抑郁焦虑', '情绪问题', '情绪障碍', '抑郁/低落', '情绪困境'],
    other: [],
  };

  // 为每位候选心理师计算匹配原因
  const scored: { therapist: Therapist; reasons: string[]; matchCount: number }[] = [];

  for (const therapist of candidates) {
    const reasons: string[] = [];
    let matchCount = 0;

    // 议题匹配
    for (const topic of topics) {
      const keywords = topicKeywords[topic] || [];
      const matchedAreas = therapist.areas.filter((area) =>
        keywords.some((kw) => area.includes(kw) || kw.includes(area)),
      );
      if (matchedAreas.length > 0) {
        matchCount += matchedAreas.length;
        if (matchedAreas.length >= 2) {
          reasons.push(`在${matchedAreas.slice(0, 2).join('、')}方面经验较丰富`);
        } else {
          reasons.push(`擅长${matchedAreas[0]}`);
        }
      }
    }

    // 海外/文化适配
    if (
      (fields.country && fields.country !== '中国' && fields.country !== '中国大陆') ||
      topics.includes('lgbtq') ||
      (fields.identity_preference && fields.identity_preference.includes('海外'))
    ) {
      if (therapist.areas.some((a) => a.includes('海外华人') || a.includes('文化适应'))) {
        matchCount += 1;
        reasons.push('有海外华人或跨文化咨询经验');
      }
    }

    // LGBTQ+ 明确需求
    if (topics.includes('lgbtq') || (fields.identity_preference && fields.identity_preference.toLowerCase().includes('lgbt'))) {
      if (therapist.areas.some((a) => a.includes('LGBTQ+') || a.includes('性别多元'))) {
        matchCount += 2;
        if (!reasons.some((r) => r.includes('LGBTQ') || r.includes('性别多元'))) {
          reasons.push('有性别多元与LGBTQ+肯定式咨询经验');
        }
      }
    }

    scored.push({ therapist, reasons: reasons.slice(0, 3), matchCount });
  }

  // 5. 排序：先按匹配度，再按推荐顺序
  scored.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    // 按 therapist_order 顺序
    const aIdx = THERAPIST_ORDER.findIndex((name) => name.includes(a.therapist.name));
    const bIdx = THERAPIST_ORDER.findIndex((name) => name.includes(b.therapist.name));
    return aIdx - bIdx;
  });

  // 6. 返回前2-3位
  const resultCount = Math.min(3, Math.max(2, scored.length));
  const results = scored.slice(0, resultCount).map((s) => ({
    therapist: s.therapist,
    reasons: s.reasons.length > 0 ? s.reasons : ['综合经验和背景适合大多数咨询需求'],
  }));

  // 如果匹配数为0且候选人较少，补充默认推荐
  if (results.length < 2) {
    const defaultPicks = THERAPISTS.filter(
      (t) => t.role === '心理师' && !results.some((r) => r.therapist.name === t.name),
    ).slice(0, 2 - results.length);
    for (const t of defaultPicks) {
      results.push({
        therapist: t,
        reasons: ['综合经验和背景适合大多数咨询需求'],
      });
    }
  }

  return results;
}

// ==================== 心理师DEEP介绍 ====================

/**
 * 获取心理师10段式DEEP介绍文本
 * 包含：定位、背景翻译、核心主题、用户场景、风格解读、语言适配、
 *       收费、适合人群、需要再比较、不确定点
 */
export function getTherapistDeepIntro(name: string): string | null {
  const therapist = findTherapistByName(name);
  if (!therapist) return null;

  // 核心主题（从areas中提取3-5个）
  const coreThemes = therapist.areas.slice(0, 5);

  // 用户场景（基于areas生成）
  const scenarios = generateScenarios(therapist.areas);

  // 风格解读
  const styleNote = generateStyleNote(therapist.style, therapist.background);

  // 语言适配
  const langNote = therapist.languages.length > 0
    ? `语言能力：${therapist.languages.join('、')}。`
    : '主要使用普通话咨询。';

  // 适合/不适合
  const fitNote = generateFitNote(therapist);

  const lines = [
    `【${therapist.name} ${therapist.name_en}｜${therapist.level}・${therapist.years}】`,
    '',
    `1. 一句话定位：${generateOneLiner(therapist)}`,
    '',
    `2. 专业背景：${therapist.background}`,
    '',
    `3. 核心工作方向：${coreThemes.join('、')}`,
    '',
    `4. 常见用户场景：`,
    ...scenarios.map((s) => `   • ${s}`),
    '',
    `5. 咨询风格：${styleNote}`,
    '',
    `6. ${langNote}`,
    '',
    `7. 收费：${therapist.price}元/60分钟（${therapist.level}）`,
    '',
    `8. 可能适合你，如果：`,
    ...fitNote.fit.map((s) => `   • ${s}`),
    '',
    `9. 可能需要再比较一下，如果：`,
    ...fitNote.notFit.map((s) => `   • ${s}`),
    '',
    `10. 说明：以上介绍基于公开资料整理。具体是否匹配，建议和心理师本人沟通后再判断。排期和具体费用以人工客服确认为准。`,
  ];

  return lines.join('\n');
}

// ==================== 心理师横向比较 ====================

/**
 * 横向比较2-3位心理师
 */
export function compareTherapists(names: string[]): string | null {
  const therapists = names
    .map((n) => findTherapistByName(n))
    .filter((t): t is Therapist => t !== undefined);

  if (therapists.length < 2) return null;

  const lines: string[] = [];

  lines.push(`【心理师比较】${therapists.map((t) => t.name).join(' vs ')}`);
  lines.push('');

  // 共同点
  const commonAreas = findCommonAreas(therapists);
  if (commonAreas.length > 0) {
    lines.push(`共同点：`);
    lines.push(`• 都有${commonAreas.slice(0, 3).join('、')}相关工作经验`);
    if (therapists.every((t) => t.level === therapists[0].level)) {
      lines.push(`• 都是${therapists[0].level}`);
    }
    lines.push('');
  }

  // 差异对比
  lines.push('主要差异：');
  lines.push('');

  for (const t of therapists) {
    lines.push(`${t.name}（${t.name_en}）：`);
    lines.push(`  • 等级/年限：${t.level}・${t.years}`);
    lines.push(`  • 收费：${t.price}元/60分钟`);
    lines.push(`  • 语言：${t.languages.length > 0 ? t.languages.join('、') : '普通话'}`);
    lines.push(`  • 侧重方向：${t.areas.slice(0, 4).join('、')}`);
    lines.push(`  • 背景特点：${t.background.split('；')[0]}`);
    lines.push('');
  }

  lines.push('怎么选：');
  lines.push('• 如果你更看重预算：可以从价位较低的开始尝试');
  lines.push('• 如果你有明确议题：选相关方向经验更集中的那位');
  lines.push('• 如果你需要特定语言：看语言能力匹配');
  lines.push('• 不太确定的话，可以先约首次体验感受一下');
  lines.push('');
  lines.push('（以上比较基于公开资料，不代表谁"更好"，选择适合自己的最重要。）');

  return lines.join('\n');
}

// ==================== 辅助函数 ====================

function generateOneLiner(therapist: Therapist): string {
  const mainArea = therapist.areas[0] || '心理咨询';
  return `${therapist.level}${therapist.role}，${therapist.years}经验，主要工作方向包括${mainArea}等。`;
}

function generateScenarios(areas: string[]): string[] {
  const scenarioMap: Record<string, string> = {
    '抑郁焦虑': '最近情绪低落、焦虑不安，想找到调节的方式',
    '情感恋爱': '在亲密关系中遇到困扰，想理清自己的感受和需求',
    '婚姻家庭': '家庭或婚姻关系出现张力，想改善沟通和相处',
    'LGBTQ+': '作为LGBTQ+群体，在身份、关系或社会适应方面有困惑',
    '性别多元': '对自己的性别认同或表达有探索的需求',
    '职场课题': '工作压力、职业发展或人际关系让你感到消耗',
    '亲子教育': '在育儿或亲子沟通中遇到挑战',
    '心理创伤': '过去的经历仍然影响着现在的生活',
    '自我成长': '想更了解自己，探索个人成长的方向',
    '人际关系': '人际关系总是让你感到疲惫或困惑',
    '情绪管理': '经常被情绪淹没，想学习和情绪相处的方式',
    '海外华人': '在海外生活或跨文化环境中，感到适应困难或孤独',
    '进食障碍': '和食物、身体形象的关系让你困扰',
    '青少年儿童': '孩子的情绪或行为让你担心，想寻求专业支持',
    '睡眠障碍': '长期睡不好，想了解背后的原因',
  };

  const result: string[] = [];
  for (const area of areas) {
    if (scenarioMap[area] && result.length < 5) {
      result.push(scenarioMap[area]);
    }
  }

  // 补充通用场景
  if (result.length < 4) {
    result.push('想找一个安全的空间，梳理最近的生活和感受');
  }

  return result.slice(0, 6);
}

function generateStyleNote(style: string, background: string): string {
  // 从背景推断可能的取向
  let approach = '整合取向';
  if (background.includes('精神分析')) {
    approach = '偏精神分析/心理动力学';
  } else if (background.includes('认知行为') || background.includes('CBT')) {
    approach = '偏认知行为';
  } else if (background.includes('叙事') || background.includes('后现代')) {
    approach = '偏后现代/叙事治疗';
  } else if (background.includes('EFT') || background.includes('情绪聚焦')) {
    approach = '偏情绪聚焦';
  }

  return `${style}（公开资料中的一句话）。从受训背景来看，${approach}。具体咨询风格建议在首次咨询中直接感受。`;
}

function generateFitNote(therapist: Therapist): { fit: string[]; notFit: string[] } {
  const fit: string[] = [];
  const notFit: string[] = [];

  // 根据areas生成适合人群
  const areaKeywords = therapist.areas.join('、');
  if (areaKeywords.includes('LGBTQ') || areaKeywords.includes('性别多元')) {
    fit.push('你关注性别认同、性取向或LGBTQ+相关议题');
  }
  if (areaKeywords.includes('海外华人') || areaKeywords.includes('文化适应')) {
    fit.push('你在海外生活或有跨文化适应的需求');
  }
  if (areaKeywords.includes('情感恋爱') || areaKeywords.includes('亲密关系')) {
    fit.push('你正在经历关系方面的困扰');
  }
  if (areaKeywords.includes('抑郁焦虑') || areaKeywords.includes('情绪')) {
    fit.push('你被情绪问题困扰，想找到应对方式');
  }
  if (areaKeywords.includes('职场') || areaKeywords.includes('职业')) {
    fit.push('你在工作或职业发展方面有困惑');
  }
  if (areaKeywords.includes('亲子') || areaKeywords.includes('儿童')) {
    fit.push('你关注孩子的心理或亲子关系');
  }

  if (fit.length === 0) {
    fit.push('你想找一个专业的心理师聊一聊当前的困扰');
  }

  // 不适合的情况（保守表述）
  if (therapist.level === '成熟等级') {
    notFit.push('你需要更资深经验的专家等级心理师（可以考虑更高档位）');
  }
  if (!areaKeywords.includes('儿童') && !areaKeywords.includes('青少年')) {
    notFit.push('你主要想为孩子咨询（建议选择有儿童青少年经验的心理师）');
  }
  if (therapist.languages.every((l) => !l.includes('英语') && !l.includes('英文'))) {
    notFit.push('你需要全英文咨询（建议选择有英语能力的心理师）');
  }

  if (notFit.length === 0) {
    notFit.push('具体是否合适，建议先约一次感受再判断');
  }

  return { fit: fit.slice(0, 4), notFit: notFit.slice(0, 3) };
}

function findCommonAreas(therapists: Therapist[]): string[] {
  if (therapists.length === 0) return [];
  const firstAreas = new Set(therapists[0].areas);
  const common: string[] = [];

  for (const area of firstAreas) {
    if (therapists.every((t) => t.areas.some((a) => a === area || a.includes(area) || area.includes(a)))) {
      common.push(area);
    }
  }

  return common;
}
