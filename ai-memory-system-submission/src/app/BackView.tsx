import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useMemoryUnits } from "../data/memoryStore";
import type { MemoryReflectionEntry, MemoryUnit } from "../domain/memory";

type BackAnchor = "empty" | "tired" | "self" | "world" | "serendipity";
type BackLevel = "entry" | "preview" | "anchor" | "deck";
type RouteKey = "moment" | "world" | "presence" | "self";

type DeckRoute = {
  key: RouteKey;
  label: string;
  kicker: string;
};

const backAnchors: Array<{ id: BackAnchor; label: string }> = [
  { id: "empty", label: "有点空" },
  { id: "tired", label: "很累" },
  { id: "self", label: "想找回自己" },
  { id: "world", label: "想碰一下某个世界" },
  { id: "serendipity", label: "随便带我回去" },
];

type BackViewProps = {
  onRecord: () => void;
  onRecordInstant: () => void;
  preferredUnitId?: string | null;
};

export function BackView({ onRecord, onRecordInstant, preferredUnitId }: BackViewProps) {
  const { memoryUnits, updateMemoryUnit } = useMemoryUnits();
  const [anchor, setAnchor] = useState<BackAnchor>("empty");
  const [backText, setBackText] = useState("");
  const [level, setLevel] = useState<BackLevel>("entry");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [deckRoute, setDeckRoute] = useState<DeckRoute | null>(null);
  const [deckIndex, setDeckIndex] = useState(0);
  const [focusUnit, setFocusUnit] = useState<MemoryUnit | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notePlace, setNotePlace] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [routeSwitch, setRouteSwitch] = useState<DeckRoute | null>(null);
  const [isDeckLeaving, setIsDeckLeaving] = useState(false);
  const [notice, setNotice] = useState("");
  const todayCards = useMemo(
    () => prioritizePreferredUnit(buildReturnPool(memoryUnits, anchor, backText), preferredUnitId).slice(0, 3),
    [anchor, backText, memoryUnits, preferredUnitId],
  );
  const anchorUnit = todayCards[previewIndex] ?? todayCards[0] ?? null;
  const deckCards = useMemo(() => (anchorUnit && deckRoute ? buildDeck(memoryUnits, anchorUnit, deckRoute) : []), [anchorUnit, deckRoute, memoryUnits]);
  const deckUnit = deckCards[deckIndex] ?? null;

  function resetToPreview() {
    setPreviewIndex(0);
    setDeckRoute(null);
    setDeckIndex(0);
    setFocusUnit(null);
    setNotice("");
  }

  function enterPreview() {
    if (todayCards.length === 0) return;
    resetToPreview();
    setLevel("preview");
  }

  function movePreview(direction: -1 | 1) {
    const next = previewIndex + direction;
    if (next < 0 || next >= todayCards.length) return;
    setPreviewIndex(next);
  }

  function putBackToday() {
    if (previewIndex < todayCards.length - 1) {
      movePreview(1);
      return;
    }
    setLevel("entry");
    setNotice("好，今天先放回去。");
  }

  function openAnchor() {
    setLevel("anchor");
  }

  function openDeck(route: DeckRoute) {
    setDeckRoute(route);
    setDeckIndex(0);
    setIsNoteOpen(false);
    setNotice("");
    setLevel("deck");
  }

  function closeDeck(to: "anchor" | "entry") {
    setIsDeckLeaving(true);
    window.setTimeout(() => {
      setIsDeckLeaving(false);
      setLevel(to);
      if (to === "entry") resetToPreview();
    }, 280);
  }

  function confirmRouteSwitch(next: DeckRoute) {
    setRouteSwitch(null);
    setIsDeckLeaving(true);
    window.setTimeout(() => {
      setIsDeckLeaving(false);
      openDeck(next);
    }, 280);
  }

  function saveNote(unit: MemoryUnit) {
    const text = noteText.trim();
    if (!text) return;
    const entry: MemoryReflectionEntry = { id: `reflection-${Date.now()}`, text, createdAt: new Date().toISOString(), placeLabel: notePlace.trim() || undefined, action: "add-thought" };
    updateMemoryUnit(unit.id, (current) => ({ ...current, updatedAt: entry.createdAt, routeStatus: "strengthened", reflectionEntries: [...(current.reflectionEntries ?? []), entry] }));
    setNoteText("");
    setNotePlace("");
    setIsNoteOpen(false);
    setNotice("这句已经贴在这张卡旁边了。");
  }

  function cancelNote() {
    setNoteText("");
    setNotePlace("");
    setIsNoteOpen(false);
  }

  function recognizePending(unit: MemoryUnit) {
    updateMemoryUnit(unit.id, (current) => ({
      ...current,
      status: "confirmed",
      receiptStatus: "confirmed",
      treasuryLayer: "core",
      routeStatus: "confirmed",
      updatedAt: new Date().toISOString(),
      userState: { ...current.userState, status: "confirmed" },
    }));
    setNotice("这张卡现在被你认领了。");
  }

  return (
    <section className="back-stage" aria-label="back">
      {level === "entry" ? (
        <>
          <nav className="back-top-actions" aria-label="back modes">
            <button type="button" onClick={onRecord}>record</button>
            <button type="button" className="active">back</button>
          </nav>
          <div className="back-entry-panel" aria-label="back entry">
            {preferredUnitId ? <p className="demo-guide back-demo-guide" aria-label="体验引导">体验 03 / 05　刚才那张卡在信箱里，点「收件」。</p> : null}
            <div className="back-anchor-row" aria-label="back anchor">
              {backAnchors.map((item) => <button className={item.id === anchor ? "active" : ""} key={item.id} type="button" onClick={() => { setAnchor(item.id); resetToPreview(); }}>{item.label}</button>)}
            </div>
            <label className="back-entry-text"><textarea value={backText} placeholder="也可以自己写一句现在的状态" onChange={(event) => setBackText(event.target.value)} /></label>
            <button className="back-return-button" type="button" onClick={enterPreview} disabled={todayCards.length === 0}>收件</button>
            {notice ? <p className="back-card-notice" role="status">{notice}</p> : null}
          </div>
        </>
      ) : null}

      {level === "preview" && anchorUnit ? <BackPreview unit={anchorUnit} index={previewIndex} count={todayCards.length} onMove={movePreview} onEnter={openAnchor} onPutBack={putBackToday} /> : null}

      {level === "anchor" && anchorUnit ? (
        <AnchorPostcard
          unit={anchorUnit}
          notice={notice}
          onRoute={openDeck}
          onRecognize={() => recognizePending(anchorUnit)}
          onPutBack={() => setLevel("preview")}
        />
      ) : null}

      {level === "deck" && anchorUnit && deckRoute ? (
        <div className={`back-deck-scene ${isDeckLeaving ? "is-leaving" : ""}`}>
          <AnchorBackdrop unit={anchorUnit} />
          <PathDeck
            anchor={anchorUnit}
            route={deckRoute}
            cards={deckCards}
            index={deckIndex}
            noteOpen={isNoteOpen}
            noteText={noteText}
            notePlace={notePlace}
            notice={notice}
            onMove={(direction) => setDeckIndex((current) => Math.max(0, Math.min(deckCards.length, current + direction)))}
            onRouteSwitch={setRouteSwitch}
            onNoteOpen={() => setIsNoteOpen(true)}
            onNoteText={setNoteText}
            onNotePlace={setNotePlace}
            onSaveNote={() => deckUnit && saveNote(deckUnit)}
            onCancelNote={cancelNote}
            onRecord={onRecordInstant}
            onBack={() => closeDeck("anchor")}
            onRestart={() => setDeckIndex(0)}
            onCloseAll={() => closeDeck("entry")}
          />
        </div>
      ) : null}

      {focusUnit ? <ReadingFocus unit={focusUnit} onClose={() => setFocusUnit(null)} /> : null}
      {routeSwitch && deckRoute ? <RouteSwitchDialog current={deckRoute} next={routeSwitch} onCancel={() => setRouteSwitch(null)} onConfirm={() => confirmRouteSwitch(routeSwitch)} /> : null}
    </section>
  );
}

