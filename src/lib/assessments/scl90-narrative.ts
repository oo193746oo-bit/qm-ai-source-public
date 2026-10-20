// SCL-90 叙事内容库
// 所有文本均为用户视角描述，非诊断、非标签
// 严格遵守：假设语言（可能/也许/值得留意）、不点名疾病、疗法仅作讨论方向

import { FactorResult, getNarrativeTier } from './scl90-scoring';

export interface FactorNarrative {
  whatItMayFeelLike: string;
  inDailyLife: string;
  whatToNotice: string;
}

export interface FactorNarrativeBundle {
  low: FactorNarrative;
  mid: FactorNarrative;
  high: FactorNarrative;
}

// 10 因子 × 3 档 叙事内容
// 全部使用假设语言，不使用疾病标签
const factorNarratives: Record<string, FactorNarrativeBundle> = {
  F1: {
    // 躯体化
    low: {
      whatItMayFeelLike:
        '你最近的身体状态相对平稳，没有太多不明原因的身体不适感。这说明你的身心连接此刻处于相对协调的状态。',
      inDailyLife:
        '日常工作和生活中，你不太会被头痛、胃不舒服、肌肉酸痛这类身体感受打断节奏，睡眠和精力也比较稳定。',
      whatToNotice:
        '可以继续留意身体发出的细微信号，比如疲劳时是否能及时休息、压力来临时身体第一反应是什么。身体的感受是情绪最早的信使。',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能会时不时感到一些身体上的不适，比如头痛、腰酸、胃不舒服或者容易累。这些感受时轻时重，有时会让你担心自己的身体状况。',
      inDailyLife:
        '在压力大或休息不好的时候，身体的不适感会更明显；放松下来又会减轻一些。你可能会反复检查或担心，但检查结果又常常没什么大问题。',
      whatToNotice:
        '值得观察的是：这些身体感受通常在什么情境下出现或加重？它们和你的情绪、压力、睡眠有没有关联？也许身体正在用它的方式提醒你关注自己。',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能经常感到各种身体不适，比如持续的头痛、胸闷、胃部不适、肌肉酸痛或者乏力。这些感受可能已经影响到你的日常生活，让你忍不住担心自己的健康。',
      inDailyLife:
        '身体的不舒服可能让你很难集中精力工作或学习，有时候甚至需要躺下休息。你可能反复去医院检查，但结果又找不到明确的生理原因，这会让你更加困扰和焦虑。',
      whatToNotice:
        '值得认真观察的是，这些身体感受和你的情绪状态、压力水平、生活事件之间有没有联系？很多时候，身体会先于语言替我们表达那些说不出口的情绪和压力。可以和心理咨询师一起探索身心之间的关系。',
    },
  },
  F2: {
    // 强迫症状
    low: {
      whatItMayFeelLike:
        '你最近的思绪和行为相对自由，不太会被反复出现的念头或必须做某些事的冲动所困扰。',
      inDailyLife:
        '做事情比较能够顺其自然，做完了就放下。不会反复检查、反复确认，也不会被一些无意义的想法占住脑子。',
      whatToNotice:
        '可以继续保持这种"允许不完美"的状态。当偶尔出现强迫念头时，注意你是怎么和它相处的——也许你已经有一套适合自己的调节方式。',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能会有些反复出现的想法或行为，比如反复检查门有没有锁、事情有没有做对，或者脑子里有些停不下来的念头。虽然不算严重，但会消耗一些精力。',
      inDailyLife:
        '做决定可能会有点犹豫，总担心不够完美或者遗漏了什么。有时候会觉得脑子"卡壳"，注意力不太容易集中。',
      whatToNotice:
        '可以观察一下：这些反复的念头或行为，通常在你压力大、焦虑或者累的时候更容易出现吗？它们有没有在试图保护你、帮你规避某种"不够好"的恐惧？',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能被一些反复出现的想法、画面或冲动所困扰，明知没有必要但很难控制。可能还会有一些反复的行为，比如反复洗手、检查、计数，或者脑子里不断重复某句话。',
      inDailyLife:
        '这些念头和行为可能已经占用了很多时间和精力，影响到你的工作、学习和人际关系。你可能试过反抗，但越控制越强烈，最后反而更焦虑。',
      whatToNotice:
        '值得认真看待的是，这些反复的念头和行为可能是内心焦虑的一种表达方式。它们不是你的错，也不代表你"有问题"。可以考虑和专业的心理咨询师一起工作，了解这些症状背后的意义，学习更灵活的应对方式。',
    },
  },
  F3: {
    // 人际关系敏感
    low: {
      whatItMayFeelLike:
        '你在人际关系中相对自在，不太容易因为别人的反应而过度思考或自责。',
      inDailyLife:
        '和人相处时你比较能够做自己，不会过度在意别人怎么看你。遇到矛盾或不同意见时，也能比较客观地看待。',
      whatToNotice:
        '可以留意：在什么样的关系或情境下，你仍然会感到敏感或不自在？那些时刻可能触及了你内心深处某个需要被看见的部分。',
    },
    mid: {
      whatItMayFeelLike:
        '你在人际关系中可能会有些敏感，容易觉得别人在评价你、不喜欢你，或者感觉自己比不上别人。有时候别人一句无心的话，你可能会想很久。',
      inDailyLife:
        '在人群中或者社交场合，你可能会有点不自在，担心自己表现不够好。和别人发生冲突或被批评时，容易往心里去，甚至怀疑是不是自己的问题。',
      whatToNotice:
        '可以观察一下：你对自己的评价，和别人对你的看法，是不是一样的？很多时候，我们以为的"别人怎么看我"，其实是"我怎么看自己"的投射。值得温柔地看看那个容易受伤的自己。',
    },
    high: {
      whatItMayFeelLike:
        '你在人际关系中可能非常敏感，经常觉得别人不理解你、不喜欢你，或者感到自己和别人不一样、格格不入。别人的一个眼神、一句话，都可能让你难受很久。',
      inDailyLife:
        '你可能会尽量避免社交场合，因为在人群中会感到紧张、不自在。即使和熟悉的人在一起，也常常担心自己说错话、做错事，或者觉得被排斥、被孤立。',
      whatToNotice:
        '值得认真看待的是，这种敏感可能源于过去某些被忽视、被否定或被排斥的经历。它不是你的性格缺陷，而是你内心深处渴望被看见、被接纳的信号。和心理咨询师一起探索，可以帮助你建立更稳固的自我价值感。',
    },
  },
  F4: {
    // 抑郁
    low: {
      whatItMayFeelLike:
        '你最近的情绪状态相对平稳，对生活仍然保有兴趣和活力。',
      inDailyLife:
        '日常的事情对你来说不算太难，你还能从喜欢的事情里获得愉悦感。睡眠、食欲和精力也基本正常。',
      whatToNotice:
        '可以继续保持和自己情绪的连接。即使状态好的时候，也可以留意：有哪些人和事在滋养着你？你是怎么让自己保持相对稳定的？',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能有些情绪低落，提不起劲，对以前喜欢的事情也兴趣减退了。有时候会感到疲倦、空虚，或者忍不住自责。',
      inDailyLife:
        '你可能睡得不太好，或者睡得太多；食欲也可能有变化。做事情比以前费力，效率下降，有时候会觉得"什么都不想做"。和人相处也容易感到疲惫。',
      whatToNotice:
        '可以观察一下：这种低落的状态持续多久了？它和你生活中的某些变化、压力或失落有没有关系？情绪低落是心灵发出的信号，提醒你可能需要慢下来、照顾一下自己。',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能深陷在低落、空虚或绝望的感受里，对几乎所有事情都失去了兴趣。你可能感到非常疲惫，觉得自己没有价值，甚至会想到死亡或结束生命。',
      inDailyLife:
        '睡眠和食欲可能严重紊乱，精力极度匮乏，连简单的日常事情都变得很困难。你可能把自己封闭起来，不和人来往，或者在别人面前假装没事，但内心已经撑得很辛苦了。',
      whatToNotice:
        '你现在可能正在经历一段非常艰难的时期。请一定记得：这些感受不是你的错，也不代表你就是这样的人——它只是你此刻正在经历的状态。如果你有伤害自己的想法，请立即联系 QM 心理援助热线 15001930070，或者告诉你身边信任的人。你值得被帮助，也值得好好活下去。',
    },
  },
  F5: {
    // 焦虑
    low: {
      whatItMayFeelLike:
        '你最近的情绪比较平静，不太容易紧张或担心。面对事情时相对从容。',
      inDailyLife:
        '日常工作和生活中，你比较能够放松下来。即使遇到压力，也能比较快地调整好。不会因为担心未来而影响当下的状态。',
      whatToNotice:
        '可以留意：你平时是怎么让自己保持放松和平静的？有哪些习惯或方法在帮助你维持内心的稳定？这些都是你的内在资源。',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能经常感到紧张、担心，心里像揣着一块石头。有时候会心跳加速、手心出汗，或者脑子里有很多停不下来的念头。',
      inDailyLife:
        '你可能对很多事情都感到担忧，比如工作、健康、关系等等。晚上躺在床上，脑子也静不下来。有时候会突然感到一阵心慌或害怕，不知道为什么。',
      whatToNotice:
        '可以观察一下：你的焦虑通常和什么有关？是对未来的不确定、对失控的恐惧，还是对自己的高要求？焦虑不是敌人，它是在提醒你：有什么重要的事情需要你关注了。',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能被强烈的焦虑和恐惧所笼罩，经常感到心慌、紧张、坐立不安，甚至有濒死感或失控感。脑子里充满了各种担心，停不下来。',
      inDailyLife:
        '焦虑可能已经严重影响了你的睡眠、食欲和日常生活。你可能会回避很多事情和场合，因为害怕会引发焦虑发作。有时候会突然感到极度恐惧，伴随心跳加速、呼吸困难、出汗等身体反应。',
      whatToNotice:
        '你正在经历的焦虑可能非常强烈和真实，但请相信：这些感受是可以被理解和处理的。焦虑不是你的性格缺陷，而是你的身心在试图保护你。建议你寻求专业的心理咨询帮助，学习理解和应对焦虑的方法。如果焦虑发作让你感到非常危险，请及时联系医疗或心理支持。',
    },
  },
  F6: {
    // 敌对
    low: {
      whatItMayFeelLike:
        '你最近的情绪比较平和，不容易生气或发怒。和人相处时也比较能够包容和理解。',
      inDailyLife:
        '遇到不顺心的事，你相对能够冷静处理，不会轻易被激怒。和人有分歧时，也能以比较平和的方式沟通。',
      whatToNotice:
        '可以留意：你是怎么处理自己的愤怒和不满的？你有健康的出口吗？愤怒也是一种重要的情绪，它在告诉你：你的边界在哪里、什么对你很重要。',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能比较容易烦躁、生气，有时候会忍不住和人争执。心里好像憋着一股火，一点小事就可能被点燃。',
      inDailyLife:
        '工作或生活中遇到挫折时，你可能更容易发脾气，或者在心里反复想那些让你不爽的事。有时候发完脾气又会后悔，但下次还是忍不住。',
      whatToNotice:
        '可以观察一下：你的愤怒通常指向什么人或什么事？它背后有没有被掩盖的受伤、委屈或者害怕？愤怒有时候是保护脆弱内心的铠甲，值得去看看铠甲下面藏着什么。',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能经常感到强烈的愤怒和敌意，忍不住想摔东西、打人或者和人争吵。这些冲动让你感到害怕，也可能伤害到你在乎的人。',
      inDailyLife:
        '你可能经常和人发生冲突，或者在心里酝酿报复性的想法。情绪上来的时候很难控制，事后又会后悔和自责。这种反复的模式可能已经影响了你的人际关系和生活。',
      whatToNotice:
        '强烈的愤怒和敌对情绪，往往背后藏着很深的受伤、无助或者不被看见的痛苦。这些情绪本身不是错，但如果它们已经失控并伤害到你或他人，值得认真对待。可以考虑和心理咨询师一起探索这些愤怒的来源，学习更健康的表达和调节方式。',
    },
  },
  F7: {
    // 恐怖
    low: {
      whatItMayFeelLike:
        '你最近没有太多明显的恐惧情绪，大部分场合都能比较自在地待着。',
      inDailyLife:
        '出门、坐车、去人多的地方，对你来说都不是太大的问题。你不会因为害怕而回避正常的活动。',
      whatToNotice:
        '可以留意：有没有什么特定的场景或事物，虽然不严重，但还是会让你有点不舒服？那些轻微的害怕背后，可能有你过去的某些经历在影响你。',
    },
    mid: {
      whatItMayFeelLike:
        '你可能对某些特定的场景或事物感到害怕，比如空旷的地方、人多的场合、乘坐公共交通，或者害怕独自出门。虽然还能勉强应对，但心里会很紧张。',
      inDailyLife:
        '你可能会尽量回避那些让你害怕的场合，有时候为了不面对甚至会找借口不去。真的不得不去的时候，会感到心跳加速、紧张不安，只想尽快离开。',
      whatToNotice:
        '可以观察一下：你害怕的这些场景，有没有什么共同点？它们和你过去的某些经历有没有关联？恐惧是一种保护机制——它在试图让你远离危险，但有时候它也会过度保护，限制了你的生活。',
    },
    high: {
      whatItMayFeelLike:
        '你可能被强烈的恐惧所困扰，对某些场景或事物产生极度的害怕和回避。一想到要面对这些场景，就会感到极度焦虑甚至惊恐发作。',
      inDailyLife:
        '为了避免恐惧，你可能已经大大缩小了自己的活动范围。不敢出门、不敢坐车、不敢去人多的地方，甚至不敢一个人待着。这可能已经严重影响了你的工作、学习和正常生活。',
      whatToNotice:
        '这些强烈的恐惧虽然让你痛苦，但它们并不是你的弱点——它们是你的身心在试图保护你，只是保护的方式有些过度了。专业的心理咨询可以帮助你逐步理解和面对这些恐惧，慢慢重新找回生活的自由度。',
    },
  },
  F8: {
    // 偏执
    low: {
      whatItMayFeelLike:
        '你对他人和世界的看法相对开放和信任，不容易产生怀疑或猜忌。',
      inDailyLife:
        '和人相处时，你比较愿意相信别人的善意。遇到事情也能从多个角度去理解，不会固执地认定某种想法。',
      whatToNotice:
        '可以留意：在什么情况下，你也会产生怀疑或者不信任的感觉？那些时刻可能触及了你过去某些受伤的经历。',
    },
    mid: {
      whatItMayFeelLike:
        '你可能对他人有一些防备和不信任，总觉得别人在议论你、针对你，或者想占你便宜。有时候会觉得别人的评价不公正，心里很不舒服。',
      inDailyLife:
        '在人群中，你可能会忍不住观察别人的反应，怀疑他们是不是在说你的坏话。和人相处时也容易往坏处想，觉得别人的动机不纯。',
      whatToNotice:
        '可以观察一下：你对他人的这些怀疑，有多少是有真凭实据的，又有多少是你自己的推测？过去有没有什么经历，让你形成了"别人不可信"的想法？也许保护自己的同时，也让你错过了一些真实的连接。',
    },
    high: {
      whatItMayFeelLike:
        '你可能深感周围的人都不可信，甚至觉得有人在监视你、跟踪你、迫害你。这些想法让你非常警惕和不安，很难和人建立真正的信任。',
      inDailyLife:
        '你可能经常和人发生误会或冲突，因为你总觉得别人在针对你。你可能会收集各种"证据"来证明自己的想法，但别人看来可能并不成立。这让你感到孤独和不被理解。',
      whatToNotice:
        '如果你经常有强烈的被监视、被迫害的感觉，并且这些想法已经影响了你的日常生活和人际关系，建议你寻求专业的评估和帮助。这些感受可能有复杂的原因，专业人士可以帮助你更好地理解和应对。请记得：寻求帮助不代表你"疯了"，而是你在认真对待自己的感受。',
    },
  },
  F9: {
    // 精神病性
    low: {
      whatItMayFeelLike:
        '你最近的思维和感知相对清晰稳定，和现实的连接也比较好。',
      inDailyLife:
        '你能够清楚地区分想象和现实，也能感受到和他人之间的连接。你的想法、感受和行为之间是协调的。',
      whatToNotice:
        '可以留意：在什么状态下（比如极度疲惫、压力很大的时候），你也会有一些不寻常的体验？那些体验告诉你什么？',
    },
    mid: {
      whatItMayFeelLike:
        '你可能偶尔会有一些不寻常的体验或想法，比如感觉周围的事物不太真实，或者有一些不属于自己的念头冒出来。这些体验让你有点困惑和担心。',
      inDailyLife:
        '你可能有时候会觉得和别人之间有一层隔膜，难以真正亲近。或者会有一些奇怪的想法，明知道不合理但还是会冒出来，让你自己也觉得困扰。',
      whatToNotice:
        '可以观察一下：这些不寻常的体验通常在什么情况下出现？它们和你的压力水平、睡眠状态有没有关系？很多时候，这些体验是身心在极度疲惫或压力下的一种反应，值得温柔地关注。',
    },
    high: {
      whatItMayFeelLike:
        '你可能经常有一些不寻常的思维和感知体验，比如听到别人听不到的声音、觉得别人能控制你的思想、感到周围的世界不真实，或者有一些不属于自己的奇怪想法。这些体验让你感到害怕、困惑和孤独。',
      inDailyLife:
        '这些体验可能已经影响了你的日常生活和人际关系。你可能觉得别人无法理解你，也不敢告诉别人你的真实感受，怕被当成"疯子"。你可能越来越封闭自己，独自承受这些痛苦。',
      whatToNotice:
        '你正在经历的这些感受可能非常真实和强烈，但请一定知道：你不是一个人。这些体验有很多可能的原因，专业人士可以帮助你理解和应对。建议你尽快寻求精神科评估和心理咨询支持。寻求帮助是勇敢的表现，不是软弱。',
    },
  },
  F10: {
    // 其他
    low: {
      whatItMayFeelLike:
        '你最近的睡眠、饮食等基本生活状态相对稳定，整体生活节奏比较规律。',
      inDailyLife:
        '睡眠质量还不错，食欲也正常，日常生活的基本功能运转良好。你能够比较好地照顾自己。',
      whatToNotice:
        '可以继续保持对自己基本需求的关注——睡得好不好、吃得香不香、有没有好好休息。这些都是身心健康的基础。',
    },
    mid: {
      whatItMayFeelLike:
        '你最近可能在睡眠或饮食方面有些困扰，比如入睡困难、睡得不深、醒得太早，或者胃口变化、吃得太多或太少。',
      inDailyLife:
        '睡眠不好可能会影响你白天的精力和情绪，饮食的变化也可能和你的情绪状态有关。你可能还会想到一些关于生命和死亡的问题，感到一些存在性的困惑。',
      whatToNotice:
        '可以观察一下：睡眠和饮食的变化，和你最近的情绪、压力有没有关系？它们往往是身心状态最直接的晴雨表。关于生命的思考也不是坏事——它可能在提醒你重新审视什么对你真正重要。',
    },
    high: {
      whatItMayFeelLike:
        '你最近可能在睡眠、饮食等方面有比较严重的困扰，可能还会频繁想到死亡、觉得自己有罪，或者感到整个人都不对劲。这些感受让你非常痛苦。',
      inDailyLife:
        '严重的睡眠或饮食问题可能已经影响了你的身体状态和日常生活。关于死亡或罪疚的想法可能反复出现，让你感到绝望和无助。你可能觉得自己"有问题"，但又不知道该怎么办。',
      whatToNotice:
        '你正在经历的这些困扰，可能是深层情绪压力的表现。它们不是你的错，也不代表你"不行"。如果你有伤害自己的想法，请立即拨打 QM 心理援助热线 15001930070。也建议你寻求专业的心理咨询或医疗评估，你值得被好好对待。',
    },
  },
};

