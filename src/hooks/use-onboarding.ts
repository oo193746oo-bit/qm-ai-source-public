"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ==========================================
// 用户画像数据模型（Plan B：本地记忆）
// Onboarding 改为 3 步：身份告知 → 记忆与隐私告知 → 称呼 → 进入对话
// ==========================================
export interface UserProfile {
  onboardingCompleted: boolean;
  onboardingStep: string;
  // 记忆默认开启（Plan B：本地存储），保留字段以兼容既有逻辑
  memoryEnabled: boolean;

  // 称呼
  nickname?: string;
  nicknameType?: "input" | "you" | "auto";

  // 代词（保留字段，当前 Onboarding 不采集）
  pronoun?: string;

  // 求助方向（保留字段）
  concerns?: string[];

  // 性别认同（保留字段）
  genderIdentity?: string;
  genderIdentityOther?: string;

  // 持续时长（保留字段）
  duration?: string;

  // 对话偏好（保留字段）
  preference?: string;

  // 咨询经验（保留字段）
  priorExperience?: string;

  // 说话风格（保留字段）
  speechStyle?: string;

  createdAt: number;
  updatedAt: number;
}

const defaultProfile: UserProfile = {
  onboardingCompleted: false,
  onboardingStep: "welcome",
  memoryEnabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const STORAGE_KEY = "qm_ai_profile";

// ==========================================
// 问卷题目定义（保留完整题库，当前 Onboarding 仅使用称呼题）
// ==========================================
export interface SurveyOption {
  value: string;
  label: string;
  subtext?: string;
}

export interface SurveyQuestion {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  type: "single" | "multi" | "text" | "text_optional";
  options?: SurveyOption[];
  placeholder?: string;
  maxSelect?: number;
  budgetSeconds?: number;
  optional?: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "nickname",
    index: 1,
    title: "我怎么称呼你？",
    type: "text_optional",
    placeholder: "你的名字 / 昵称（可以跳过）",
    budgetSeconds: 15,
    optional: true,
  },
  {
    id: "pronoun",
    index: 2,
    title: "我用什么代词提到你比较自在？",
    subtitle: "选一个你听着最舒服的就好",
    type: "single",
    options: [
      { value: "she", label: "她" },
      { value: "he", label: "他" },
      { value: "ta", label: "TA" },
      { value: "they", label: "他们 / 她们" },
      { value: "name", label: "直接叫我名字" },
      { value: "unsure", label: "不确定，都行" },
      { value: "prefer_not", label: "不想说" },
    ],
    budgetSeconds: 8,
    optional: true,
  },
  {
    id: "concerns",
    index: 3,
    title: "你今天来，比较想聊哪一块？",
    subtitle: "可以选 1~3 个，选最贴近的就好",
    type: "multi",
    maxSelect: 3,
    options: [
      { value: "emotion", label: "情绪最近不太对劲" },
      { value: "intimacy", label: "亲密关系里有想不通的事" },
      { value: "family", label: "家里的事 / 原生家庭" },
      { value: "friendship", label: "朋友 / 人际关系" },
      { value: "work", label: "工作 / 学业压力" },
      { value: "identity", label: "性别认同或性取向" },
      { value: "self", label: "想更了解自己" },
      { value: "anxiety_sleep", label: "焦虑、睡不好" },
      { value: "trauma", label: "过去的事一直影响我" },
      { value: "other", label: "其他 / 说不清" },
    ],
    budgetSeconds: 20,
    optional: false,
  },
  {
    id: "gender",
    index: 4,
    title: "如果你愿意说——你怎么描述自己的性别？",
    subtitle: "没有标准答案，选最像你的就好",
    type: "single",
    options: [
      { value: "female", label: "女性" },
      { value: "male", label: "男性" },
      { value: "trans_female", label: "跨性别女性" },
      { value: "trans_male", label: "跨性别男性" },
      { value: "non_binary", label: "非二元性别" },
      { value: "genderqueer", label: "性别酷儿" },
      { value: "agender", label: "无性别" },
      { value: "genderfluid", label: "流动性别" },
      { value: "intersex", label: "间性人" },
      { value: "questioning", label: "还在探索中" },
      { value: "prefer_not", label: "不想说" },
      { value: "other", label: "其他" },
    ],
    budgetSeconds: 15,
    optional: true,
  },
  {
    id: "duration",
    index: 5,
    title: "你刚才选的那件事，跟着你多久了？",
    type: "single",
    options: [
      { value: "days", label: "这几天的事" },
      { value: "weeks", label: "几个星期" },
      { value: "months", label: "好几个月了" },
      { value: "years", label: "好几年了" },
      { value: "on_off", label: "断断续续，时好时坏" },
      { value: "not_sure", label: "我也说不清" },
    ],
    budgetSeconds: 8,
    optional: true,
  },
  {
    id: "preference",
    index: 6,
    title: "你希望我怎么陪你？",
    subtitle: "这是今天的基调，之后随时可以变",
    type: "single",
    options: [
      { value: "listen", label: "先听我说，别急着分析" },
      { value: "clarify", label: "帮我把事情理一理" },
      { value: "perspective", label: "给我一些没想过的角度" },
      { value: "skills", label: "教我一些调节的方法" },
      { value: "unsure", label: "不知道，先聊聊看" },
    ],
    budgetSeconds: 8,
    optional: true,
  },
  {
    id: "experience",
    index: 7,
    title: "你以前接触过心理咨询吗？",
    type: "single",
    options: [
      { value: "ongoing", label: "有，现在还在进行" },
      { value: "had", label: "有过，现在没有了" },
      { value: "thinking", label: "想过，还没开始" },
      { value: "never", label: "完全没有" },
      { value: "not_sure", label: "不太确定算不算" },
    ],
    budgetSeconds: 6,
    optional: true,
  },
  {
    id: "speech",
    index: 8,
    title: "最后一个——说话的时候，你比较像哪一种？",
    subtitle: "小酷会调整节奏来配合你",
    type: "single",
    options: [
      { value: "talk_think", label: "边说边想，说出来才清楚" },
      { value: "think_talk", label: "想清楚了才说，需要一点时间" },
      { value: "depends", label: "看情况" },
    ],
    budgetSeconds: 8,
    optional: true,
  },
];

