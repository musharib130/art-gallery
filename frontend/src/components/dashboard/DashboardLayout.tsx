"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { NotFoundView } from "@/components/common/NotFoundView";
import { Loading } from "@/components/common/ui";
import type { UserMe } from "@/lib/api";
import { useAuth } from "@/stores/auth";

/**
 * The artist's signed-in account. Only valid inside <DashboardLayout>, which
 * renders nothing below it unless an artist is logged in.
 */
export function useDashboardArtist(): UserMe {
  const user = useAuth((s) => s.user);
  if (!user || user.role !== "artist") throw new Error("useDashboardArtist used outside the dashboard");
  return user;
}

const LINKS = [
  { href: "/dashboard", label: "Galleries", exact: true },
  { href: "/dashboard/galleries/new", label: "New gallery", exact: true },
];

function SideLink({ href, label, exact }: { href: string; label: string; exact: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm ${active ? "bg-muted font-medium" : "text-subtle hover:text-foreground"}`}
    >
      {label}
    </Link>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const logout = useAuth((s) => s.logout);
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Art Gallery <span className="font-normal text-subtle">Dashboard</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="rounded-md px-3 py-1.5 text-sm text-subtle hover:bg-muted hover:text-foreground">
              View site
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="rounded-md px-3 py-1.5 text-sm text-subtle hover:bg-muted hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:flex-row">
        <nav className="flex shrink-0 gap-1 md:w-48 md:flex-col">
          {LINKS.map((l) => (
            <SideLink key={l.href} {...l} />
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

/** Artists only: everyone else, including visitors, gets the 404 page. */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  if (!ready) return <Loading />;
  if (!user || user.role !== "artist") return <NotFoundView />;
  return <Shell>{children}</Shell>;
}
