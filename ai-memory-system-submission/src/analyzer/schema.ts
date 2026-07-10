import type { MemoryAsset } from "../domain/memory";

export type AnalyzerRiskFlag =
  | "low_context"
  | "too_generic"
  | "too_diagnostic"
  | "possible_hallucination"
  | "too_complete"
  | "sensitive_relation"
  | "material_reduction"
  | "missing_self_state"
  | "non_returnable";

export interface AnalyzerCandidate {
  id: string;
  label: string;
  confidence: number;
  reason: string;
}

export interface AnalyzerRoute {
  id: string;
  target: "receipt" | "treasury" | "return";
  label: string;
  confidence: number;
  reason: string;
}

export interface ReceiptOptionCandidate {
  id: string;
  label: string;
  text: string;
  intent: "hold" | "raw" | "return";
}

export type TreasuryEntryType = "moment" | "world" | "presence" | "self";

export interface ReturnDoorAnalysis {
  rawObject: string;
  residue: string;
  selfState: string;
  strongestReturnDoor: TreasuryEntryType;
  whyDoor: string;
  avoidReducingTo: string[];
}

export interface SupportingTreasuryEntry {
  type: TreasuryEntryType;
  label: string;
  reason: string;
}

export interface TreasuryEntryCandidate {
  id: string;
  type: TreasuryEntryType;
  label: string;
  rawObject: string;
  residue: string;
  selfState: string;
  returnQuestion: string;
  whyThisType: string;
  confidence: number;
  whyReturnable: string;
  preserves: string;
  avoidReducingTo: string[];
  supportingEntries: SupportingTreasuryEntry[];
}

export interface AnalyzerInput {
  rawText: string;
  assets?: MemoryAsset[];
  tasteProfile?: string[];
}

export interface AnalyzerMemoryUnit {
  rawText: string;
  possibleAfterglow: string;
  receiptOptions: ReceiptOptionCandidate[];
  returnDoorAnalysis: ReturnDoorAnalysis;
  momentCandidates: AnalyzerCandidate[];
  worldCandidates: AnalyzerCandidate[];
  presenceCandidates: AnalyzerCandidate[];
  selfCandidates: AnalyzerCandidate[];
  treasuryEntry: TreasuryEntryCandidate;
  suggestedRoutes: AnalyzerRoute[];
  aiReason: string;
  uncertainty: number;
  riskFlags: AnalyzerRiskFlag[];
  preserveRawText: true;
}

export interface SchemaValidationResult {
  ok: boolean;
  errors: string[];
  value?: AnalyzerMemoryUnit;
}

export interface AnalyzerValidationOptions {
  expectedRawText?: string;
}

const riskFlags: AnalyzerRiskFlag[] = [
  "low_context",
  "too_generic",
  "too_diagnostic",
  "possible_hallucination",
  "too_complete",
  "sensitive_relation",
  "material_reduction",
  "missing_self_state",
  "non_returnable",
];

export function normalizeAnalyzerMemoryUnit(value: AnalyzerMemoryUnit): AnalyzerMemoryUnit {
  return {
    ...value,
    riskFlags: value.riskFlags.filter((flag) => riskFlags.includes(flag)),
  };
}

export function validateAnalyzerMemoryUnit(value: unknown, options: AnalyzerValidationOptions = {}): SchemaValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["MemoryUnit must be a JSON object."] };
  }

  requireString(value, "rawText", errors);
  requireString(value, "possibleAfterglow", errors);
  requireReceiptOptions(value, errors);
  requireReturnDoorAnalysis(value, errors);
  requireCandidateArray(value, "momentCandidates", errors);
  requireCandidateArray(value, "worldCandidates", errors);
  requireCandidateArray(value, "presenceCandidates", errors);
  requireCandidateArray(value, "selfCandidates", errors);
  requireTreasuryEntry(value, errors);
  requireRoutes(value, errors);
  requireString(value, "aiReason", errors);
  requireNumberInRange(value, "uncertainty", errors);
  requireRiskFlags(value, errors);

  if (value.preserveRawText !== true) {
    errors.push("preserveRawText must be true.");
  }

  applyHardGates(value, errors, options);

  if (typeof value.rawText === "string") {
    if (typeof value.possibleAfterglow === "string" && !keepsAnyRawPhrase(value.rawText, value.possibleAfterglow)) {
      errors.push("possibleAfterglow should keep at least one raw phrase visible.");
    }

    if (Array.isArray(value.receiptOptions)) {
      value.receiptOptions.forEach((option, index) => {
        if (isRecord(option) && typeof option.text === "string" && !keepsAnyRawPhrase(value.rawText as string, option.text)) {
          errors.push(`receiptOptions[${index}].text should keep at least one raw phrase visible.`);
        }
      });
    }
  }

  return errors.length === 0
    ? { ok: true, errors, value: value as unknown as AnalyzerMemoryUnit }
    : { ok: false, errors };
}

