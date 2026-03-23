export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 text-[var(--text-primary)] page-enter">
      <h1 className="text-[36px] font-extrabold tracking-[-0.03em]">Terms of Service</h1>
      <p className="mt-3 text-[14px] text-[var(--text-secondary)]">Last updated: March 23, 2026</p>

      <section className="mt-8 space-y-4 text-[14px] leading-7 text-[var(--text-secondary)]">
        <p>
          CloudCue is provided to help teams organize projects, pages, and tasks. By using this app, you agree to use
          it responsibly and in compliance with applicable laws.
        </p>
        <p>
          You are responsible for the content you create and share in your workspace. Do not upload unlawful, harmful,
          or infringing content.
        </p>
        <p>
          We may update these terms over time. Continued use after updates means you accept the revised terms.
        </p>
      </section>
    </main>
  );
}
