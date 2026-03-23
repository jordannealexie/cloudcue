export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 text-[var(--text-primary)] page-enter">
      <h1 className="text-[36px] font-extrabold tracking-[-0.03em]">Privacy Policy</h1>
      <p className="mt-3 text-[14px] text-[var(--text-secondary)]">Last updated: March 23, 2026</p>

      <section className="mt-8 space-y-4 text-[14px] leading-7 text-[var(--text-secondary)]">
        <p>
          CloudCue stores account and workspace data needed to provide collaboration features such as projects, pages,
          comments, notifications, and uploads.
        </p>
        <p>
          We use cookies for authentication and session continuity. You can request account removal and associated data
          cleanup by contacting your workspace administrator.
        </p>
        <p>
          We do not sell personal data. This policy may be updated as features evolve.
        </p>
      </section>
    </main>
  );
}
