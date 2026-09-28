"use client";

import { useState } from "react";

import { SingleImagePicker } from "@/components/common/ImagePicker";
import { Button, ErrorText, Field, Input, TextArea } from "@/components/common/ui";
import type { Gallery } from "@/lib/api";

export interface GalleryValues {
  title: string;
  description: string;
  cover_image_url: string;
}

export function GalleryForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Gallery;
  submitLabel: string;
  onSubmit: (values: GalleryValues) => Promise<void>;
}) {
  const [values, setValues] = useState<GalleryValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.cover_image_url) {
      setError("Upload a cover image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
      <Field label="Title">
        <Input
          required
          maxLength={200}
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <TextArea
          maxLength={5000}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </Field>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Cover image</span>
        <SingleImagePicker
          value={values.cover_image_url}
          onChange={(url) => setValues({ ...values, cover_image_url: url })}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
