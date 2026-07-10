type EditablePaperFieldProps = {
  className?: string;
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
};

export function EditablePaperField({
  className = "",
  multiline = false,
  value,
  onChange,
  onSave,
}: EditablePaperFieldProps) {
  const fieldClassName = `editable-paper-field ${className}`.trim();

  if (multiline) {
    return (
      <textarea
        className={fieldClassName}
        value={value}
        onBlur={() => onSave(value)}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
    );
  }

  return (
    <input
      className={fieldClassName}
      value={value}
      onBlur={() => onSave(value)}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
    />
  );
}