export interface FactorStory {
  factorCode: string;
  factorName: string;
  tier: 'low' | 'mid' | 'high'; // 叙事档位
  mean: number;
  narrative: FactorNarrative;
}

/**
 * 为每个因子生成对应的叙事文本
 * @param factorResults 各因子得分结果
 * @returns 每个因子的档级和叙事
 */
export function buildFactorStories(factorResults: FactorResult[]): FactorStory[] {
  return factorResults.map((fr) => {
    const tier = getNarrativeTier(fr.mean);
    const bundle = factorNarratives[fr.factorCode];
    return {
      factorCode: fr.factorCode,
      factorName: fr.factorName,
      tier,
      mean: fr.mean,
      narrative: bundle[tier],
    };
  });
}

/**
 * 多因子联合叙事 — 基于 top factors 生成整合成像
 * 使用假设语言，不做确定性因果判断
 */
export function buildCombinedStory(factorStories: FactorStory[]): string {
  const sorted = [...factorStories].sort((a, b) => b.mean - a.mean);
  const topFactors = sorted.filter((s) => s.tier !== 'low').slice(0, 4);

  if (topFactors.length === 0) {
    return '从整体来看，你目前的身心状态相对平稳。各个维度的感受都在较轻的范围内，说明你此刻的生活节奏和心理资源处于相对协调的状态。这本身就是值得珍惜和看见的。可以继续保持对自己的关注，在状态好的时候，也是了解自己、积累资源的好时机。';
  }

  const topNames = topFactors.map((f) => f.factorName).join('、');
  let story = `从整体画像来看，你目前在${topNames}等方面的感受相对明显一些。`;

  const topCodes = topFactors.map((f) => f.factorCode);

  if (topCodes.includes('F4') && topCodes.includes('F5')) {
    story += ' 抑郁和焦虑常常相伴出现——低落的情绪会让人更担心未来，而持续的担忧又会消耗精力、加深疲惫感。';
  } else if (topCodes.includes('F4')) {
    story += ' 情绪低落的时候，人往往会感到精力下降、兴趣减退，甚至觉得自己没有价值。';
  } else if (topCodes.includes('F5')) {
    story += ' 焦虑感比较明显的时候，人会处于一种持续的紧张和警觉状态，这会消耗很多心理能量。';
  }

  if (topCodes.includes('F1') && (topCodes.includes('F4') || topCodes.includes('F5'))) {
    story += ' 同时，躯体上的不适感可能和情绪状态有关——当我们承受太多压力和情绪时，身体常常会先一步替我们"说话"。';
  }

  if (topCodes.includes('F2') && topCodes.includes('F5')) {
    story += ' 强迫性的念头或行为，往往和焦虑感有关——当内心的焦虑无法直接表达时，可能会通过反复的想法或动作来试图获得控制感。';
  }

  if (topCodes.includes('F3') && (topCodes.includes('F4') || topCodes.includes('F8'))) {
    story += ' 人际关系中的敏感和不信任，可能会让你更难从他人那里获得支持，而孤独感又可能反过来加重情绪上的困扰。';
  }

  if (topCodes.includes('F6')) {
    story += ' 敌对或易怒的感受，有时候是内心受伤或无助的另一种表达——愤怒可以保护我们暂时不感受到那些更脆弱的部分。';
  }

  story +=
    ' 这些维度之间可能相互影响、彼此关联，但具体是怎样的机制，还需要结合你个人的经历和当下的处境来理解。也许这些感受正在提醒你：有些东西需要被看见、被认真对待了。';

  return story;
}

