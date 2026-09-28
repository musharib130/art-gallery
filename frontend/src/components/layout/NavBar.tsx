"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/stores/auth";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-muted font-medium" : "text-subtle hover:text-foreground"}`}
    >
      {children}
    </Link>
  );
}

export function NavBar() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 text-lg font-semibold tracking-tight">
          Art Gallery
        </Link>
        <NavLink href="/">Feed</NavLink>
        <NavLink href="/explore">Explore</NavLink>
        <NavLink href="/artists">Artists</NavLink>
        {user && <NavLink href="/saved">Saved</NavLink>}
        <div className="ml-auto flex items-center gap-2">
          {!ready ? null : user ? (
            <>
              {user.role === "artist" ? (
                <Link
                  href="/dashboard"
                  className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
                >
                  Dashboard
                </Link>
              ) : (
                <Link href="/account" className="text-sm text-subtle hover:text-foreground">
                  {user.display_name}
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-md px-3 py-1.5 text-sm text-subtle hover:bg-muted hover:text-foreground"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <Link
                href="/signup"
                className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
