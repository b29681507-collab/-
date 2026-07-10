import type {
  CharacterCandidate,
  MemoryAsset,
  MemoryCandidate,
  MemoryMood,
  MemoryUnit,
  PlaceCandidate,
  RecallRoute,
  TraceSourceType,
} from "./memory";

export interface CreateMemoryUnitInput {
  rawText: string;
  assets?: MemoryAsset[];
  links?: string[];
  createdAt?: string;
}

interface LowEnergyAnalysis {
  possibleAfterglow: string;
  momentCandidate: MemoryCandidate;
  worldCandidate: MemoryCandidate;
  presenceCandidate: MemoryCandidate;
  selfCandidate: MemoryCandidate;
  aiReason: string;
}

const emotionRules: Array<[MemoryMood, string[]]> = [
  ["被打动", ["打动", "触动", "震", "哭", "喜欢", "暂停"]],
  ["忧伤", ["忧伤", "难过", "沮丧", "空落", "失落", "孤寂"]],
  ["想逃", ["逃", "不想面对", "躲", "没有点开"]],
  ["孤独", ["孤独", "孤寂", "一个人", "空落"]],
  ["释然", ["解脱", "释然", "松了一口气", "放下", "存在本身"]],
  ["珍视", ["留下", "珍惜", "记住", "不想丢", "保存"]],
  ["困惑", ["为什么", "不懂", "矛盾", "困惑"]],
  ["疲惫", ["累", "疲惫", "撑不住", "还没有落地"]],
];

export function createMemoryUnitFromLowEnergyInput(input: CreateMemoryUnitInput): MemoryUnit {
  const rawText = input.rawText.trim();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const id = `trace-${createdAt.replace(/\D/g, "")}-${hashText(rawText).toString(36)}`;
  const assets = input.assets ?? [];
  const links = input.links ?? [];
  const lowEnergyAnalysis = analyzeLowEnergyText(rawText);
  const emotionTags = pickEmotionTags(rawText);
  const placeCandidates = buildPlaceCandidates(rawText, lowEnergyAnalysis);
  const characterCandidates = buildCharacterCandidates(rawText, emotionTags, lowEnergyAnalysis);
  const suggestedRoutes = buildRoutes(placeCandidates, characterCandidates);
  const sourceTypes = buildSourceTypes(rawText, assets, links);

  return {
    id,
    rawText,
    possibleAfterglow: lowEnergyAnalysis.possibleAfterglow,
    momentCandidate: lowEnergyAnalysis.momentCandidate,
    worldCandidate: lowEnergyAnalysis.worldCandidate,
    presenceCandidate: lowEnergyAnalysis.presenceCandidate,
    selfCandidate: lowEnergyAnalysis.selfCandidate,
    sourceTypes,
    sourceType: sourceTypes[0] ?? "text",
    assets,
    links,
    createdAt,
    timeAnchor: createdAt,
    emotionTags,
    placeCandidates,
    characterCandidates,
    suggestedRoutes,
    aiSummary: lowEnergyAnalysis.possibleAfterglow,
    aiReason: buildReason(lowEnergyAnalysis, placeCandidates, characterCandidates, links),
    status: "received",
    rawRecordStatus: "saved",
    receiptStatus: "received",
    treasuryLayer: "soft",
    routeStatus: "suggested",
    userState: { status: "suggested" },
    privacy: "medium",
    preserveRawText: true,
    sourceMemoryUnitIds: [id],
    placeHints: placeCandidates.map((candidate) => candidate.label),
    characterHints: characterCandidates.map((candidate) => candidate.label),
  };
}

export const createMemoryUnitFromTrace = createMemoryUnitFromLowEnergyInput;