/**
 * 小酷心理耳语 — SCL-90 版本
 * 固定四段：我看见 → 我怎么理解 → 需要认真看一眼的地方 → 一个问题
 * 注意：高风险时禁用文学化耳语，改用安全覆盖
 */
export function buildWhisper(
  factorStories: FactorStory[],
  totalMean: number
): {
  iSee: string;
  iUnderstand: string;
  lookCloser: string;
  oneQuestion: string;
} {
  const sorted = [...factorStories].sort((a, b) => b.mean - a.mean);
  const topOne = sorted[0];
  const topTwo = sorted[1];

  let iSee = `我看见你最近在「${topOne.factorName}」这个维度上感受比较明显。`;
  if (topTwo && topTwo.tier !== 'low') {
    iSee += `同时，「${topTwo.factorName}」也让你有一些体会。`;
  }
  iSee += ' 这些感受可能在你的身体里、情绪里，或者在你和别人的相处中，留下了印记。';

  const iUnderstand =
    '我想，每一种强烈的感受都不是凭空出现的。它们也许是你内心发出的信号，告诉你：有些东西需要被关注了。这不是你"不够好"或者"有问题"，而是你作为一个完整的人，在真实地回应着你的生活。';

  const lookCloser = `值得认真看一眼的是：你这些「${topOne.factorName}」的感受，通常在什么时候会更强烈？在什么人面前、什么情境下会出现？又有哪些时候，它们会稍微轻一些？那些变化的瞬间，可能藏着理解自己的钥匙。`;

  const oneQuestion = '如果你的这些感受会说话，你觉得它最想告诉你什么？';

  return { iSee, iUnderstand, lookCloser, oneQuestion };
}

