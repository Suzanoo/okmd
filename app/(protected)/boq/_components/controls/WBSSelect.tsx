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
      <span className="text-[color:var(--color-muted-foreground)]">
        {label}
      </span>

      <select
        className="h-9 rounded-xl border border-[color:var(--color-border)]
          bg-[color:var(--color-surface-2)] px-3 text-sm text-[color:var(--color-foreground)]
          shadow-[var(--shadow-input)] outline-none
          focus:ring-2 focus:ring-[color:var(--color-accent)]/35 disabled:opacity-60"
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
