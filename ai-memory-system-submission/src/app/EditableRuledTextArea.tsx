type EditableRuledTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  disabled?: boolean;
};

export function EditableRuledTextArea({
  value,
  onChange,
  onSave,
  disabled = false,
}: EditableRuledTextAreaProps) {
  return (
    <label className="ruled-text-area" aria-label="rawText">
      <textarea
        disabled={disabled}
        value={value}
        onBlur={() => onSave(value)}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    </label>
  );
}