// ==========================================
// 个性化开场白模板
// ==========================================
export function getOpeningLine(profile: UserProfile): string {
  const name = profile.nickname || "朋友";
  const concerns = profile.concerns || [];
  const primary = concerns[0];

  const templates: Record<string, string> = {
    emotion: `${name}，你说最近情绪不太对劲——这真的很消耗人。\n有时候我们忙着应对生活，会忘了自己也需要被照顾。\n你今天愿意来这里，愿意说出来，这本身就是在照顾自己了。\n你愿意跟小酷聊聊，最近发生了什么吗？`,
    intimacy: `${name}，感情里的事，往往是最让人无力的——因为你在乎，所以才会困惑。\n你愿意跟小酷说说，最近发生了什么吗？`,
    family: `${name}，家里的事，常常是最复杂也最难说出口的。\n你愿意说出来，这已经很勇敢了。可以跟小酷聊聊，最近是什么事吗？`,
    friendship: `${name}，朋友之间的事，看似轻，有时候却最让人纠结。\n你愿意跟小酷说说，最近在跟谁的相处里遇到了什么吗？`,
    work: `${name}，在一个总在要求你"达标"、"表现"、"跟上"的环境里，有时候会忘了自己也值得被好好对待。\n你愿意跟小酷聊聊，最近具体发生了什么？`,
    identity: `${name}，性别认同和性取向的探索，往往是一条不太容易的路——尤其是在一个总想告诉你"应该是什么"的世界里。\n但 QM 一直相信：生活没有标准答案。你是谁、你爱谁、你如何定义自己——这些答案只能由你写出。\n小酷会陪你一起探索。最近是什么让你开始思考这些的？`,
    self: `${name}，你说你想更了解自己——这是一个很珍贵的开始。\n很多人一辈子都在忙着符合别人的期待，而你愿意停下来问自己"我是谁"，这本身就很难得。\n你愿意跟小酷聊聊，是什么让你现在开始想要探索自己了？`,
    anxiety_sleep: `${name}，焦虑和睡不好真的很折磨人。身体在提醒你，有些东西需要被看见。\n你愿意跟小酷说说，这种状态持续多久了？最近有什么特别让你担心的事吗？`,
    trauma: `${name}，过去的事一直在影响你——这真的不容易。\n有些事情以为过去了，但其实还在那里，悄悄影响着现在的生活。\n如果你愿意说，小酷在这里听；如果还没准备好，也完全没关系。`,
    other: `${name}，有时候就是想找个空间理一理自己，这本身就是一种自我照顾。\n今天有什么想聊的方向吗？或者，最近有没有什么事一直在你心里？`,
  };

  if (concerns.length >= 2) {
    return `${name}，小酷注意到你提到了好几个方向。这些事往往是交织在一起的——工作上的压力会影响关系，关系里的困惑会触动我们对自我的思考。\n你想先从哪里聊起？`;
  }

  if (!primary || !templates[primary]) {
    return `${name}，好的，随时可以开始聊 🤍\n想说什么都可以，不着急。`;
  }

  return templates[primary];
}

