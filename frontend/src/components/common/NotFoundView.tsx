import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="text-sm font-medium text-subtle">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-subtle">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-2 underline">
        Go to the homepage
      </Link>
    </div>
  );
}
