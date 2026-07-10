import { assertAnalyzerMemoryUnit } from "./schema";
import type {
  AnalyzerCandidate,
  AnalyzerInput,
  AnalyzerMemoryUnit,
  ReceiptOptionCandidate,
  AnalyzerRiskFlag,
  AnalyzerRoute,
  ReturnDoorAnalysis,
  TreasuryEntryCandidate,
} from "./schema";

interface RuleOutput {
  possibleAfterglow: string;
  receiptOptions: ReceiptOptionCandidate[];
  returnDoorAnalysis: ReturnDoorAnalysis;
  moment: AnalyzerCandidate;
  world: AnalyzerCandidate;
  presence: AnalyzerCandidate;
  self: AnalyzerCandidate;
  treasuryEntry: TreasuryEntryCandidate;
  aiReason: string;
  uncertainty: number;
  riskFlags?: AnalyzerRiskFlag[];
}

const rules: Array<{ id: string; keywords: string[]; build: (rawText: string) => RuleOutput }> = [
  {
    id: "api-afternoon-invisible-gains",
    keywords: ["网站接api", "一个下午啥也没做", "无形的东西", "这个下午是有意义的"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n一个下午卡住了。也不是空的。无形的东西，也算发生过。`,
      receiptOptions: [
        {
          id: "receipt-hold-api-afternoon",
          label: "受挫之后",
          intent: "hold",
          text: "「一个下午啥也没做」\n不\n「我其实做了很多了」",
        },
        {
          id: "receipt-raw-api-afternoon",
          label: "原话切片",
          intent: "raw",
          text: "「很受挫 很沮丧」\n「卡在了网站接api上」\n「无形的东西」",
        },
        {
          id: "receipt-return-api-afternoon",
          label: "这个下午",
          intent: "return",
          text: "这个下午\n没有可见进度\n「我收获了很多无形的东西」",
        },
      ],
      returnDoorAnalysis: analysis(
        "今天下午卡在网站接api上",
        "卡住和受挫之后，重新承认不可见的理解与经验也算发生过。",
        "把无形收获算数的我",
        "self",
        "最强入口是从“啥也没做”里把无形收获算进意义的自己，而不是 API 问题本身。",
        ["API 调试记录", "效率复盘", "项目进度总结", "励志安慰", "技术问题分类"],
      ),
      moment: candidate("moment-not-nothing", "不 我其实做了很多了", 0.9, "原话里的“不”把下午从空白里拉回来。"),
      world: candidate("world-api-afternoon", "卡在网站接api上的下午", 0.86, "这个下午作为一整个压力场，包住了受挫和意义确认。"),
      presence: candidate("presence-invisible-things", "无形的东西", 0.84, "它不是具体成果，但正是这条 trace 想保存的对象。"),
      self: candidate("self-counts-invisible-gains", "把无形收获算数的我", 0.93, "原话最后落在“这个下午是有意义的”。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-counts-invisible-gains",
        "self",
        "把无形收获算数的我",
        "今天下午卡在网站接api上",
        "卡住一下午之后，承认看不见的理解和经验也算发生过。",
        "受挫、沮丧，但仍然能说出“这个下午是有意义的”的我",
        "再遇到一个像空白一样的下午时，我想重新看见哪些无形的东西？",
        "主入口选 Self，因为最值得保存的是把无形收获算作意义的自己。",
        0.92,
        "它能带用户回到一个没有可见进度、但并不空的下午。",
        "保留“一个下午啥也没做 / 不 / 我其实做了很多了 / 无形的东西”的转折。",
        ["API 调试记录", "效率复盘", "项目进度总结", "励志安慰", "技术问题分类"],
        [
          supportingEntry("world", "卡在网站接api上的下午", "这个下午本身是可返回的压力场。"),
          supportingEntry("presence", "无形的东西", "它是这条 trace 要辨认的存在。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中 API 下午规则，保留受挫后的 Life Evidence，不写成技术复盘或励志安慰。",
      uncertainty: 0.15,
    }),
  },
  {
    id: "low-energy-mud",
    keywords: ["一切都没有意义", "什么也不想干", "泥潭", "那就算了", "继续生活"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n很累。不行了。那就算了。过一两天，再继续生活。`,
      receiptOptions: [
        {
          id: "receipt-hold-low-energy",
          label: "低能量切片",
          intent: "hold",
          text: "「很累」\n「不行了」\n「那就算了」",
        },
        {
          id: "receipt-raw-low-energy",
          label: "原话切片",
          intent: "raw",
          text: "“一切都没有意义”\n“什么也不想干”\n——过一两天就好了",
        },
        {
          id: "receipt-return-low-energy",
          label: "以后回来",
          intent: "return",
          text: "泥潭\n那就算了\n然后继续生活",
        },
      ],
      returnDoorAnalysis: analysis(
        "一切都没有意义 / 这个泥潭 / 那就算了 / 然后继续生活",
        "低能量里把自己暂时还给累、饿、泥潭和时间。",
        "累了、饿了、出不来，但还会继续生活的我",
        "self",
        "最强入口是低能量里对自己的松绑；泥潭可以作为 presence，但不能被诊断。",
        ["情绪管理建议", "心理诊断", "人生总结", "励志鸡汤", "日记总结"],
      ),
      moment: candidate("moment-tired-that-is-it", "很累 不行了 那就算了", 0.88, "这个短片段比解释性 label 更贴近原话转折。"),
      world: candidate("world-a-day-or-two-later", "过一两天就好了", 0.78, "这是把自己交给一点时间的场域。"),
      presence: candidate("presence-mud", "泥潭", 0.82, "泥潭是原话里具体的阻滞存在。"),
      self: candidate("self-continue-living", "然后继续生活的我", 0.91, "原话最后落在继续生活。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-continue-living",
        "self",
        "然后继续生活的我",
        "一切都没有意义 / 泥潭 / 那就算了",
        "把意义感坍塌暂时还给身体、疲惫和时间。",
        "累了、饿了、出不来，但还会继续生活的我",
        "以后再回到泥潭时，我想重新碰到哪一种“那就算了”？",
        "主入口选 Self，因为保存的是低能量里放过自己的方式，不是问题解释。",
        0.9,
        "它可以带用户回到 pain 和泥潭本身，而不是强行回到积极状态。",
        "保留“很累 / 不行了 / 那就算了 / 继续生活”的松绑。",
        ["情绪管理建议", "心理诊断", "人生总结", "励志鸡汤", "日记总结"],
        [
          supportingEntry("presence", "泥潭", "泥潭是可返回的阻滞感。"),
          supportingEntry("world", "过一两天就好了", "时间本身是辅助场域。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中低能量泥潭规则，允许 return 回到 pain，不强行积极化。",
      uncertainty: 0.18,
      riskFlags: ["too_diagnostic"],
    }),
  },
  {
    id: "vibecoding-experience",
    keywords: ["高强度vibecoding", "vibecoding", "我收获了体验"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n高强度 vibecoding。不一定是最好的选择，但体验已经留下。`,
      receiptOptions: [
        {
          id: "receipt-hold-vibecoding",
          label: "体验切片",
          intent: "hold",
          text: "「不 纠结这个没有意义」\n「我收获了体验」",
        },
        {
          id: "receipt-raw-vibecoding",
          label: "原话切片",
          intent: "raw",
          text: "“最近两天高强度vibecoding”\n“codex plus会员 不够用”\n——每一次选择或许不是最好的",
        },
        {
          id: "receipt-return-vibecoding",
          label: "以后回来",
          intent: "return",
          text: "高强度 vibecoding\n不够用\n我收获了体验",
        },
      ],
      returnDoorAnalysis: analysis(
        "高强度vibecoding / codex plus会员 不够用 / 我收获了体验",
        "高强度尝试之后，从最优选择的纠结里退出来，但不把 pain 抹掉。",
        "收获了体验的我",
        "self",
        "最强入口是承认体验已经留下的自己；presence 应是 vibecoding，不是会员购买。",
        ["会员性价比分析", "工具评测", "编程进度总结", "消费后悔", "效率复盘"],
      ),
      moment: candidate("moment-stop-optimizing-choice", "不 纠结这个没有意义", 0.88, "原话里“不”是停止最优解纠结的转折。"),
      world: candidate("world-high-intensity-vibecoding", "高强度vibecoding", 0.9, "这两天被高强度 vibecoding 包住。"),
      presence: candidate("presence-vibecoding", "vibecoding", 0.88, "vibecoding 是反复出现的实践对象，会员只是触发物。"),
      self: candidate("self-gained-experience", "收获了体验的我", 0.92, "用户最后的自我状态是收获了体验。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-gained-experience",
        "self",
        "收获了体验的我",
        "高强度vibecoding / 我收获了体验",
        "不再只用最优解衡量选择，承认这轮体验已经留下。",
        "收获了体验的我",
        "以后再回到高强度 vibecoding 时，我想重新碰到哪一种不够用和体验？",
        "主入口选 Self，因为保存的是从选择纠结里松开的自己。",
        0.9,
        "return 可以回到压力、不够用和体验本身，而不是积极自我安慰。",
        "保留“高强度vibecoding / 不够用 / 我收获了体验”的张力。",
        ["会员性价比分析", "工具评测", "编程进度总结", "消费后悔", "效率复盘"],
        [
          supportingEntry("world", "高强度vibecoding", "这是这条 trace 的主要场域。"),
          supportingEntry("presence", "vibecoding", "vibecoding 才是可返回 presence。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中 vibecoding 体验规则，presence 选择 vibecoding，并允许 return 回到压力本身。",
      uncertainty: 0.16,
    }),
  },
  {
    id: "lana-poetic-presence",
    keywords: ["lana del ray", "打雷姐", "她在写诗"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n「她是lana del ray / 她在写诗」——四月的歌声，和春天。`,
      receiptOptions: [
        {
          id: "receipt-hold-lana",
          label: "诗意片段",
          intent: "hold",
          text: "「她是lana del ray / 她在写诗」",
        },
        {
          id: "receipt-raw-lana",
          label: "原话切片",
          intent: "raw",
          text: "「很缠绵 很深情」\n「好俗 好讨厌」\n——她是lana del ray",
        },
        {
          id: "receipt-return-lana",
          label: "以后回来",
          intent: "return",
          text: "四月\nlana del ray 的歌声\n和春天。",
        },
      ],
      returnDoorAnalysis: analysis(
        "lana del ray / 她的声音和唱腔 / 她的诗集",
        "声音、唱腔和歌里留下的缠绵、深情与诗意。",
        "在四月认真喜欢她的声音、唱腔和歌的我",
        "presence",
        "最强入口是 lana del ray 这个 presence；声音、唱腔、歌和诗意是主轴，拒绝俗气外号只是辅助边界。",
        ["歌手资料", "外号纠错", "诗集收藏", "音乐品味标签", "四月歌单"],
      ),
      moment: candidate("moment-april-lana", "4月 lana del ray 我的", 0.84, "原话给出四月和喜欢对象，也带有很私人的占有感。"),
      world: candidate("world-lana-voice-spring", "四月的歌声和春天", 0.88, "声音、唱腔、缠绵、深情和写诗形成一层空气。"),
      presence: candidate("presence-lana-del-ray", "lana del ray", 0.93, "原话强调她不是外号，她是 lana del ray。"),
      self: candidate("self-likes-lana-voice", "喜欢她的声音和唱腔的我", 0.88, "self 的主轴是认真喜欢她的歌声、唱腔和诗意状态；外号拒绝只是旁支。"),
      treasuryEntry: treasuryEntry(
        "treasury-presence-lana-del-ray",
        "presence",
        "lana del ray",
        "lana del ray / 她的声音和唱腔 / 她的诗集",
        "她的声音和唱腔很缠绵、很深情；她在写诗，四月的歌声和春天一起留下来。",
        "在四月认真喜欢她的声音、唱腔和歌的我",
        "以后从「lana del ray」回来时，我想重新听见哪一种四月的歌声？",
        "主入口选 Presence，因为这条余波围绕 lana del ray；但 self 应该回到喜欢她的声音、唱腔和歌的我，而不是外号讨论。",
        0.9,
        "以后回来不是查歌手或诗集，而是回到四月那种被她的声音、唱腔和歌留下的余波。",
        "保留 lana del ray、她的声音和唱腔、“她在写诗”，以及四月喜欢她的歌的状态。",
        ["歌手资料", "外号纠错主轴", "诗集收藏", "音乐品味标签", "四月歌单"],
        [
          supportingEntry("world", "四月的歌声和春天", "声音、唱腔和写诗构成了可以回去的精神场。"),
          supportingEntry("self", "喜欢她的声音和唱腔的我", "这让余波不只是关于她，也关于四月认真听见她的歌的我。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中 lana 诗意 presence 规则，用短片段承接名字、声音和诗意边界。",
      uncertainty: 0.18,
    }),
  },
  {
    id: "shirogane-stanford-afterglow",
    keywords: ["白银御行", "stanford"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n白银御行和 stanford 连在一起，留下的是被点燃后的自我要求。`,
      receiptOptions: receiptOptions(
        rawText,
        "白银御行和 stanford 连在一起，留下的是被点燃后的自我要求。",
        "「你配的上吗？」「我也要去stanford！」这两句不是励志总结。",
        "白银御行。\n被推高的标准。\n我也要去stanford。",
      ),
      returnDoorAnalysis: analysis(
        "白银御行 / stanford",
        "被作品角色点燃后，转向自己能不能做到的上冲感。",
        "被白银御行点燃的我",
        "self",
        "最强入口是被作品余波推高自我要求的自己，不是作品资料或升学计划。",
        ["动漫分类", "作品资料", "角色档案", "升学规划", "励志总结", "恋爱建议"],
      ),
      moment: candidate("moment-kaguya-turn-to-self", "换个角度", 0.84, "原话从幻想转向“你能做到会长那样吗”。"),
      world: candidate("world-kaguya-high-standard", "作品留下的高标准空气", 0.78, "辉夜在这里提供的是自我标准被抬高的场。"),
      presence: candidate("presence-shirogane-miyuki", "白银御行", 0.92, "原话直接把白银御行说成偶像。"),
      self: candidate("self-lit-by-shirogane", "被白银御行点燃的我", 0.9, "最后落在“我也要去stanford！”。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-lit-by-shirogane",
        "self",
        "被白银御行点燃的我",
        "白银御行 / stanford",
        "被会长那样的人抬高了对自己的要求。",
        "想追上偶像、也想把自己推到 stanford 的我",
        "以后从「白银御行」回来时，我想重新碰到哪个被点燃的自己？",
        "主入口选 Self，因为最值得保存的是作品余波落到用户身上的自我要求。",
        0.9,
        "以后回来不是查作品或学校，而是回到“我也要去stanford！”的冲劲。",
        "保留自我拷问和被偶像点燃的上冲感。",
        ["动漫分类", "作品资料", "角色档案", "升学规划", "恋爱建议"],
        [
          supportingEntry("presence", "白银御行", "他是这条余波里清楚的返回存在。"),
          supportingEntry("moment", "换个角度", "从幻想转成自我要求的转折很关键。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中白银御行 / stanford 规则，保留作品点燃的自我要求。",
      uncertainty: 0.18,
    }),
  },
  {
    id: "blonde-hokkaido-private-work",
    keywords: ["frank ocean", "blonde", "b1onded", "whiteferrari", "北海道"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n“我在意就好”和“它还在那里”，已经把这段私人创作留住了。`,
      receiptOptions: receiptOptions(
        rawText,
        "“我在意就好”和“它还在那里”，已经把这段私人创作留住了。",
        "frank ocean、blonde、b1onded、whiteferrari、北海道，都按原样在这条 trace 里。",
        "b1onded。\n那支北海道视频。\n我在意就好。",
      ),
      returnDoorAnalysis: analysis(
        "blonde / b1onded / whiteferrari / 北海道视频",
        "无人观看也成立的私人创作确认。",
        "我在意就好的我",
        "self",
        "最强入口是确认它存在就够的自己，不是歌曲、旅行或播放量。",
        ["Frank Ocean资料", "歌单收藏", "北海道旅行相册", "生日记录", "视频播放量", "剪辑作品展示"],
      ),
      moment: candidate("moment-birthday-hokkaido-video", "5.4剪完北海道视频的那天", 0.86, "生日那天剪出视频是清楚的返回点。"),
      world: candidate("world-may-blonde-b1onded", "五月的 blonde / b1onded 世界", 0.88, "音乐、网名和视频构成了那段私人空气。"),
      presence: candidate("presence-hokkaido-video", "那支北海道视频", 0.9, "“它还在那里”让视频成为可返回存在。"),
      self: candidate("self-i-care-enough", "我在意就好的我", 0.93, "原话最后落在“我在意就好 / 它还在那里 / 就够了”。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-i-care-enough",
        "self",
        "我在意就好的我",
        "b1onded / 那支北海道视频",
        "一段只被自己认真在意、但已经足够存在的私人作品余波。",
        "在5.4把北海道视频剪出来，并确认它还在就够的我",
        "以后从「我在意就好」回来时，我想重新碰到哪个把它留下来的自己？",
        "主入口选 Self，因为核心不是作品展示，而是无人观看时仍确认它存在的自己。",
        0.92,
        "以后回来不是证明它被看见，而是回到它已经被留下的安静确认。",
        "保留“我在意就好 / 它还在那里 / 就够了”。",
        ["Frank Ocean资料", "歌单收藏", "北海道旅行相册", "生日记录", "视频播放量"],
        [
          supportingEntry("world", "五月的 blonde / b1onded 世界", "声音和网名是包住这条余波的空气。"),
          supportingEntry("presence", "那支北海道视频", "视频是可以回来的具体存在。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中 blonde / 北海道视频规则，保留私人创作确认。",
      uncertainty: 0.16,
    }),
  },
  {
    id: "drake-iceman-taste",
    keywords: ["drake", "iceman", "欧美说唱", "不只是歌词"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\niceman 留下的是第一次听出“不只是歌词”的 taste 判断。`,
      receiptOptions: receiptOptions(
        rawText,
        "iceman 留下的是第一次听出“不只是歌词”的 taste 判断。",
        "“他除了说唱 还有很多东西”和“很有taste”保持原样。",
        "drake的iceman。\n不只是歌词。\n很有taste。",
      ),
      returnDoorAnalysis: analysis(
        "drake的iceman",
        "第一次沉进所谓欧美说唱，并听到不只是歌词的东西。",
        "正在建立自己听感和 taste 判断的我",
        "self",
        "最强入口是听感被打开的自己，不是歌曲资料或说唱分类。",
        ["欧美说唱分类", "歌单记录", "歌词分析", "音乐资料"],
      ),
      moment: candidate("moment-june-drake-iceman", "6月喜欢听drake的iceman", 0.82, "原话给出明确时间和音乐对象。"),
      world: candidate("world-first-rap-immersion", "所谓欧美说唱里的第一次沉浸", 0.78, "这是一个新的听感场域。"),
      presence: candidate("presence-drake-iceman", "drake的iceman", 0.87, "它是具体返回对象。"),
      self: candidate("self-not-just-lyrics", "觉得“不只是歌词”的我", 0.9, "重心落在“不只是歌词”和“很有taste”。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-not-just-lyrics",
        "self",
        "觉得“不只是歌词”的我",
        "drake的iceman",
        "drake的iceman 让用户第一次听到“不只是歌词”的东西。",
        "正在建立自己听感和 taste 判断的我",
        "以后从「drake的iceman」回来时，我想重新碰到哪个觉得“不只是歌词”的自己？",
        "主入口选 Self，因为最值得保存的是听感被打开后的 taste 确认。",
        0.88,
        "以后回来不是查一首歌，而是回到自己开始听出“很多东西”的那一刻。",
        "保留第一次沉进 iceman 时，对 taste 的辨认。",
        ["欧美说唱分类", "歌单记录", "歌词分析", "音乐资料"],
        [
          supportingEntry("presence", "drake的iceman", "它是具体返回对象，但不能只变成歌曲资料。"),
          supportingEntry("world", "所谓欧美说唱里的第一次沉浸", "它提供新的听感场域。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中 drake / iceman 规则，保留听感打开和 taste 判断。",
      uncertainty: 0.2,
    }),
  },
  {
    id: "work-afterglow",
    keywords: ["辉夜", "大小姐", "动漫", "番", "看完", "作品"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n可能先放在这里：不是剧情总结，是作品退场后那一下空。之后可以改。`,
      receiptOptions: receiptOptions(
        rawText,
        "先放着：这不是剧情总结，像是作品退场后那一下空。",
        "我先只保留原话里的辉夜和这点空，不急着解释它为什么来。",
        "辉夜。\n看完后还没出来的我。\n作品退场后的空。",
      ),
      returnDoorAnalysis: analysis(
        rawText.includes("辉夜") ? "辉夜大小姐" : "看完的作品",
        "作品退场后的空，和还没有从那个世界里出来的余波。",
        "看完后还没出来的我",
        "self",
        "最可回访的是被作品余波留下来的自己；辉夜可以作为辅助 presence。",
        ["动漫分类", "作品标签", "看过的剧", "剧情总结", "青春流逝解释", "恋爱冲动分析"],
      ),
      moment: candidate("moment-after-work", "看完之后的空白", 0.86, "原话出现作品或看完线索。"),
      world: candidate("world-kaguya-afterglow", "作品余波", 0.88, "它更像作品世界退场后的场域。"),
      presence: candidate("presence-kaguya", rawText.includes("辉夜") ? "辉夜大小姐" : "那个作品", 0.9, "作品名是可返回入口。"),
      self: candidate("self-after-ending", "看完后还没出来的我", 0.82, "输入不像评论，更像结束后的状态。"),
      treasuryEntry: treasuryEntry(
        "treasury-self-after-ending",
        "self",
        "看完后还没出来的我",
        rawText.includes("辉夜") ? "辉夜大小姐" : "看完的作品",
        "作品退场后的空，和还没有从那个世界里出来的余波。",
        "看完后还没出来的我",
        "以后想回来时，我想重新碰到哪个还没出来的自己？",
        "主入口选 Self，因为最值得保存的不是作品资料，而是被作品余波留住的当时的我。",
        0.86,
        "以后用户想回到的不是作品资料，而是作品退场后那个还在余波里的自己。",
        "保留作品结束后的空落和原话里的作品名。",
        ["动漫分类", "剧情总结", "通用作品标签"],
        [
          supportingEntry("presence", rawText.includes("辉夜") ? "辉夜大小姐" : "那个作品", "作品名仍然是反复回来找用户的存在。"),
          supportingEntry("world", "作品余波", "作品退场后的场域可以辅助回访。"),
        ],
      ),
      aiReason: "mockAnalyzer 命中作品余波规则，只做轻量承接，不补剧情。",
      uncertainty: 0.18,
    }),
  },
  {
    id: "travel-afterglow",
    keywords: ["日本", "东京", "旅行", "回来", "机场", "新干线"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n可能是旅行结束后的没落地。先不写成攻略，只让这点回落存在。`,
      receiptOptions: receiptOptions(
        rawText,
        "先让这句停在这里：它像是回来以后还没落地。",
        "我不把它写成攻略，只保留「回来以后」这点回落。",
        "日本回来以后。\n还没落回日常的我。",
      ),
      returnDoorAnalysis: analysis(
        rawText.includes("日本") ? "日本回来以后" : "旅行回来以后",
        "旅行结束后还没重新落回日常的失重感。",
        "重新落回日常的我",
        "world",
        "这更像包住用户的一段旅行后精神气候，而不是某个景点。",
        ["日本地点", "旅行攻略", "景点回忆", "地点相册", "游记总结"],
      ),
      moment: candidate("moment-after-return", "回来以后", 0.88, "原话出现回来、日本或旅行线索。"),
      world: candidate("world-japan-afterward", "日本回来以后", 0.9, "地点和结束后的情绪绑在一起。"),
      presence: candidate("presence-trip-afterimage", "旅行残影", 0.78, "真正反复出现的是旅行结束后的残留感。"),
      self: candidate("self-after-travel", "重新落回日常的我", 0.84, "输入指向从旅途中回到现实的自己。"),
      treasuryEntry: treasuryEntry(
        "treasury-world-japan-afterward",
        "world",
        "日本回来以后",
        rawText.includes("日本") ? "日本回来以后" : "旅行回来以后",
        "旅行结束后还没重新落回日常的失重感。",
        "重新落回日常的我",
        "以后我想回到旅行结束后哪种还没落地的空气里？",
        "主入口选 World，因为核心是旅行结束后包住用户的私人精神气候。",
        0.9,
        "这是一个包住用户的旅行后场域，之后可以从这里重新进入那种没落地的余波。",
        "保留旅行结束后的失重感，而不是旅行过程本身。",
        ["日本相册", "景点回忆", "旅行攻略"],
        [supportingEntry("self", "重新落回日常的我", "这个场域里必须保留当时的自己。")],
      ),
      aiReason: "mockAnalyzer 命中旅行余波规则，保留原词，不扩写行程。",
      uncertainty: 0.16,
    }),
  },
  {
    id: "relationship-afterglow",
    keywords: ["Tony", "朋友", "妈妈", "爸爸", "他", "她", "聊天", "见面"],
    build: (rawText) => {
      const name = rawText.includes("Tony")
        ? "Tony"
        : rawText.includes("妈妈")
          ? "妈妈"
          : rawText.includes("爸爸")
            ? "爸爸"
            : "那个人";

      return {
        possibleAfterglow: `「${rawText}」\n可能先记成一句话留下的回响。这里不用分析 ${name}，只留住那种在场感。`,
        receiptOptions: receiptOptions(
          rawText,
          `先只留住 ${name} 和那句话之后还在的回响。`,
          `我不会分析 ${name}，只把你被这句话牵住的那一刻放在这里。`,
          `${name}。\n那句话之后还在的回响。`,
        ),
        returnDoorAnalysis: analysis(
          name,
          "关系里的在场感，和那句话之后还在回来的回响。",
          "被关系接住的我",
          "presence",
          "这个名字以后最容易把用户带回那段在场感，但不能变成对方档案。",
          ["联系人", "人物档案", "关系诊断", "对方动机推断", "对方心理分析"],
        ),
        moment: candidate("moment-with-person", "和那个人有关的一刻", 0.82, "原话出现关系或陪伴线索。"),
        world: candidate("world-shared-presence", "两个人之间的场", 0.78, "它不是单纯地点，更像关系里的场域。"),
        presence: candidate(`presence-${slugify(name)}`, name, 0.9, "这个名字是主要返回入口。"),
        self: candidate("self-held-by-relation", "被关系接住的我", 0.78, "输入指向自己在关系中的状态。"),
        treasuryEntry: treasuryEntry(
          `treasury-presence-${slugify(name)}`,
          "presence",
          name,
          name,
          "关系里的在场感，和那句话之后还在回来的回响。",
          "被关系接住的我",
          `以后从「${name}」回来时，我想重新碰到哪一句话留下的在场感？`,
          "主入口选 Presence，因为这个名字像一个反复回来找用户的存在。",
          0.88,
          "这个名字以后能把用户带回关系里的在场感，但不需要解释对方。",
          "保留一句话留下的关系回响和自己被拉住的感觉。",
          ["联系人", "人物档案", `对 ${name} 的动机分析`],
          [supportingEntry("self", "被关系接住的我", "关系入口必须同时保留当时的自己。")],
        ),
        aiReason: "mockAnalyzer 命中关系余波规则，不推断对方动机。",
        uncertainty: 0.2,
        riskFlags: ["sensitive_relation"],
      };
    },
  },
  {
    id: "stage-afterglow",
    keywords: ["期末", "考试", "结束", "没有开心", "不开心", "空", "阶段"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n可能只是阶段结束后的空还在。它不用马上变成原因，也不用被鼓励开心。`,
      receiptOptions: receiptOptions(
        rawText,
        "先允许这句存在：结束了，但开心没有立刻跟上。",
        "我不急着找原因，也不把它变成情绪问题；只保留期末结束后的那一下空。",
        "阶段刚结束。\n开心还没有跟上。",
      ),
      returnDoorAnalysis: analysis(
        "期末结束但没有开心",
        "阶段结束后，预期中的开心没有立刻出现的空。",
        "阶段刚结束的我",
        "moment",
        "核心是结束后那一下精神密度很高的瞬间。",
        ["考试记录", "情绪问题", "原因分析", "鼓励开心", "心理诊断"],
      ),
      moment: candidate("moment-after-term", "期末结束后", 0.9, "原话出现期末、结束或没有开心。"),
      world: candidate("world-stage-afterward", "阶段退场之后", 0.84, "这条更像阶段性压力退去后的空间。"),
      presence: candidate("presence-unarrived-happiness", "还没来的开心", 0.76, "反复出现的是预期中的开心没有出现。"),
      self: candidate("self-after-stage", "阶段刚结束的我", 0.86, "输入保留了结束后的自我状态。"),
      treasuryEntry: treasuryEntry(
        "treasury-moment-after-term",
        "moment",
        "期末结束后没有开心的那一刻",
        "期末结束但没有开心",
        "阶段结束后，预期中的开心没有立刻出现的空。",
        "阶段刚结束的我",
        "以后我想回到哪个结束了但还没开心起来的瞬间？",
        "主入口选 Moment，因为最强的是结束后那一下，而不是考试资料或长期状态。",
        0.88,
        "这是一段阶段结束后的稀有感触，之后可以回到这个瞬间看见当时的自己。",
        "保留事情结束了但开心没有跟上的状态。",
        ["考试记录", "情绪问题", "原因解释"],
        [supportingEntry("self", "阶段刚结束的我", "这个瞬间未来可回访，是因为里面有当时的自己。")],
      ),
      aiReason: "mockAnalyzer 命中阶段余波规则，不把它诊断成情绪问题。",
      uncertainty: 0.18,
    }),
  },
  {
    id: "photo-moment-afterglow",
    keywords: ["旧照片", "照片", "突然想哭", "想哭", "翻到"],
    build: (rawText) => ({
      possibleAfterglow: `「${rawText}」\n可能是旧时间突然碰了一下。先不用说清楚为什么哭，那张照片还在就够了。`,
      receiptOptions: receiptOptions(
        rawText,
        "先不用解释为什么哭；那张旧照片和这一瞬间先被留住。",
        "我只保留旧照片突然碰到你的那一下，不把它整理成相册。",
        "那张旧照片。\n被旧时间碰到的我。",
      ),
      returnDoorAnalysis: analysis(
        rawText.includes("旧照片") ? "那张旧照片" : "那张照片",
        "被旧时间突然碰到的一瞬间。",
        "被旧时间碰到的我",
        "moment",
        "核心是照片触发的那一下，不是照片文件本身。",
        ["图片文件", "相册整理", "怀旧标签", "追问为什么哭"],
      ),
      moment: candidate("moment-old-photo", "看到旧照片的瞬间", 0.9, "原话出现旧照片或突然想哭。"),
      world: candidate("world-photo-return", "照片带回来的时间", 0.82, "照片像一个返回入口，而不只是图片文件。"),
      presence: candidate("presence-old-photo", "那张旧照片", 0.88, "触发物很具体，可以先作为 presence 保存。"),
      self: candidate("self-met-by-photo", "被旧时间碰到的我", 0.8, "输入指向被过去突然碰到的状态。"),
      treasuryEntry: treasuryEntry(
        "treasury-moment-old-photo",
        "moment",
        "看到旧照片突然想哭",
        rawText.includes("旧照片") ? "那张旧照片" : "那张照片",
        "被旧时间突然碰到的一瞬间。",
        "被旧时间碰到的我",
        "以后我想从哪张照片回到被旧时间碰到的那一下？",
        "主入口选 Moment，因为真正值得保存的是突然想哭的那一刻。",
        0.9,
        "这个瞬间本身就是回访入口，之后可以从照片重新碰到那段旧时间。",
        "保留被旧照片击中的一瞬间，不追问哭的原因。",
        ["图片文件", "相册整理", "怀旧标签"],
        [supportingEntry("presence", "那张旧照片", "照片可以作为辅助 presence，但不能变成相册分类。")],
      ),
      aiReason: "mockAnalyzer 命中瞬间余波规则，不解释哭的原因。",
      uncertainty: 0.2,
    }),
  },
];

export async function mockAnalyzer(input: AnalyzerInput): Promise<AnalyzerMemoryUnit> {
  const rawText = input.rawText.trim();
  const matchedRule = rules.find((rule) => rule.keywords.some((keyword) => rawText.includes(keyword)));
  const output = matchedRule?.build(rawText) ?? buildFallback(rawText, input.assets?.length ?? 0);
  const memoryUnit: AnalyzerMemoryUnit = {
    rawText,
    possibleAfterglow: output.possibleAfterglow,
    receiptOptions: output.receiptOptions,
    returnDoorAnalysis: output.returnDoorAnalysis,
    momentCandidates: [output.moment],
    worldCandidates: [output.world],
    presenceCandidates: [output.presence],
    selfCandidates: [output.self],
    treasuryEntry: output.treasuryEntry,
    suggestedRoutes: buildRoutes(output),
    aiReason: output.aiReason,
    uncertainty: output.uncertainty,
    riskFlags: output.riskFlags ?? (rawText.length < 8 ? ["low_context"] : []),
    preserveRawText: true,
  };

  return assertAnalyzerMemoryUnit(memoryUnit, { expectedRawText: rawText });
}

function buildFallback(rawText: string, assetCount: number): RuleOutput {
  return {
    possibleAfterglow: `「${rawText}」\n现在还不用写完整。它可以先作为一个还没命名、之后能改的余波存在。`,
    receiptOptions: receiptOptions(
      rawText,
      "现在还不用写完整。它可以先作为一个还没命名的余波存在。",
      "我先按原样保留这几个词，之后你可以回来改名字。",
      "这里。\n还没命名。\n但已经被留下。",
    ),
    returnDoorAnalysis: analysis(
      rawText,
      "还没有完全命名的精神残留。",
      "愿意留下这几个词的我",
      "self",
      "线索少时，先从当时的自己回来最稳。",
      ["待分类素材", "完整日记任务", "搜索关键词", "收藏夹"],
    ),
    moment: candidate("moment-unnamed", "刚刚留下的一刻", 0.56, "输入很短，先保留时间入口。"),
    world: candidate("world-unnamed", "还没命名的场域", 0.46, "还没有足够线索判断它属于哪个世界。"),
    presence: candidate(
      assetCount > 0 ? "presence-attached-asset" : "presence-unnamed",
      assetCount > 0 ? "附带素材" : "还没命名的存在",
      assetCount > 0 ? 0.58 : 0.44,
      assetCount > 0 ? "有附带素材，但不替代原话。" : "先不强行命名。",
    ),
    self: candidate("self-now", "此刻的我", 0.54, "先把它放在当前状态下。"),
    treasuryEntry: treasuryEntry(
      "treasury-self-unnamed",
      "self",
      "还没命名的我",
      rawText,
      "还没有完全命名的精神残留。",
      "愿意留下这几个词的我",
      "以后我想回来补认哪个还没说完的自己？",
      "主入口选 Self，因为低能量输入还没给出更强对象时，先保存当时的自己。",
      0.52,
      "线索还少，但可以先保留成一个未来能改名的自我状态入口。",
      "保留用户愿意留下这几个词的当下状态。",
      ["待分类素材", "完整日记任务"],
      [],
    ),
    aiReason: "mockAnalyzer 未命中特定规则，只做保留和轻量托底。",
    uncertainty: 0.52,
    riskFlags: ["low_context"],
  };
}

function buildRoutes(output: RuleOutput): AnalyzerRoute[] {
  return [
    {
      id: "route-receipt",
      target: "receipt",
      label: "receipt",
      confidence: 1,
      reason: "先给用户一个被接住的回执。",
    },
    {
      id: `route-treasury-${output.world.id}`,
      target: "treasury",
      label: output.treasuryEntry.label,
      confidence: output.treasuryEntry.confidence,
      reason: `按 ${output.treasuryEntry.type} 精神入口进入 Treasury，避免只按页面或素材分类。`,
    },
    {
      id: `route-return-${output.presence.id}`,
      target: "return",
      label: output.presence.label,
      confidence: output.presence.confidence,
      reason: "按 presence 建立以后可返回的入口。",
    },
  ];
}

function candidate(id: string, label: string, confidence: number, reason: string): AnalyzerCandidate {
  return { id, label, confidence, reason };
}

function receiptOptions(rawText: string, holdText: string, rawTextText: string, returnText: string): ReceiptOptionCandidate[] {
  return [
    {
      id: "receipt-hold",
      label: "轻轻接住",
      intent: "hold",
      text: `「${rawText}」\n${holdText}`,
    },
    {
      id: "receipt-raw",
      label: "原话优先",
      intent: "raw",
      text: `「${rawText}」\n${rawTextText}`,
    },
    {
      id: "receipt-return",
      label: "返回入口",
      intent: "return",
      text: `「${rawText}」\n${returnText}`,
    },
  ];
}

function treasuryEntry(
  id: string,
  type: TreasuryEntryCandidate["type"],
  label: string,
  rawObject: string,
  residue: string,
  selfState: string,
  returnQuestion: string,
  whyThisType: string,
  confidence: number,
  whyReturnable: string,
  preserves: string,
  avoidReducingTo: string[],
  supportingEntries: TreasuryEntryCandidate["supportingEntries"],
): TreasuryEntryCandidate {
  return {
    id,
    type,
    label,
    rawObject,
    residue,
    selfState,
    returnQuestion,
    whyThisType,
    confidence,
    whyReturnable,
    preserves,
    avoidReducingTo,
    supportingEntries,
  };
}

function analysis(
  rawObject: string,
  residue: string,
  selfState: string,
  strongestReturnDoor: ReturnDoorAnalysis["strongestReturnDoor"],
  whyDoor: string,
  avoidReducingTo: string[],
): ReturnDoorAnalysis {
  return { rawObject, residue, selfState, strongestReturnDoor, whyDoor, avoidReducingTo };
}

function supportingEntry(type: TreasuryEntryCandidate["type"], label: string, reason: string) {
  return { type, label, reason };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
