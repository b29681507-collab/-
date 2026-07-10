import { TreasuryFields } from "./ReceiptPostcard";

type RecordToReceiptTransitionProps = {
  rawText: string;
  treasury: TreasuryFields;
  onDone: () => void;
};

export function RecordToReceiptTransition({
  rawText,
  treasury,
  onDone,
}: RecordToReceiptTransitionProps) {
  return (
    <section
      className="record-to-receipt-stage"
      aria-label="record to receipt transition"
      onAnimationEnd={(event) => {
        if (event.animationName === "received-stamp") {
          onDone();
        }
      }}
    >
      <article className="transition-postcard" aria-label="forming receipt postcard">
        <section className="transition-annotation" aria-label="AI annotation">
          <div>
            <span>moment</span>
            <p>{treasury.moment}</p>
          </div>
          <div>
            <span>world</span>
            <p>{treasury.world}</p>
          </div>
          <div>
            <span>presence</span>
            <p>{treasury.presence}</p>
          </div>
          <div>
            <span>self</span>
            <p>{treasury.self}</p>
          </div>
        </section>

        <div className="transition-divider" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <section className="transition-raw-area" aria-label="rawText settled into postcard">
          <div className="transition-stamp-box" aria-hidden="true" />
          <p>{rawText}</p>
          <div className="transition-zip-row" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <div className="received-stamp" aria-hidden="true">
          RECEIVED
        </div>
      </article>

      <div className="transition-slip" aria-hidden="true">
        <p>{rawText}</p>
      </div>
    </section>
  );
}
