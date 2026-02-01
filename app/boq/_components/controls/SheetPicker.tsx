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
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium">Select Sheet</div>

      <select
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
           focus:outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || sheets.length === 0}
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
    </div>
  );
}