function requireReceiptOptions(value: Record<string, unknown>, errors: string[]) {
  const options = value.receiptOptions;

  if (!Array.isArray(options) || options.length !== 3) {
    errors.push("receiptOptions must contain exactly three options.");
    return;
  }

  const intents = new Set<string>();

  options.forEach((option, index) => {
    if (!isRecord(option)) {
      errors.push(`receiptOptions[${index}] must be an object.`);
      return;
    }

    requireString(option, "id" as keyof AnalyzerMemoryUnit, errors);
    requireString(option, "label" as keyof AnalyzerMemoryUnit, errors);
    requireString(option, "text" as keyof AnalyzerMemoryUnit, errors);

    if (!["hold", "raw", "return"].includes(String(option.intent))) {
      errors.push(`receiptOptions[${index}].intent must be hold, raw, or return.`);
    } else {
      intents.add(String(option.intent));
    }
  });

  ["hold", "raw", "return"].forEach((intent) => {
    if (!intents.has(intent)) {
      errors.push(`receiptOptions must include one ${intent} option.`);
    }
  });
}

export function assertAnalyzerMemoryUnit(value: unknown, options: AnalyzerValidationOptions = {}): AnalyzerMemoryUnit {
  const result = validateAnalyzerMemoryUnit(value, options);

  if (!result.ok || !result.value) {
    throw new Error(result.errors.join("\n"));
  }

  return result.value;
}

function requireReturnDoorAnalysis(value: Record<string, unknown>, errors: string[]) {
  const analysis = value.returnDoorAnalysis;

  if (!isRecord(analysis)) {
    errors.push("returnDoorAnalysis must be an object.");
    return;
  }

  requireString(analysis, "rawObject" as keyof AnalyzerMemoryUnit, errors);
  requireString(analysis, "residue" as keyof AnalyzerMemoryUnit, errors);
  requireString(analysis, "selfState" as keyof AnalyzerMemoryUnit, errors);
  requireString(analysis, "whyDoor" as keyof AnalyzerMemoryUnit, errors);

  if (!["moment", "world", "presence", "self"].includes(String(analysis.strongestReturnDoor))) {
    errors.push("returnDoorAnalysis.strongestReturnDoor must be moment, world, presence, or self.");
  }

  requireStringArray(analysis, "avoidReducingTo", errors);
}

function requireString(value: Record<string, unknown>, key: keyof AnalyzerMemoryUnit, errors: string[]) {
  if (typeof value[key] !== "string" || value[key].trim().length === 0) {
    errors.push(`${key} must be a non-empty string.`);
  }
}

function requireNumberInRange(value: Record<string, unknown>, key: keyof AnalyzerMemoryUnit, errors: string[]) {
  const item = value[key];

  if (typeof item !== "number" || item < 0 || item > 1) {
    errors.push(`${key} must be a number between 0 and 1.`);
  }
}

function requireCandidateArray(value: Record<string, unknown>, key: keyof AnalyzerMemoryUnit, errors: string[]) {
  const candidates = value[key];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    errors.push(`${key} must be a non-empty array.`);
    return;
  }

  candidates.forEach((candidateValue, index) => {
    if (!isRecord(candidateValue)) {
      errors.push(`${key}[${index}] must be an object.`);
      return;
    }

    requireString(candidateValue, "id" as keyof AnalyzerMemoryUnit, errors);
    requireString(candidateValue, "label" as keyof AnalyzerMemoryUnit, errors);
    requireString(candidateValue, "reason" as keyof AnalyzerMemoryUnit, errors);

    if (typeof candidateValue.confidence !== "number" || candidateValue.confidence < 0 || candidateValue.confidence > 1) {
      errors.push(`${key}[${index}].confidence must be a number between 0 and 1.`);
    }
  });
}