// 生活场景镜像（Life Scene Mirror）
export interface LifeScene {
  area: string;
  description: string;
}

/**
 * 根据因子画像生成匿名生活场景镜像
 * 六个领域：工作/学习、关系、身体、睡眠饮食、日常功能、自我照顾
 */
export function buildLifeScenes(factorStories: FactorStory[]): LifeScene[] {
  const scenes: LifeScene[] = [];
  const factorMap = new Map(factorStories.map((s) => [s.factorCode, s]));

  // 工作/学习
  const f2 = factorMap.get('F2');
  const f5 = factorMap.get('F5');
  const f4 = factorMap.get('F4');
  let workText = '你在工作或学习中，可能会有自己的节奏和方式。';
  if (f2 && f2.tier !== 'low')
    workText =
      '在工作或学习中，你可能会反复检查、担心出错，做决定也比较犹豫。任务一多就容易感到压力大，担心自己做不好。';
  else if (f4 && f4.tier !== 'low')
    workText =
      '工作或学习对你来说可能有些吃力。你可能感到精力不足、难以集中注意力，完成日常任务都需要付出额外的努力。';
  else if (f5 && f5.tier !== 'low')
    workText =
      '工作或学习中可能经常感到紧张和焦虑，担心完不成任务、担心出错。deadline 或压力大的时候，焦虑感会更明显。';
  scenes.push({ area: '工作／学习', description: workText });

  // 关系
  const f3 = factorMap.get('F3');
  const f6 = factorMap.get('F6');
  let relationText = '在人际关系中，你有自己的相处方式。';
  if (f3 && f3.tier !== 'low')
    relationText =
      '在人际关系里，你可能比较敏感，容易觉得别人不喜欢你或不理解你。有时候为了避免受伤，你可能会主动和人保持距离。';
  else if (f6 && f6.tier !== 'low')
    relationText =
      '在关系中，你可能容易生气或和人发生冲突。有时候明明在乎对方，但说出来的话却带着刺，事后又会后悔。';
  scenes.push({ area: '关系', description: relationText });

  // 身体
  const f1 = factorMap.get('F1');
  let bodyText = '身体是你的家，也是你感受世界的入口。';
  if (f1 && f1.tier !== 'low')
    bodyText =
      '你的身体可能经常会有各种不适感——头痛、胃痛、腰酸、胸闷等等。你可能已经习惯了和这些不舒服共处，但它们也在提醒你：需要慢下来，听听身体在说什么。';
  scenes.push({ area: '身体', description: bodyText });

  // 睡眠饮食
  const f10 = factorMap.get('F10');
  let sleepText = '睡眠和饮食是你最基本的自我照顾。';
  if (f10 && f10.tier !== 'low')
    sleepText =
      '睡眠和饮食可能是你目前比较受影响的部分。入睡困难、睡得浅、醒得早，或者胃口变化——这些都是身心状态最直接的反馈。';
  else if (f4 && f4.tier !== 'low')
    sleepText =
      '情绪低落的时候，睡眠和饮食往往也会受到影响。可能睡得太多或太少，吃得太多或太少，身体和情绪是连在一起的。';
  scenes.push({ area: '睡眠饮食', description: sleepText });

  // 日常功能
  const f9 = factorMap.get('F9');
  let functionText = '你在努力维持着日常生活的运转。';
  if (f4 && f4.tier === 'high')
    functionText =
      '你可能感到日常的事情都变得很困难——起床、出门、见人、完成基本的事务。请一定知道：这不是你懒或不够努力，而是你此刻正处于一个比较艰难的状态。';
  else if (f9 && f9.tier !== 'low')
    functionText =
      '当你的思维或感知有一些不寻常的体验时，日常功能可能会受到影响。你可能比别人更努力才能维持基本的生活节奏。';
  scenes.push({ area: '日常功能', description: functionText });

  // 自我照顾
  let selfCareText = '自我照顾不是奢侈，是必需品。';
  if (f4 && f4.tier !== 'low')
    selfCareText =
      '你可能已经很久没有好好照顾自己了。当情绪低落的时候，连吃饭、洗澡、出门这些基本的自我照顾都会变得很困难。但请记得：照顾好你自己，是一切的起点。';
  else if (f5 && f5.tier !== 'low')
    selfCareText =
      '焦虑的时候，你可能忘记了要怎么放松和照顾自己。但你的身心需要定期的休息和滋养。哪怕是深呼吸五分钟、喝一杯温水，也是对自己的照顾。';
  scenes.push({ area: '自我照顾', description: selfCareText });

  return scenes;
}

