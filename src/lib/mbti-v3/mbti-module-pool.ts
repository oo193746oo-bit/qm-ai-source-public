/**
 * QM 93题MBTI风格人格偏好测试 - 结果模块池 v3.0
 * 共 26 个模块类别，每个模块包含 16 型的专属内容
 * 每次动态选择 ≥12 个模块展示
 */

import type { ResultModule, ModuleCategory, TypeCode } from './mbti-types';

export const MODULE_CATEGORIES: ModuleCategory[] = [
  'personality_narrative',
  'work_style',
  'learning_style',
  'relationship_pattern',
  'stress_reaction',
  'decision_style',
  'communication_style',
  'leadership',
  'creativity',
  'conflict_handling',
  'growth_direction',
  'shadow_side',
  'energy_management',
  'social_pattern',
  'life_philosophy',
  'emotional_pattern',
  'perfectionism',
  'adaptability',
  'self_awareness',
  'values',
  'intimacy',
  'team_role',
  'leisure_preference',
  'motivation_driver',
  'communication_advice',
  'development_advice',
];

// 每种类型的完整模块池
export function getModulePoolForType(typeCode: TypeCode): ResultModule[] {
  const modules: ResultModule[] = [];

  // 你的人格叙事
  if (typeCode === 'ISTJ') modules.push({
    id: 'personality_narrative_ISTJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个务实、可靠的人。你尊重传统和秩序，相信经验和事实的力量。在生活中，你像一座稳稳的灯塔——不张扬，但永远在那里。你用行动证明自己，用责任定义自己，你相信把每件小事做好就是最大的意义。',
    applicableTypes: ['ISTJ'],
    priority: 10,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'personality_narrative_ISFJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个温暖、细心的人。你善于观察他人的需要，常常在别人开口之前就已经准备好了帮助。你像一盏温柔的灯——不刺眼，但照亮了身边每一个人的生活。你用默默的付出诠释爱与责任。',
    applicableTypes: ['ISFJ'],
    priority: 10,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'personality_narrative_INFJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个深邃、有使命感的人。你的内心世界丰富而复杂，对人和世界有着独特的洞察力。你像一本写满故事的书——安静的封面下，藏着翻不完的深度。你追求意义，渴望让世界因你而有一点点不同。',
    applicableTypes: ['INFJ'],
    priority: 10,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'personality_narrative_INTJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个独立、有战略眼光的人。你的头脑像一台精密的计算机，擅长分析复杂问题、规划长远目标。你追求知识和能力的卓越，相信大部分事情都可以通过思考和努力来优化。你是安静的强者，用智慧定义自己。',
    applicableTypes: ['INTJ'],
    priority: 10,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'personality_narrative_ISTP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个冷静、灵活的行动派。你擅长用双手解决问题，对机械、工具和系统有天然的理解力。你话不多，但做的事让人佩服。你活在当下，享受动手创造和解决难题的乐趣。',
    applicableTypes: ['ISTP'],
    priority: 10,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'personality_narrative_ISFP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个温柔、有艺术气质的人。你用五感体验世界，对美有独特的感知力。你像一首安静的诗——不张扬，但有自己的节奏和温度。你不喜欢被定义，相信生活应该被感受，而不是被规划。',
    applicableTypes: ['ISFP'],
    priority: 10,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'personality_narrative_INFP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个温柔、有理想的人。你的内心世界像一片深邃的森林——有想象、有情感、有坚定的价值观。你追求真实和意义，对理解和共鸣有着深切的渴望。你用柔软的方式爱着这个世界。',
    applicableTypes: ['INFP'],
    priority: 10,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'personality_narrative_INTP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个好奇、爱思考的人。你的头脑里永远有新的想法在碰撞，对知识和真理有无穷的渴望。你像一座永不熄灭的思想实验室——安静的外表下，内心进行着无数的推演和探索。',
    applicableTypes: ['INTP'],
    priority: 10,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'personality_narrative_ESTP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个大胆、有魅力的行动派。你精力充沛、反应敏捷，擅长抓住机会并快速行动。你活在当下，对生活充满热情和好奇。和你在一起，永远不会无聊。',
    applicableTypes: ['ESTP'],
    priority: 10,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'personality_narrative_ESFP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个热情、快乐的人。你热爱生活，对美好事物有敏锐的感知力。你像一束阳光——走到哪里就把快乐带到哪里。你活在当下，相信每一天都值得被好好庆祝。',
    applicableTypes: ['ESFP'],
    priority: 10,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'personality_narrative_ENFP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个热情、有创造力的人。你对人和可能性充满好奇，总能看到别人身上的闪光点。你的生活像一场永不停歇的探索——充满了新想法、新关系和新梦想。你用热情感染着身边的每一个人。',
    applicableTypes: ['ENFP'],
    priority: 10,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'personality_narrative_ENTP',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个机智、好奇的辩论家。你思维敏捷、能言善辩，喜欢挑战权威和常规。对你来说，世界是一个巨大的智力游乐场——永远有新的想法可以探索、新的观点可以辩论。',
    applicableTypes: ['ENTP'],
    priority: 10,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'personality_narrative_ESTJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个果断、有条理的人。你擅长组织和管理，重视规则和效率。你像一座坚固的堡垒——可靠、有担当，让人放心依靠。你相信秩序和努力的力量，说到做到。',
    applicableTypes: ['ESTJ'],
    priority: 10,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'personality_narrative_ESFJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个热心、有凝聚力的人。你擅长照顾他人的需要，总能让每个人都感到被重视和欢迎。你像一个温暖的大家庭——把大家凝聚在一起，让每个人都有归属感。',
    applicableTypes: ['ESFJ'],
    priority: 10,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'personality_narrative_ENFJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个热情、有感召力的人。你对人的潜能有强烈的信念，善于激励他人成长。你像一束温暖的光——吸引着周围的人，点亮每个人内心的火种。你相信每个人都可以变得更好。',
    applicableTypes: ['ENFJ'],
    priority: 10,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'personality_narrative_ENTJ',
    category: 'personality_narrative' as ModuleCategory,
    title: '你的人格叙事',
    icon: '📖',
    content: '你是一个果断、有战略眼光的领导者。你擅长制定大方向并组织资源去实现它，对低效和混乱没有耐心。你像一位将军——目标明确、勇往直前，带领团队征服一个又一个目标。',
    applicableTypes: ['ENTJ'],
    priority: 10,
  });

  // 工作风格
  if (typeCode === 'ISTJ') modules.push({
    id: 'work_style_ISTJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是那种让人放心的存在。你做事有条理、重细节，喜欢按照既定的流程和标准来完成任务。你对质量有很高的要求，交付的成果总是经得起检验。你更适合结构清晰、目标明确的工作环境。',
    applicableTypes: ['ISTJ'],
    priority: 9,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'work_style_ISFJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是认真细致、值得信赖的好伙伴。你擅长处理需要耐心和细心的事务，总能注意到别人忽略的细节。你重视团队和谐，会主动做很多「幕后工作」来确保事情顺利进行。',
    applicableTypes: ['ISFJ'],
    priority: 9,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'work_style_INFJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你最看重的是意义和价值。你希望自己做的事情能真正帮助到别人、对社会产生积极影响。你擅长从全局视角看问题，有独到的见解和长远的眼光。',
    applicableTypes: ['INFJ'],
    priority: 9,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'work_style_INTJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是目标导向的战略家。你擅长制定长远规划、设计高效的系统和流程。你对自己和他人都有很高的标准，追求卓越是你的本能。你最适合有挑战性、有自主权的工作。',
    applicableTypes: ['INTJ'],
    priority: 9,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'work_style_ISTP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是高效的问题解决者。你擅长处理突发状况和技术问题，总能快速找到解决方案。你喜欢有自主性、能动手实践的工作，对冗长的会议和繁文缛节没有耐心。',
    applicableTypes: ['ISTP'],
    priority: 9,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'work_style_ISFP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是认真且有美感的执行者。你擅长需要细心和审美能力的工作，能把平凡的事情做出质感。你需要一个和谐、有美感的工作环境，不喜欢太激烈的竞争。',
    applicableTypes: ['ISFP'],
    priority: 9,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'work_style_INFP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你最看重的是意义和价值的一致。你希望做的事情能和你的价值观吻合，能帮助到别人或者创造美好。你擅长需要想象力和共情能力的工作，不喜欢太机械或太功利的环境。',
    applicableTypes: ['INFP'],
    priority: 9,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'work_style_INTP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是解决复杂问题的高手。你擅长分析和逻辑推理，能在混乱中找到规律。你最适合有挑战性的、需要深度思考的工作，对琐碎的日常事务可能会感到无聊。',
    applicableTypes: ['INTP'],
    priority: 9,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'work_style_ESTP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是充满活力的开拓者。你擅长开拓新市场、解决突发问题、在混乱中找到机会。你喜欢有挑战性、有变化的工作，对日复一日的重复性工作会感到无聊。',
    applicableTypes: ['ESTP'],
    priority: 9,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'work_style_ESFP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是热情有活力的团队一员。你擅长和人打交道，也能把日常的工作变得有趣。你需要有变化、有人际互动的工作，不适合太孤立或太机械的环境。',
    applicableTypes: ['ESFP'],
    priority: 9,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'work_style_ENFP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是充满创意和热情的推动者。你擅长提出新想法、激励他人、开拓新方向。你需要有创造性和人际互动的工作，对重复性的、机械的工作会感到窒息。',
    applicableTypes: ['ENFP'],
    priority: 9,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'work_style_ENTP',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是创新的推动者和挑战者。你擅长提出新想法、发现系统的漏洞、推动变革。你需要有挑战性和自由度的工作，对循规蹈矩的环境会感到窒息。',
    applicableTypes: ['ENTP'],
    priority: 9,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'work_style_ESTJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是高效的组织者和执行者。你擅长建立制度、安排任务、确保目标达成。你重视结果和效率，对松散和敷衍没有耐心。你最适合管理和执行的角色。',
    applicableTypes: ['ESTJ'],
    priority: 9,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'work_style_ESFJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是热心的团队成员和协调者。你擅长人际关系和团队建设，确保每个人都开心地工作。你需要有人际互动和服务性质的工作，不适合太孤立的环境。',
    applicableTypes: ['ESFJ'],
    priority: 9,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'work_style_ENFJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是有魅力的领导者和激励者。你擅长带领团队、培养人才、创造积极的文化。你需要有意义和人际互动的工作，对孤立和机械的环境会感到不满足。',
    applicableTypes: ['ENFJ'],
    priority: 9,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'work_style_ENTJ',
    category: 'work_style' as ModuleCategory,
    title: '工作风格',
    icon: '💼',
    content: '在工作中，你是天生的领导者和战略家。你擅长制定长远规划、组织团队、推动执行。你对自己和他人都有很高的标准，追求卓越是你的本能。你最适合高层管理和战略决策的角色。',
    applicableTypes: ['ENTJ'],
    priority: 9,
  });

  // 学习方式
  if (typeCode === 'ISTJ') modules.push({
    id: 'learning_style_ISTJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从具体的事实和经验入手，一步一步地掌握知识。你擅长记忆和应用已经验证过的方法，对抽象的理论有时需要实际的例子才能理解透彻。动手实践和重复练习对你特别有效。',
    applicableTypes: ['ISTJ'],
    priority: 8,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'learning_style_ISFJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢循序渐进，从基础开始一步一步打牢。你擅长记忆和应用具体的知识，对有实际用途的内容特别有动力。动手实践和真实案例对你来说比抽象理论更容易理解。',
    applicableTypes: ['ISFJ'],
    priority: 8,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'learning_style_INFJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢先理解整体框架和深层原理，然后再填充细节。你对人文学科、心理学、哲学等领域特别感兴趣。你擅长从不同的知识中找到连接点，形成自己独特的理解。',
    applicableTypes: ['INFJ'],
    priority: 8,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'learning_style_INTJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从理论和框架入手，快速掌握核心原理，然后应用到实际中。你对复杂的系统和概念有天然的兴趣，擅长自学和独立研究。你更看重知识的深度而非广度。',
    applicableTypes: ['INTJ'],
    priority: 8,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'learning_style_ISTP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时最喜欢「做中学」。看十遍不如亲手试一遍，你在实践中掌握知识的速度最快。你对具体的、有用的技能特别感兴趣，对抽象的理论可能会觉得无聊。',
    applicableTypes: ['ISTP'],
    priority: 8,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'learning_style_ISFP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时最喜欢通过亲身体验和动手实践来掌握知识。你对艺术、音乐、自然等领域特别有天赋。你喜欢在轻松的氛围中学习，对压力和竞争会有些排斥。',
    applicableTypes: ['ISFP'],
    priority: 8,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'learning_style_INFP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从兴趣和意义出发，对你觉得「有感觉」的东西会学得特别好。你擅长文学、艺术、心理学等人文学科。你需要理解「为什么学」，才能投入其中。',
    applicableTypes: ['INFP'],
    priority: 8,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'learning_style_INTP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢追根究底，一定要理解背后的原理。你对科学、哲学、技术等领域特别感兴趣。你擅长自学和独立研究，通过不断提问和分析来掌握知识。',
    applicableTypes: ['INTP'],
    priority: 8,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'learning_style_ESTP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时最喜欢「做中学」。你讨厌冗长的理论讲解，更喜欢直接上手试错。你在实践中学习最快，对能立即用上的技能最感兴趣。',
    applicableTypes: ['ESTP'],
    priority: 8,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'learning_style_ESFP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时最喜欢通过体验和互动来掌握知识。你讨厌枯燥的理论，更喜欢动手做、和人一起学。你对艺术、表演、人际相关的领域特别有天赋。',
    applicableTypes: ['ESFP'],
    priority: 8,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'learning_style_ENFP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从兴趣和整体理解出发，对你好奇的东西会学得特别快。你擅长跨领域学习，在不同知识之间找到连接。你需要开放和互动的学习环境。',
    applicableTypes: ['ENFP'],
    priority: 8,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'learning_style_ENTP',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从质疑和挑战出发，通过辩论和探索来理解知识。你对复杂的概念和前沿领域特别感兴趣。你擅长跨学科学习，在不同领域之间找到连接。',
    applicableTypes: ['ENTP'],
    priority: 8,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'learning_style_ESTJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢系统化、结构化的方式，从基础到高级一步一步来。你对管理、法律、金融等实用领域特别感兴趣。你相信经验和验证过的方法。',
    applicableTypes: ['ESTJ'],
    priority: 8,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'learning_style_ESFJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢在群体中学习，通过讨论和互动来掌握知识。你对人际服务、教育、医疗等领域特别感兴趣。你需要感受到学习是「有用的」、能帮助人的。',
    applicableTypes: ['ESFJ'],
    priority: 8,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'learning_style_ENFJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从意义和应用出发，对能帮助人的知识特别感兴趣。你擅长人际相关的领域，如教育、心理咨询、领导力等。你在互动和实践中学习最好。',
    applicableTypes: ['ENFJ'],
    priority: 8,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'learning_style_ENTJ',
    category: 'learning_style' as ModuleCategory,
    title: '学习方式',
    icon: '📚',
    content: '你学习时喜欢从框架和原理入手，快速掌握核心然后应用。你对管理、战略、领导力等领域特别感兴趣。你擅长自学，目标明确，效率很高。',
    applicableTypes: ['ENTJ'],
    priority: 8,
  });

  // 关系模式
  if (typeCode === 'ISTJ') modules.push({
    id: 'relationship_pattern_ISTJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是忠诚而稳定的伴侣/朋友。你不擅长用言语表达情感，但会用实际行动来表达在乎。你重视承诺和可靠性，一旦认定一个人就会长久地走下去。你需要对方理解你「做的比说的多」的爱的语言。',
    applicableTypes: ['ISTJ'],
    priority: 9,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'relationship_pattern_ISFJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是那个总是记得别人喜好、在关键时刻送上温暖的人。你付出很多，但有时可能因为不善表达而让自己的努力不被看见。你需要学会也让别人来照顾你。',
    applicableTypes: ['ISFJ'],
    priority: 9,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'relationship_pattern_INFJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你追求深度的灵魂连接。你不满足于表面的交往，渴望有人能真正懂你。你对朋友和伴侣非常忠诚，一旦认定就会全心投入。但你的内心世界很少完全向人敞开。',
    applicableTypes: ['INFJ'],
    priority: 9,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'relationship_pattern_INTJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是忠诚但不善表达的伴侣/朋友。你用行动和能力来证明自己的在乎，而不是甜言蜜语。你对伴侣的智力和独立性有很高的要求，渴望一个能和你势均力敌的灵魂。',
    applicableTypes: ['INTJ'],
    priority: 9,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'relationship_pattern_ISTP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是行动派的伴侣/朋友。你不擅长甜言蜜语，但会在对方需要的时候出现，用实际行动表达在乎。你需要足够的个人空间和自由，不喜欢被束缚。',
    applicableTypes: ['ISTP'],
    priority: 9,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'relationship_pattern_ISFP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是温柔体贴的伴侣/朋友。你用行动和细节来表达爱，记得对方的喜好，给对方惊喜。你性格随和，容易相处，但内心深处的想法很少完全说出来。',
    applicableTypes: ['ISFP'],
    priority: 9,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'relationship_pattern_INFP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是深情而忠诚的伴侣/朋友。你渴望深度的灵魂连接，希望有人能真正懂你。你对在乎的人非常包容和支持，但也容易因为太敏感而受伤。',
    applicableTypes: ['INFP'],
    priority: 9,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'relationship_pattern_INTP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是忠诚但不善表达的伴侣/朋友。你用自己的方式表达在乎——记住对方说过的话、帮对方分析问题。你需要独立的空间和思想的交流，不喜欢太黏腻的关系。',
    applicableTypes: ['INTP'],
    priority: 9,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'relationship_pattern_ESTP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是有趣、有魅力的伴侣/朋友。你总能带来新鲜感和刺激感，让生活充满乐趣。你需要足够的自由和空间，不喜欢被束缚和控制。',
    applicableTypes: ['ESTP'],
    priority: 9,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'relationship_pattern_ESFP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是温暖有趣的伴侣/朋友。你总能给身边的人带来快乐和惊喜，是大家的开心果。你喜欢分享和陪伴，但有时可能需要更多的独立空间。',
    applicableTypes: ['ESFP'],
    priority: 9,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'relationship_pattern_ENFP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是热情、支持性的伴侣/朋友。你总能看到对方的优点和潜能，给予鼓励和支持。你渴望深度的连接和精神的共鸣，但有时可能因为兴趣太广而分心。',
    applicableTypes: ['ENFP'],
    priority: 9,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'relationship_pattern_ENTP',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是有趣、刺激的伴侣/朋友。你总能带来新的想法和观点，和你在一起永远不会无聊。你需要智力上的交流和独立的空间，不喜欢太黏腻的关系。',
    applicableTypes: ['ENTP'],
    priority: 9,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'relationship_pattern_ESTJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是可靠、负责的伴侣/朋友。你用行动和承诺来表达爱，承担责任、解决问题。你重视稳定和忠诚，但有时可能不够浪漫和体贴。',
    applicableTypes: ['ESTJ'],
    priority: 9,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'relationship_pattern_ESFJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是温暖、体贴的伴侣/朋友。你总是记得别人的喜好和重要日子，用细心的照顾来表达爱。你重视关系的和谐稳定，但有时可能过于付出。',
    applicableTypes: ['ESFJ'],
    priority: 9,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'relationship_pattern_ENFJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是热情、支持性的伴侣/朋友。你总能看到对方的优点和潜能，给予鼓励和引导。你渴望深度的连接和共同成长，但有时可能过于付出。',
    applicableTypes: ['ENFJ'],
    priority: 9,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'relationship_pattern_ENTJ',
    category: 'relationship_pattern' as ModuleCategory,
    title: '关系模式',
    icon: '💞',
    content: '在关系中，你是忠诚可靠但强势的伴侣/朋友。你用行动和能力来表达在乎，帮对方解决问题、规划未来。你需要一个独立、有思想的伴侣，不喜欢过度依赖的关系。',
    applicableTypes: ['ENTJ'],
    priority: 9,
  });

  // 压力反应
  if (typeCode === 'ISTJ') modules.push({
    id: 'stress_reaction_ISTJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '面对压力时，你会变得更加固执和刻板，坚持按自己的方式来。你可能会过度关注细节而忽略全局，或者因为事情不在计划内而感到烦躁。找到释放压力的健康方式对你很重要。',
    applicableTypes: ['ISTJ'],
    priority: 9,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'stress_reaction_ISFJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会过度承担责任，把别人的问题都扛在自己身上。你可能会变得情绪化或者对批评特别敏感。记得照顾好自己，你不必一个人扛下所有。',
    applicableTypes: ['ISFJ'],
    priority: 9,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'stress_reaction_INFJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会过度思考、陷入自己的内心世界，或者变得对他人的情绪异常敏感。你可能会因为理想与现实的落差而感到痛苦和无力。给自己独处和恢复的时间非常重要。',
    applicableTypes: ['INFJ'],
    priority: 9,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'stress_reaction_INTJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加孤僻和冷漠，把所有情绪都压进工作里。你可能会过度分析问题，或者因为事情不在掌控中而感到愤怒。学会放松和信任他人是你的课题。',
    applicableTypes: ['INTJ'],
    priority: 9,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'stress_reaction_ISTP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加沉默和疏离，一个人躲起来解决问题。你也可能通过冒险或极限运动来释放压力。学会用语言表达情绪，而不只是用行动，对你有好处。',
    applicableTypes: ['ISTP'],
    priority: 9,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'stress_reaction_ISFP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得情绪化或者逃避现实。你可能会通过购物、吃东西、听音乐等方式来安慰自己，或者一个人躲起来不想见人。学会面对问题而不是回避，是你的成长课题。',
    applicableTypes: ['ISFP'],
    priority: 9,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'stress_reaction_INFP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得退缩和消沉，陷入自己的情绪里出不来。你可能会过度自责，或者因为理想和现实的差距而感到绝望。找到表达情绪的出口对你非常重要。',
    applicableTypes: ['INFP'],
    priority: 9,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'stress_reaction_INTP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加孤僻和冷漠，把自己埋进思考里来逃避情绪。你也可能过度分析问题，陷入思维的死循环。学会感受和表达情绪对你很重要。',
    applicableTypes: ['INTP'],
    priority: 9,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'stress_reaction_ESTP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加冲动和冒险，或者用娱乐来逃避问题。你也可能因为不耐烦而和人发生冲突。学会冷静思考和延迟满足对你有好处。',
    applicableTypes: ['ESTP'],
    priority: 9,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'stress_reaction_ESFP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得情绪化或者过度追求享乐来逃避问题。你也可能因为害怕冲突而回避问题。学会面对困难和处理负面情绪是你的成长课题。',
    applicableTypes: ['ESFP'],
    priority: 9,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'stress_reaction_ENFP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得过度焦虑或者逃避现实。你也可能因为想法太多而无法集中，或者因为怕让人失望而硬撑。学会聚焦和照顾自己对你很重要。',
    applicableTypes: ['ENFP'],
    priority: 9,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'stress_reaction_ENTP',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加好辩和挑剔，或者用讽刺和幽默来逃避问题。你也可能因为想法太多而焦虑。学会专注和处理情绪是你的成长课题。',
    applicableTypes: ['ENTP'],
    priority: 9,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'stress_reaction_ESTJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加控制欲强和固执，或者用工作来逃避情绪。你也可能因为事情不在掌控中而烦躁。学会放松和信任他人是你的课题。',
    applicableTypes: ['ESTJ'],
    priority: 9,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'stress_reaction_ESFJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会过度承担责任，把别人的问题都扛在自己身上。你也可能因为不被感激而受伤或抱怨。学会照顾自己和设立边界是你的课题。',
    applicableTypes: ['ESFJ'],
    priority: 9,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'stress_reaction_ENFJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会过度承担责任，把别人的问题都扛在自己身上。你也可能因为理想与现实的差距而感到痛苦。学会照顾自己、接受不完美是你的课题。',
    applicableTypes: ['ENFJ'],
    priority: 9,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'stress_reaction_ENTJ',
    category: 'stress_reaction' as ModuleCategory,
    title: '压力反应',
    icon: '🌊',
    content: '压力大的时候，你可能会变得更加控制欲强和冷漠，把所有情绪都压进工作里。你也可能因为事情不在掌控中而变得暴躁。学会放松和示弱是你的课题。',
    applicableTypes: ['ENTJ'],
    priority: 9,
  });

  // 决策风格
  if (typeCode === 'ISTJ') modules.push({
    id: 'decision_style_ISTJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时习惯依赖过去的经验和客观事实，喜欢有数据和先例支撑。你不喜欢仓促做决定，会在充分了解情况后才下判断。一旦做了决定，你通常会坚持到底。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'decision_style_ISFJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时会考虑很多人的感受和需要，希望找到一个让大家都满意的方案。你有时会因为担心伤害别人而犹豫不决。学习在顾及他人的同时也忠于自己的需要，是你成长的课题。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'decision_style_INFJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时既会考虑价值观和长远意义，也会分析利弊。你会花很多时间思考「什么是对的」，一旦确定就会坚持。但有时你可能因为想太多而迟迟无法行动。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'decision_style_INTJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时快速而理性，基于数据和逻辑分析。你不太容易被情感左右，能在压力下保持冷静。但有时你可能因为太快下判断而忽略了人的因素。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'decision_style_ISTP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时快速而务实，基于当下的事实和自己的经验。你不喜欢过度思考，觉得先做了再说。你在危机中的决策能力特别强，越紧急越清醒。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'decision_style_ISFP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时跟随自己的内心感受和价值观。你不喜欢过度分析，觉得感觉对最重要。你有时会因为怕伤害别人而难以做出选择，尤其是当决定涉及他人时。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'decision_style_INFP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时跟随自己的价值观和内心感受。你会花很多时间思考「什么是对的」，但有时会因为想太多而无法行动。你需要学会平衡内心和现实。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'decision_style_INTP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时基于逻辑和分析，喜欢收集尽可能多的信息。你有时会因为想找到「最优解」而迟迟无法决定。学习接受「足够好」的方案，会让你更有效率。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'decision_style_ESTP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时快速而果断，基于当下的情况和自己的经验。你不喜欢过度思考，觉得先行动再说。你在压力下的决策能力特别强。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'decision_style_ESFP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时跟随自己的感觉和当下的心情。你不喜欢过度分析，觉得感觉对最重要。你有时会因为冲动而做出让自己后悔的决定。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'decision_style_ENFP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时跟随自己的价值观和直觉。你会考虑很多人和可能性，有时会因为想太多而犹豫不决。你需要学会在选项中做出取舍，而不是什么都想要。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'decision_style_ENTP',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时基于逻辑和可能性分析。你喜欢考虑各种选项和可能性，有时会因为想太多而难以决定。你需要学会在信息不完美的情况下做出选择。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'decision_style_ESTJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时快速、果断，基于经验和事实。你不喜欢犹豫，觉得该决定就决定。你在组织和管理方面的决策能力特别强。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'decision_style_ESFJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时会考虑很多人的感受和需要，希望找到一个让大家都满意的方案。你有时会因为怕伤害别人而犹豫不决。学会坚持自己的立场是你的成长方向。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'decision_style_ENFJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时会考虑价值观和对人的影响。你有很强的直觉和信念，一旦认定就会坚持。但有时你可能因为太在意他人的看法而犹豫不决。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'decision_style_ENTJ',
    category: 'decision_style' as ModuleCategory,
    title: '决策风格',
    icon: '⚖️',
    content: '你做决定时快速、果断，基于战略分析和长远考虑。你不喜欢犹豫，能在信息不完美的情况下做出判断。你的决策力是你最大的优势之一。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 沟通方式
  if (typeCode === 'ISTJ') modules.push({
    id: 'communication_style_ISTJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式直接而务实，喜欢说重点、讲事实。你不喜欢绕弯子或打哑谜，有时可能显得不够委婉。你更擅长处理具体事务的沟通，对情绪类话题可能会有些不自在。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'communication_style_ISFJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式温和体贴，擅长倾听和共情。你总能让人感到被理解和被关心。但有时你可能因为怕冲突而不敢说出真实想法，导致自己积压了很多情绪。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'communication_style_INFJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式深刻而有洞察力，擅长听出别人没说出口的话。你不喜欢肤浅的闲聊，更喜欢有深度的一对一交流。你说话有时比较含蓄，习惯用比喻和暗示来表达。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'communication_style_INTJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式直接、理性、有逻辑。你不喜欢拐弯抹角，直奔主题。但有时你可能显得过于直率或冷漠，忽略了对方的感受。你更擅长书面表达而非情感表达。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'communication_style_ISTP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式简洁直接，说重点、讲实际。你不喜欢绕弯子，也不太会说场面话。你更擅长谈论具体的事物和技术话题，对情感交流可能会有些不自在。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'communication_style_ISFP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式温和而含蓄，擅长用行动而非语言表达。你是很好的倾听者，让人感到被接纳。但有时你可能因为怕冲突而隐藏真实想法，或者说话太委婉让人摸不着头绪。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'communication_style_INFP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式温柔而有深度，擅长倾听和共情。你总能让人感到被理解和被接纳。但你可能不太擅长表达愤怒或拒绝，有时会因为怕伤害别人而委屈自己。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'communication_style_INTP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式理性而精确，喜欢讨论观点和想法。你不喜欢闲聊，更享受有深度的智力交流。但你有时可能太直接或太挑剔，忽略了对方的感受。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'communication_style_ESTP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式直接、活泼、有感染力。你擅长讲故事和调动气氛，和谁都能聊得来。但有时你可能说话太快或太直接，没有考虑到对方的感受。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'communication_style_ESFP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式热情、活泼、有感染力。你擅长讲故事和调动气氛，和谁都能成为朋友。但你有时可能说话不经过思考，或者注意力容易被新事物吸引而跑题。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'communication_style_ENFP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式热情、有感染力、充满想象力。你擅长激励和启发他人，让人看到新的可能。但你有时可能说话跑题或者太理想化，不够落地。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'communication_style_ENTP',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式机智、幽默、有挑战性。你擅长辩论和说服，能从不同角度看问题。但你有时可能太好辩或太尖锐，让人觉得不舒服或被攻击。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'communication_style_ESTJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式直接、明确、有条理。你喜欢说重点、讲事实，不喜欢绕弯子。但你有时可能太强硬或太直接，让人感到有压力。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'communication_style_ESFJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式温暖、友好、体贴。你擅长倾听和共情，让人感到被关心和被理解。但你有时可能因为怕冲突而不敢说出真实想法，或者太在意别人的评价。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'communication_style_ENFJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式温暖、有感染力、充满真诚。你擅长激励和说服他人，让人感到被理解和被鼓舞。但你有时可能太理想化，或者因为怕伤害别人而隐瞒真实想法。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'communication_style_ENTJ',
    category: 'communication_style' as ModuleCategory,
    title: '沟通方式',
    icon: '💬',
    content: '你的沟通方式直接、有力、有逻辑。你擅长说服和激励，直奔主题。但你有时可能太强硬或太直接，让人感到有压力或被冒犯。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 领导力
  if (typeCode === 'ISTJ') modules.push({
    id: 'leadership_ISTJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你以身作则、赏罚分明。你重视规则和效率，会确保团队按正确的方式做事。你擅长组织和管理，能把复杂的事情安排得井井有条，但可以多关注团队成员的情感需求。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'leadership_ISFJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你温暖而体贴，关心团队成员的福祉。你擅长创造和谐的团队氛围，让每个人都感到被重视。你可以更果断一些，在必要时坚定地做出决定。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'leadership_INFJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见、有感召力，擅长激励他人追求更高的目标。你关注每个人的成长和潜能，相信每个人都可以变得更好。你可以更果断一些，不要因为追求完美而拖延。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'leadership_INTJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见、有魄力、能做艰难的决定。你擅长制定战略和组织资源，带领团队朝目标前进。你可以更多地关注团队成员的情感需求，领导力不止是方向正确，也包括人心所向。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'leadership_ISTP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你以身作则、冷静务实。你擅长在危机中带领团队走出困境，用行动而不是言语来激励。你可以更多地关注团队的士气和沟通，领导力不只在于解决问题。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'leadership_ISFP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你温和而民主，尊重每个人的独特性。你擅长创造有美感和温度的团队氛围，让每个人都能做自己。你可以更果断和有方向感一些，团队需要明确的指引。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'leadership_INFP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你民主而有人情味，尊重每个人的独特性。你擅长激励他人追求理想，让每个人都感到被看见。你可以更果断和有执行力一些，光有愿景是不够的。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'leadership_INTP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见和智慧，擅长制定战略和解决难题。你给团队成员很大的自由度，相信他们的专业能力。你可以更多地关注团队的情感和凝聚力，不只是任务本身。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'leadership_ESTP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有魅力、有决断力，能在危机中带领团队冲锋陷阵。你擅长激励行动和抓住机会，但可以更注重长远规划和团队成员的成长。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'leadership_ESFP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有人格魅力，能激励团队士气，让工作变得有趣。你擅长人际关系和团队建设。你可以更注重目标和结果，不只是让大家开心。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'leadership_ENFP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有感染力和远见，擅长激励他人追求梦想。你关注每个人的成长和潜能，创造积极的团队氛围。你可以更注重执行力和细节，愿景需要落地才能实现。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'leadership_ENTP',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见和创造力，擅长推动创新和变革。你给团队成员很大的自由度，鼓励大家提出不同意见。你可以更注重执行力和团队情绪，不只停留在想法层面。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'leadership_ESTJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你果断、有魄力，能带领团队高效达成目标。你擅长组织和规划，赏罚分明。你可以更关注团队成员的感受和成长，领导力不只是完成任务。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'leadership_ESFJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你温暖、有凝聚力，擅长创造和谐的团队氛围。你关心每个成员的福祉，让大家感到被重视。你可以更果断一些，在必要时做出艰难的决定。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'leadership_ENFJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见和感染力，擅长激励他人追求更高的目标。你关注每个人的成长，创造积极向上的团队文化。你可以更果断一些，不要因为怕伤害人而拖延决定。',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'leadership_ENTJ',
    category: 'leadership' as ModuleCategory,
    title: '领导力',
    icon: '👑',
    content: '作为领导者，你有远见、有魄力、能做艰难的决定。你擅长制定战略和组织资源，带领团队朝目标前进。你可以更多地关注团队成员的情感需求，领导力不只是方向正确。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 创造力
  if (typeCode === 'ISTJ') modules.push({
    id: 'creativity_ISTJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在「把事情做得更好」上。你擅长在现有框架内优化和改进，用更高效的方法达成目标。你不追求天马行空的创意，而是欣赏那些真正有用、能落地的创新。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'creativity_ISFJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在「用心做事」上。你擅长在日常事务中加入温暖的巧思，让平凡的事情变得特别。你喜欢做手工、烹饪、装饰等能带来实际美感的创作。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'creativity_INFJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是深刻而有意义的。你喜欢通过写作、艺术或帮助他人来表达自己对世界的理解。你的创意往往带有强烈的价值观色彩，想要传递某种信息或启发。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'creativity_INTJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在战略和系统层面。你擅长设计全新的框架和模型，找到别人看不到的解决方案。你的创意往往是颠覆性的，能从根本上改变做事的方式。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'creativity_ISTP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是实用型的。你擅长用现有资源解决新问题，或者把旧东西改造成更有用的样子。你的创意往往体现在动手实践中，而不是空想。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'creativity_ISFP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是感官和美学型的。你对色彩、声音、质感有天生的敏感度，擅长在日常生活中创造美。你的创意不需要宏大，而是体现在每一个用心的细节里。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'creativity_INFP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是想象和情感型的。你有丰富的内心世界，擅长写作、艺术、音乐等表达性的创作。你的作品往往带有强烈的个人色彩和情感深度。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'creativity_INTP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是思想和理论型的。你擅长提出新的理论框架、发现别人看不到的规律。你的创意往往在看似无关的事物之间找到连接，带来突破性的洞见。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'creativity_ESTP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是实践型的。你擅长在现场找到解决办法，用现有的资源应对新的挑战。你的创意往往是即兴的、灵活的，在行动中产生。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'creativity_ESFP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是表演和体验型的。你擅长在人前展现自己，用创意的方式给人带来快乐和惊喜。你的创意往往是即兴的、好玩的，充满生活气息。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'creativity_ENFP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是灵感和人际型的。你擅长提出新的想法和可能性，在不同领域之间找到连接。你的创意往往充满人文关怀，想要让世界变得更好。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'creativity_ENTP',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力是思想和辩论型的。你擅长提出颠覆性的想法，在别人看不到的地方找到机会。你的创意往往在挑战和质疑中产生，越辩论越精彩。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'creativity_ESTJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在组织和系统层面。你擅长设计高效的流程和制度，把混乱的事情变得有序。你的创意是务实的、有产出的。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'creativity_ESFJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在人际交往和生活美学中。你擅长组织活动、布置环境、让大家感到温馨和快乐。你的创意是为了服务他人、创造美好。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'creativity_ENFJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在人和成长的领域。你擅长发现人的潜能、设计有意义的体验、用语言激励他人。你的创意是温暖的、有力量的。',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'creativity_ENTJ',
    category: 'creativity' as ModuleCategory,
    title: '创造力',
    icon: '🎨',
    content: '你的创造力体现在战略和系统层面。你擅长设计宏大的蓝图、找到实现目标的最佳路径。你的创意是颠覆性的、有格局的。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 冲突处理
  if (typeCode === 'ISTJ') modules.push({
    id: 'conflict_handling_ISTJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突时，你倾向于坚持原则和立场，相信对错分明。你可能不太擅长处理情绪化的冲突，会试图把话题拉回事实和逻辑层面。学会理解对方的情绪视角会让你在冲突中更有智慧。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'conflict_handling_ISFJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你第一反应是回避和妥协，因为你不希望关系受到伤害。但有时回避会让问题积累得更严重。学会温和而坚定地表达自己的立场，你会发现关系并不会因此而破裂。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'conflict_handling_INFJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你会尽量避免伤害他人的感情，但如果涉及原则问题，你会非常坚定。你可能会因为太在意和谐而压抑自己的愤怒，直到某个点才爆发。学会健康地表达愤怒对你有好处。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'conflict_handling_INTJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于直面问题、就事论事。你不怕争论，反而觉得真理越辩越明。但有时你可能会因为过于强硬而伤害关系，或者因为觉得「不值得」而选择冷战。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'conflict_handling_ISTP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避或直接解决问题。你不喜欢情绪化的争吵，觉得吵架不如做事。有时你可能会因为逃避沟通而让问题积累，学会坐下来好好谈谈是你的成长方向。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'conflict_handling_ISFP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避和妥协，因为你不喜欢紧张和不和谐的氛围。你可能会把委屈藏在心里，或者用被动的方式表达不满。学会直面冲突、表达自己的立场，会让你更有力量。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'conflict_handling_INFP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避或妥协，因为你不喜欢伤害任何人。你可能会把委屈藏在心里，或者在心里反复琢磨。学会温和而坚定地表达自己的立场，是你重要的成长课题。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'conflict_handling_INTP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于从理性的角度分析问题，就事论事。你不怕争论，但讨厌情绪化的争吵。有时你可能会因为觉得「不值得」而选择回避，或者用冷处理的方式应对。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'conflict_handling_ESTP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于直接面对和解决。你不怕争论，甚至有些享受辩论的过程。但有时你可能太急于解决问题而忽略了对方的情绪，或者说话太冲而伤害关系。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'conflict_handling_ESFP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避或用幽默来化解。你不喜欢紧张和不和谐的气氛，希望每个人都开心。但有时回避会让问题变得更严重，学会直面冲突是必要的。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'conflict_handling_ENFP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避或寻找双赢的解决方案。你不喜欢伤害任何人，希望每个人都开心。但有时回避会让问题积累，学会直面冲突和设立边界是必要的。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'conflict_handling_ENTP',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于直接辩论和挑战。你不怕争论，甚至享受思维碰撞的过程。但有时你可能为了赢而伤害关系，或者把辩论的心态带到生活中。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'conflict_handling_ESTJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于直接面对和解决。你坚持原则和立场，不怕争论。但有时你可能太强硬或太固执，不愿意妥协，导致关系紧张。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'conflict_handling_ESFJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于回避和寻求和解。你不喜欢紧张和不和谐的气氛，希望每个人都开心。但有时回避会让问题积累，学会直面冲突是必要的。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'conflict_handling_ENFJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于寻求理解和和解。你相信沟通可以解决一切问题，愿意主动修复关系。但有时你可能为了和谐而牺牲自己的利益，或者回避必要的冲突。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'conflict_handling_ENTJ',
    category: 'conflict_handling' as ModuleCategory,
    title: '冲突处理',
    icon: '🤝',
    content: '面对冲突，你倾向于直接面对和解决。你不怕争论，相信冲突能带来进步。但有时你可能太强硬或太好胜，为了赢而伤害关系。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 成长方向
  if (typeCode === 'ISTJ') modules.push({
    id: 'growth_direction_ISTJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：学习拥抱变化和不确定性，培养对新方法的开放态度。尝试走出舒适区，允许自己偶尔「不按计划来」，你会发现生活中有更多可能性。同时，练习表达自己的感受也会让你更完整。',
    applicableTypes: ['ISTJ'],
    priority: 8,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'growth_direction_ISFJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：学会把自己放在重要的位置上，不再一味讨好他人；练习设立健康的边界，敢于说「不」；发展更多的自我认同，而不只是通过照顾他人来获得价值感。',
    applicableTypes: ['ISFJ'],
    priority: 8,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'growth_direction_INFJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：学会在不完美的世界里找到内心的平静，不再被理想主义所累；把深刻的洞见转化为实际的行动，而不只是停留在思考层面；接纳自己的「不被理解」也是一种常态。',
    applicableTypes: ['INFJ'],
    priority: 8,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'growth_direction_INTJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展情感智能，学习理解和回应他人的情绪；放下对控制的执念，学会拥抱不确定性；培养更多的耐心和包容，接受有些事情不需要完美的方案。',
    applicableTypes: ['INTJ'],
    priority: 8,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'growth_direction_ISTP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展语言表达能力，学会分享自己的想法和感受；培养长远规划的习惯，不只活在当下；加深对情感的理解，学习经营关系而不只是解决问题。',
    applicableTypes: ['ISTP'],
    priority: 8,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'growth_direction_ISFP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展坚持和韧性，不再轻易放弃或逃避；学会表达自己的需求和边界，不用总是迁就他人；培养长远规划的能力，为自己的梦想设定清晰的目标。',
    applicableTypes: ['ISFP'],
    priority: 8,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'growth_direction_INFP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：把理想转化为行动，不再只是停留在想象中；学会设立健康的边界，保护自己的能量；接纳不完美的世界和不完美的自己，在现实中找到平衡。',
    applicableTypes: ['INFP'],
    priority: 8,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'growth_direction_INTP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展情感智能，学习理解和回应他人的情绪；培养执行力，把想法付诸实践而不只是停留在思考层面；学会与人建立更深的情感连接。',
    applicableTypes: ['INTP'],
    priority: 8,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'growth_direction_ESTP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：培养耐心和长远眼光，不只看眼前利益；发展更深的情感连接能力，不再害怕深度和承诺；学会在行动前停下来思考，减少冲动带来的后悔。',
    applicableTypes: ['ESTP'],
    priority: 8,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'growth_direction_ESFP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：培养深度和坚持，不只是追求表面的快乐；学会面对和处理负面情绪，而不是逃避；发展长远规划的能力，为未来做打算。',
    applicableTypes: ['ESFP'],
    priority: 8,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'growth_direction_ENFP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：培养专注力和执行力，把想法变成现实；学会设立边界，保护自己的能量；接受生活中的平淡和不完美，不总是追求新鲜刺激。',
    applicableTypes: ['ENFP'],
    priority: 8,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'growth_direction_ENTP',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：培养专注力和执行力，把好想法变成现实；发展情感智能，学会理解和照顾他人的感受；学会在适当的时候闭嘴，不是每件事都需要辩论。',
    applicableTypes: ['ENTP'],
    priority: 8,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'growth_direction_ESTJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展情感智能，学习理解和回应他人的情绪；学会放手和信任，不要什么都想控制；培养对不同生活方式的包容，不是只有你的方式才是对的。',
    applicableTypes: ['ESTJ'],
    priority: 8,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'growth_direction_ESFJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：学会把自己放在重要的位置上，不再一味讨好他人；设立健康的边界，敢于说「不」；发展独立思考的能力，不要总是随大流。',
    applicableTypes: ['ESFJ'],
    priority: 8,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'growth_direction_ENFJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：学会照顾自己，不要总是把别人放在第一位；接受不是所有人都想被「拯救」，尊重每个人的选择；发展批判性思维，不要总是看到最好的一面。',
    applicableTypes: ['ENFJ'],
    priority: 8,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'growth_direction_ENTJ',
    category: 'growth_direction' as ModuleCategory,
    title: '成长方向',
    icon: '🌱',
    content: '你的成长方向在于：发展情感智能，学习理解和回应他人的情绪；学会放手和信任，不要什么都想控制；培养耐心和温柔，力量不只是强硬。',
    applicableTypes: ['ENTJ'],
    priority: 8,
  });

  // 阴影面
  if (typeCode === 'ISTJ') modules.push({
    id: 'shadow_side_ISTJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过于执着于规则和传统，对新想法和新方式抱有抵触；有时可能显得冷漠或不近人情，因为你习惯用逻辑而非情感回应他人；追求稳定可能让你错失一些美好的意外。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'shadow_side_ISFJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过度牺牲自己来满足他人，导致内心积怨；可能用「我都是为你好」的方式控制他人；容易记住别人对你的伤害，却不好意思说出来；有时会因为怕冲突而压抑真实想法。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'shadow_side_INFJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过于理想化，对自己和他人有不切实际的期待；容易感到「世人皆醉我独醒」的孤独；可能因为过度敏感而在关系中容易受伤；有时会用精神上的优越感来逃避现实。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'shadow_side_INTJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：傲慢和智力优越感，看不起你觉得「笨」的人；过度独立，不愿意求助或依赖他人；冷漠和情感疏离，让身边的人感到不被爱；完美主义和控制欲，难以接受计划外的变化。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'shadow_side_ISTP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：情感表达匮乏，让身边的人感到被忽视；冲动和冒险倾向，可能做出危险的决定；对承诺的恐惧，难以维持长期稳定的关系；冷漠和疏离，让人难以靠近。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'shadow_side_ISFP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：逃避倾向，遇到困难就想躲起来；被动攻击，不用直接的方式表达不满；对承诺和计划的恐惧，害怕被束缚住；自我低估，不相信自己也可以很厉害。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'shadow_side_INFP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过度理想化，对现实和他人有不切实际的期待；逃避倾向，遇到困难就躲进自己的内心世界；自我怀疑和自责，总觉得自己不够好；被动和拖延，难以把想法付诸行动。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'shadow_side_INTP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过度思考，陷入分析瘫痪；冷漠和情感疏离，让身边的人感到不被爱；傲慢和智力优越感，看不起你觉得「没逻辑」的人；拖延和执行力差，想法很多行动很少。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'shadow_side_ESTP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：冲动和鲁莽，做事不考虑后果；对承诺的恐惧，难以维持长期稳定的关系；肤浅和不耐，对深刻和严肃的事情没有耐心；自我中心，有时忽略他人的感受。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'shadow_side_ESFP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：追求享乐和刺激，容易逃避问题；肤浅和不耐，对深刻和严肃的事情没有耐心；注意力容易分散，难以长期专注于一件事；自我中心，有时忽略他人的感受。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'shadow_side_ENFP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：注意力分散，想法很多但难以坚持；过度讨好，害怕让人失望而委屈自己；理想化，对现实和他人有不切实际的期待；逃避问题，用新的想法来掩盖旧的问题。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'shadow_side_ENTP',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：好辩和挑衅，为了辩论而辩论；傲慢和智力优越感，看不起你觉得「没想法」的人；注意力分散，想法很多但难以坚持；冷漠和无情，有时为了真理而伤害人。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'shadow_side_ESTJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：控制欲强，什么都想按自己的来；固执和刻板，难以接受新的方式；冷漠和不近人情，有时为了效率而伤害人；判断太快，容易给人贴标签。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'shadow_side_ESFJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过度付出和讨好，害怕不被喜欢；控制欲强，用「我都是为你好」的方式干涉他人；容易记仇，对伤害过你的人难以释怀；在意别人的评价，活得太累。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'shadow_side_ENFJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：过度付出和自我牺牲，把自己累垮；控制欲强，用「为你好」的方式干涉他人的选择；理想化，对自己和他人有不切实际的期待；容易受伤，对批评特别敏感。',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'shadow_side_ENTJ',
    category: 'shadow_side' as ModuleCategory,
    title: '阴影面',
    icon: '🌑',
    content: '你的阴影面是：控制欲和支配欲，什么都想按自己的来；冷漠和无情，有时为了目标而牺牲他人；傲慢和自大，看不起能力不如你的人；工作狂，忽略生活和关系。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 能量管理
  if (typeCode === 'ISTJ') modules.push({
    id: 'energy_management_ISTJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自秩序和掌控感。当事情按计划进行、环境整洁有序时，你感到精力充沛。混乱和不确定性会消耗你的能量。给自己建立稳定的日常节奏，同时适当安排一些「计划外」的放松。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'energy_management_ISFJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自和谐的关系和有意义的付出。当你帮助了别人、感受到连接时，你会感到充实和快乐。但过度付出和人际冲突会快速消耗你的能量。你需要独处时间来恢复，也需要学会拒绝。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'energy_management_INFJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自独处、深度思考和有意义的连接。肤浅的社交和无意义的忙碌会快速消耗你。你需要定期的独处时间来「充电」，也需要至少一两个可以深度交流的知心朋友。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'energy_management_INTJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自独立思考和解决有挑战性的问题。当你在智力上获得突破时，会感到极大的满足。而琐碎的日常事务、愚蠢的规则、无意义的社交会快速消耗你的能量。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'energy_management_ISTP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自动手做事和解决实际问题。当你在专注地做一件事时，会进入心流状态，忘记时间。而冗长的会议、抽象的讨论、被束缚的感觉会快速消耗你的能量。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'energy_management_ISFP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自感官体验和美的享受。当你沉浸在喜欢的事物中、感受美好的事物时，你会感到愉悦和平静。而冲突、压力、嘈杂的环境会快速消耗你的能量。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'energy_management_INFP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自独处、创造和深度连接。当你在做自己喜欢的事情、和懂你的人交流时，你会感到充实和快乐。而冲突、批评、嘈杂的环境会快速消耗你的能量。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'energy_management_INTP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自思考和学习。当你在研究一个有趣的问题、获得新的洞见时，你会感到极大的满足。而琐碎的事务、无意义的社交、愚蠢的规则会快速消耗你的能量。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'energy_management_ESTP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自行动和刺激。当你在做有趣的事情、认识新的人、体验新鲜事物时，你会感到精力充沛。而等待、拖延、无聊的日常会让你感到窒息。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'energy_management_ESFP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自社交、乐趣和美的体验。当你和朋友在一起、做有趣的事情、感受美好时，你会感到精力充沛。而孤独、无聊、压抑的环境会快速消耗你的能量。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'energy_management_ENFP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自新想法、新体验和深度连接。当你在探索新事物、和有趣的人交流时，你会感到充满活力。而重复性的工作、压抑的环境、批评会快速消耗你的能量。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'energy_management_ENTP',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自新想法、辩论和智力挑战。当你在探索新概念、和人讨论时，你会感到精神焕发。而重复性的工作、愚蠢的规则、无知的人会快速消耗你的能量。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'energy_management_ESTJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自秩序和成就。当事情按计划进行、目标达成时，你会感到满足和有力量。而混乱、拖延、低效会快速消耗你的能量。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'energy_management_ESFJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自和谐的关系和帮助他人。当你知道自己被需要、被感激时，你会感到充实和快乐。而冲突、批评、孤独会快速消耗你的能量。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'energy_management_ENFJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自帮助他人、深度连接和有意义的工作。当你看到他人成长、感受到真诚的连接时，你会感到充满活力。而冷漠、批评、无意义的工作会快速消耗你的能量。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'energy_management_ENTJ',
    category: 'energy_management' as ModuleCategory,
    title: '能量管理',
    icon: '🔋',
    content: '你的能量来自目标达成和挑战。当你克服困难、实现目标时，你会感到极大的满足。而低效、拖延、愚蠢的规则会快速消耗你的能量。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 社交模式
  if (typeCode === 'ISTJ') modules.push({
    id: 'social_pattern_ISTJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你更倾向于小范围、有深度的交往。你不喜欢肤浅的闲聊，更愿意和熟悉的朋友进行有意义的交流。你对陌生人可能有些矜持，但熟悉之后会展现出温暖和幽默的一面。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'social_pattern_ISFJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你是那个温暖贴心的存在。你记得每个人的喜好和重要日子，总能让朋友感到被重视。你更喜欢小范围的深度交往，而不是大规模的社交场合。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'social_pattern_INFJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你偏向内敛和有选择性。你朋友不多，但个个都是深交。你不喜欢大型社交场合，更享受一对一的深度对话。在陌生人面前你可能显得安静甚至冷淡，但熟悉之后会展现出热情的一面。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'social_pattern_INTJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你比较内向和有选择性。你对肤浅的闲聊没有耐心，更喜欢和少数几个志同道合的朋友进行有深度的交流。你不在意是否受欢迎，更看重是否被尊重。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'social_pattern_ISTP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你比较低调和随性。你不喜欢成为焦点，更喜欢和几个合得来的朋友一起做点什么。你容易相处但不容易深交，你的内心世界很少向人敞开。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'social_pattern_ISFP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你随和友善，但也有自己的小世界。你容易相处但不容易深交，只有在真正信任的人面前才会展现真实的自己。你更喜欢小范围的、轻松的社交。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'social_pattern_INFP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你内向而有选择性。你朋友不多，但个个都是深交。你不喜欢大型社交场合，更享受和知心朋友的深度交流。在陌生人面前你可能显得安静甚至害羞。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'social_pattern_INTP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你比较内向和有选择性。你对肤浅的闲聊没有耐心，更喜欢和志同道合的朋友讨论想法。你不在意是否受欢迎，更看重是否能进行有质量的交流。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'social_pattern_ESTP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你是天生的社交达人。你容易和陌生人打成一片，在人群中如鱼得水。你朋友很多，但深交的可能不多。你喜欢热闹和新鲜的体验。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'social_pattern_ESFP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你是天生的社交明星。你热情、大方、有感染力，很容易成为人群中的焦点。你朋友很多，喜欢热闹的场合。你也很擅长让新朋友感到被欢迎。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'social_pattern_ENFP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你热情、开朗、有魅力。你很容易和陌生人建立连接，朋友遍天下。你喜欢深度交流，也喜欢热闹的场合。你对人总是充满好奇。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'social_pattern_ENTP',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你外向但有选择性。你喜欢和有趣、有想法的人交流，对肤浅的闲聊没有耐心。你朋友不少，但真正能在智力上和你过招的人不多。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'social_pattern_ESTJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你比较直接和正式。你重视责任和形象，在群体中往往扮演组织者的角色。你朋友可能不多，但都是靠谱的、长期的关系。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'social_pattern_ESFJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你热情、友好、有人缘。你擅长照顾每个人的感受，是群体中的「粘合剂」。你朋友很多，喜欢热闹的聚会和家庭活动。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'social_pattern_ENFJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你热情、有魅力、有人缘。你擅长和不同类型的人交往，总能让对方感到被重视。你朋友很多，也有几个深交的知己。你喜欢有深度的交流。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'social_pattern_ENTJ',
    category: 'social_pattern' as ModuleCategory,
    title: '社交模式',
    icon: '👥',
    content: '在社交中，你比较直接和有目的性。你不喜欢肤浅的闲聊，更喜欢有意义的交流。你朋友可能不多，但都是志同道合的人。你在群体中往往扮演领导者的角色。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 生活哲学
  if (typeCode === 'ISTJ') modules.push({
    id: 'life_philosophy_ISTJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「一分耕耘一分收获」，认为踏实努力是成功的必经之路。你重视承诺和责任，相信做好自己该做的事就是最大的本分。对你来说，稳定和可靠本身就是一种美德。',
    applicableTypes: ['ISTJ'],
    priority: 5,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'life_philosophy_ISFJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「予人玫瑰，手有余香」，认为善良和温暖是世界上最珍贵的东西。你重视家庭和传统，相信平凡日子里的相互扶持就是最大的幸福。',
    applicableTypes: ['ISFJ'],
    priority: 5,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'life_philosophy_INFJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「每个人都有自己的使命」，认为人生的意义在于找到并完成它。你重视真诚、深度和成长，对那些随波逐流的生活方式不感兴趣。你一直在追寻「为什么活着」这个问题的答案。',
    applicableTypes: ['INFJ'],
    priority: 5,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'life_philosophy_INTJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「知识就是力量」，认为通过理性思考和持续努力，人可以实现任何目标。你重视独立、能力和成就，对平庸和懒惰没有容忍度。对你来说，不断成长和突破是人生的意义所在。',
    applicableTypes: ['INTJ'],
    priority: 5,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'life_philosophy_ISTP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「行动胜于言语」，认为说得再好不如做得好。你重视自由和独立，不喜欢被规则和承诺束缚。对你来说，活在当下、体验生活比什么都重要。',
    applicableTypes: ['ISTP'],
    priority: 5,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'life_philosophy_ISFP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「活在当下」，认为人生最重要的是体验和感受。你重视自由和真实，不喜欢被标签和规则定义。对你来说，做自己喜欢的事、和喜欢的人在一起，就是最好的生活。',
    applicableTypes: ['ISFP'],
    priority: 5,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'life_philosophy_INFP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「每个人都是独一无二的」，认为人生的意义在于做真实的自己。你重视真诚、善良和美，对虚伪和功利感到厌恶。你一直在寻找属于自己的位置和表达方式。',
    applicableTypes: ['INFP'],
    priority: 5,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'life_philosophy_INTP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「知识就是力量」，认为通过思考和理性可以理解世界的本质。你重视真理、智慧和自由，对盲从和迷信嗤之以鼻。对你来说，思考本身就是最大的乐趣。',
    applicableTypes: ['INTP'],
    priority: 5,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'life_philosophy_ESTP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「活在当下」，认为人生就该及时行乐。你重视自由和体验，不喜欢被规则和计划束缚。对你来说，人生最大的冒险就是不去冒险。',
    applicableTypes: ['ESTP'],
    priority: 5,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'life_philosophy_ESFP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「人生苦短，及时行乐」，认为活在当下、享受生活最重要。你重视快乐、美和人际关系，对严肃的规划和长远打算不太感兴趣。对你来说，开心最重要。',
    applicableTypes: ['ESFP'],
    priority: 5,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'life_philosophy_ENFP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「每个人都有无限可能」，认为人生就是一场不断探索和成长的旅程。你重视自由、真实和连接，对平庸和安稳没有太大兴趣。对你来说，人生最大的乐趣就是发现。',
    applicableTypes: ['ENFP'],
    priority: 5,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'life_philosophy_ENTP',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「想法越辩越明」，认为真理在挑战和质疑中显现。你重视自由、智慧和创新，对盲从和守旧嗤之以鼻。对你来说，人生最大的乐趣就是思考和创造。',
    applicableTypes: ['ENTP'],
    priority: 5,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'life_philosophy_ESTJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「一分耕耘一分收获」，认为努力和自律是成功的关键。你重视责任、荣誉和传统，相信规则和秩序的价值。对你来说，做好自己该做的事就是最大的本分。',
    applicableTypes: ['ESTJ'],
    priority: 5,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'life_philosophy_ESFJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「大家好才是真的好」，认为人与人之间的连接是最珍贵的。你重视家庭、友谊和传统，相信爱与付出的力量。对你来说，幸福就是和爱的人在一起。',
    applicableTypes: ['ESFJ'],
    priority: 5,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'life_philosophy_ENFJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「每个人都有无限潜能」，认为人生的意义在于成长和帮助他人成长。你重视爱、成长、意义和连接，相信爱的力量可以改变世界。对你来说，成为光、传递光，就是人生的使命。',
    applicableTypes: ['ENFJ'],
    priority: 5,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'life_philosophy_ENTJ',
    category: 'life_philosophy' as ModuleCategory,
    title: '生活哲学',
    icon: '✨',
    content: '你相信「有志者事竟成」，认为通过努力和智慧可以实现任何目标。你重视成就、权力和自由，对平庸和懒惰没有容忍度。对你来说，人生就是不断征服更高的山峰。',
    applicableTypes: ['ENTJ'],
    priority: 5,
  });

  // 情绪模式
  if (typeCode === 'ISTJ') modules.push({
    id: 'emotional_pattern_ISTJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪相对平稳，不轻易大起大落。你习惯自己消化情绪，不太愿意向他人倾诉脆弱的一面。有时你可能会压抑自己的感受，直到某个临界点才爆发出来。学习识别和表达情绪对你的健康很重要。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'emotional_pattern_ISFJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感丰富而细腻，但不太容易对外表露。你习惯自己消化负面情绪，不想给别人添麻烦。当你感到被忽视或不被感激时，可能会默默生气而不是说出来。学会表达自己的需求对你很重要。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'emotional_pattern_INFJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感深刻而复杂，但很少完全展现给他人。你对情绪有很强的洞察力，能敏锐地感知到自己和他人的情绪变化。但有时你可能会被强烈的情感淹没，需要独处来整理。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'emotional_pattern_INTJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪表达比较内敛，习惯用理性来「管理」情绪。你可能不太善于识别和处理自己的情感，有时会压抑或忽视情绪信号。但在信任的人面前，你也会展现出柔软的一面。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'emotional_pattern_ISTP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪反应比较平稳，很少大起大落。你习惯自己处理情绪，不太愿意向别人倾诉。当你生气或受伤时，可能会变得更加沉默或者用行动发泄，而不是说出来。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'emotional_pattern_ISFP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感细腻而敏感，但不太善于用语言表达。你容易被美好的事物感动，也容易受到伤害。你习惯自己消化情绪，不想给别人添麻烦。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'emotional_pattern_INFP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感丰富而深刻，容易感动也容易受伤。你对情绪的感知力很强，能敏锐地捕捉到自己和他人的情绪变化。但有时你可能会被情绪淹没，需要独处来整理和恢复。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'emotional_pattern_INTP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪表达比较内敛，习惯用理性来分析情绪。你可能不太善于处理自己和他人的情感，有时会感到困惑。但在信任的人面前，你也会展现出幽默和温暖的一面。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'emotional_pattern_ESTP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪反应直接而强烈，但来得快去得也快。你不太会把事情放在心上，有情绪发泄出来就好了。但你可能对别人的情绪不够敏感，有时会无意中伤害到人。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'emotional_pattern_ESFP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪反应直接而丰富，开心就大笑，难过就掉眼泪。你不太会压抑自己的情绪，来得快去得也快。你对别人的情绪也有感染力，很容易带动气氛。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'emotional_pattern_ENFP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪丰富而多变，容易被感动也容易受伤。你对情绪有很强的感知力，能敏锐地捕捉到他人的情绪变化。但你有时可能情绪起伏太大，需要学会稳定。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'emotional_pattern_ENTP',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪表达比较直接，但通常被理性包裹。你习惯用幽默和讽刺来处理情绪，不太愿意展现脆弱的一面。你对别人的情绪有时不够敏感。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'emotional_pattern_ESTJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪表达比较内敛，习惯用工作和责任来「管理」情绪。你不太容易展现脆弱的一面，觉得人应该坚强。但你在信任的人面前也会展现柔软。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'emotional_pattern_ESFJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感丰富而温暖，但容易受到他人情绪的影响。你对别人的感受很敏感，也容易因为他人的评价而起伏。你需要学会区分自己的情绪和别人的情绪。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'emotional_pattern_ENFJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情感丰富而深刻，对情绪有很强的感知力。你很容易被感动，也很容易因为他人的痛苦而难过。你需要学会保护自己的情绪边界，不要把别人的情绪都扛在自己身上。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'emotional_pattern_ENTJ',
    category: 'emotional_pattern' as ModuleCategory,
    title: '情绪模式',
    icon: '🌊',
    content: '你的情绪表达比较内敛，习惯用理性和工作来「管理」情绪。你不太容易展现脆弱的一面，觉得领导者就该坚强。但在信任的人面前，你也会展现柔软的一面。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 完美主义倾向
  if (typeCode === 'ISTJ') modules.push({
    id: 'perfectionism_ISTJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在对质量和标准的坚持上。你做事情有自己的一套标准，不喜欢敷衍了事。但有时你可能会因为过度关注细节而降低效率，或者对别人的要求过高而让自己和他人都感到累。',
    applicableTypes: ['ISTJ'],
    priority: 5,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'perfectionism_ISFJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在对他人感受的细致照顾上。你希望每个人都开心、每件事都妥帖，有时会把自己累坏。你对自己的付出有很高的标准，觉得「还不够好」。',
    applicableTypes: ['ISFJ'],
    priority: 5,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'perfectionism_INFJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在对意义和质量的追求上。你希望自己做的每件事都有价值、都达到你内心的标准。你对「敷衍」和「肤浅」特别不能容忍，对自己和亲密的人都有很高的期待。',
    applicableTypes: ['INFJ'],
    priority: 5,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'perfectionism_INTJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在对能力和结果的高标准上。你追求卓越，不满足于「差不多就行」。你对自己的要求尤其严格，常常觉得「还不够好」。这种驱动力让你优秀，但也可能让你疲惫。',
    applicableTypes: ['INTJ'],
    priority: 5,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'perfectionism_ISTP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在技术和技能层面。你做事情讲究技巧和方法，追求「漂亮」地完成。你对自己的动手能力有很高的标准，容不得粗制滥造。',
    applicableTypes: ['ISTP'],
    priority: 5,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'perfectionism_ISFP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在审美和质感上。你对美的东西有自己的标准，不喜欢粗糙和敷衍。你做事情讲究「感觉」，感觉不对就不想继续。',
    applicableTypes: ['ISFP'],
    priority: 5,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'perfectionism_INFP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在价值观和真实性上。你希望自己做的每件事都符合你的理想和标准，是「有意义」的。你对敷衍和虚伪特别不能容忍，对自己也有很高的道德要求。',
    applicableTypes: ['INFP'],
    priority: 5,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'perfectionism_INTP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在思想和逻辑上。你追求严谨和准确，不能容忍逻辑上的漏洞。你对自己的思考标准很高，经常觉得「还不够完善」。',
    applicableTypes: ['INTP'],
    priority: 5,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'perfectionism_ESTP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义不明显，你更看重效率和结果。你觉得「完成比完美重要」，先做了再说。但你对自己的行动力和应变能力有很高的自信，不喜欢别人说你不行。',
    applicableTypes: ['ESTP'],
    priority: 5,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'perfectionism_ESFP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义不明显，你更看重过程的快乐和体验。你觉得「开心就好」，没必要太较真。但你对美的东西有自己的品味，不喜欢粗糙和敷衍。',
    applicableTypes: ['ESFP'],
    priority: 5,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'perfectionism_ENFP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在可能性和理想化上。你总是觉得还可以更好、还有更多可能，对「差不多」不满意。你对自己和他人都有很高的期待，有时会让人喘不过气。',
    applicableTypes: ['ENFP'],
    priority: 5,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'perfectionism_ENTP',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在思想和逻辑上。你追求严谨和创新，不能容忍平庸的想法。你对自己的思维能力有很高的标准，容不得逻辑漏洞。',
    applicableTypes: ['ENTP'],
    priority: 5,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'perfectionism_ESTJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在标准和执行上。你做事情有自己的一套高标准，追求效率和质量。你对自己和他人都有很高的要求，有时会让人喘不过气。',
    applicableTypes: ['ESTJ'],
    priority: 5,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'perfectionism_ESFJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在关系和服务上。你希望每个人都开心、每件事都妥帖，有时会把自己累坏。你对自己作为「照顾者」的角色有很高的标准。',
    applicableTypes: ['ESFJ'],
    priority: 5,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'perfectionism_ENFJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在人和成长上。你希望每个人都能变得更好，包括自己。你对「敷衍」和「浪费潜能」特别不能容忍。有时你对自己和他人都太苛刻了。',
    applicableTypes: ['ENFJ'],
    priority: 5,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'perfectionism_ENTJ',
    category: 'perfectionism' as ModuleCategory,
    title: '完美主义倾向',
    icon: '💎',
    content: '你的完美主义体现在标准和成果上。你追求卓越，不满足于「差不多」。你对自己和他人都有很高的要求，有时会让人喘不过气。',
    applicableTypes: ['ENTJ'],
    priority: 5,
  });

  // 适应力
  if (typeCode === 'ISTJ') modules.push({
    id: 'adaptability_ISTJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力属于「慢热型」。面对变化，你需要时间来了解和接受新的方式。一旦适应了，你会做得很好，但转变的过程可能让你感到不安。你可以尝试主动了解变化背后的原因，这会帮助你更快适应。',
    applicableTypes: ['ISTJ'],
    priority: 5,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'adaptability_ISFJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力取决于新环境是否让你感到安全和被接纳。在温暖友好的环境中，你能很快适应；在冷漠或竞争激烈的环境中，你可能需要更长的时间来打开自己。',
    applicableTypes: ['ISFJ'],
    priority: 5,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'adaptability_INFJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力取决于新环境是否符合你的价值观和直觉判断。如果感觉「对」，你能很快融入；如果感觉「不对」，你可能会长期感到格格不入。你比大多数人更需要「做自己」的空间。',
    applicableTypes: ['INFJ'],
    priority: 5,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'adaptability_INTJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力取决于你是否认为变化是「合理的」。如果变化有逻辑、有好处，你能很快适应甚至推动变化；如果变化是随意的、低效的，你会非常抵触。你擅长主动改变，不擅长被动接受。',
    applicableTypes: ['INTJ'],
    priority: 5,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'adaptability_ISTP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力很强。面对变化和突发事件，你能很快调整自己、找到应对方法。你不怕新环境和新挑战，反而觉得刺激。你是那种「到哪都能活」的人。',
    applicableTypes: ['ISTP'],
    priority: 5,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'adaptability_ISFP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力不错，只要新环境让你感到舒服和自由。你随遇而安，能在不同的环境中找到自己的节奏。但你不喜欢被迫改变，或者在压力下适应。',
    applicableTypes: ['ISFP'],
    priority: 5,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'adaptability_INFP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力取决于新环境是否符合你的价值观和是否让你感到安全。在温暖、有意义的环境中，你能慢慢适应并展现才华；在冷漠、功利的环境中，你会感到格格不入和痛苦。',
    applicableTypes: ['INFP'],
    priority: 5,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'adaptability_INTP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力取决于新环境是否在智力上有吸引力。如果有新的东西可以学习和探索，你能很快适应；如果只是重复和无聊，你会非常抗拒。',
    applicableTypes: ['INTP'],
    priority: 5,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'adaptability_ESTP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力非常强。无论什么环境，你都能很快找到自己的位置并融入其中。你不怕变化和挑战，反而觉得刺激。你是那种「到哪都能活得好」的人。',
    applicableTypes: ['ESTP'],
    priority: 5,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'adaptability_ESFP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力非常强。无论什么环境，你都能很快融入并找到乐趣。你不怕变化和陌生人，反而觉得新鲜刺激。你是那种「到哪都能交朋友」的人。',
    applicableTypes: ['ESFP'],
    priority: 5,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'adaptability_ENFP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力很强。你喜欢新事物和新环境，总能很快找到有趣的人和事。你不怕变化，反而觉得变化带来新的可能。',
    applicableTypes: ['ENFP'],
    priority: 5,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'adaptability_ENTP',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力很强。你喜欢变化和新挑战，总能快速找到新的角度和机会。你不怕失败，大不了换个思路再来。',
    applicableTypes: ['ENTP'],
    priority: 5,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'adaptability_ESTJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力属于「可控型」。如果变化是有计划的、合理的，你能适应和推动；如果变化是突然的、混乱的，你会非常抵触。你擅长主动改变，不擅长被动接受。',
    applicableTypes: ['ESTJ'],
    priority: 5,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'adaptability_ESFJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力不错，只要新环境中的人是友好和接纳的。你擅长在新环境中交朋友、建立关系。你不太适应冷漠或竞争激烈的环境。',
    applicableTypes: ['ESFJ'],
    priority: 5,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'adaptability_ENFJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力很强，只要新环境中的人是友好和开放的。你擅长在新环境中建立连接、找到自己的位置。你对变化持开放态度，只要变化是有意义的。',
    applicableTypes: ['ENFJ'],
    priority: 5,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'adaptability_ENTJ',
    category: 'adaptability' as ModuleCategory,
    title: '适应力',
    icon: '🦎',
    content: '你的适应力很强，但方式是「主动改变」。你不害怕变化，反而会推动变化来实现目标。你擅长在变化中找到机会，把挑战变成机遇。',
    applicableTypes: ['ENTJ'],
    priority: 5,
  });

  // 自我认知
  if (typeCode === 'ISTJ') modules.push({
    id: 'self_awareness_ISTJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和局限有比较清晰的认识。你知道自己擅长什么、不擅长什么，不会轻易自我膨胀或自我贬低。但你可能对自己的情感模式了解不够，有时会困惑「为什么我会有这种感觉」。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'self_awareness_ISFJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对他人的需求很敏感，但对自己的需求有时会忽视。你可能很清楚别人想要什么，却不太确定自己想要什么。花时间独处和反思，问问自己「我真正想要的是什么」，会帮助你更了解自己。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'self_awareness_INFJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己有比较深刻的认识，经常反思自己的动机和行为。但有时你可能会过度分析自己，或者对自己有不切实际的完美期待。记住：你不需要时时刻刻都「有意义」，偶尔的放松和放空也是必要的。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'self_awareness_INTJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和局限有很理性的认识。你清楚自己擅长什么、弱点在哪里，会有意识地扬长避短。但你可能对自己的情感世界了解不够，有时会困惑于自己的情绪反应。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'self_awareness_ISTP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和兴趣有比较清楚的认识，但对自己的情感模式可能了解不多。你知道自己擅长什么、喜欢什么，但有时会困惑自己到底想要什么样的生活和关系。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'self_awareness_ISFP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的感受和喜好很敏感，但对自己的能力和潜力可能认识不足。你有时会低估自己，觉得自己「只是普通」。你需要看到自己独特的价值和天赋。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'self_awareness_INFP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的内心世界有很深的了解，但可能对自己的外部能力认识不足。你清楚自己的价值观和感受，但有时会低估自己的实际能力。你需要更多的实践来认识自己的力量。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'self_awareness_INTP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的思想和能力有比较清晰的认识，但对自己的情感模式了解不多。你清楚自己擅长什么、对什么感兴趣，但有时会困惑于自己的情绪反应和人际关系。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'self_awareness_ESTP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和魅力有比较清楚的认识，但可能对自己的深层需求和长期目标思考不多。你知道自己当下想要什么，但有时会困惑长远来说什么才是真正重要的。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'self_awareness_ESFP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的感受和喜好很清楚，但可能对自己的深层需求和长期目标思考不多。你知道当下什么让你开心，但有时会困惑自己真正想要什么样的生活。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'self_awareness_ENFP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的价值观和理想有很清楚的认识，但可能对自己的实际能力和局限认识不足。你有很多梦想和计划，但有时会高估自己的执行力。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'self_awareness_ENTP',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的智力和创造力有比较清楚的认识，但可能对自己的情感模式和人际影响了解不多。你知道自己擅长什么，但有时会忽略自己的行为对他人的影响。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'self_awareness_ESTJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和责任有很清楚的认识，但可能对自己的情感需求和柔软面了解不多。你知道自己擅长什么，但有时会过度依赖理性而忽略感性。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'self_awareness_ESFJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对他人的需求很敏感，但对自己的需求有时会忽视。你可能很清楚别人想要什么，却不太确定自己想要什么。你需要花时间独处，问问自己的内心。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'self_awareness_ENFJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的价值观和使命有很清楚的认识，但可能对自己的真实需求了解不多。你有时会因为太关注他人而忽略自己。你需要定期独处，问问自己：我想要什么？',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'self_awareness_ENTJ',
    category: 'self_awareness' as ModuleCategory,
    title: '自我认知',
    icon: '🪞',
    content: '你对自己的能力和目标有很清楚的认识，但可能对自己的情感模式和柔软面了解不多。你知道自己要什么，但有时会忽略自己的感受和身边人的需要。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 价值观
  if (typeCode === 'ISTJ') modules.push({
    id: 'values_ISTJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：诚实、可靠、责任、传统、公平。你相信规则的价值，认为一个有序的社会需要每个人尽到自己的本分。你尊重那些说到做到、踏实肯干的人。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'values_ISFJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：忠诚、善良、和谐、责任、家庭。你相信人与人之间的连接是生命中最重要的东西，愿意为在乎的人付出很多。你欣赏那些真诚、温暖、有同理心的人。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'values_INFJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：意义、真诚、成长、洞察、慈悲。你相信每个人都值得被理解和被爱，愿意为了让世界变得更好而付出努力。你欣赏有深度、有温度、有追求的人。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'values_INTJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：独立、能力、知识、成就、理性。你相信真正的力量来自内心的强大和智慧。你欣赏那些有思想、有追求、不断进步的人，轻视那些安于现状、不求上进的人。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'values_ISTP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：自由、独立、技能、实用、真实。你讨厌虚伪和束缚，欣赏那些有真本事的人。对你来说，一个人的价值不在于说什么，而在于能做什么。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'values_ISFP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：自由、美、真实、和谐、体验。你讨厌虚伪和束缚，欣赏那些有个性、有温度的人。对你来说，人生的意义在于感受和创造美好。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'values_INFP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：真实、善良、意义、美、理解。你相信每个人都值得被尊重和被爱。你欣赏那些真诚、有温度、有理想的人，讨厌虚伪和冷漠。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'values_INTP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：真理、智慧、自由、独立、好奇。你相信思考的力量，欣赏那些有思想、爱学习的人。对你来说，人生的意义在于不断探索和理解这个世界。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'values_ESTP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：自由、行动、体验、刺激、真实。你讨厌虚伪和束缚，欣赏那些有胆量、有活力的人。对你来说，人生就该精彩地活。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'values_ESFP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：快乐、美、自由、友谊、体验。你讨厌无聊和压抑，欣赏那些有趣、有活力、真实的人。对你来说，人生的意义在于享受和分享美好。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'values_ENFP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：自由、成长、意义、连接、创造。你相信每个人都值得被看见和被鼓励。你欣赏那些真诚、有梦想、有趣的人，讨厌虚伪和束缚。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'values_ENTP',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：自由、创新、真理、智慧、挑战。你相信思想的力量，欣赏那些有想法、有勇气的人。对你来说，人生的意义在于不断探索和突破。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'values_ESTJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：责任、效率、秩序、传统、荣誉。你相信规则和制度的价值，欣赏那些说到做到、踏实肯干的人。对你来说，可靠是最大的美德。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'values_ESFJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：关系、和谐、责任、传统、善良。你相信付出爱就会收获爱。你欣赏那些温暖、真诚、有担当的人，讨厌虚伪和冷漠。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'values_ENFJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：成长、爱、意义、连接、真诚。你相信每个人都值得被看见和被鼓励。你欣赏那些有温度、有追求、有担当的人。',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'values_ENTJ',
    category: 'values' as ModuleCategory,
    title: '价值观',
    icon: '🌟',
    content: '你最看重的是：成就、能力、自由、战略、效率。你相信力量和智慧的价值，欣赏那些有追求、有能力的人。对你来说，成功就是不断超越自己。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 亲密关系
  if (typeCode === 'ISTJ') modules.push({
    id: 'intimacy_ISTJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是忠诚可靠的伴侣。你用行动表达爱，记得对方的喜好，在关键时刻永远在那里。但你可能不太擅长说甜言蜜语或制造浪漫惊喜。学习用对方能理解的语言表达爱，会让你们的关系更甜蜜。',
    applicableTypes: ['ISTJ'],
    priority: 8,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'intimacy_ISFJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是体贴入微的伴侣。你记得对方的每一个喜好，在生活的点点滴滴中表达爱。但你可能会因为过度付出而感到委屈，或者不敢说出自己的需要。平衡的爱是双向的。',
    applicableTypes: ['ISFJ'],
    priority: 8,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'intimacy_INFJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你追求灵魂层面的深度连接。你渴望一个能真正懂你的伴侣，和你分享内心最深处的想法和感受。你非常忠诚和深情，但可能因为害怕被伤害而不完全敞开自己。',
    applicableTypes: ['INFJ'],
    priority: 8,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'intimacy_INTJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是忠诚可靠但不善表达的伴侣。你用行动来证明爱——解决问题、规划未来、让关系变得更好。但你可能需要学习用语言和肢体表达情感，因为爱是需要被「看见」的。',
    applicableTypes: ['INTJ'],
    priority: 8,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'intimacy_ISTP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是用行动表达爱的伴侣。你记得怎么修对方的电脑、怎么调整对方不舒服的座椅，用实际的方式照顾对方。但你需要学习语言表达和情感分享，因为关系需要「说」出来。',
    applicableTypes: ['ISTP'],
    priority: 8,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'intimacy_ISFP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是温柔浪漫的伴侣。你用细节和行动表达爱，给对方带来很多温暖和惊喜。但你可能需要更多的安全感和确认，因为你内心深处有点害怕被抛弃。',
    applicableTypes: ['ISFP'],
    priority: 8,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'intimacy_INFP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是深情而浪漫的伴侣。你渴望灵魂的深度连接，愿意为爱情付出很多。但你可能比较敏感，容易因为对方的一句话而受伤。学习沟通和建立安全感对你很重要。',
    applicableTypes: ['INFP'],
    priority: 8,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'intimacy_INTP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是忠诚可靠但情感表达不足的伴侣。你用分享想法和帮对方解决问题来表达爱。但你需要学习更多的情感表达和肢体语言，因为关系需要温度。',
    applicableTypes: ['INTP'],
    priority: 8,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'intimacy_ESTP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是热情浪漫的伴侣，总能给对方带来惊喜和新鲜感。但你可能不太善于处理深度的情感问题，遇到矛盾时容易逃避。学会面对和经营长期关系是你的课题。',
    applicableTypes: ['ESTP'],
    priority: 8,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'intimacy_ESFP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是热情浪漫的伴侣，总能给对方带来惊喜和快乐。你喜欢分享和陪伴，让关系充满甜蜜。但你可能需要学会处理关系中的平淡和冲突，因为关系不只有美好。',
    applicableTypes: ['ESFP'],
    priority: 8,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'intimacy_ENFP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是热情浪漫的伴侣，总能给对方带来惊喜和灵感。你渴望深度的精神连接，愿意为爱情付出很多。但你可能需要学会在平淡中发现爱，关系不总是充满激情的。',
    applicableTypes: ['ENFP'],
    priority: 8,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'intimacy_ENTP',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是有趣、有挑战性的伴侣。你喜欢和对方讨论各种话题，从智力的碰撞中获得快乐。但你可能需要学习更多的温柔和情感表达，因为关系不只有辩论。',
    applicableTypes: ['ENTP'],
    priority: 8,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'intimacy_ESTJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是忠诚可靠的伴侣。你承担责任、规划未来，让对方感到安心。但你可能需要学习更多的温柔和浪漫，因为爱有时候需要被「说」出来和被「感受」到。',
    applicableTypes: ['ESTJ'],
    priority: 8,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'intimacy_ESFJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是体贴入微的伴侣，把对方照顾得无微不至。你重视承诺和稳定，愿意为家庭付出很多。但你需要学会也让对方照顾你，爱是双向的。',
    applicableTypes: ['ESFJ'],
    priority: 8,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'intimacy_ENFJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是深情、支持性的伴侣，总能看到对方最好的一面。你渴望灵魂的深度连接和共同成长。但你可能需要学会接受对方本来的样子，而不是你希望他成为的样子。',
    applicableTypes: ['ENFJ'],
    priority: 8,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'intimacy_ENTJ',
    category: 'intimacy' as ModuleCategory,
    title: '亲密关系',
    icon: '💕',
    content: '在亲密关系中，你是忠诚可靠但强势的伴侣。你用行动和规划来表达爱，给对方安全感和未来。但你需要学习更多的温柔和陪伴，因为爱不只是保护和提供，更是理解和陪伴。',
    applicableTypes: ['ENTJ'],
    priority: 8,
  });

  // 团队角色
  if (typeCode === 'ISTJ') modules.push({
    id: 'team_role_ISTJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是那个「靠谱的执行者」。你承担责任、按时交付，是团队稳定运行的基石。你擅长梳理流程和完善细节，确保每个环节都不出错。你更适合需要精确和可靠的角色。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'team_role_ISFJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「粘合剂」一样的存在。你关心每个人的感受，协调团队的氛围，让大家能够舒心地合作。你擅长细节执行和后勤支持，是团队默默运转的幕后英雄。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'team_role_INFJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「远见者」和「凝聚者」。你擅长看到大局和长远方向，也能理解每个人的需求和潜能。你更适合战略规划和人才培养的角色，而不是日常事务的执行。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'team_role_INTJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「战略家」和「架构师」。你擅长看清方向、设计方案、推动执行。你更适合领导和规划的角色，而不是执行琐碎事务。你欣赏有能力的队友，对低效的合作没有耐心。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'team_role_ISTP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「技术担当」和「救火队员」。你擅长解决技术难题和处理突发状况，是团队遇到困难时第一个想到的人。你更适合独立完成的技术角色，而不是管理和协调的角色。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'team_role_ISFP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「美学家」和「调和者」。你擅长让事情变得更有质感，也能缓解团队的紧张气氛。你更适合创意和支持性的角色，而不是领导和决策的角色。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'team_role_INFP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「梦想家」和「共情者」。你擅长提出有创意的想法，也能理解每个人的感受。你更适合创意和人文关怀的角色，而不是执行和管理的角色。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'team_role_INTP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「智囊」和「问题终结者」。你擅长分析复杂问题、提出创新的解决方案。你更适合研发和策略的角色，而不是日常管理和执行的角色。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'team_role_ESTP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「开拓者」和「气氛担当」。你擅长打开新局面、应对突发状况，也能调动团队的士气。你更适合销售、公关、应急等需要应变能力的角色。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'team_role_ESFP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「开心果」和「连接者」。你擅长调动气氛、建立关系，让团队充满活力。你更适合销售、公关、活动策划等需要人际魅力的角色。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'team_role_ENFP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「灵感来源」和「啦啦队长」。你擅长提出新想法、激励团队士气，让每个人都充满干劲。你更适合创意、策划、人资等需要创造力和人际能力的角色。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'team_role_ENTP',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「创意发动机」和「魔鬼代言人」。你擅长提出新想法和挑战现状，推动团队不断进步。你更适合研发、策略、创业等需要创新思维的角色。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'team_role_ESTJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「组织者」和「执行者」。你擅长制定计划、分配任务、确保目标达成。你天生就是领导者和管理者，能把团队带得井井有条。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'team_role_ESFJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「粘合剂」和「服务者」。你擅长协调关系、营造氛围，确保每个人都开心地合作。你更适合人资、行政、服务等需要人际能力的角色。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'team_role_ENFJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「导师」和「凝聚者」。你擅长激励团队、培养人才，让每个人都发挥出最好的水平。你更适合教育、人资、领导等需要人际影响力的角色。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'team_role_ENTJ',
    category: 'team_role' as ModuleCategory,
    title: '团队角色',
    icon: '🧩',
    content: '在团队中，你是「指挥官」和「战略家」。你擅长制定方向、组织资源、带领团队冲锋陷阵。你天生就是领导者，适合管理和决策的角色。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 休闲偏好
  if (typeCode === 'ISTJ') modules.push({
    id: 'leisure_preference_ISTJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些有明确目标或产出的事情，比如整理房间、学习新技能、做手工或园艺。你也喜欢和少数几个好朋友一起吃饭聊天。你不太喜欢太刺激或太随机的活动。',
    applicableTypes: ['ISTJ'],
    priority: 5,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'leisure_preference_ISFJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些温暖治愈的事情，比如烘焙、养花、看温馨的电影、和好朋友聊天。你也喜欢做一些能照顾到别人的事，比如给朋友准备礼物。',
    applicableTypes: ['ISFJ'],
    priority: 5,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'leisure_preference_INFJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些能滋养心灵的事情，比如阅读、写作、看有深度的电影、在自然中散步、和知心朋友长谈。你也喜欢做一些有创意的事情来表达自己。',
    applicableTypes: ['INFJ'],
    priority: 5,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'leisure_preference_INTJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你也喜欢做一些有挑战性的事情，比如阅读非虚构书籍、研究新技能、下棋、做策略游戏。你也享受独处的时间，一个人思考和规划对你来说就是放松。',
    applicableTypes: ['INTJ'],
    priority: 5,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'leisure_preference_ISTP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些动手的活动，比如运动、手工、修理东西、玩电子游戏、自驾游。你也喜欢尝试新的体验，追求刺激和新鲜感。',
    applicableTypes: ['ISTP'],
    priority: 5,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'leisure_preference_ISFP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些有美感的事情，比如画画、弹琴、摄影、逛展览、在大自然中散步。你也喜欢美食、好音乐、和好朋友轻松地聚会。',
    applicableTypes: ['ISFP'],
    priority: 5,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'leisure_preference_INFP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些滋养心灵的事情，比如阅读、写作、听音乐、看电影、在大自然中散步、和知心朋友聊天。你也喜欢做创意手工或艺术创作。',
    applicableTypes: ['INFP'],
    priority: 5,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'leisure_preference_INTP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你也喜欢做一些需要动脑的事情，比如阅读、下棋、玩策略游戏、研究新技术。你也享受独处的时间，一个人想问题对你来说就是放松。',
    applicableTypes: ['INTP'],
    priority: 5,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'leisure_preference_ESTP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做一些刺激有趣的事情，比如运动、旅行、聚会、玩游戏、尝试新的体验。你讨厌无聊的周末，永远在找下一个好玩的事。',
    applicableTypes: ['ESTP'],
    priority: 5,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'leisure_preference_ESFP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做各种有趣的事情，比如逛街、看电影、和朋友聚会、旅行、尝试新餐厅。你讨厌无聊的周末，日程总是排得满满的。',
    applicableTypes: ['ESFP'],
    priority: 5,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'leisure_preference_ENFP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢做各种有趣的事情，比如旅行、读书、和朋友聊天、尝试新事物、参加活动。你的兴趣很广泛，什么都想试试看。',
    applicableTypes: ['ENFP'],
    priority: 5,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'leisure_preference_ENTP',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你也喜欢做一些动脑的事情，比如阅读、辩论、玩策略游戏、研究新事物。你也喜欢和有趣的朋友聚会聊天，讨论各种话题。',
    applicableTypes: ['ENTP'],
    priority: 5,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'leisure_preference_ESTJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你也喜欢做一些有组织、有目标的活动，比如运动、旅行、家庭聚会、学习新技能。你不太喜欢无所事事，即使休息也要「有意义」。',
    applicableTypes: ['ESTJ'],
    priority: 5,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'leisure_preference_ESFJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢和朋友家人在一起，比如聚餐、聚会、旅行。你也喜欢做一些照顾别人的事，比如做饭、准备礼物、布置家。',
    applicableTypes: ['ESFJ'],
    priority: 5,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'leisure_preference_ENFJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你喜欢和朋友家人在一起，或者做一些有意义的事情，比如读书、参加活动、做志愿者。你也喜欢旅行和探索新的文化。',
    applicableTypes: ['ENFJ'],
    priority: 5,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'leisure_preference_ENTJ',
    category: 'leisure_preference' as ModuleCategory,
    title: '休闲偏好',
    icon: '🎮',
    content: '休闲时你也喜欢做一些有挑战性的事情，比如运动、阅读商业书籍、参加论坛、规划下一步。你不太喜欢无所事事，即使休息也要有收获。',
    applicableTypes: ['ENTJ'],
    priority: 5,
  });

  // 动机驱动
  if (typeCode === 'ISTJ') modules.push({
    id: 'motivation_driver_ISTJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：成就感、责任感和稳定感。你希望把事情做好，不仅是为了别人的认可，更是因为这是你对自己的要求。知道自己的努力有实际的成果，会让你感到满足和充实。',
    applicableTypes: ['ISTJ'],
    priority: 6,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'motivation_driver_ISFJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：被需要的感觉、和谐的人际关系、有意义的付出。当你知道自己的努力让别人的生活变得更好时，你会感到莫大的满足。认可和感谢对你来说是最好的奖励。',
    applicableTypes: ['ISFJ'],
    priority: 6,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'motivation_driver_INFJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：使命感、自我实现、深度连接、帮助他人成长。当你感到自己在做有意义的事情、在成为更好的自己时，你会充满能量。物质奖励对你来说远不如精神满足重要。',
    applicableTypes: ['INFJ'],
    priority: 6,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'motivation_driver_INTJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：成就感、智力挑战、自我实现、掌控感。当你克服了困难、实现了目标、变得更强大时，你会感到最大的满足。你追求的不是别人的认可，而是自己对自己的肯定。',
    applicableTypes: ['INTJ'],
    priority: 6,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'motivation_driver_ISTP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：解决问题的成就感、掌握新技能的兴奋感、自由行动的快感。当你攻克了一个难题、学会了一个新技能时，你会感到最大的满足。你讨厌被安排得明明白白。',
    applicableTypes: ['ISTP'],
    priority: 6,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'motivation_driver_ISFP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：美的享受、内心的感受、自由的体验、和谐的关系。当你在做自己喜欢的事情、感受美好的时候，你会感到最幸福。你不在乎别人怎么看，只在乎自己喜不喜欢。',
    applicableTypes: ['ISFP'],
    priority: 6,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'motivation_driver_INFP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：意义感、自我表达、深度连接、帮助他人。当你在做有意义的事情、做真实的自己时，你会感到最满足。你对物质和地位没有太大的欲望。',
    applicableTypes: ['INFP'],
    priority: 6,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'motivation_driver_INTP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：好奇心、智力挑战、发现真理的快感。当你解开了一个难题、获得了新的理解时，你会感到最大的满足。你追求的是智识上的成长和突破。',
    applicableTypes: ['INTP'],
    priority: 6,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'motivation_driver_ESTP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：新鲜感、刺激感、行动的快感、赢的感觉。当你在做有趣的、有挑战性的事情时，你会感到最快乐。你讨厌一成不变的生活。',
    applicableTypes: ['ESTP'],
    priority: 6,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'motivation_driver_ESFP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：快乐、新鲜感、社交认可、美的体验。当你在做有趣的事情、和喜欢的人在一起时，你会感到最幸福。你要的是当下的快乐。',
    applicableTypes: ['ESFP'],
    priority: 6,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'motivation_driver_ENFP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：好奇心、创造力、帮助他人成长、新的体验。当你在探索新可能、帮助别人变得更好时，你会感到最满足。你对重复和平庸没有耐心。',
    applicableTypes: ['ENFP'],
    priority: 6,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'motivation_driver_ENTP',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：好奇心、智力挑战、创新的快感。当你发现了一个新想法、推翻了一个旧观念时，你会感到最大的满足。你追求的是思维的自由和突破。',
    applicableTypes: ['ENTP'],
    priority: 6,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'motivation_driver_ESTJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：成就感、责任感、掌控感。当你完成了一个大目标、组织好一件事情时，你会感到最大的满足。你追求的是效率和成果。',
    applicableTypes: ['ESTJ'],
    priority: 6,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'motivation_driver_ESFJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：被需要的感觉、和谐的关系、服务他人。当你帮助了别人、看到大家开心时，你会感到最大的满足。你追求的是连接和归属感。',
    applicableTypes: ['ESFJ'],
    priority: 6,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'motivation_driver_ENFJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：帮助他人成长、有意义的工作、深度的连接。当你看到别人因为你而变得更好时，你会感到最大的满足。你追求的是自我实现和服务他人。',
    applicableTypes: ['ENFJ'],
    priority: 6,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'motivation_driver_ENTJ',
    category: 'motivation_driver' as ModuleCategory,
    title: '动机驱动',
    icon: '🚀',
    content: '驱动你的是：成就感、权力感、征服挑战的快感。当你实现了一个大目标、克服了一个大困难时，你会感到最大的满足。你追求的是更大的目标和更强的自己。',
    applicableTypes: ['ENTJ'],
    priority: 6,
  });

  // 沟通建议
  if (typeCode === 'ISTJ') modules.push({
    id: 'communication_advice_ISTJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：多给对方一些情感回应，不只是就事论事；练习用「我觉得」开头表达感受，而不只是讲事实；在给出反馈时先肯定再建议，让对方更容易接受。',
    applicableTypes: ['ISTJ'],
    priority: 7,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'communication_advice_ISFJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习直接表达自己的需要，不要等别人来猜；学会说「不」，不用每次都解释理由；在冲突中相信关系有韧性，真实表达不会毁掉一段好的关系。',
    applicableTypes: ['ISFJ'],
    priority: 7,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'communication_advice_INFJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：不必每次都追求深度，偶尔的「废话」也是连接的方式；练习直接表达你的想法和感受，不要假设别人应该懂；多和不同类型的人交流，你会发现新的视角。',
    applicableTypes: ['INFJ'],
    priority: 7,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'communication_advice_INTJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：多注意对方的情绪反应，必要时放缓节奏；练习先肯定再提建议，软化你的表达方式；不要假设每个人都像你一样理性和直接，调整沟通方式是智慧而非妥协。',
    applicableTypes: ['INTJ'],
    priority: 7,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'communication_advice_ISTP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：多分享你的想法和感受，不要让人猜；在关系中主动表达关心，哪怕只是一句话；学习倾听和共情，有时候对方需要的不是解决方案而是理解。',
    applicableTypes: ['ISTP'],
    priority: 7,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'communication_advice_ISFP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习直接表达你的需求和感受，不要等别人发现；在冲突中学会说「我觉得」，把情绪说出来而不是憋在心里；不要总是迁就别人，你的感受同样重要。',
    applicableTypes: ['ISFP'],
    priority: 7,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'communication_advice_INFP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习直接表达你的需求，不要假设别人应该懂；学会说「不」，保护好自己的能量；在冲突中相信关系的韧性，真实表达不会毁掉一段好的关系。',
    applicableTypes: ['INFP'],
    priority: 7,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'communication_advice_INTP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：多注意对方的情绪，学会先共情再分析；练习表达欣赏和感谢，不只是提问题和建议；不要假设每个人都像你一样喜欢争论，有时和谐比正确更重要。',
    applicableTypes: ['INTP'],
    priority: 7,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'communication_advice_ESTP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：学会倾听，不要急着回应；在对方分享感受时，先共情再给建议；说话之前先想一想，有时候慢半拍会更好。',
    applicableTypes: ['ESTP'],
    priority: 7,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'communication_advice_ESFP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习倾听，不要急着说自己的事；在严肃的话题上放慢节奏，给对方思考的空间；学会表达负面情绪，不要总是用笑脸掩盖。',
    applicableTypes: ['ESFP'],
    priority: 7,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'communication_advice_ENFP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习把话说完、说清楚，不要跳来跳去；学会倾听，不要急着给建议或分享自己的经历；在给人反馈时，除了鼓励也要说真话。',
    applicableTypes: ['ENFP'],
    priority: 7,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'communication_advice_ENTP',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：学会什么时候该闭嘴，不是每个观点都需要被挑战；练习先肯定再提出不同意见，让人更容易接受；注意对方的情绪反应，别为了赢而输了关系。',
    applicableTypes: ['ENTP'],
    priority: 7,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'communication_advice_ESTJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：放慢语速，给对方反应的时间；练习先感谢再提要求，让人更容易接受；学会表达欣赏和鼓励，不只是指出问题。',
    applicableTypes: ['ESTJ'],
    priority: 7,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'communication_advice_ESFJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：练习直接表达你的需求，不要暗示或等待；学会说「不」，不必每次都解释理由；在冲突中相信关系的韧性，真实表达不会毁掉友谊。',
    applicableTypes: ['ESFJ'],
    priority: 7,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'communication_advice_ENFJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：学会说「不」，不要总是答应别人；练习接受「不被喜欢」，你不需要让每个人都满意；在给出建议之前先确认对方想要听，有时陪伴就够了。',
    applicableTypes: ['ENFJ'],
    priority: 7,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'communication_advice_ENTJ',
    category: 'communication_advice' as ModuleCategory,
    title: '沟通建议',
    icon: '📝',
    content: '建议你在沟通时：放慢节奏，给对方思考和反应的时间；练习先感谢再提建议，软化你的表达方式；学会倾听，不要急着反驳或下判断。',
    applicableTypes: ['ENTJ'],
    priority: 7,
  });

  // 发展建议
  if (typeCode === 'ISTJ') modules.push({
    id: 'development_advice_ISTJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）主动拥抱一些小变化，比如换一条通勤路线、尝试新的餐厅；2）练习表达自己的情感，可以从写日记开始；3）培养对不同观点的包容，意识到正确的答案可能不止一个。',
    applicableTypes: ['ISTJ'],
    priority: 8,
  });
  if (typeCode === 'ISFJ') modules.push({
    id: 'development_advice_ISFJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每天留一段时间只照顾自己，做让自己开心的事；2）练习在小事上说「不」，建立边界感；3）写下你的需求和愿望，它们和别人的需求一样重要。',
    applicableTypes: ['ISFJ'],
    priority: 8,
  });
  if (typeCode === 'INFJ') modules.push({
    id: 'development_advice_INFJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）把宏大的目标拆解成小步骤，用行动代替空想；2）允许自己「不深刻」，享受一些简单的快乐；3）学会接受不完美的世界和不完美的自己。',
    applicableTypes: ['INFJ'],
    priority: 8,
  });
  if (typeCode === 'INTJ') modules.push({
    id: 'development_advice_INTJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每周安排专门的「情感时间」，和爱的人聊聊感受；2）练习接受不完美，有些事情 80 分就够了；3）学会向别人求助，真正的强者懂得借力。',
    applicableTypes: ['INTJ'],
    priority: 8,
  });
  if (typeCode === 'ISTP') modules.push({
    id: 'development_advice_ISTP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）练习每天和身边的人分享一件你的感受；2）试着做一些长远规划，比如三个月后的目标；3）培养耐心，有些事情需要时间，不能一蹴而就。',
    applicableTypes: ['ISTP'],
    priority: 8,
  });
  if (typeCode === 'ISFP') modules.push({
    id: 'development_advice_ISFP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）给自己设定一个小目标并坚持完成，培养毅力；2）尝试说一次「不」，看看天会不会塌下来；3）写下你的优点和成就，你比自己想象的更棒。',
    applicableTypes: ['ISFP'],
    priority: 8,
  });
  if (typeCode === 'INFP') modules.push({
    id: 'development_advice_INFP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）把你的一个想法变成行动，从小事开始；2）练习设立边界，学会保护自己；3）接纳不完美，有些事情做了就好，不必追求完美。',
    applicableTypes: ['INFP'],
    priority: 8,
  });
  if (typeCode === 'INTP') modules.push({
    id: 'development_advice_INTP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每天花一点时间感受自己的情绪，而不是分析它；2）把一个想法变成行动，哪怕不完美；3）主动和朋友联系，不要总是等别人找你。',
    applicableTypes: ['INTP'],
    priority: 8,
  });
  if (typeCode === 'ESTP') modules.push({
    id: 'development_advice_ESTP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）练习做一件需要坚持的事，比如每天运动或写日记；2）试着做一些长远规划，想想一年后的目标；3）学会独处，享受安静的时光。',
    applicableTypes: ['ESTP'],
    priority: 8,
  });
  if (typeCode === 'ESFP') modules.push({
    id: 'development_advice_ESFP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）找到一件值得长期坚持的事，培养深度和毅力；2）练习独处，学会和自己相处；3）直面一个你一直在逃避的问题，你会发现并不可怕。',
    applicableTypes: ['ESFP'],
    priority: 8,
  });
  if (typeCode === 'ENFP') modules.push({
    id: 'development_advice_ENFP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）选一个项目坚持做完，不管中途遇到什么；2）学会说「不」，保护好自己的时间和能量；3）练习专注，一次只做一件事。',
    applicableTypes: ['ENFP'],
    priority: 8,
  });
  if (typeCode === 'ENTP') modules.push({
    id: 'development_advice_ENTP',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）选一个好想法，把它执行到底，不要中途又换方向；2）练习表达你的感受，而不只是你的观点；3）每天做一件「没有用」的事，享受过程而不是结果。',
    applicableTypes: ['ENTP'],
    priority: 8,
  });
  if (typeCode === 'ESTJ') modules.push({
    id: 'development_advice_ESTJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每天花十分钟什么都不做，只是休息；2）试着让别人做决定，即使你觉得他的方法不是最优的；3）练习表达你的感受，从「我觉得」开始。',
    applicableTypes: ['ESTJ'],
    priority: 8,
  });
  if (typeCode === 'ESFJ') modules.push({
    id: 'development_advice_ESFJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每周安排专门的「自我照顾时间」，只做让自己开心的事；2）在小事上练习说「不」，建立边界感；3）写下你的愿望和目标，它们和别人的一样重要。',
    applicableTypes: ['ESFJ'],
    priority: 8,
  });
  if (typeCode === 'ENFJ') modules.push({
    id: 'development_advice_ENFJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每周安排专属的「自我照顾时间」，什么都不用做就是休息；2）练习接受别人的「不」，不要把它当成针对你；3）培养一个和帮助他人无关的爱好，纯粹为了自己快乐。',
    applicableTypes: ['ENFJ'],
    priority: 8,
  });
  if (typeCode === 'ENTJ') modules.push({
    id: 'development_advice_ENTJ',
    category: 'development_advice' as ModuleCategory,
    title: '发展建议',
    icon: '🎯',
    content: '你的发展建议：1）每周安排完全不工作的时间，享受生活；2）练习向别人求助和示弱，真正的强者懂得借力；3）培养一个和工作无关的爱好，让自己放松下来。',
    applicableTypes: ['ENTJ'],
    priority: 8,
  });

  return modules;
}

// 动态选择模块：从模块池中选出 ≥12 个，按优先级和随机因素选择
export function selectModules(pool: ResultModule[], count: number = 14): ResultModule[] {
  // 先按优先级排序
  const sorted = [...pool].sort((a, b) => b.priority - a.priority);
  
  // 高优先级模块必选，低优先级模块随机选择以增加多样性
  const selected: ResultModule[] = [];
  const highPriority = sorted.filter(m => m.priority >= 8);
  const lowPriority = sorted.filter(m => m.priority < 8);
  
  selected.push(...highPriority);
  
  // 从低优先级中随机补足到 count 个
  const remaining = count - selected.length;
  if (remaining > 0 && lowPriority.length > 0) {
    // Fisher-Yates shuffle
    const shuffled = [...lowPriority];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    selected.push(...shuffled.slice(0, Math.min(remaining, shuffled.length)));
  }
  
  // 最后按优先级排序返回
  return selected.sort((a, b) => b.priority - a.priority);
}
