"use client";

import { useRef, useState } from "react";

import { Button, ErrorText } from "@/components/common/ui";
import { uploadImage } from "@/lib/api";

const MAX_IMAGES = 5;

async function uploadAll(files: FileList | null): Promise<string[]> {
  return Promise.all(Array.from(files ?? []).map(uploadImage));
}

/** One image (gallery cover, avatar). */
export function SingleImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {value && <img src={value} alt="" className="aspect-[4/3] w-full max-w-sm rounded-lg object-cover" />}
      <div>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={async (e) => {
          setBusy(true);
          setError(null);
          try {
            const [url] = await uploadAll(e.target.files);
            if (url) onChange(url);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** Ordered list of 1-5 artwork images with one marked primary. */
export function MultiImagePicker({
  images,
  primaryIndex,
  onChange,
}: {
  images: string[];
  primaryIndex: number;
  onChange: (images: string[], primaryIndex: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = MAX_IMAGES - images.length;

  function remove(i: number) {
    const next = images.filter((_, j) => j !== i);
    // Keep the same image primary; if it was removed, fall back to the first.
    const primary = i === primaryIndex ? 0 : i < primaryIndex ? primaryIndex - 1 : primaryIndex;
    onChange(next, next.length ? primary : 0);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    const primary = primaryIndex === i ? j : primaryIndex === j ? i : primaryIndex;
    onChange(next, primary);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {images.map((url, i) => (
          <div key={url + i} className="flex flex-col gap-1.5">
            <div
              className={`relative aspect-square overflow-hidden rounded-lg bg-muted ${i === primaryIndex ? "ring-2 ring-foreground" : ""}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === primaryIndex && (
                <span className="absolute left-1.5 top-1.5 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                  Primary
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
              {i !== primaryIndex && (
                <button type="button" className="underline" onClick={() => onChange(images, i)}>
                  Make primary
                </button>
              )}
              <button type="button" aria-label="Move left" className="px-1" onClick={() => move(i, -1)}>
                ←
              </button>
              <button type="button" aria-label="Move right" className="px-1" onClick={() => move(i, 1)}>
                →
              </button>
              <button type="button" className="text-red-600 underline" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || remaining <= 0}
          onClick={() => input.current?.click()}
        >
          {busy ? "Uploading…" : "Add images"}
        </Button>
        <span className="text-xs text-subtle">
          {images.length}/{MAX_IMAGES} images. At least one is required.
        </span>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []).slice(0, remaining);
          setBusy(true);
          setError(null);
          try {
            const urls = await Promise.all(files.map(uploadImage));
            onChange([...images, ...urls], images.length ? primaryIndex : 0);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
