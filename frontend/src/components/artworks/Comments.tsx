"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar, Button, ErrorText, TextArea } from "@/components/common/ui";
import { api, type Comment } from "@/lib/api";
import { useAuth } from "@/stores/auth";
import { usePaged } from "@/lib/hooks";

export function Comments({
  artworkId,
  artworkOwnerId,
  onCountChange,
}: {
  artworkId: string;
  artworkOwnerId: string;
  onCountChange: (delta: number) => void;
}) {
  const user = useAuth((s) => s.user);
  const { items, setItems, hasMore, loadMore, loading } = usePaged<Comment>(
    `/artworks/${artworkId}/comments`,
    50,
  );
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const comment = await api.post<Comment>(`/artworks/${artworkId}/comments`, { body });
      setItems([...items, comment]);
      setBody("");
      onCountChange(1);
    });
  };

  const saveEdit = () =>
    run(async () => {
      if (!editing) return;
      const updated = await api.patch<Comment>(`/comments/${editing.id}`, { body: editing.body });
      setItems(items.map((c) => (c.id === updated.id ? updated : c)));
      setEditing(null);
    });

  const remove = (id: string) =>
    run(async () => {
      await api.delete(`/comments/${id}`);
      setItems(items.filter((c) => c.id !== id));
      onCountChange(-1);
    });

  return (
    <section className="mt-4 flex flex-col gap-4 border-t border-line pt-6">
      <h2 className="font-semibold">Comments</h2>

      {items.length === 0 && !loading && <p className="text-sm text-subtle">No comments yet.</p>}
      <ul className="flex flex-col gap-4">
        {items.map((c) => {
          const mine = user?.id === c.author.id;
          const canDelete = mine || user?.id === artworkOwnerId;
          return (
            <li key={c.id} className="flex gap-3">
              <Avatar url={c.author.avatar_url} name={c.author.display_name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link href={`/artists/${c.author.username}`} className="font-medium">
                    {c.author.display_name}
                  </Link>{" "}
                  <span className="text-subtle">{new Date(c.created_at).toLocaleDateString("en-US")}</span>
                </p>
                {editing?.id === c.id ? (
                  <div className="mt-1 flex flex-col gap-2">
                    <TextArea
                      value={editing.body}
                      maxLength={2000}
                      onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} disabled={busy || !editing.body.trim()}>
                        Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm">{c.body}</p>
                )}
                {editing?.id !== c.id && (mine || canDelete) && (
                  <div className="mt-1 flex gap-3 text-xs text-subtle">
                    {mine && (
                      <button className="hover:underline" onClick={() => setEditing({ id: c.id, body: c.body })}>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button className="hover:underline" onClick={() => remove(c.id)} disabled={busy}>
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button variant="ghost" onClick={loadMore} disabled={loading}>
          Show more comments
        </Button>
      )}

      <ErrorText>{error}</ErrorText>
      {user ? (
        <form onSubmit={post} className="flex flex-col gap-2">
          <TextArea
            placeholder="Add a comment"
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
          />
          <div>
            <Button type="submit" disabled={busy || !body.trim()}>
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-subtle">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to comment.
        </p>
      )}
    </section>
  );
}
