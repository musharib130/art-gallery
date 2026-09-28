"use client";

import { useState } from "react";

import { MultiImagePicker } from "@/components/common/ImagePicker";
import { Button, ErrorText, Field, Input, TextArea } from "@/components/common/ui";
import type { Artwork } from "@/lib/api";

export interface ArtworkValues {
  title: string;
  description: string;
  is_for_sale: boolean;
  /** Cents, or null when no price has ever been set. */
  price_cents: number | null;
  images: string[];
  primary_index: number;
}

function initialValues(artwork?: Artwork): ArtworkValues {
  if (!artwork) {
    return { title: "", description: "", is_for_sale: false, price_cents: null, images: [], primary_index: 0 };
  }
  const primary = artwork.images.findIndex((i) => i.is_primary);
  return {
    title: artwork.title,
    description: artwork.description,
    is_for_sale: artwork.is_for_sale,
    // The owner receives the stored price even while the artwork is not for sale.
    price_cents: artwork.price_cents,
    images: artwork.images.map((i) => i.url),
    primary_index: Math.max(primary, 0),
  };
}

export function ArtworkForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Artwork;
  submitLabel: string;
  onSubmit: (values: ArtworkValues) => Promise<void>;
}) {
  const [values, setValues] = useState<ArtworkValues>(() => initialValues(initial));
  const [price, setPrice] = useState(
    values.price_cents === null ? "" : (values.price_cents / 100).toFixed(2),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let price_cents: number | null = null;
    if (price.trim()) {
      const dollars = Number(price);
      if (!Number.isFinite(dollars) || dollars <= 0) {
        setError("Enter a price greater than $0.");
        return;
      }
      price_cents = Math.round(dollars * 100);
    }
    if (values.is_for_sale && price_cents === null) {
      setError("An artwork that is for sale needs a price.");
      return;
    }
    if (values.images.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...values, price_cents });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-5">
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

      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium">Sale</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.is_for_sale}
            onChange={(e) => setValues({ ...values, is_for_sale: e.target.checked })}
          />
          For sale
        </label>
        <Field
          label="Price (USD)"
          hint={
            values.is_for_sale
              ? "Required while the artwork is for sale."
              : "Optional. Kept but hidden from visitors while the artwork is not for sale."
          }
        >
          <Input
            inputMode="decimal"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required={values.is_for_sale}
          />
        </Field>
      </fieldset>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Images</span>
        <MultiImagePicker
          images={values.images}
          primaryIndex={values.primary_index}
          onChange={(images, primary_index) => setValues({ ...values, images, primary_index })}
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