function analyzeLowEnergyText(rawText: string): LowEnergyAnalysis {
  if (hasAny(rawText, ["日本", "东京", "旅行", "回来", "空落", "期待结束"])) {
    return {
      possibleAfterglow:
        "这可能是一段旅行结束后的余波。期待、移动和陌生感退下去以后，留下的可能不是某个景点，而是回来之后突然面对现实的空落。之后你可以再改。",
      momentCandidate: candidate("moment-after-return", "回来后的晚上", 0.86, "文字里出现了回来、期待结束或空落。"),
      worldCandidate: candidate("world-japan-afterward", "Japan Afterward", 0.9, "它更像旅行之后的情绪场域，而不只是地理地点。"),
      presenceCandidate: candidate("presence-japan-afterward", "日本之后的空落", 0.84, "反复回来的不是日本攻略，而是日本之后的余波。"),
      selfCandidate: candidate("self-after-travel", "旅行后的我", 0.86, "这条输入指向旅行结束后重新落回现实的自己。"),
      aiReason: "mock analyzer 命中旅行余波规则：日本 / 东京 / 旅行 / 回来 / 空落 / 期待结束。",
    };
  }

  if (hasAny(rawText, ["Tony", "妈妈", "朋友", "他", "她", "在旁边", "聊天"])) {
    const presence = rawText.includes("Tony")
      ? "Tony"
      : rawText.includes("妈妈")
        ? "妈妈"
        : rawText.includes("朋友")
          ? "朋友"
          : "某个重要的人";

    return {
      possibleAfterglow:
        "这可能是一段关系留下的余波。重要的也许不是画面本身，而是那个人在旁边时，你的状态短暂变得更落地。之后你可以再改。",
      momentCandidate: candidate("moment-with-someone", "和某个人在一起的时刻", 0.8, "文字里出现了真实关系或陪伴线索。"),
      worldCandidate: candidate("world-shared-field", "当时所在的场域", 0.68, "场域还没有被命名，但它和某个人的在场有关。"),
      presenceCandidate: candidate(`presence-${slugify(presence)}`, presence, 0.88, "这条余波由一个具体存在触发。"),
      selfCandidate: candidate("self-grounded-by-someone", "被拉回现实的我", 0.86, "输入强调对方在场时自己的状态变化。"),
      aiReason: "mock analyzer 命中关系余波规则：Tony / 妈妈 / 朋友 / 他 / 她 / 在旁边 / 聊天。",
    };
  }

  if (hasAny(rawText, ["辉夜", "番", "动漫", "看完", "剧", "电影", "作品", "恋爱", "最后一集"])) {
    const presence = rawText.includes("辉夜") ? "辉夜大小姐" : "某个作品";

    return {
      possibleAfterglow:
        "这可能是一段作品结束后的空落。你沉浸在一个作品世界里，结束后那个世界突然退场，所以留下的可能不是某个剧情点，而是沉浸结束后的失重感。之后你可以再改。",
      momentCandidate: candidate("moment-after-binge-watch", "熬夜看完后的时刻", 0.84, "文字里出现了作品、看完或最后一集等结束线索。"),
      worldCandidate: candidate("world-after-work", "作品结束之后", 0.86, "它指向作品世界退场后的场域。"),
      presenceCandidate: candidate(`presence-${slugify(presence)}`, presence, 0.88, "作品名或作品类型是这段余波的入口。"),
      selfCandidate: candidate("self-empty-after-ending", "看完后突然空掉的我", 0.86, "输入里的难过和不知道为什么更像结束后的自我状态。"),
      aiReason: "mock analyzer 命中作品余波规则：辉夜 / 番 / 动漫 / 看完 / 剧 / 电影 / 作品 / 恋爱 / 最后一集。",
    };
  }

  return {
    possibleAfterglow: "这可能是一段还没有完全说清楚的余波。之后你可以再回来补充。",
    momentCandidate: candidate("moment-just-left", "刚刚留下的时刻", 0.52, "暂时只知道这是刚刚留下的 Trace。"),
    worldCandidate: candidate("world-unnamed", "还未命名的场域", 0.44, "还没有足够线索判断它属于哪个场域。"),
    presenceCandidate: candidate("presence-unnamed", "还未命名的存在", 0.42, "还没有足够线索判断是什么一直回来找你。"),
    selfCandidate: candidate("self-now", "此刻的我", 0.56, "先把它保存在当前自我状态下，之后可修改。"),
    aiReason: "mock analyzer 未命中特定规则，只做兜底托管。",
  };
}

