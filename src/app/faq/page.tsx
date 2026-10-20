"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-layout";

/**
 * 常见问题页 v3.0
 * FAQ 手风琴组件，覆盖 4 大类：
 * - 咨询相关
 * - AI 相关
 * - 隐私相关
 * - 服务相关
 *
 * 全简体中文，不使用绝对化用语。
 */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

const faqCategories: FaqCategory[] = [
  // 1. 关于 QM 心理咨询中心
  {
    id: "about-qm",
    title: "关于 QM 心理咨询中心",
    items: [
      {
        question: "QM 是一家什么样的机构？",
        answer:
          "QM 上海酷儿心理咨询中心，是一家以多元文化视角理解不同人群心理经验的专业机构。我们的 slogan 是「生活没有标准答案」，意思是不把单一的人生脚本当成唯一正确的活法。我们关注多元性别群体，也欢迎所有在生活中感到困惑的人。",
      },
      {
        question: "QM 的地址和联系方式是什么？",
        answer:
          "线下地址在上海市静安区民立路 150 号。主热线是 15001930070，备用热线 13601658763，微信客服号是 queermental2。线上和线下咨询都可以预约，你可以先从网站体验 AI 服务，不一定一进来就要预约咨询。",
      },
      {
        question: "QM 的工作时间是怎样的？",
        answer:
          "我们的 24 小时心理援助热线 15001930070 全年无休，深夜也有人接。微信人工客服（queermental2）的对接时间为每天 12:00–24:00（中国时间）。如果遇到紧急情况，请直接拨打热线。",
      },
      {
        question: "QM 只服务 LGBTQ+ 吗？",
        answer:
          "不是的。QM 从多元性别社区成长起来，对 LGBTQ+ 议题有深入理解，但我们服务所有有心理需求的人。不管你是什么身份，只要你在关系、情绪、职业、自我认同等方面感到困扰，都可以来这里。",
      },
    ],
  },

  // 2. 关于 QM AI 与心理支持的边界
  {
    id: "ai-boundary",
    title: "关于 QM AI 与心理支持的边界",
    items: [
      {
        question: "QM AI 到底能帮我做什么？",
        answer:
          "AI 可以陪你梳理情绪、解释一些心理概念、推荐自助工具和知识文章，也能帮你做心理测评、引导你做情绪记录。它更像是一个随时在身边的心理陪伴伙伴，帮你在日常生活中多了解自己一点。",
      },
      {
        question: "AI 能替代真人心理师吗？",
        answer:
          "不能。AI 没有真实的情感体验，也无法建立真正的咨访关系，它可以提供陪伴和信息，但无法替代真人心理师的深度共情、专业评估和个性化治疗。如果你有深层的困扰，还是建议和真人心理师工作。",
      },
      {
        question: "AI 能给我诊断或开药吗？",
        answer:
          "绝对不能。AI 不具备医疗诊断资质，也不能提供任何药物建议。测评结果和 AI 的分析只能作为自我觉察的参考，不能当作诊断。如果你怀疑自己有心理方面的困扰，建议和专业心理师或精神科医生聊聊。",
      },
      {
        question: "什么情况下我应该找真人心理师而不是 AI？",
        answer: `如果你感到情绪持续低落或焦虑已经影响日常生活，经历了重大创伤，有自伤或自杀的念头，或者感觉自己"不对劲"但说不清楚，这些时候更适合找真人心理师。AI 适合日常的情绪梳理和自我探索，深层困扰还是专业关系更能帮到你。`,
      },
    ],
  },

  // 3. 关于 AI 聊天角色"小酷"
  {
    id: "xiaoku",
    title: '关于 AI 聊天角色"小酷"',
    items: [
      {
        question: "小酷是谁？能做什么？",
        answer:
          "小酷是你的心理陪伴伙伴，设计成一个温暖、不说教、会提问的倾听者。你可以把它当作一个安全的树洞，聊聊心情、梳理思绪，它会试着理解你，也会问一些帮助你更了解自己的问题。",
      },
      {
        question: "小酷和真人心理师有什么不一样？",
        answer: `小酷不是心理师，也不是医生。它不会给你诊断、不会开药，也不会说"你应该怎样"。它更像是一个愿意陪你说话、帮你整理思路的朋友，而真人心理师能提供更深层的专业支持和更真实的关系体验。`,
      },
      {
        question: "小酷能记住我们之前聊过的内容吗？",
        answer:
          "目前在这个体验版本里，小酷的对话记录只保存在你自己浏览器的本地存储中，不上传云端，也不会跨设备同步。也就是说，换一台设备或者清理浏览器数据，之前的对话就找不到了。",
      },
      {
        question: "和小酷聊天什么话题都可以说吗？",
        answer:
          "大部分心情和想法都可以和小酷分享，它会试着接住你。但如果涉及到严重的自伤、自杀念头，或者你正处于危机中，小酷会优先引导你联系 QM 的热线或紧急资源——因为那些时刻，真人的帮助比 AI 对话更重要。",
      },
    ],
  },

  // 4. 关于 AI 预约助理"小雪"
  {
    id: "xiaoxue",
    title: '关于 AI 预约助理"小雪"',
    items: [
      {
        question: "小雪是谁？她的作用是什么？",
        answer:
          "小雪是 AI 预约前置顾问，主要帮你在正式预约前梳理需求。她会收集一些基本信息，了解你想通过咨询解决什么，并生成一份情况摘要，后续由人工客服为你匹配合适的心理师。",
      },
      {
        question: "小雪能直接帮我预约好心理师吗？",
        answer:
          "目前还不行。小雪不查档期、不锁时段、不收付款、也不确认预约。她只负责收集信息并生成摘要，后续的具体预约还是需要你和客服或心理师助理对接完成。",
      },
      {
        question: "找小雪预约需要提供哪些信息？",
        answer:
          "必填的只有三项：你的预约目标、联系方式（如果你明确拒绝留联系方式也可以）、以及你所在的城市或时区。其他信息是可选的，你愿意说多少都可以。",
      },
      {
        question: "小雪会把我和小酷的聊天内容告诉心理师吗？",
        answer:
          "不会。从小酷转到小雪时，只会传递预约所必需的摘要信息，不会把创伤经历、性相关内容、梦境细节或第三方隐私等敏感信息带过去。这是我们特别在意的一条边界。",
      },
    ],
  },

  // 5. 关于情绪树洞
  {
    id: "emotion-treehole",
    title: "关于情绪树洞",
    items: [
      {
        question: "情绪树洞是什么？怎么用？",
        answer:
          "情绪树洞是一个日常情绪记录和自我对话的小空间。每天它会先问你几道选项式的关心问题，然后你可以写下当天的心情日记，最后 AI 会给你一封回信。它更像是一个陪你每天做情绪打卡的朋友。",
      },
      {
        question: "树洞的每日关心都问些什么？",
        answer:
          "每日关心包含 11 个维度、约 20 道题目，会从情绪状态、身体感受、睡眠、社交等多个角度了解你当天的情况。题目每天轮换，14 天内不会重复，还会根据你前一天的状态做一些跟进式的提问。",
      },
      {
        question: "我写在树洞里的内容别人能看到吗？",
        answer:
          "在目前的体验版本中，树洞的内容只存在你自己的浏览器本地，不上传到云端，也不会被其他人看到。它是你一个人的私密空间。当然，使用完后如果你清理了浏览器数据，内容也会一起消失。",
      },
      {
        question: '"昨日线索 follow-up" 是什么意思？',
        answer:
          "就是说如果你前一天提到了某件让你难过或纠结的事，第二天树洞会顺着这个线索再问问你今天感觉怎么样，像是一个记得你心事的朋友。它不会评判你，只是想知道你还好不好。",
      },
    ],
  },

  // 6. 关于心理测评
  {
    id: "assessment",
    title: "关于心理测评",
    items: [
      {
        question: "目前有哪些心理测评可以做？",
        answer:
          "我们上线了 7 套测评工具，包括 MBTI 性格测试、SCL-90 症状自评、霍兰德职业兴趣、阿德勒生活风格指数、多元智能、性别多元指数 GDI-48，还有 ADHD 筛查。你可以根据兴趣或需要选择。",
      },
      {
        question: "测评结果能当作心理诊断吗？",
        answer:
          "不能。这些测评是自我觉察的工具，帮助你更了解自己的某些特质或状态，但不能等同于专业诊断。比如 SCL-90 分数偏高不代表你就有某种心理疾病，它只是一个信号，值得你多关注自己，或者和专业人士聊聊。",
      },
      {
        question: "GDI-48 性别多元指数是什么？",
        answer:
          "GDI-48 是一套性别多元指数量表，共 48 道题，从多个维度探索一个人的性别认同、性别表达和性别体验。它不是用来给你贴标签的，而是帮你更细致地感知和理解自己的性别经验。",
      },
      {
        question: "做一次测评大概需要多长时间？",
        answer:
          "不同测评的时长不太一样，短的十几分钟，长的可能需要半小时左右。你可以找一个相对安静不被打扰的时间来做，按照自己真实的感受和第一反应回答就好，没有对错之分。",
      },
    ],
  },

  // 7. 关于知识库文章
  {
    id: "knowledge-base",
    title: "关于知识库文章",
    items: [
      {
        question: "知识库里有多少篇文章？都讲些什么？",
        answer:
          "目前知识库有 157 篇文章，按 15 个主题域分类，涵盖情绪管理、亲密关系、自我认同、职场心理、多元性别、家庭关系等多个方面。文章深浅不一，有的偏科普，有的会带你做一些小练习。",
      },
      {
        question: "这些文章是心理师写的吗？",
        answer:
          "知识库的文章由 QM 心理师团队和内容团队共同创作和审核，确保内容的专业性和可读性。不过文章是通用性质的心理科普，不能替代针对你个人情况的专业咨询。",
      },
      {
        question: "怎么找到我需要的文章？",
        answer:
          "你可以通过主题分类浏览，也可以用关键词搜索。如果不确定从哪里开始，可以先从你当下最关心的话题入手，比如情绪、关系或自我认同，读几篇之后往往会自然找到更深入的方向。",
      },
    ],
  },

  // 8. 关于自助工具
  {
    id: "self-help-tools",
    title: "关于自助工具",
    items: [
      {
        question: "自助工具有哪些类型？",
        answer:
          "目前有 40 个左右的自助工具，类型挺丰富的，比如呼吸练习、接地技术、各种主题的日记引导、情绪命名练习、认知调整卡片等等。每个工具都有明确的使用场景和步骤说明。",
      },
      {
        question: "自助工具真的能帮到我吗？",
        answer:
          "自助工具更像是你情绪急救箱里的小物件，在你感到焦虑、低落或慌乱的时候，可以拿出来用一用，帮你快速回到相对平稳的状态。它们不能解决深层问题，但在当下这一刻常常是有用的。",
      },
      {
        question: "自助工具和心理咨询有什么区别？",
        answer:
          "自助工具是你自己就可以操作的方法和练习，短平快，随时能用。而心理咨询是在一段专业关系里，和心理师一起探索和处理更深入的议题。两者可以搭配使用，日常用工具调节，深层的困扰交给咨询。",
      },
    ],
  },

  // 9. 关于预约真人心理咨询
  {
    id: "booking",
    title: "关于预约真人心理咨询",
    items: [
      {
        question: "怎么预约真人心理咨询？",
        answer:
          "你可以联系人工客服了解心理师与预约安排，也可以直接拨打我们的热线 15001930070，或者添加微信客服 queermental2 预约。微信人工客服 12:00–24:00（中国时间）会尽快回复你。",
      },
      {
        question: "预约后一般多久能安排上？",
        answer:
          "这取决于你选择的心理师档期，通常 3 到 7 天内可以安排到第一次咨询。如果你有比较紧急的需求，可以在预约时说明，我们会尽量帮你协调更早的时间。",
      },
      {
        question: "预约之后可以更改或取消吗？",
        answer:
          "可以的。一般来说，提前 24 小时以上取消或改期不产生费用。如果是临时取消，可能会有相关的扣费规则，具体可以在预约时和客服确认。心理师的时间也是提前预留的，互相理解就好。",
      },
      {
        question: "线上和线下咨询有什么区别？",
        answer:
          "线下咨询在上海市静安区民立路 150 号的咨询室进行，线上咨询通过视频进行，每次都是 60 分钟。两种形式各有特点，线下可能更有在场感，线上更方便灵活，你可以根据自己的偏好选择。",
      },
    ],
  },

  // 10. 关于心理师团队与费用
  {
    id: "therapists-fees",
    title: "关于心理师团队与费用",
    items: [
      {
        question: "QM 有多少位心理师？",
        answer:
          "QM 有多位签约心理师，每个人的受训背景和擅长方向不太一样。我们的心理师团队覆盖了精神分析、认知行为、人本主义、家庭治疗等多个流派，也都对多元性别议题有较深的理解。具体心理师信息可咨询人工客服。",
      },
      {
        question: "心理咨询的费用是怎么定的？",
        answer:
          "我们有 8 档价格，从 400 元到 1500 元不等，每节常规咨询 60 分钟。具体是 400、500、600、700、800、900、1200、1500 这八档。定价主要参考心理师的受训年限、临床经验和专业资质。",
      },
      {
        question: "不同价位的心理师有什么区别？",
        answer: `价格更多反映的是心理师的从业年限、受训深度和临床经验，而不是"好不好"或"有没有用"。很多时候，和你是否匹配比价格更重要。新手心理师同样接受专业训练，也在持续接受督导。`,
      },
      {
        question: "心理师都有什么资质？",
        answer:
          "我们的心理师都具备相关的专业受训背景，不少人持有国家二级心理咨询师资质，也有临床心理学硕士、注册系统心理师等不同背景。每位心理师都在持续接受督导和继续教育，确保专业水平。",
      },
    ],
  },

  // 11. 关于首次来访（新手必读）
  {
    id: "first-visit",
    title: "关于首次来访（新手必读）",
    items: [
      {
        question: "第一次做心理咨询，有点紧张怎么办？",
        answer:
          "第一次咨询感到紧张是很正常的，大多数人都会这样。你不用逼自己一上来就说最深的事，可以从你为什么来、最近的状态开始聊，节奏由你掌控。心理师会陪着你慢慢建立信任的。",
      },
      {
        question: "第一次咨询一般会聊些什么？",
        answer:
          "第一次更像是互相认识和评估的过程。心理师会了解你来咨询的原因、你目前的生活状态、过往经历等等，也会和你说明咨询的设置和边界。你也可以趁这个机会感受一下和这位心理师相处是否舒服。",
      },
      {
        question: "首次咨询有优惠吗？",
        answer:
          "有的。400 到 600 元档位的首次体验价是 299 或 499 元，700 到 900 元档位是 599 或 799 元，1500 元档位是 1200 或 1800 元。具体对应哪一档，可以在预约时和客服确认。",
      },
      {
        question: "怎么判断哪位心理师适合我？",
        answer:
          "可以先看看心理师的擅长方向和个人介绍，感受一下你对 ta 的文字和语气是否顺眼。不过更准确的判断，往往是聊过一次之后才知道——你是否愿意在 ta 面前说真话，是否感到被理解和被接住。",
      },
    ],
  },

  // 12. 关于多元性别/多元文化群体的特殊关切
  {
    id: "diversity",
    title: "关于多元性别/多元文化群体的特殊关切",
    items: [
      {
        question: "QM 对多元性别群体友好吗？",
        answer: `QM 本身就是一家从多元性别社区成长起来的机构，对 LGBTQ+ 群体的议题有深入的理解和共情。我们不会把性取向或性别认同本身当作"问题"来看待，而是陪伴你面对生活中因此带来的各种挑战。`,
      },
      {
        question: "我是跨性别 / 非二元，心理师懂这些吗？",
        answer:
          "QM 的心理师团队对跨性别、非二元等多元性别议题有系统的了解和临床经验。我们知道出柜、家庭关系、性别焦虑、医疗路径等议题的特殊性，也会尊重你的称谓和性别表达。",
      },
      {
        question: "咨询中会被评判我的性取向或性别认同吗？",
        answer: `不会的。在 QM，性取向和性别认同本身是多元的、正常的，不是需要被"治疗"或"纠正"的问题。我们关注的是你因为这些身份在生活中遇到的困扰，以及你想要怎样的生活。`,
      },
      {
        question: "有没有专门针对多元群体的资源？",
        answer:
          "有的。我们的知识库中有不少关于性别认同、性取向、出柜、亲密关系等主题的文章，也有针对性别探索的测评工具比如 GDI-48。你可以在知识库的多元性别分类下找到相关内容。",
      },
    ],
  },

  // 13. 关于隐私与数据安全
  {
    id: "privacy",
    title: "关于隐私与数据安全",
    items: [
      {
        question: "真人咨询的内容会被保密吗？",
        answer:
          "会的。心理咨询有严格的保密伦理，心理师不会把你在咨询中说的内容告诉任何人。你的咨询记录也会妥善保管，只有你本人授权后才会被调取。这是专业关系的基础，也是我们非常看重的底线。",
      },
      {
        question: "和 AI 聊天的数据会怎么处理？",
        answer:
          "目前的体验版本中，AI 对话内容只保存在你自己浏览器的本地存储里，不上传云端，也不会用于训练或其他用途。换句话说，数据的控制权在你手上，清理浏览器数据就一并清除了。",
      },
      {
        question: "我的 AI 对话记录会被工作人员看到吗？",
        answer:
          "不会。因为对话只存在你本地的浏览器中，QM 的工作人员是看不到的。这也意味着我们没法帮你找回丢失的对话记录，重要的内容建议你自己备份。",
      },
      {
        question: "什么情况下保密会有例外？",
        answer:
          "当你或他人的生命安全受到严重威胁时，比如有明确的自杀计划或伤害他人的计划，心理师可能需要打破保密来保护你或他人。除此之外，你的咨询内容都是严格保密的。这些设置也会在首次咨询时和你详细说明。",
      },
    ],
  },

  // 14. 关于危机与紧急情况
  {
    id: "crisis",
    title: "关于危机与紧急情况",
    items: [
      {
        question: "如果我正处于心理危机中，该怎么办？",
        answer:
          "如果你现在感觉很危险，请第一时间拨打 QM 的热线 15001930070 或备用热线 13601658763。如果是有自伤或自杀的紧急风险，也可以直接前往附近医院的急诊，或者拨打 120 急救电话。",
      },
      {
        question: "QM 有 24 小时危机热线吗？",
        answer:
          "有的。我们的 24 小时心理援助热线 15001930070 全年无休，深夜也有人接。备用热线 13601658763 同样 24 小时可用。你的安全是第一位的。",
      },
      {
        question: "AI 遇到我说有自杀念头会怎么处理？",
        answer:
          "当 AI 识别到你可能处于危机中时，它会暂停所有商业推荐和普通对话，优先引导你联系 QM 的心理热线。它也可能建议你联系身边信任的人，或者前往就近的医疗机构。因为生命安全比什么都重要。",
      },
      {
        question: "我朋友有自杀风险，我该怎么帮 ta？",
        answer:
          "首先请认真对待 ta 的表达，不要轻视或评判。你可以陪在 ta 身边，听 ta 说话，帮助 ta 联系专业资源，比如 QM 的热线、精神科医院或急救电话。如果情况很紧急，不要犹豫，直接带 ta 去最近的急诊。",
      },
    ],
  },

  // 15. 关于费用与支付
  {
    id: "payment",
    title: "关于费用与支付",
    items: [
      {
        question: "心理咨询怎么收费？怎么支付？",
        answer:
          "每节咨询 60 分钟，费用从 400 元到 1500 元分 8 档，具体取决于你选择的心理师。支付方式包括微信、支付宝等常见方式，预约时客服会和你说明具体的支付流程。",
      },
      {
        question: "有套餐或长期咨询的优惠吗？",
        answer:
          "有的，我们提供 5 小时卡和 10 小时卡，购买小时卡会有一定的价格优惠。如果你打算做比较长程的咨询，小时卡会比单次付费更划算一些。具体的优惠额度可以咨询客服。",
      },
      {
        question: "首次体验价是什么意思？",
        answer:
          "首次体验价是针对第一次来 QM 做咨询的朋友设置的优惠价格。不同档位优惠力度不一样，400 到 600 档首次是 299 或 499 元，700 到 900 档是 599 或 799 元，1500 档是 1200 或 1800 元。每位来访者享受一次首次优惠。",
      },
      {
        question: "临时取消预约会扣钱吗？",
        answer:
          "一般提前 24 小时以上取消或改期是不扣费的。如果距离咨询时间不足 24 小时临时取消，可能会按照一定比例扣除咨询费用。具体规则可以在预约时和客服确认，尽量提前安排就好。",
      },
    ],
  },

  // 16. 关于意见反馈与投诉
  {
    id: "feedback",
    title: "关于意见反馈与投诉",
    items: [
      {
        question: "我有意见或建议，怎么告诉你们？",
        answer:
          "非常欢迎你的反馈。你可以通过微信客服 queermental2 或热线电话 15001930070 联系我们。无论是产品体验、服务感受还是功能建议，我们都会认真看。",
      },
      {
        question: "如果对咨询不满意，可以投诉吗？",
        answer:
          "当然可以。如果你对咨询服务有任何不满意的地方，可以通过客服渠道投诉，我们会有专门的同事跟进处理。你的反馈对我们改进服务很重要，也会受到保密对待。",
      },
      {
        question: "提交反馈后，多久能收到回复？",
        answer:
          "我们会在工作日 48 小时内回复你。如果是比较复杂的问题，可能需要多一点时间调查和沟通，但一定会给你一个明确的答复。你的每一条反馈我们都会认真对待。",
      },
    ],
  },
];

function FaqAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`bg-white/70 border transition-all duration-300 ${
        isOpen
          ? "border-[#6B4C9A]/30 shadow-md shadow-[#6B4C9A]/5"
          : "border-[#E8DCD6]/50 hover:border-[#B794F4]/30"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 md:px-5 py-4 md:py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4C9A]/30 min-h-[52px]"
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-medium text-[#4A4A4A] leading-relaxed">
              {item.question}
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-[#9B8E8A] shrink-0 mt-0.5 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">
            <p className="text-sm text-[#6B5B52] leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <PageLayout title="常见问题" subtitle="快速了解咨询、AI、隐私与服务">
      <div className="space-y-10 md:space-y-12">
        {/* 页面导言 */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-xl md:text-2xl font-semibold text-[#4A4A4A]">
            常见问题
          </h2>
          <p className="text-sm text-[#7A6A62] leading-relaxed">
            这里整理了一些你可能想了解的问题。如果没有找到答案，
            可以联系微信客服 queermental2 或拨打热线 15001930070。
          </p>
        </div>

        {/* FAQ 分类 */}
        {faqCategories.filter((category) => category.id !== "xiaoxue").map((category) => (
          <div key={category.id} className="space-y-3">
            <h2 className="text-sm font-semibold text-[#6B4C9A] px-1">
              {category.title}
            </h2>
            <div className="space-y-2 md:space-y-3">
              {category.items.map((item, idx) => (
                <FaqAccordion
                  key={idx}
                  item={item}
                  isOpen={openItems.has(`${category.id}-${idx}`)}
                  onToggle={() => toggleItem(category.id, idx)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* 底部联系提示 */}
        <div className="bg-gradient-to-br from-[#B794F4]/10 to-[#F687B3]/10 rounded-2xl p-6 md:p-8 border border-[#B794F4]/20 text-center space-y-4">
          <h3 className="text-base md:text-lg font-semibold text-[#4A4A4A]">
            还有其他问题？
          </h3>
          <p className="text-sm text-[#6B5B52] leading-relaxed">
            你可以通过微信客服或热线联系我们，工作时间内我们会尽快回复。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="tel:15001930070"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B4C9A] text-white text-sm font-medium rounded-xl hover:bg-[#5A3D8A] transition-colors min-h-[44px]"
            >
              拨打热线 15001930070
            </a>
            <span className="text-xs text-[#9B8E8A] sm:hidden">或</span>
            <div className="text-sm text-[#7A6A62]">
              微信客服：<span className="font-medium text-[#6B4C9A]">queermental2</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