function BackPreview({ unit, index, count, onMove, onEnter, onPutBack }: { unit: MemoryUnit; index: number; count: number; onMove: (direction: -1 | 1) => void; onEnter: () => void; onPutBack: () => void }) {
  return (
    <div className="back-preview-stage">
      <p className="back-mailbox-title">我的信箱</p>
      {isPending(unit) ? <p className="demo-guide back-demo-guide" aria-label="体验引导">体验 04 / 05　这是刚才先放下的卡，点「回去看看」。</p> : null}
      <article className={`back-preview-card ${isPending(unit) ? "is-pending" : ""}`} aria-label="today's postcard">
        <button type="button" className="back-preview-main" onClick={onEnter}>
          <span>{isPending(unit) ? "之前先放下的一张卡" : "收到一封来自过去的信"}</span>
          <strong>{cardTitle(unit)}</strong>
          <blockquote>“{unit.rawText}”</blockquote>
        </button>
        <div className="back-preview-actions">
          <button type="button" onClick={onPutBack}>休息一下</button>
          <button type="button" onClick={onEnter}>回去看看</button>
        </div>
      </article>
      <CardArrows index={index} count={count} onMove={onMove} />
    </div>
  );
}

function AnchorPostcard({ unit, notice, onRoute, onRecognize, onPutBack }: { unit: MemoryUnit; notice: string; onRoute: (route: DeckRoute) => void; onRecognize: () => void; onPutBack: () => void }) {
  const pending = isPending(unit);
  return (
    <div className="back-anchor-stage">
      <article className={`receipt-postcard back-anchor-postcard ${pending ? "is-pending" : ""}`} aria-label="anchor postcard">
        <section className="receipt-postcard-annotation back-anchor-annotation" aria-label="AI annotation">
          <div className="back-anchor-meta"><span>{formatMemoryTime(unit.createdAt)}</span></div>
          <p className="back-lookback-question">这是你当时先记下还没来得及完善的，有没有想起当时没说完的话</p>
          {pending ? <p className="demo-guide back-demo-guide" aria-label="体验引导">体验 05 / 05　从「回到一个曾经的我」走进去，再补一句现在想起的话。</p> : null}
          <RouteRows unit={unit} onRoute={onRoute} />
          {pending ? <div className="back-pending-actions"><button type="button" onClick={onRecognize}>是的，就这样</button><button type="button">改一点</button><button type="button" onClick={onPutBack}>还是先放着</button></div> : null}
          {notice ? <p className="back-card-notice" role="status">{notice}</p> : null}
          <button type="button" className="back-anchor-close" onClick={onPutBack}>← 收回这张卡</button>
        </section>
        <div className="receipt-postcard-divider" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div>
        <section className="receipt-postcard-raw back-anchor-raw" aria-label="rawText writing area">
          <div className="receipt-stamp-box back-empty-stamp" aria-hidden="true" />
          <div className="back-raw-text ruled-text-area"><blockquote>“{unit.rawText}”</blockquote></div>
          <div className="receipt-zip-row" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>
        </section>
      </article>
    </div>
  );
}