function pickEmotionTags(rawText: string) {
  const tags = emotionRules
    .filter(([, keywords]) => keywords.some((keyword) => rawText.includes(keyword)))
    .map(([emotion]) => emotion);

  return unique(tags).slice(0, 3).length > 0 ? unique(tags).slice(0, 3) : (["珍视"] satisfies MemoryMood[]);
}

function buildPlaceCandidates(rawText: string, analysis: LowEnergyAnalysis): PlaceCandidate[] {
  const candidates: PlaceCandidate[] = [];

  candidates.push({
    id: `place-${analysis.worldCandidate.id}`,
    label: analysis.worldCandidate.label,
    kind: analysis.worldCandidate.label.includes("Afterward") || analysis.worldCandidate.label.includes("场域") ? "emotional-place" : "unknown",
    confidence: analysis.worldCandidate.confidence,
    reason: analysis.worldCandidate.reason,
  });

  if (hasAny(rawText, ["日本", "东京", "Shibuya", "涩谷"])) {
    candidates.push({
      id: "place-japan",
      label: rawText.includes("涩谷") || rawText.includes("Shibuya") ? "Shibuya" : rawText.includes("东京") ? "Tokyo" : "日本",
      kind: "real-place",
      confidence: 0.82,
      reason: "文字里出现了日本、东京或涩谷等地点线索。",
    });
  }

  if (hasAny(rawText, ["回来", "旅行结束", "空落", "孤独", "孤寂", "沮丧"])) {
    candidates.push({
      id: "place-japan-afterward",
      label: "Japan Afterward",
      kind: "emotional-place",
      confidence: 0.78,
      reason: "它更像旅行结束后的情绪地点，而不只是地理位置。",
    });
  }

  if (hasAny(rawText, ["家", "桌面", "夜里", "房间", "日常"])) {
    candidates.push({
      id: "place-home-desk",
      label: "Home / 夜里的桌面",
      kind: "emotional-place",
      confidence: 0.7,
      reason: "家、桌面或夜里暗示了一个日常沉淀场。",
    });
  }

  return uniqueById(candidates);
}

function buildCharacterCandidates(
  rawText: string,
  emotionTags: MemoryMood[],
  analysis: LowEnergyAnalysis,
): CharacterCandidate[] {
  const candidates: CharacterCandidate[] = [];

  candidates.push({
    id: `character-${analysis.presenceCandidate.id}`,
    label: analysis.presenceCandidate.label,
    kind: analysis.presenceCandidate.label.includes("我") ? "self-stage" : "theme",
    confidence: analysis.presenceCandidate.confidence,
    reason: analysis.presenceCandidate.reason,
  });

  if (hasAny(rawText, ["黄金时代", "书", "摘句", "读到", "书页", "王小波"])) {
    candidates.push(
      {
        id: "character-golden-age",
        label: "黄金时代",
        kind: "book",
        confidence: 0.86,
        reason: "书名、阅读或摘句线索指向一个作品入口。",
      },
      {
        id: "character-book-pages",
        label: "书页和摘句",
        kind: "book",
        confidence: 0.76,
        reason: "这条 Trace 像是由书页或摘句触发的借用表达。",
      },
    );
  }

  if (hasAny(rawText, ["动画", "截图", "角色", "台词"])) {
    candidates.push({
      id: "character-anime-role",
      label: "动画里的那个角色",
      kind: "fictional-character",
      confidence: 0.8,
      reason: "动画、截图、角色或台词共同指向作品角色。",
    });
  }

  if (hasAny(rawText, ["妈妈", "朋友", "L", "聊天"])) {
    candidates.push({
      id: rawText.includes("L") ? "character-friend-l" : "character-person",
      label: rawText.includes("L") ? "朋友 L" : rawText.includes("妈妈") ? "妈妈" : "朋友",
      kind: "person",
      confidence: 0.74,
      reason: "文字中出现了真实关系或聊天线索。",
    });
  }

  if (hasAny(rawText, ["我", "自己", "回来以后", "现在的我", "存在本身"])) {
    candidates.push({
      id: hasAny(rawText, ["回来以后", "回来", "旅行结束", "空落"]) ? "character-after-travel-self" : "character-self",
      label: hasAny(rawText, ["回来以后", "回来", "旅行结束", "空落"]) ? "旅行后的我" : "自己",
      kind: "self-stage",
      confidence: 0.72,
      reason: "这条 Trace 明显和某个自我阶段有关。",
    });
  }

  if (hasAny(rawText, ["产品", "Trace", "Recall", "回忆", "存在", "文字"])) {
    candidates.push({
      id: "character-presence-memory",
      label: hasAny(rawText, ["文字"]) ? "我的文字" : "存在感与回忆",
      kind: "theme",
      confidence: 0.78,
      reason: "产品、回忆、存在或文字反复指向一个主题入口。",
    });
  }

  if (candidates.length === 0 && emotionTags.some((tag) => tag === "孤独" || tag === "忧伤")) {
    candidates.push({
      id: "character-japan-after-empty",
      label: "日本之后的空落",
      kind: "emotion",
      confidence: 0.64,
      reason: "没有明确人物，但情绪本身可以作为 recurring presence。",
    });
  }

  return uniqueById(candidates.length > 0 ? candidates : [fallbackSelfCandidate()]);
}

