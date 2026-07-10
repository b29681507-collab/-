type RecordSlipProps = {
  rawText: string;
  onRawTextChange: (value: string) => void;
  onLeave: () => void;
  onBack: () => void;
  saveRawText: (value: string) => void;
  instant?: boolean;
};

export function RecordSlip({
  rawText,
  onRawTextChange,
  onLeave,
  onBack,
  saveRawText,
  instant = false,
}: RecordSlipProps) {
  return (
    <section className={`record-slip-stage ${instant ? "is-instant" : ""}`} aria-label="record note slip">
      <nav className="record-slip-top-actions" aria-label="record modes">
        <button type="button" disabled>
          record
        </button>
        <button type="button" onClick={onBack}>
          back
        </button>
      </nav>
      {!instant ? <p className="demo-guide" aria-label="体验引导">体验 01 / 05　先读这段已经留下的话，再点「留下」。</p> : null}
      <label className="record-slip" aria-label="record rawText">
        <textarea
          value={rawText}
          placeholder="先留下几个词"
          onBlur={() => saveRawText(rawText)}
          onChange={(event) => onRawTextChange(event.target.value)}
          spellCheck={false}
        />
      </label>
      <button className="record-leave-button" type="button" onClick={onLeave}>
        留下
      </button>
    </section>
  );
}
