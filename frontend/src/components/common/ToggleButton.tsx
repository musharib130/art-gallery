"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/stores/auth";

/**
 * Follow / like / save style toggle backed by PUT (on) and DELETE (off) on `path`.
 * Visitors are sent to log in.
 */
export function ToggleButton({
  path,
  active,
  onChange,
  labels,
}: {
  path: string;
  active: boolean;
  onChange: (active: boolean) => void;
  labels: [off: string, on: string];
}) {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      if (active) await api.delete(path);
      else await api.put(path);
      onChange(!active);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={active ? "secondary" : "primary"} onClick={toggle} disabled={busy} aria-pressed={active}>
      {active ? labels[1] : labels[0]}
    </Button>
  );
}