function AnchorBackdrop({ unit }: { unit: MemoryUnit }) {
  return (
    <article className="receipt-postcard back-deck-anchor-backdrop" aria-hidden="true">
      <section className="receipt-postcard-annotation"><span>最初的锚点</span><h2>{cardTitle(unit)}</h2><p>{afterglowText(unit.possibleAfterglow)}</p></section>
      <div className="receipt-postcard-divider">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div>
      <section className="receipt-postcard-raw"><blockquote>“{unit.rawText}”</blockquote></section>
    </article>
  );
}

function PathDeck({ anchor, route, cards, index, noteOpen, noteText, notePlace, notice, onMove, onRouteSwitch, onNoteOpen, onNoteText, onNotePlace, onSaveNote, onCancelNote, onRecord, onBack, onRestart, onCloseAll }: { anchor: MemoryUnit; route: DeckRoute; cards: MemoryUnit[]; index: number; noteOpen: boolean; noteText: string; notePlace: string; notice: string; onMove: (direction: -1 | 1) => void; onRouteSwitch: (route: DeckRoute) => void; onNoteOpen: () => void; onNoteText: (value: string) => void; onNotePlace: (value: string) => void; onSaveNote: () => void; onCancelNote: () => void; onRecord: () => void; onBack: () => void; onRestart: () => void; onCloseAll: () => void }) {
  const [transition, setTransition] = useState<"next" | "previous" | null>(null);
  const [enteredFrom, setEnteredFrom] = useState<"next" | "previous" | null>(null);
  const [dragX, setDragX] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const unit = cards[index] ?? null;
  const backCards = cards.slice(index + 1, index + 5);

  useEffect(() => {
    if (!enteredFrom) return;
    const timer = window.setTimeout(() => setEnteredFrom(null), 380);
    return () => window.clearTimeout(timer);
  }, [enteredFrom]);

  function requestMove(direction: -1 | 1) {
    if (transition || index + direction < 0 || index + direction > cards.length) return;
    setTransition(direction === 1 ? "next" : "previous");
    window.setTimeout(() => {
      onMove(direction);
      setDragX(0);
      setTransition(null);
      setEnteredFrom(direction === 1 ? "next" : "previous");
    }, 280);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (transition || event.button !== 0 || isCardControl(event.target)) return;
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (pointerStart.current === null || transition) return;
    const distance = Math.max(-116, Math.min(116, event.clientX - pointerStart.current));
    setDragX(distance);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) >= 72) requestMove(distance < 0 ? 1 : -1);
    else setDragX(0);
  }

  if (!unit) return <DeckEnd route={route} count={cards.length} onRestart={onRestart} onBack={onBack} onCloseAll={onCloseAll} />;
  const cardStyle = { "--deck-drag-x": `${dragX}px`, "--deck-drag-y": `${Math.abs(dragX) * 0.035}px`, "--deck-drag-rotate": `${dragX * 0.018}deg` } as CSSProperties;
  const cardClass = ["receipt-postcard", "back-deck-postcard", transition ? `is-leaving-${transition}` : "", enteredFrom ? `enters-from-${enteredFrom}` : ""].filter(Boolean).join(" ");

  return (
    <div className="back-deck-stage">
      <p className="back-deck-origin">最初来自：{cardTitle(anchor)}</p>
      <div className="back-deck-stack" aria-hidden="true">{backCards.map((card, stackIndex) => <div className="back-deck-back-card" key={card.id} style={getStackStyle(stackIndex)}><span>{cardTitle(card)}</span></div>)}</div>
      <article className={cardClass} aria-label="deck postcard" style={cardStyle} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; setDragX(0); }}>
        <section className="receipt-postcard-annotation back-deck-annotation">
          <p className="back-deck-afterglow">{formatAfterglowLines(unit.possibleAfterglow)}</p>
          <RouteRows unit={unit} onRoute={onRouteSwitch} />
          {unit.reflectionEntries?.length ? <div className="back-note-list">{unit.reflectionEntries.map((entry) => <p key={entry.id}><span>{formatMemoryTime(entry.createdAt)}{entry.placeLabel ? ` · ${entry.placeLabel}` : ""}</span>{entry.text}</p>)}</div> : null}
        </section>
        <div className="receipt-postcard-divider" aria-hidden="true">{Array.from({ length: 12 }, (_, itemIndex) => <span key={itemIndex} />)}</div>
        <section className="receipt-postcard-raw back-anchor-raw">
          <div className="receipt-stamp-box back-empty-stamp" aria-hidden="true" />
          <div className="back-raw-text ruled-text-area"><blockquote>“{unit.rawText}”</blockquote></div>
          {noteOpen ? <label className="back-inline-note"><textarea aria-label="补在原文之后" value={noteText} onChange={(event) => onNoteText(event.target.value)} /><input value={notePlace} placeholder="此刻地点（可选）" onChange={(event) => onNotePlace(event.target.value)} /></label> : null}
          <div className="receipt-zip-row" aria-hidden="true">{Array.from({ length: 5 }, (_, itemIndex) => <span key={itemIndex} />)}</div>
        </section>
      </article>
      <div className="back-deck-controls"><button type="button" onClick={noteOpen ? onSaveNote : onNoteOpen}>{noteOpen ? "提交" : "补一句"}</button>{noteOpen ? <button type="button" onClick={onCancelNote}>撤回</button> : null}<button type="button" onClick={onRecord}>又想起一些</button><CardArrows index={index} count={cards.length} onMove={requestMove} /><button type="button" onClick={onBack}>返回</button></div>
      {notice ? <p className="back-card-notice" role="status">{notice}</p> : null}
    </div>
  );
}

