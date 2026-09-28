"use client";

import { useState } from "react";

import { SingleImagePicker } from "@/components/common/ImagePicker";
import { RequireAuth } from "@/components/common/RequireAuth";
import { Button, ErrorText, Field, Input, PageHeader, TextArea } from "@/components/common/ui";
import { api, type UserMe } from "@/lib/api";
import { useAuth } from "@/stores/auth";

function ProfileForm({ user }: { user: UserMe }) {
  const setUser = useAuth((s) => s.setUser);
  const [form, setForm] = useState({
    display_name: user.display_name,
    bio: user.bio ?? "",
    avatar_url: user.avatar_url ?? "",
  });
  const [status, setStatus] = useState<{ error?: string; saved?: boolean }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api.patch<UserMe>("/auth/me", {
        display_name: form.display_name,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      });
      setUser(updated);
      setStatus({ saved: true });
    } catch (err) {
      setStatus({ error: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-lg flex-col gap-5">
      <PageHeader
        title="Account"
        subtitle={`@${user.username} · ${user.email} · ${user.role === "artist" ? "Artist" : "Member"}`}
      />
      <Field label="Name">
        <Input
          required
          maxLength={100}
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
        />
      </Field>
      <Field label="Bio">
        <TextArea maxLength={2000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Avatar</span>
        <SingleImagePicker value={form.avatar_url} onChange={(url) => setForm({ ...form, avatar_url: url })} />
      </div>
      <ErrorText>{status.error}</ErrorText>
      {status.saved && <p className="text-sm text-subtle">Saved.</p>}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export function AccountForm() {
  return <RequireAuth>{(user) => <ProfileForm user={user} />}</RequireAuth>;
}
