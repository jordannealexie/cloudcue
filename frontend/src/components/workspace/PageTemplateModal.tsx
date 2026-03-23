"use client";

import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PageIcon from "./PageIcon";
import { BUILT_IN_PAGE_TEMPLATES } from "../../lib/pageTemplates";
import { usePageTemplates } from "../../hooks/usePageTemplates";

interface PageTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (payload: { title: string; content: unknown }) => void;
}

const TEMPLATE_ICON_MAP: Record<string, string> = {
  meeting_notes: "NotebookText",
  project_brief: "Target",
  weekly_review: "CalendarCheck",
  bug_report: "Bug",
  announcement: "Megaphone",
  how_to_guide: "BookOpen",
  sprint_plan: "CalendarRange",
  retrospective: "Clock3",
  release_notes: "Rocket",
  daily_standup: "Sun",
  decision_log: "Brain",
  customer_interview: "Mic"
};

export default function PageTemplateModal({ open, onClose, onUseTemplate }: PageTemplateModalProps) {
  const { items: customTemplates, isLoading, error, deleteTemplate, usingLocalFallback } = usePageTemplates();

  return (
    <Modal open={open} onClose={onClose} title="Use template">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Built-in templates</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {BUILT_IN_PAGE_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => {
                  onUseTemplate({ title: template.name, content: template.content });
                  onClose();
                }}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-2)] px-3 py-2 text-left transition hover:bg-[var(--bg-card)]"
              >
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  <PageIcon
                    icon={TEMPLATE_ICON_MAP[template.key] ?? "FileText"}
                    className="h-4 w-4 text-[var(--text-secondary)]"
                  />
                  <span>{template.name}</span>
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">Create page from this template</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Your templates</p>
          {usingLocalFallback ? (
            <p className="mb-2 text-[11px] text-[var(--text-secondary)]">Using local template storage in this browser.</p>
          ) : null}
          {isLoading ? <p className="text-[12px] text-[var(--text-secondary)]">Loading templates...</p> : null}
          {!isLoading && customTemplates.length === 0 ? (
            <p className="text-[12px] text-[var(--text-secondary)]">No custom templates yet. Save one from a page menu.</p>
          ) : null}
          <div className="space-y-2">
            {customTemplates.map((template) => (
              <div key={template.id} className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    onUseTemplate({ title: template.name, content: template.content });
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <p className="text-[13px] font-semibold">{template.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Saved template</p>
                </button>
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-[11px]"
                  onClick={() => {
                    void deleteTemplate(template.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="text-[12px] text-[var(--blush)]">{error}</p> : null}
      </div>
    </Modal>
  );
}