function DeckEnd({ route, count, onRestart, onBack, onCloseAll }: { route: DeckRoute; count: number; onRestart: () => void; onBack: () => void; onCloseAll: () => void }) {
  return <article className="back-deck-end"><p>这一叠先看到这里。</p><span>你刚刚经过了 {count} 张和「{route.label}」有关的卡。</span><button type="button" onClick={onBack}>回到原来的卡</button><button type="button" onClick={onRestart}>再看一遍</button><button type="button" onClick={onCloseAll}>收回去</button></article>;
}

function RouteRows({ unit, onRoute }: { unit: MemoryUnit; onRoute: (route: DeckRoute) => void }) {
  return <div className="back-route-row" aria-label="ways back">{getRoutes(unit).map((route) => <button key={route.key} type="button" onClick={(event) => { event.stopPropagation(); onRoute(route); }}><span>{route.kicker}</span><strong>{route.label}</strong><i aria-hidden="true">→</i></button>)}</div>;
}

function ReadingFocus({ unit, onClose }: { unit: MemoryUnit; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="back-reading-focus" role="dialog" aria-label="focused reading"><button type="button" className="back-focus-backdrop" onClick={onClose} aria-label="收回阅读" /><article><button type="button" className="back-focus-close" onClick={onClose}>收回</button><span>你当时写下</span><blockquote>“{unit.rawText}”</blockquote><span>我当时先这样放着</span><p>{afterglowText(unit.possibleAfterglow)}</p></article></div>;
}

function RouteSwitchDialog({ current, next, onCancel, onConfirm }: { current: DeckRoute; next: DeckRoute; onCancel: () => void; onConfirm: () => void }) {
  return <div className="back-route-switch" role="dialog" aria-label="switch path"><p>要换一条路吗？</p><span>当前：{current.label}</span><span>接下来：{next.label}</span><div><button type="button" onClick={onCancel}>取消</button><button type="button" onClick={onConfirm}>走这条路</button></div></div>;
}

function CardArrows({ index, count, onMove }: { index: number; count: number; onMove: (direction: -1 | 1) => void }) {
  return <nav className="back-card-switcher" aria-label="postcard navigation"><button type="button" aria-label="上一张" onClick={() => onMove(-1)} disabled={index === 0}>←</button><span>{String(Math.min(index + 1, count)).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><button type="button" aria-label="下一张" onClick={() => onMove(1)} disabled={index >= count}>→</button></nav>;
}

function getStackStyle(index: number) {
  const offsets = [
    { x: 9, y: 11, rotate: -0.7 },
    { x: -10, y: 22, rotate: 1.1 },
    { x: 17, y: 33, rotate: -1.35 },
    { x: -15, y: 42, rotate: 0.75 },
  ];
  const offset = offsets[index] ?? offsets[offsets.length - 1];
  return { "--stack-x": `${offset.x}px`, "--stack-y": `${offset.y}px`, "--stack-rotate": `${offset.rotate}deg`, "--stack-scale": `${1 - index * 0.006}`, "--stack-opacity": `${0.52 - index * 0.07}`, zIndex: 4 - index } as CSSProperties;
}

function isCardControl(target: EventTarget | null) {
  const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  return Boolean(element?.closest("button, textarea, input"));
}

function getRoutes(unit: MemoryUnit): DeckRoute[] {
  return [
    { key: "moment", label: unit.momentCandidate.label, kicker: "回到一个时刻" },
    { key: "world", label: unit.worldCandidate.label, kicker: "回到一个世界" },
    { key: "presence", label: unit.presenceCandidate.label, kicker: "回到一个存在" },
    { key: "self", label: unit.selfCandidate.label, kicker: "回到一个曾经的我" },
  ];
}

function buildDeck(units: MemoryUnit[], anchor: MemoryUnit, route: DeckRoute) {
  return [...units]
    .map((unit) => ({ unit, score: getRelationScore(anchor, unit, route) }))
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score)
    .map((candidate) => candidate.unit);
}

function getRouteValue(unit: MemoryUnit, key: RouteKey) {
  return key === "moment" ? unit.momentCandidate.label : key === "world" ? unit.worldCandidate.label : key === "presence" ? unit.presenceCandidate.label : unit.selfCandidate.label;
}

function getRelationScore(anchor: MemoryUnit, unit: MemoryUnit, route: DeckRoute) {
  if (unit.id === anchor.id) return 100;

  const routeValue = getRouteValue(unit, route.key);
  if (routeValue === route.label) return 80;

  const anchorValues = getRoutes(anchor).map((item) => item.label);
  const unitValues = getRoutes(unit).map((item) => item.label);
  const sharedLabels = unitValues.filter((label) => anchorValues.includes(label)).length;
  const sharedWords = sharedMeaningfulWords(anchorValues.join(" "), unitValues.join(" "));

  return sharedLabels * 20 + sharedWords * 5;
}

function sharedMeaningfulWords(first: string, second: string) {
  const firstWords = first.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? [];
  const secondWords = new Set(second.match(/[A-Za-z0-9]+|[\u4e00-\u9fa5]{2,}/g) ?? []);

  return [...new Set(firstWords)].filter((word) => word.length > 1 && secondWords.has(word)).length;
}

function buildReturnPool(units: MemoryUnit[], anchor: BackAnchor, backText: string) {
  return [...units].map((unit) => ({ unit, score: getReturnScore(unit, anchor, backText) })).filter((candidate) => candidate.score > 0).sort((first, second) => second.score - first.score).map((candidate) => candidate.unit);
}

function prioritizePreferredUnit(units: MemoryUnit[], preferredUnitId: string | null | undefined) {
  if (!preferredUnitId) return units;

  const preferredUnit = units.find((unit) => unit.id === preferredUnitId);
  return preferredUnit ? [preferredUnit, ...units.filter((unit) => unit.id !== preferredUnitId)] : units;
}

function getReturnScore(unit: MemoryUnit, anchor: BackAnchor, backText: string) {
  const text = [unit.rawText, unit.possibleAfterglow, unit.momentCandidate.label, unit.worldCandidate.label, unit.presenceCandidate.label, unit.selfCandidate.label].join(" ");
  const anchors: Record<BackAnchor, string[]> = { empty: ["空", "孤独", "结束", "夜"], tired: ["累", "疲惫", "撑不住"], self: ["我", "自己", "短发"], world: ["东京", "上海", "作品", "美术馆"], serendipity: [] };
  const hits = anchors[anchor].filter((word) => text.includes(word)).length;
  const words = backText.trim().split(/\s+/).filter((word) => word.length > 1);
  const typedHits = words.filter((word) => text.includes(word)).length;
  const ageDays = Math.max(0, (Date.now() - new Date(unit.createdAt).getTime()) / 86_400_000);
  const distance = Math.min(1, ageDays / 30);
  const recentlyRecorded = ageDays < 1 ? 0.24 : 0;

  return 0.42 + hits * 0.1 + typedHits * 0.12 + distance * 0.08 + recentlyRecorded + (isPending(unit) ? 0.14 : 0.08);
}

function cardTitle(unit: MemoryUnit) {
  return unit.userState?.userRenamedLabel ?? unit.selfCandidate.label;
}

function isPending(unit: MemoryUnit) {
  return unit.status === "deferred";
}

function afterglowText(value: string) {
  return value.replace("原话先保留，", "").replace(/之后你可以再改。?/g, "");
}

function formatAfterglowLines(value: string) {
  return afterglowText(value).split(/(?<=[。！？])/).filter(Boolean).join("\n");
}

function formatMemoryTime(createdAt: string) {
  return new Date(createdAt).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