// 专业支持方向
export interface SupportDirection {
  howToSay: string;
  discussionTopics: string[];
  whenToConsiderMedical: string;
}

/**
 * 生成专业支持方向建议
 * 注意：不自动指定治疗方案或疗法名称作为处方
 */
export function buildSupportDirection(factorStories: FactorStory[]): SupportDirection {
  const sorted = [...factorStories].sort((a, b) => b.mean - a.mean);
  const topFactors = sorted.filter((s) => s.tier !== 'low');
  const topNames = topFactors.slice(0, 3).map((f) => f.factorName).join('、');

  const howToSay = `"我最近在${
    topNames || '身心状态'
  }方面感受比较明显，想和你聊聊这些感受是怎么回事，以及我可以怎么更好地照顾自己。"`;

  const discussionTopics: string[] = [
    '这些感受从什么时候开始的，当时发生了什么',
    '哪些情境会让这些感受加重或减轻',
    '这些感受如何影响了你的日常生活和人际关系',
  ];

  const topCodes = topFactors.map((f) => f.factorCode);
  if (topCodes.includes('F4')) {
    discussionTopics.push('你低落的时候通常会做什么，有没有人可以支持你');
  }
  if (topCodes.includes('F5')) {
    discussionTopics.push('焦虑发作的时候你怎么应对，有没有让你感到安全的方法');
  }
  if (topCodes.includes('F9') || topCodes.includes('F8')) {
    discussionTopics.push('这些不寻常的想法或体验是怎样的，它们在什么时候会出现');
  }
  if (topCodes.includes('F1')) {
    discussionTopics.push('身体的不适感和你的情绪、压力之间有什么关联');
  }

  const whenToConsiderMedical =
    '如果你有以下情况，可以考虑去精神科或心理科做一次专业评估：（1）症状持续两周以上，且没有明显缓解的趋势；（2）症状已经严重影响了你的睡眠、饮食、工作或人际关系；（3）你出现了伤害自己或他人的想法；（4）你有一些别人无法理解的感知或想法，并且感到很困扰。';

  return {
    howToSay,
    discussionTopics: discussionTopics.slice(0, 4),
    whenToConsiderMedical,
  };
}

export { factorNarratives };