function buildRoutes(placeCandidates: PlaceCandidate[], characterCandidates: CharacterCandidate[]): RecallRoute[] {
  const routes: RecallRoute[] = [
    { id: "route-time", target: "time", label: "time", confidence: 1, reason: "每条 Trace 都按时间进入 Recall。" },
    { id: "route-inbox", target: "inbox", label: "trace inbox", confidence: 1, reason: "未确认前保留在 inbox。" },
  ];

  placeCandidates.forEach((candidate) => {
    routes.push({
      id: `route-place-${candidate.id}`,
      target: "place",
      label: candidate.label,
      confidence: candidate.confidence,
      reason: candidate.reason,
    });
  });

  characterCandidates.forEach((candidate) => {
    routes.push({
      id: `route-character-${candidate.id}`,
      target: "character",
      label: candidate.label,
      confidence: candidate.confidence,
      reason: candidate.reason,
    });
  });

  return routes;
}

function buildSourceTypes(rawText: string, assets: MemoryAsset[], links: string[]): TraceSourceType[] {
  const sourceTypes: TraceSourceType[] = rawText ? ["text"] : [];
  assets.forEach((asset) => sourceTypes.push(asset.type));
  if (links.length > 0) sourceTypes.push("link");
  return unique(sourceTypes);
}

function buildReason(
  analysis: LowEnergyAnalysis,
  places: PlaceCandidate[],
  characters: CharacterCandidate[],
  links: string[],
) {
  const reasons = [
    analysis.aiReason,
    ...places.map((candidate) => candidate.reason),
    ...characters.slice(0, 2).map((candidate) => candidate.reason),
    ...(links.length > 0 ? ["外部链接被保留为触发源，但不会覆盖原始文字。"] : []),
  ];
  return reasons.length > 0 ? reasons.join(" ") : "mock analyzer 只做轻量建议，用户原话仍是事实源。";
}

function fallbackSelfCandidate(): CharacterCandidate {
  return {
    id: "character-self",
    label: "自己",
    kind: "self-stage",
    confidence: 0.52,
    reason: "没有明显对象时，先归到自我阶段，等待用户修正。",
  };
}

function candidate(id: string, label: string, confidence: number, reason: string): MemoryCandidate {
  return { id, label, confidence, reason };
}

function hasAny(rawText: string, keywords: string[]) {
  return keywords.some((keyword) => rawText.includes(keyword));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function uniqueById<T extends { id: string }>(values: T[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

function hashText(value: string) {
  return Array.from(value).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 17);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
