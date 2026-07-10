export type TraceSourceType = "text" | "image" | "screenshot" | "book-page" | "voice" | "link";

export type MemoryStatus = "raw" | "received" | "deferred" | "confirmed" | "suggested" | "routed";

export type RawRecordStatus = "saved";
export type ReceiptStatus = "received" | "confirmed";
export type MemoryUnitTreasuryLayer = "soft" | "core";
export type RouteStatus = "suggested" | "confirmed" | "strengthened";

export type MemoryMood = "被打动" | "忧伤" | "想逃" | "孤独" | "释然" | "珍视" | "困惑" | "疲惫";

export type PrivacyLevel = "low" | "medium" | "high";

export interface MemoryAsset {
  id: string;
  type: TraceSourceType;
  name: string;
  fileName?: string;
  previewUrl?: string;
  userNote?: string;
  createdAt?: string;
  privacy?: PrivacyLevel;
}

export interface PlaceCandidate {
  id: string;
  label: string;
  kind: "real-place" | "emotional-place" | "unknown";
  confidence: number;
  reason: string;
}

export interface CharacterCandidate {
  id: string;
  label: string;
  kind:
    | "person"
    | "fictional-character"
    | "artist"
    | "book"
    | "theme"
    | "emotion"
    | "self-stage"
    | "object"
    | "unknown";
  confidence: number;
  reason: string;
}

export interface RecallRoute {
  id: string;
  target: "time" | "place" | "character" | "inbox";
  label: string;
  confidence: number;
  reason: string;
}

export interface MemoryCandidate {
  id: string;
  label: string;
  confidence: number;
  reason: string;
}

export interface MemoryReflectionEntry {
  id: string;
  text: string;
  createdAt: string;
  placeLabel?: string;
  action: "add-thought" | "complete";
}

export interface MemoryUnit {
  id: string;
  rawText: string;
  originalRawText?: string;
  possibleAfterglow: string;
  momentCandidate: MemoryCandidate;
  worldCandidate: MemoryCandidate;
  presenceCandidate: MemoryCandidate;
  selfCandidate: MemoryCandidate;

  sourceTypes: TraceSourceType[];
  sourceType: TraceSourceType;
  assets: MemoryAsset[];
  links: string[];

  createdAt: string;
  updatedAt?: string;
  timeAnchor?: string;

  emotionTags: MemoryMood[];
  placeCandidates: PlaceCandidate[];
  characterCandidates: CharacterCandidate[];
  suggestedRoutes: RecallRoute[];

  aiSummary: string;
  aiReason: string;

  status: MemoryStatus;
  rawRecordStatus: RawRecordStatus;
  receiptStatus: ReceiptStatus;
  treasuryLayer: MemoryUnitTreasuryLayer;
  routeStatus: RouteStatus;
  userNote?: string;
  reflectionEntries?: MemoryReflectionEntry[];
  editedAt?: string;
  userState?: {
    status: "suggested" | "confirmed" | "dismissed";
    pinned?: boolean;
    userRenamedLabel?: string;
  };
  privacy: PrivacyLevel;
  preserveRawText: true;

  sourceMemoryUnitIds: string[];

  placeHints?: string[];
  characterHints?: string[];
}

export type MemoryAssetType = TraceSourceType;
export type SuggestedRoute = RecallRoute;
