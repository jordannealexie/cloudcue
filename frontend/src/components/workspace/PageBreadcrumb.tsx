"use client";

import Link from "next/link";

interface PageBreadcrumbProps {
  segments: Array<{ label: string; href: string }>;
}

export default function PageBreadcrumb({ segments }: PageBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-secondary)]">
      {segments.map((segment, index) => (
        <span key={segment.href} className="inline-flex items-center gap-2">
          <Link href={segment.href} className="hover:text-[var(--text-primary)]">
            {segment.label}
          </Link>
          {index < segments.length - 1 ? <span>›</span> : null}
        </span>
      ))}
    </nav>
  );
}
