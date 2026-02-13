"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export default function FileDropzone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  const pick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      setIsOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div
      className={[
        "rounded-2xl border bg-surface p-4 shadow-card",
        "border-border",
        isOver ? "ring-2 ring-accent/30" : "",
        disabled ? "opacity-60" : "cursor-pointer hover:bg-surface-2",
      ].join(" ")}
      onClick={pick}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <div className="text-sm font-semibold text-foreground">Upload .xlsx</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Drag & drop your progress file here, or click to choose.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
