import type { MemoryCandidate, MemoryUnit } from "../domain/memory";

type TrainingTrace = {
  id: string;
  rawText: string;
  possibleAfterglow: string;
  createdAt: string;
  moment: string;
  world: string;
  presence: string;
  self: string;
};

const traces: TrainingTrace[] = [
  {
    id: "shirogane",
    rawText: "辉夜大小姐想让我告白\n你怎么能奢求自己在生活中会遇到这样的女孩呢？\n换个角度\n你配的上吗？你能做到会长那样吗？\n白银御行是我的偶像\n我也要去stanford！",
    possibleAfterglow: "不是恋爱幻想。\n是被白银御行抬高的自己。",
    createdAt: "2026-04-18T23:18:00+08:00",
    moment: "换个角度",
    world: "作品留下的高标准空气",
    presence: "白银御行",
    self: "被白银御行点燃的我",
  },
  {
    id: "blonde-video",
    rawText: "我在5月的时候很喜欢听frank ocean的blonde\n我甚至把自己的网名改成了\nb1onded\n5.4 我生日那天\n我用whiteferrari和月光把我寒假去北海道的视频剪出来了\n10几分钟\n没什么人看 没什么人在意\n我在意就好\n它还在那里\n就够了",
    possibleAfterglow: "五月、blonde、北海道。\n它还在那里。",
    createdAt: "2026-05-04T22:40:00+08:00",
    moment: "5.4 我生日那天",
    world: "五月的 blonde / b1onded 世界",
    presence: "那支北海道视频",
    self: "我在意就好的我",
  },
  {
    id: "drake-iceman",
    rawText: "6月喜欢听drake的iceman\n算是我第一次沉浸在所谓欧美说唱里\n但他和我之前听的都不一样\n他除了说唱 还有很多东西\n我喜欢他的音乐 不只是歌词\n很有taste",
    possibleAfterglow: "第一次听见：\n不只是歌词。",
    createdAt: "2026-06-09T00:16:00+08:00",
    moment: "6月喜欢听 drake 的 iceman",
    world: "所谓欧美说唱里的第一次沉浸",
    presence: "drake 的 iceman",
    self: "觉得“不只是歌词”的我",
  },
  {
    id: "lana-name",
    rawText: "4月最喜欢lana del ray\n她的声音和唱腔\n很缠绵 很深情\n我不喜欢打雷姐这个外号\n好俗 好讨厌\n她是lana del ray\n她在写诗\n我买了她的诗集\n还没有来得及好好看",
    possibleAfterglow: "她是 lana del ray。\n她在写诗。",
    createdAt: "2026-04-12T21:24:00+08:00",
    moment: "4月最喜欢 lana del ray",
    world: "lana del ray 的声音和诗意空气",
    presence: "lana del ray",
    self: "不喜欢“打雷姐”这个外号的我",
  },
  {
    id: "continue-living",
    rawText: "我现在明白了\n很多时候觉得一切都没有意义 什么也不想干的时候\n或许就是真的累了 或者饿了\n或者怎么也出不来这个泥潭\n那就算了\n过一两天就好了\n然后继续生活",
    possibleAfterglow: "很累。\n不行了。\n那就算了。",
    createdAt: "2026-06-21T01:12:00+08:00",
    moment: "那就算了",
    world: "过一两天就好了",
    presence: "泥潭",
    self: "然后继续生活的我",
  },
  {
    id: "vibecoding-experience",
    rawText: "最近两天高强度vibecoding\n开了codex plus会员 不够用\n每一次选择或许不是最好的\n不 纠结这个没有意义\n我收获了体验",
    possibleAfterglow: "不是最好的。\n也不是白费。",
    createdAt: "2026-07-08T02:06:00+08:00",
    moment: "不，纠结这个没有意义",
    world: "高强度 vibecoding",
    presence: "vibecoding",
    self: "我收获了体验的我",
  },
  {
    id: "api-afternoon",
    rawText: "总会有很受挫 很沮丧的时候\n就像我今天下午卡在了网站接api上\n一个下午啥也没做\n不 我其实做了很多了\n我懂得了很多\n我收获了很多无形的东西\n这个下午是有意义的",
    possibleAfterglow: "卡在 API 上的下午。\n无形的东西，也算数。",
    createdAt: "2026-07-09T18:12:00+08:00",
    moment: "不，我其实做了很多了",
    world: "卡在网站接 API 上的下午",
    presence: "无形的东西",
    self: "把无形收获算数的我",
  },
];

export const trainingMemoryCorpus: MemoryUnit[] = traces.map((trace) => {
  const momentCandidate = candidate(`moment-training-${trace.id}`, trace.moment);
  const worldCandidate = candidate(`world-training-${trace.id}`, trace.world);
  const presenceCandidate = candidate(`presence-training-${trace.id}`, trace.presence);
  const selfCandidate = candidate(`self-training-${trace.id}`, trace.self);

  return {
    id: `training-${trace.id}`,
    rawText: trace.rawText,
    possibleAfterglow: trace.possibleAfterglow,
    momentCandidate,
    worldCandidate,
    presenceCandidate,
    selfCandidate,
    sourceTypes: ["text"],
    sourceType: "text",
    assets: [],
    links: [],
    createdAt: trace.createdAt,
    timeAnchor: trace.createdAt,
    emotionTags: ["珍视"],
    placeCandidates: [{ id: `place-training-${trace.id}`, label: trace.world, kind: "emotional-place", confidence: 0.9, reason: "已训练的 trace 场域。" }],
    characterCandidates: [{ id: `character-training-${trace.id}`, label: trace.presence, kind: "theme", confidence: 0.9, reason: "已训练的 trace 返回对象。" }],
    suggestedRoutes: [
      { id: `route-training-moment-${trace.id}`, target: "time", label: trace.moment, confidence: 0.9, reason: "回到训练后保留的时刻。" },
      { id: `route-training-world-${trace.id}`, target: "place", label: trace.world, confidence: 0.9, reason: "回到训练后保留的世界。" },
      { id: `route-training-presence-${trace.id}`, target: "character", label: trace.presence, confidence: 0.9, reason: "回到训练后保留的存在。" },
    ],
    aiSummary: trace.possibleAfterglow,
    aiReason: "来自 training_data.md 中已经过一轮训练与修改的 trace。",
    status: "confirmed",
    rawRecordStatus: "saved",
    receiptStatus: "confirmed",
    treasuryLayer: "core",
    routeStatus: "confirmed",
    userState: { status: "confirmed", userRenamedLabel: trace.self },
    privacy: "medium",
    preserveRawText: true,
    sourceMemoryUnitIds: [`training-${trace.id}`],
    placeHints: [trace.world],
    characterHints: [trace.presence, trace.self],
  };
});

function candidate(id: string, label: string): MemoryCandidate {
  return { id, label, confidence: 0.9, reason: "来自训练后的 trace。" };
}
