/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 Story Mirror 推理引擎
// ⚠️ 核心规则：
//   - sensitive_identity_matching: false (不根据用户推断的身份匹配)
//   - requires_source_verified: true (人物必须有可靠公开来源)
//   - 公众人物身份不得推断，只能基于公开自述/可核验叙事
//   - 人物覆盖多元性别经验，但不标注未经证实的身份标签
//   - 影视/文学角色做行为镜像，不做诊断或身份判定

import {
  AssessmentProfile,
  DimensionCode,
  StoryPerson,
  StoryMedia,
  MirrorMatchResult,
  MirrorMatchType,
} from './gdi-types';
import { matchPeopleByThemes, getPublicReadyPeople } from './gdi-story-people';
import { matchMediaByThemes } from './gdi-story-media';

// 将维度分数映射到行为主题
const DIMENSION_THEME_MAP: Record<DimensionCode, { high: string[]; low: string[] }> = {
  IGS: {
    high: ['自我觉察', '内在方向感', '性别作为体验', '独立于他人评价'],
    low: ['模糊感', '探索中', '需要更多线索', '通过行动而非感受认知'],
  },
  SDO: {
    high: ['自我定义', '开放态度', '拒绝标签束缚', '自我命名'],
    low: ['需要确定感', '依赖标签', '寻找正确答案', '认知闭合需求'],
  },
  EA: {
    high: ['表达真实感', '衣着呈现', '声音姿态', '自我表达'],
    low: ['表达与自我距离', '环境限制表达', '寻找表达方式', '扮演感'],
  },
  CF: {
    high: ['性别流动', '情境变化', '弹性适应', '多元面向'],
    low: ['性别稳定', '一致性强', '固定感', '较少变化'],
  },
  GCC: {
    high: ['身心协调', '称谓舒适', '被正确看见', '身体自在'],
    low: ['不协调感', '身体不适', '称谓错位', '被误读'],
  },
  GAE: {
    high: ['性别愉悦', '被肯定感', '自我欣赏', '积极体验'],
    low: ['愉悦感缺失', '需要探索积极体验', '性别平静感', '寻找快乐来源'],
  },
  SNA: {
    high: ['规范自主', '批判意识', '主动选择', '重写规则'],
    low: ['规范遵从', '社会期待压力', '他人评价敏感', '需要社会认可'],
  },
  BR: {
    high: ['归属感', '被理解', '社群连接', '被正确看见'],
    low: ['孤独感', '不被理解', '寻找社群', '需要支持'],
  },
};

// 从画像中提取行为主题
export const extractBehavioralThemes = (profile: AssessmentProfile): string[] => {
  const themes: string[] = [];
  const dims: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];

  for (const dim of dims) {
    const score = profile.plotScores[dim];
    if (score === null) continue;

    const themeSet = DIMENSION_THEME_MAP[dim];
    if (score >= 66) {
      themes.push(...themeSet.high);
    } else if (score < 33) {
      themes.push(...themeSet.low);
    }
  }

  // 加入基于高分组合的额外主题
  const highDims = dims.filter((d) => (profile.plotScores[d] ?? 0) >= 66);
  if (highDims.includes('EA') && highDims.includes('GCC')) {
    themes.push('内外一致');
    themes.push('身心和谐');
  }
  if (highDims.includes('BR') && highDims.includes('GAE')) {
    themes.push('社群支持');
    themes.push('被肯定');
  }
  if (highDims.includes('SNA') && highDims.includes('SDO')) {
    themes.push('自主决定');
    themes.push('自我定义');
  }
  if (highDims.includes('CF') && highDims.includes('EA')) {
    themes.push('流动表达');
    themes.push('情境适应');
  }
  if (highDims.includes('IGS') && highDims.includes('SDO')) {
    themes.push('自我觉知');
    themes.push('内在清晰');
  }

  return [...new Set(themes)];
};

// 匹配Story Mirror人物（行为镜像）
export const matchStoryPeople = (
  profile: AssessmentProfile,
  count: number = 3
): MirrorMatchResult[] => {
  const themes = extractBehavioralThemes(profile);
  const people = matchPeopleByThemes(themes, count);

  return people.map((person) => ({
    item: person,
    type: 'behavioral' as MirrorMatchType,
    matchingThemes: person.behavioralThemes.filter((t) => themes.includes(t)),
    rationale: `基于${person.field}领域的行为模式和主题相似性进行镜像匹配。`,
  }));
};

// 匹配Story Mirror影视/文学
export const matchStoryMedia = (
  profile: AssessmentProfile,
  count: number = 3
): MirrorMatchResult[] => {
  const themes = extractBehavioralThemes(profile);
  const media = matchMediaByThemes(themes, count);

  return media.map((m) => ({
    item: m,
    type: 'thematic' as MirrorMatchType,
    matchingThemes: [...m.themes, ...m.behavioralMirrors].filter((t) => themes.includes(t)),
    rationale: `基于主题相似性和行为镜像进行作品推荐，做叙事连接而非身份判定。`,
  }));
};

// 安全检查：确保不做身份推断
export const validateMirrorSafety = (results: MirrorMatchResult[]): boolean => {
  for (const result of results) {
    const item = result.item;
    // 如果是人物，检查是否只有公开自述身份才标注
    if ('selfDisclosedIdentities' in item) {
      const person = item as StoryPerson;
      // 只有当人物有公开自述身份时，selfDisclosedIdentities 才非空
      // 行为镜像人物的 selfDisclosedIdentities 应为空
      if (person.reviewStatus === 'public_ready') {
        // public_ready 必须有 sourceUrls
        if (!person.sourceUrls || person.sourceUrls.length === 0) {
          console.warn(`Mirror safety warning: ${person.id} is public_ready but has no sourceUrls`);
          return false;
        }
      }
    }
  }
  return true;
};

// 获取随机补充人物（当主题匹配不够时）
export const getDiversePeopleSelection = (count: number = 3): StoryPerson[] => {
  const allPeople = getPublicReadyPeople();
  // 从不同领域各选一人
  const fields = [...new Set(allPeople.map((p) => p.field))];
  const selected: StoryPerson[] = [];

  for (const field of fields) {
    if (selected.length >= count) break;
    const fieldPeople = allPeople.filter((p) => p.field === field);
    if (fieldPeople.length > 0) {
      const randomPerson = fieldPeople[Math.floor(Math.random() * fieldPeople.length)];
      selected.push(randomPerson);
    }
  }

  // 如果还不够，随机补充
  while (selected.length < count && allPeople.length > selected.length) {
    const remaining = allPeople.filter((p) => !selected.find((s) => s.id === p.id));
    const randomPerson = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(randomPerson);
  }

  return selected.slice(0, count);
};

// Story Mirror 总选择函数
export const generateStoryMirrorSet = (profile: AssessmentProfile) => {
  const people = matchStoryPeople(profile, 3);
  const media = matchStoryMedia(profile, 3);

  // 安全校验
  const peopleSafe = validateMirrorSafety(people);
  if (!peopleSafe) {
    console.warn('Story Mirror people safety check failed, using diverse selection');
    const diversePeople = getDiversePeopleSelection(3);
    return {
      people: diversePeople.map((p) => ({
        item: p,
        type: 'behavioral' as MirrorMatchType,
        matchingThemes: [],
        rationale: '基于多元领域代表性进行行为镜像推荐。',
      })),
      media,
    };
  }

  return { people, media };
};
