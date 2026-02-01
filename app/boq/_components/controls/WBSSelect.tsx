"use client";

type Props = {
  label: string;
  value: string | null;
  options: string[];
  placeholder?: string;
  onChange: (v: string | null) => void;
  disabled?: boolean;
};

export default function WBSSelect({
  label,
  value,
  options,
  placeholder = "Select…",
  onChange,
  disabled,
}: Props) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="h-8 rounded-xl border bg-background px-2 text-xs disabled:opacity-60"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
