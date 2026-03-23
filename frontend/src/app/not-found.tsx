import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-4 text-[var(--text-primary)]">
      <section className="surface-card max-w-xl p-8 text-center">
        <svg width="140" height="86" viewBox="0 0 140 86" fill="none" className="mx-auto mb-5" aria-hidden="true">
          <path d="M24 58h78c12 0 22-9 22-21s-10-21-22-21c-2.3 0-4.6.4-6.6 1A24 24 0 0 0 50 20a18 18 0 0 0-28 16c0 12.2 10 22 22 22Z" stroke="#3D5387" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 50h43" stroke="#C2F04B" strokeWidth="6" strokeLinecap="round" />
          <circle cx="28" cy="18" r="5" fill="#BFA9BA" />
          <circle cx="108" cy="68" r="4" fill="#7C83AD" />
        </svg>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">404</p>
        <h1 className="mb-2 text-[32px] font-bold">Page drifted into the clouds</h1>
        <p className="mb-6 text-[14px] text-[var(--text-secondary)]">The page you requested does not exist or was moved.</p>
        <div className="flex justify-center gap-2">
          <Link href="/workspace" className="rounded-[10px] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-text)] transition hover:bg-[var(--accent-hover)]">
            Go to workspace
          </Link>
          <Link href="/dashboard" className="rounded-[10px] border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--bg-card-2)]">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
