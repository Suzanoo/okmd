// app/report/progress/_components/FileActions.tsx
// Download template / Reset / Upload

"use client";

import FileDropzone from "./FileDropzone";

type Props = {
  isLoading: boolean;
  sourceLabel: string;
  onDownloadTemplate: () => void;
  onResetToTemplate: () => void;
  onUpload: (file: File) => void;
};

export default function FileActions({
  isLoading,
  sourceLabel,
  onDownloadTemplate,
  onResetToTemplate,
  onUpload,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-white/90">Data</div>
        <div className="mt-1 text-xs text-white/60">{sourceLabel}</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/85 hover:bg-white/15"
            onClick={onDownloadTemplate}
            disabled={isLoading}
          >
            Download template
          </button>

          <button
            className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/75 hover:bg-white/10"
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
  );
}
