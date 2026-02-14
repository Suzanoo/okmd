"use client";

import { useState } from "react";
import FileDropzone from "./FileDropzone";

type Props = {
  isLoading: boolean;
  sourceLabel: string;
  onDownloadTemplate: () => void;
  onResetToTemplate: () => void;
  onUpload: (file: File) => void;
};

export default function DataSettingsPanel({
  isLoading,
  sourceLabel,
  onDownloadTemplate,
  onResetToTemplate,
  onUpload,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-left shadow-card hover:bg-surface"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            ⚙ Data Settings
          </span>
          <span className="text-xs text-muted-foreground">· {sourceLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-3 p-4 shadow-card">
            <div className="text-sm font-semibold text-foreground">
              Template
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Download a sample file to see the required format.
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-xl bg-surface px-3 py-2 text-sm text-foreground shadow-card hover:bg-surface-2 disabled:opacity-60"
                onClick={onDownloadTemplate}
                disabled={isLoading}
              >
                Download template
              </button>

              <button
                className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-surface disabled:opacity-60"
                onClick={onResetToTemplate}
                disabled={isLoading}
              >
                Reset to template
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <FileDropzone onFile={onUpload} disabled={isLoading} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
