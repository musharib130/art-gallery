import { NavBar } from "@/components/layout/NavBar";

/** Public site chrome: top navigation and a centered content column. */
export function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
