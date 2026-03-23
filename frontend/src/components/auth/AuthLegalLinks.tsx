"use client";

import { useState } from "react";
import Modal from "../ui/Modal";

interface AuthLegalLinksProps {
  leadText: string;
}

export default function AuthLegalLinks({ leadText }: AuthLegalLinksProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        {leadText}{" "}
        <button
          type="button"
          className="font-semibold text-[var(--accent)] hover:opacity-85"
          onClick={() => setTermsOpen(true)}
        >
          Terms of Service
        </button>
        {" "}and{" "}
        <button
          type="button"
          className="font-semibold text-[var(--accent)] hover:opacity-85"
          onClick={() => setPrivacyOpen(true)}
        >
          Privacy Policy
        </button>
        .
      </p>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms of Service">
        <div className="space-y-4 text-[14px] leading-6 text-[var(--text-secondary)]">
          <p>
            CloudCue helps teams plan and execute work. By using CloudCue, you agree to use the platform responsibly
            and in accordance with applicable laws.
          </p>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Acceptable use</h4>
            <p>Do not upload or distribute unlawful, harmful, or infringing content through your workspace.</p>
          </section>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Account responsibility</h4>
            <p>You are responsible for maintaining account security and activity performed under your account.</p>
          </section>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Service updates</h4>
            <p>
              We may update features and terms over time. Continued use after updates means you accept the revised
              terms.
            </p>
          </section>
        </div>
      </Modal>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy">
        <div className="space-y-4 text-[14px] leading-6 text-[var(--text-secondary)]">
          <p>
            CloudCue processes the minimum account and workspace data required to deliver collaboration features such
            as tasks, pages, comments, notifications, and file uploads.
          </p>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Authentication data</h4>
            <p>We use secure tokens and cookies to keep your session active and protect account access.</p>
          </section>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Workspace content</h4>
            <p>Content is stored to provide your workspace features and is visible based on your permission settings.</p>
          </section>
          <section className="space-y-2">
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Policy changes</h4>
            <p>We may revise this policy as the product evolves. Updates take effect when posted in-app.</p>
          </section>
        </div>
      </Modal>
    </>
  );
}
