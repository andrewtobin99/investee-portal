"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/format";

export interface FileValidationOptions {
  /** Max size per file in bytes. */
  maxSize?: number;
  /** Accepted MIME types / extensions for the file picker + validation. */
  accept?: string[];
}

const DEFAULT_MAX = 25 * 1024 * 1024; // 25 MB

/** Returns an error string if the file is invalid, else null. */
export function validateFile(file: File, opts: FileValidationOptions): string | null {
  const maxSize = opts.maxSize ?? DEFAULT_MAX;
  if (file.size > maxSize) {
    return `Exceeds the ${formatFileSize(maxSize)} limit (${formatFileSize(file.size)}).`;
  }
  if (opts.accept && opts.accept.length > 0) {
    const ok = opts.accept.some((a) =>
      a.startsWith(".")
        ? file.name.toLowerCase().endsWith(a.toLowerCase())
        : file.type === a || file.type.startsWith(a.replace("/*", "/")),
    );
    if (!ok) return "This file type isn't allowed.";
  }
  return null;
}

/**
 * Reusable drag-and-drop + file-picker zone. Stateless w.r.t. uploads — it just
 * surfaces validated files to the parent via onFiles. Validation errors for
 * rejected files are reported through onReject so the parent can show them.
 */
export function FileUploadZone({
  onFiles,
  onReject,
  options = {},
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  onReject?: (rejections: { name: string; reason: string }[]) => void;
  options?: FileValidationOptions;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted: File[] = [];
    const rejected: { name: string; reason: string }[] = [];
    Array.from(files).forEach((f) => {
      const err = validateFile(f, options);
      if (err) rejected.push({ name: f.name, reason: err });
      else accepted.push(f);
    });
    if (accepted.length) onFiles(accepted);
    if (rejected.length && onReject) onReject(rejected);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-lg border-2 border-dashed bg-card p-6 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        accept={options.accept?.join(",")}
        disabled={disabled}
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm">
          <label
            htmlFor={inputId}
            className="cursor-pointer font-medium text-primary hover:underline"
          >
            Click to upload
          </label>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          {options.maxSize
            ? `Up to ${formatFileSize(options.maxSize)} per file`
            : "Multiple files supported"}
        </p>
      </div>
    </div>
  );
}
