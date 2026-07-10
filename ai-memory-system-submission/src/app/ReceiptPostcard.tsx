import { ReactNode, useEffect, useState } from "react";
import { EditableRuledTextArea } from "./EditableRuledTextArea";
import { EditablePaperField } from "./EditablePaperField";
import envelopeClosed from "../assets/mailing/envelope-closed.png";
import envelopeHalfOpen from "../assets/mailing/envelope-half-open.png";
import envelopeOpen from "../assets/mailing/envelope-open.png";

export type TreasuryFields = {
  moment: string;
  world: string;
  presence: string;
  self: string;
};

type ReceiptPostcardProps = {
  mode: "record" | "receipt";
  rawText: string;
  treasury: TreasuryFields;
  onRawTextChange: (value: string) => void;
  onTreasuryChange: (field: keyof TreasuryFields, value: string) => void;
  onSend: () => void;
  onDefer: () => void;
  onBack: () => void;
  onRecord: () => void;
  saveRawText: (value: string) => void;
  saveTreasuryField: (field: keyof TreasuryFields, value: string) => void;
};

export function ReceiptPostcard({
  mode,
  rawText,
  treasury,
  onRawTextChange,
  onTreasuryChange,
  onSend,
  onDefer,
  onBack,
  onRecord,
  saveRawText,
  saveTreasuryField,
}: ReceiptPostcardProps) {
  const isReceipt = mode === "receipt";
  const [isMailing, setIsMailing] = useState(false);
  const [hasMailed, setHasMailed] = useState(false);

  useEffect(() => {
    if (!isMailing) return;

    const finishMailing = window.setTimeout(() => {
      onSend();
      setHasMailed(true);
      setIsMailing(false);
    }, 6600);

    return () => window.clearTimeout(finishMailing);
  }, [isMailing, onSend]);

  function startMailing() {
    if (isMailing) return;
    setIsMailing(true);
  }

  return (
    <div className={`receipt-postcard-stack ${isMailing ? "is-mailing" : ""}`}>
      {isReceipt && !hasMailed ? (
        <nav className="receipt-top-actions" aria-label="postcard modes">
          <button type="button" onClick={onRecord} disabled={isMailing}>
            record
          </button>
          <button type="button" onClick={onBack} disabled={isMailing}>
            back
          </button>
        </nav>
      ) : null}

      {hasMailed ? <div className="mailing-after-space" aria-hidden="true" /> : null}

      {!hasMailed ? (
        <MailingSequence isMailing={isMailing}>
          <CoreCard isReceipt={isReceipt}>
            {isReceipt ? (
              <section className="receipt-postcard-annotation" aria-label="AI annotation">
                <div className="treasury-entry">
                  <span>moment</span>
                  <EditablePaperField
                    className="receipt-treasury-field"
                    value={treasury.moment}
                    onChange={(value) => onTreasuryChange("moment", value)}
                    onSave={(value) => saveTreasuryField("moment", value)}
                  />
                </div>
                <div className="treasury-entry">
                  <span>world</span>
                  <EditablePaperField
                    className="receipt-treasury-field"
                    value={treasury.world}
                    onChange={(value) => onTreasuryChange("world", value)}
                    onSave={(value) => saveTreasuryField("world", value)}
                  />
                </div>
                <div className="treasury-entry">
                  <span>presence</span>
                  <EditablePaperField
                    className="receipt-treasury-field"
                    value={treasury.presence}
                    onChange={(value) => onTreasuryChange("presence", value)}
                    onSave={(value) => saveTreasuryField("presence", value)}
                  />
                </div>
                <div className="treasury-entry">
                  <span>self</span>
                  <EditablePaperField
                    className="receipt-treasury-field"
                    value={treasury.self}
                    onChange={(value) => onTreasuryChange("self", value)}
                    onSave={(value) => saveTreasuryField("self", value)}
                  />
                </div>
                <p className="receipt-date">2026.07.10 / bedroom desk / R-0418</p>
              </section>
            ) : (
              <section className="receipt-postcard-annotation record-blank" aria-hidden="true" />
            )}

        <div className="receipt-postcard-divider" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <section className="receipt-postcard-raw" aria-label="rawText writing area">
          <div className="receipt-stamp-box" aria-hidden="true" />
            <EditableRuledTextArea
              value={rawText}
              onChange={onRawTextChange}
              onSave={saveRawText}
              disabled={isMailing}
            />
          <div className="receipt-zip-row" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>
          </CoreCard>
        </MailingSequence>
      ) : null}

      {isReceipt && !hasMailed ? (
        <nav className="receipt-bottom-actions" aria-label="postcard actions">
          <button type="button" onClick={startMailing} disabled={isMailing}>
            可以
          </button>
          <button type="button" onClick={onDefer} disabled={isMailing}>
            先放着（继续体验）
          </button>
        </nav>
      ) : null}
      {isReceipt && !hasMailed ? <p className="demo-guide receipt-demo-guide" aria-label="体验引导">体验 02 / 05　现在不必确认，点「先放着（继续体验）」。</p> : null}

      {!isReceipt && !hasMailed ? (
        <nav className="record-send-action" aria-label="send postcard">
          <button type="button" onClick={onSend}>
            寄出
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function MailingSequence({
  isMailing,
  children,
}: {
  isMailing: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`mailing-sequence ${isMailing ? "is-active" : ""}`}>
      <div className="mailing-postcard-layer">{children}</div>
      {isMailing ? <Envelope /> : null}
    </div>
  );
}

function CoreCard({
  isReceipt,
  children,
}: {
  isReceipt: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={`receipt-postcard ${isReceipt ? "receipt-mode" : "record-mode"}`}
      aria-label="receipt postcard"
    >
      {children}
    </article>
  );
}

function Envelope() {
  return (
    <div className="mailing-envelope" aria-hidden="true">
      <img
        className="mailing-envelope-frame mailing-envelope-frame-closed"
        src={envelopeClosed}
        alt=""
      />
      <img
        className="mailing-envelope-frame mailing-envelope-frame-open"
        src={envelopeOpen}
        alt=""
      />
      <img
        className="mailing-envelope-frame mailing-envelope-frame-half"
        src={envelopeHalfOpen}
        alt=""
      />
      <div className="mailing-envelope-back" />
      <EnvelopeFlap />
      <div className="mailing-envelope-mouth" />
      <div className="mailing-envelope-front" />
      <div className="mailing-envelope-stamp">TO FUTURE</div>
    </div>
  );
}

function EnvelopeFlap() {
  return <div className="mailing-envelope-flap" />;
}