function requireRoutes(value: Record<string, unknown>, errors: string[]) {
  const routes = value.suggestedRoutes;

  if (!Array.isArray(routes) || routes.length === 0) {
    errors.push("suggestedRoutes must be a non-empty array.");
    return;
  }

  routes.forEach((route, index) => {
    if (!isRecord(route)) {
      errors.push(`suggestedRoutes[${index}] must be an object.`);
      return;
    }

    requireString(route, "id" as keyof AnalyzerMemoryUnit, errors);
    requireString(route, "label" as keyof AnalyzerMemoryUnit, errors);
    requireString(route, "reason" as keyof AnalyzerMemoryUnit, errors);

    if (!["receipt", "treasury", "return"].includes(String(route.target))) {
      errors.push(`suggestedRoutes[${index}].target must be receipt, treasury, or return.`);
    }

    if (typeof route.confidence !== "number" || route.confidence < 0 || route.confidence > 1) {
      errors.push(`suggestedRoutes[${index}].confidence must be a number between 0 and 1.`);
    }
  });
}

function requireTreasuryEntry(value: Record<string, unknown>, errors: string[]) {
  const entry = value.treasuryEntry;

  if (!isRecord(entry)) {
    errors.push("treasuryEntry must be an object.");
    return;
  }

  requireString(entry, "id" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "label" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "rawObject" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "residue" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "selfState" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "returnQuestion" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "whyThisType" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "whyReturnable" as keyof AnalyzerMemoryUnit, errors);
  requireString(entry, "preserves" as keyof AnalyzerMemoryUnit, errors);
  requireStringArray(entry, "avoidReducingTo", errors);
  requireSupportingEntries(entry, errors);

  if (!["moment", "world", "presence", "self"].includes(String(entry.type))) {
    errors.push("treasuryEntry.type must be moment, world, presence, or self.");
  }

  if (typeof entry.confidence !== "number" || entry.confidence < 0 || entry.confidence > 1) {
    errors.push("treasuryEntry.confidence must be a number between 0 and 1.");
  }
}

function requireSupportingEntries(entry: Record<string, unknown>, errors: string[]) {
  if (!Array.isArray(entry.supportingEntries)) {
    errors.push("treasuryEntry.supportingEntries must be an array.");
    return;
  }

  entry.supportingEntries.forEach((supportingEntry, index) => {
    if (!isRecord(supportingEntry)) {
      errors.push(`treasuryEntry.supportingEntries[${index}] must be an object.`);
      return;
    }

    if (!["moment", "world", "presence", "self"].includes(String(supportingEntry.type))) {
      errors.push(`treasuryEntry.supportingEntries[${index}].type must be moment, world, presence, or self.`);
    }

    requireString(supportingEntry, "label" as keyof AnalyzerMemoryUnit, errors);
    requireString(supportingEntry, "reason" as keyof AnalyzerMemoryUnit, errors);
  });
}

function requireStringArray(value: Record<string, unknown>, key: string, errors: string[]) {
  const items = value[key];

  if (!Array.isArray(items) || items.length === 0 || items.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    errors.push(`${key} must be a non-empty string array.`);
  }
}

