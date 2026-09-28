"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Empty, Loading } from "@/components/common/ui";
import type { UserMe } from "@/lib/api";
import { useAuth } from "@/stores/auth";

/** Renders children only for logged-in users (optionally artists only). */
export function RequireAuth({
  artist = false,
  children,
}: {
  artist?: boolean;
  children: (user: UserMe) => React.ReactNode;
}) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <Loading />;
  if (artist && user.role !== "artist") {
    return <Empty>This area is only available to artist accounts.</Empty>;
  }
  return <>{children(user)}</>;
}
