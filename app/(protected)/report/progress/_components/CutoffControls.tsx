"use client";

type Props = {
  weeks: string[];
  cutoffDraft: string | null;
  cutoffApplied: string | null;
  onChangeDraft: (w: string | null) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
};

export default function CutoffControls({
  weeks,
  cutoffDraft,
  cutoffApplied,
  onChangeDraft,
  onApply,
  onReset,
  disabled,
}: Props) {
  const dirty = cutoffDraft !== cutoffApplied;

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          Reporting Cutoff
        </div>
        <div className="text-xs text-muted-foreground">
          Applied: {cutoffApplied ?? "—"}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Select reporting week and click{" "}
        <span className="font-semibold text-foreground">Render</span> to update
        dashboard.
      </div>

      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
        <select
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none md:max-w-xs"
          value={cutoffDraft ?? ""}
          onChange={(e) => onChangeDraft(e.target.value || null)}
          disabled={disabled}
        >
          <option value="">(No actual)</option>
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            className={[
              "rounded-xl px-4 py-2 text-sm shadow-card disabled:opacity-60",
              dirty
                ? "bg-accent text-background hover:opacity-90"
                : "bg-surface text-muted-foreground",
            ].join(" ")}
            onClick={onApply}
            disabled={disabled || !dirty}
          >
            Render
          </button>

          <button
            className="rounded-xl border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground hover:bg-surface disabled:opacity-60"
            onClick={onReset}
            disabled={disabled}
          >
            Use Auto Cutoff
          </button>
        </div>
      </div>

      {dirty ? (
        <div className="mt-2 text-xs text-muted-foreground">
          Changes not applied yet.
        </div>
      ) : null}
    </div>
  );
}
