"use client";

type Props = {
  sheets: string[];
  value: string;
  onChange: (sheetName: string) => void;
  disabled?: boolean;
};

export default function SheetPicker({
  sheets,
  value,
  onChange,
  disabled,
}: Props) {
  const isDisabled = disabled || sheets.length === 0;

  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
        Select Sheet
      </div>

      <select
        className="mt-2 h-10 w-full rounded-xl border border-[color:var(--color-border)]
          bg-[color:var(--color-surface-2)] px-3 text-sm text-[color:var(--color-foreground)]
          shadow-[var(--shadow-input)] outline-none
          focus:ring-2 focus:ring-[color:var(--color-accent)]/35 disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
      >
        <option value="" disabled>
          {sheets.length === 0
            ? "— ไม่มี sheet ที่ผ่านเงื่อนไข —"
            : "เลือก sheet"}
        </option>

        {sheets.map((name) => (
          <option key={name} value={name}>
            ✅ {name}
          </option>
        ))}
      </select>

      <div className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
        แสดงเฉพาะ sheet ที่มี column ครบตามเงื่อนไข
      </div>
    </section>
  );
}