function applyHardGates(value: Record<string, unknown>, errors: string[], options: AnalyzerValidationOptions) {
  const rawText = typeof value.rawText === "string" ? value.rawText : "";
  const expectedRawText = options.expectedRawText;
  const analysis = isRecord(value.returnDoorAnalysis) ? value.returnDoorAnalysis : {};
  const entry = isRecord(value.treasuryEntry) ? value.treasuryEntry : {};
  const selfCandidates = Array.isArray(value.selfCandidates) ? value.selfCandidates : [];
  const textFields = [
    value.possibleAfterglow,
    value.aiReason,
    analysis.residue,
    analysis.selfState,
    analysis.whyDoor,
    entry.label,
    entry.rawObject,
    entry.residue,
    entry.selfState,
    entry.returnQuestion,
    entry.whyThisType,
    entry.whyReturnable,
    entry.preserves,
  ]
    .filter((item): item is string => typeof item === "string")
    .join("\n");

  if (typeof expectedRawText === "string" && rawText !== expectedRawText) {
    errors.push("Hard Gate 1: rawText must preserve the user's original trace exactly.");
  }

  if (typeof value.possibleAfterglow === "string" && rawText && !keepsAnyRawPhrase(rawText, value.possibleAfterglow)) {
    errors.push("Hard Gate 1: possibleAfterglow must keep rawText visible as a side note.");
  }

  if (Array.isArray(value.receiptOptions)) {
    value.receiptOptions.forEach((option, index) => {
      if (isRecord(option) && typeof option.text === "string" && rawText && !keepsAnyRawPhrase(rawText, option.text)) {
        errors.push(`Hard Gate 1: receiptOptions[${index}] must keep rawText visible as a side note.`);
      }
    });
  }

  if (selfCandidates.length === 0 || !isNonEmptyString(analysis.selfState) || !isNonEmptyString(entry.selfState)) {
    errors.push("Hard Gate 3: selfState must preserve the self who was touched by the trace.");
  }

  if (!isNonEmptyString(entry.returnQuestion) || !isNonEmptyString(entry.whyReturnable) || !isNonEmptyString(analysis.whyDoor)) {
    errors.push("Hard Gate 4: Treasury entry must be returnable, not merely informative.");
  }

  if (hasBannedOverExplanation(textFields)) {
    errors.push("Hard Gate 5: output must not diagnose, explain causes, or conclude the user's psychology.");
  }

  if (looksGeneric(textFields, rawText)) {
    errors.push("Hard Gate 6: output is too generic to preserve this user's specific residue.");
  }

  const rawObject = isNonEmptyString(analysis.rawObject) ? analysis.rawObject : isNonEmptyString(entry.rawObject) ? entry.rawObject : "";

  if (!rawObject || !keepsSpecificRawObject(rawText, rawObject, textFields)) {
    errors.push("Hard Gate 7: rawObject must remain visible and concrete.");
  }

  if (looksMateriallyReduced(entry, analysis)) {
    errors.push("Hard Gate 2: trace was reduced to material storage instead of spiritual residue.");
  }
}

function hasBannedOverExplanation(value: string) {
  return /你其实是因为|这说明你|你渴望|你需要|这体现了你的成长|你应该|这是一种典型|心理问题|创伤|依恋|投射/.test(value);
}

function looksGeneric(value: string, rawText: string) {
  const genericPhrases = /某段经历|这段回忆|一些情绪|这个东西|一段记忆|复杂感受|重要时刻/g;
  const matches = value.match(genericPhrases)?.length ?? 0;
  const rawTokens = rawText.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? [];
  const visibleTokens = rawTokens.filter((token) => value.includes(token));

  return matches >= 3 && visibleTokens.length === 0;
}

function keepsSpecificRawObject(rawText: string, rawObject: string, value: string) {
  if (value.includes(rawObject)) return true;

  const rawObjectTokens = rawObject.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? [];
  const rawTextTokens = rawText.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? [];

  return [...rawObjectTokens, ...rawTextTokens].some((token) => value.includes(token));
}

function keepsAnyRawPhrase(rawText: string, value: string) {
  if (value.includes(rawText)) return true;

  const rawWords = rawText.trim().split(/\s+/).filter(Boolean);

  if (rawWords.some((word) => value.includes(word))) return true;

  const rawTokens = rawText.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? [];

  return rawTokens.some((token) => value.includes(token));
}

function looksMateriallyReduced(entry: Record<string, unknown>, analysis: Record<string, unknown>) {
  const materialWords = /分类|资料|素材库|搜索索引|相册整理|旅行攻略|联系人|人物档案|作品资料|图片文件|看过的剧|日记总结|收藏夹/;
  const residueWords = /余波|空|失重|回响|在场|没落地|当时的我|自己|碰到|退场|回访|精神|残留/;
  const positiveFields = [entry.label, entry.residue, entry.preserves, entry.whyReturnable, analysis.residue, analysis.selfState]
    .filter((item): item is string => typeof item === "string")
    .join("\n");

  return materialWords.test(positiveFields) && !residueWords.test(positiveFields);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function requireRiskFlags(value: Record<string, unknown>, errors: string[]) {
  if (!Array.isArray(value.riskFlags)) {
    errors.push("riskFlags must be an array.");
    return;
  }

  value.riskFlags.forEach((flag, index) => {
    if (!riskFlags.includes(flag as AnalyzerRiskFlag)) {
      errors.push(`riskFlags[${index}] is not supported.`);
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
