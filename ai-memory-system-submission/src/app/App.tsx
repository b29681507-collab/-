import { useState } from "react";
import { mockAnalyzer } from "../analyzer";
import type { AnalyzerMemoryUnit } from "../analyzer";
import { MemoryStoreProvider, useMemoryUnits } from "../data/memoryStore";
import { createMemoryUnitFromLowEnergyInput } from "../domain/analyzeTraceMock";
import type { MemoryUnit } from "../domain/memory";
import { BackView } from "./BackView";
import { RecordSlip } from "./RecordSlip";
import { RecordToReceiptTransition } from "./RecordToReceiptTransition";
import { ReceiptPostcard, TreasuryFields } from "./ReceiptPostcard";

export type ViewMode = "trace" | "analyzer" | "recall" | "return";

const initialTreasury: TreasuryFields = {
  moment: "4月 lana del ray 我的",
  world: "四月的歌声和春天",
  presence: "lana del ray",
  self: "喜欢她的声音和唱腔的我",
};

const submissionPresetText = `总会有很受挫 很沮丧的时候
就像我今天下午卡在了网站接api上
一个下午啥也没做
不 我其实做了很多了
我收获了很多无形的东西
这个下午是有意义的`;

function saveRawText(rawText: string) {
  console.info("saveRawText", rawText);
}

function saveTreasuryField(field: keyof TreasuryFields, value: string) {
  console.info("saveTreasuryField", field, value);
}

export function App() {
  return (
    <MemoryStoreProvider>
      <PostcardApp />
    </MemoryStoreProvider>
  );
}

function PostcardApp() {
  const { addMemoryUnit } = useMemoryUnits();
  const [mode, setMode] = useState<"record" | "transition" | "receipt" | "back">("record");
  const [rawText, setRawText] = useState(submissionPresetText);
  const [treasury, setTreasury] = useState(initialTreasury);
  const [pendingUnit, setPendingUnit] = useState<MemoryUnit | null>(null);
  const [returnToUnitId, setReturnToUnitId] = useState<string | null>(null);
  const [recordInstant, setRecordInstant] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function updateTreasuryField(field: keyof TreasuryFields, value: string) {
    setTreasury((current) => ({ ...current, [field]: value }));
  }

  async function analyzeAndLeave() {
    const trimmedText = rawText.trim();

    if (!trimmedText || isAnalyzing) return;

    setIsAnalyzing(true);
    saveRawText(trimmedText);

    try {
      const analysis = await mockAnalyzer({ rawText: trimmedText });
      const memoryUnit = createMemoryUnitFromAnalyzer(analysis);

      setRawText(memoryUnit.rawText);
      setTreasury({
        moment: memoryUnit.momentCandidate.label,
        world: memoryUnit.worldCandidate.label,
        presence: memoryUnit.presenceCandidate.label,
        self: memoryUnit.selfCandidate.label,
      });
      setPendingUnit(memoryUnit);
      setMode("transition");
    } catch (error) {
      console.error("analyzeRawText", error);
      const fallbackUnit = createMemoryUnitFromLowEnergyInput({ rawText: trimmedText });

      setRawText(fallbackUnit.rawText);
      setTreasury({
        moment: fallbackUnit.momentCandidate.label,
        world: fallbackUnit.worldCandidate.label,
        presence: fallbackUnit.presenceCandidate.label,
        self: fallbackUnit.selfCandidate.label,
      });
      setPendingUnit(fallbackUnit);
      setMode("transition");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function saveReceipt(status: "confirmed" | "deferred") {
    if (!pendingUnit) return;

    const savedUnit: MemoryUnit = {
      ...pendingUnit,
      momentCandidate: { ...pendingUnit.momentCandidate, label: treasury.moment },
      worldCandidate: { ...pendingUnit.worldCandidate, label: treasury.world },
      presenceCandidate: { ...pendingUnit.presenceCandidate, label: treasury.presence },
      selfCandidate: { ...pendingUnit.selfCandidate, label: treasury.self },
      rawText,
      status,
      receiptStatus: status === "confirmed" ? "confirmed" : "received",
      treasuryLayer: status === "confirmed" ? "core" : "soft",
      routeStatus: status === "confirmed" ? "confirmed" : "suggested",
      userState: { status: status === "confirmed" ? "confirmed" : "suggested" },
    };

    addMemoryUnit(savedUnit);
    setReturnToUnitId(savedUnit.id);
    setPendingUnit(null);
    setRawText(submissionPresetText);
  }

  function goRecord() {
    setPendingUnit(null);
    setRawText(submissionPresetText);
    setReturnToUnitId(null);
    setRecordInstant(false);
    setMode("record");
  }

  function goRecordInstant() {
    setPendingUnit(null);
    setRawText("");
    setReturnToUnitId(null);
    setRecordInstant(true);
    setMode("record");
  }

  return (
    <main className="postcard-experiment" aria-label="postcard entrance experiment">
      {mode === "record" ? (
        <RecordSlip
          rawText={rawText}
          onRawTextChange={setRawText}
          onLeave={() => void analyzeAndLeave()}
          onBack={() => {
            setReturnToUnitId(null);
            setMode("back");
          }}
          saveRawText={saveRawText}
          instant={recordInstant}
        />
      ) : mode === "transition" ? (
        <RecordToReceiptTransition
          rawText={rawText}
          treasury={treasury}
          onDone={() => setMode("receipt")}
        />
      ) : mode === "receipt" ? (
        <ReceiptPostcard
          mode={mode}
          rawText={rawText}
          treasury={treasury}
          onRawTextChange={setRawText}
          onTreasuryChange={updateTreasuryField}
          onSend={() => {
            saveReceipt("confirmed");
            saveRawText(rawText);
            setMode("back");
          }}
          onDefer={() => {
            saveReceipt("deferred");
            setMode("back");
          }}
          onBack={() => setMode("back")}
          onRecord={goRecord}
          saveRawText={saveRawText}
          saveTreasuryField={saveTreasuryField}
        />
      ) : mode === "back" ? (
        <BackView onRecord={goRecord} onRecordInstant={goRecordInstant} preferredUnitId={returnToUnitId} />
      ) : (
        <BackView onRecord={goRecord} onRecordInstant={goRecordInstant} preferredUnitId={returnToUnitId} />
      )}
    </main>
  );
}

function createMemoryUnitFromAnalyzer(analysis: AnalyzerMemoryUnit): MemoryUnit {
  const unit = createMemoryUnitFromLowEnergyInput({ rawText: analysis.rawText });

  return {
    ...unit,
    possibleAfterglow: analysis.possibleAfterglow,
    momentCandidate: analysis.momentCandidates[0] ?? unit.momentCandidate,
    worldCandidate: analysis.worldCandidates[0] ?? unit.worldCandidate,
    presenceCandidate: analysis.presenceCandidates[0] ?? unit.presenceCandidate,
    selfCandidate: analysis.selfCandidates[0] ?? unit.selfCandidate,
    suggestedRoutes: analysis.suggestedRoutes.map((route) => ({
      id: route.id,
      target: route.target === "return" ? "character" : "inbox",
      label: route.label,
      confidence: route.confidence,
      reason: route.reason,
    })),
    aiSummary: analysis.possibleAfterglow,
    aiReason: analysis.aiReason,
  };
}