// ==========================================
// Hook：useOnboarding
// 3 步流程：welcome（身份告知） → memory（记忆与隐私告知） → survey（称呼） → 进入对话
// ==========================================
export function useOnboarding({ strictPersistence = false }: { strictPersistence?: boolean } = {}) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profileError, setProfileError] = useState("");
  const profileRef = useRef(profile);

  const retryProfile = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      if (strictPersistence && (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))) throw new Error("用户状态格式错误");
      if (strictPersistence) {
        if ("onboardingCompleted" in parsed && typeof parsed.onboardingCompleted !== "boolean") throw new Error("用户状态格式错误");
        if ("memoryEnabled" in parsed && typeof parsed.memoryEnabled !== "boolean") throw new Error("用户状态格式错误");
        if ("nickname" in parsed && typeof parsed.nickname !== "string") throw new Error("用户状态格式错误");
        if ("onboardingStep" in parsed && !["welcome", "memory", "survey", "ready", "done"].includes(parsed.onboardingStep)) throw new Error("用户状态格式错误");
      }
      const next = { ...defaultProfile, ...parsed };
      profileRef.current = next;
      setProfile(next);
      setProfileError("");
    } catch {
      if (strictPersistence) setProfileError("浏览器未能读取用户状态，原状态没有被清除。请重试读取。");
    }
    setIsLoaded(true);
  }, [strictPersistence]);
  useEffect(() => {
    retryProfile();
    if (!strictPersistence) return;
    const changed = (event: StorageEvent) => { if (event.key === STORAGE_KEY) retryProfile(); };
    window.addEventListener("qm-profile-updated", retryProfile);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("qm-profile-updated", retryProfile);
      window.removeEventListener("storage", changed);
    };
  }, [retryProfile, strictPersistence]);

  const saveProfile = (updates: Partial<UserProfile>): boolean | undefined => {
    if (strictPersistence) {
      const next = { ...profileRef.current, ...updates, updatedAt: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        profileRef.current = next;
        setProfile(next);
        setProfileError("");
        window.dispatchEvent(new Event("qm-profile-updated"));
        return true;
      } catch {
        setProfileError("浏览器没有保存本次设置。原状态保留，请重试。");
        return false;
      }
    }
    setProfile((prev) => {
      const next = { ...prev, ...updates, updatedAt: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* 旧入口保持既有行为 */ }
      return next;
    });
  };

  // 当前步骤进度（3 步）
  const getStepProgress = () => {
    const step = profile.onboardingStep;
    if (step === "welcome") return 0;
    if (step === "memory") return 1;
    if (step === "survey") return 2;
    if (step === "ready" || step === "done") return 3;
    return 0;
  };

  // 总阶段数：身份告知 → 记忆与隐私 → 称呼 = 3
  const TOTAL_PHASES = 3;

  // === 步骤推进 ===
  const goToWelcome = () => saveProfile({ onboardingStep: "welcome" });
  const goToMemory = () => saveProfile({ onboardingStep: "memory" });
  const goToSurvey = () => saveProfile({ onboardingStep: "survey" });
  // goToReady 直接一步写完成态 done，避免依赖 effect 二次触发导致的"完成态未持久化"时序窗口
  const goToReady = () =>
    saveProfile({ onboardingStep: "done", onboardingCompleted: true });
  const completeOnboarding = () =>
    saveProfile({ onboardingStep: "done", onboardingCompleted: true });

  // 记忆设置：Plan B 默认开启本地记忆，保留接口兼容
  const enableMemory = () => saveProfile({ memoryEnabled: true });
  const disableMemory = () => saveProfile({ memoryEnabled: false });

  // 设置昵称
  const setNickname = (name: string) => {
    return saveProfile({
      nickname: name.trim() || undefined,
      nicknameType: name.trim() ? "input" : "you",
    });
  };

  // 单题作答
  const answerQuestion = (questionId: string, value: string | string[]) => {
    const updates: Partial<UserProfile> = {};
    switch (questionId) {
      case "nickname":
        updates.nickname = typeof value === "string" ? value : undefined;
        break;
      case "pronoun":
        updates.pronoun = typeof value === "string" ? value : undefined;
        break;
      case "concerns":
        updates.concerns = Array.isArray(value) ? value : undefined;
        break;
      case "gender":
        updates.genderIdentity = typeof value === "string" ? value : undefined;
        break;
      case "duration":
        updates.duration = typeof value === "string" ? value : undefined;
        break;
      case "preference":
        updates.preference = typeof value === "string" ? value : undefined;
        break;
      case "experience":
        updates.priorExperience = typeof value === "string" ? value : undefined;
        break;
      case "speech":
        updates.speechStyle = typeof value === "string" ? value : undefined;
        break;
    }
    saveProfile(updates);
  };

  // 重置
  const resetOnboarding = () => {
    saveProfile({
      ...defaultProfile,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return {
    profile,
    isLoaded,
    profileError,
    retryProfile,
    // 步骤
    getStepProgress,
    TOTAL_PHASES,
    // 导航
    goToWelcome,
    goToMemory,
    goToSurvey,
    goToReady,
    completeOnboarding,
    // 设置
    enableMemory,
    disableMemory,
    setNickname,
    answerQuestion,
    saveProfile,
    resetOnboarding,
    // 开场白
    getOpeningLine: () => getOpeningLine(profile),
  };
}
