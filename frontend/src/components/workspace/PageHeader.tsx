"use client";

import { useState } from "react";
import { icons } from "lucide-react";
import Button from "../ui/Button";
import LinkPromptModal from "../ui/LinkPromptModal";
import PageIcon from "./PageIcon";

interface PageHeaderProps {
  title: string;
  emoji?: string | null;
  coverUrl?: string | null;
  isSaving?: boolean;
  authorName?: string;
  updatedAt?: string;
  commentCount?: number;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string | null) => void;
  onCoverChange: (coverUrl: string | null) => void;
}

const ICON_OPTIONS = [
  "FileText", "NotebookText", "Bookmark", "Sparkles", "BadgeCheck",
  ...Object.keys(icons)
    .filter((name) =>
      /(File|Folder|Book|Note|Clipboard|Calendar|Clock|Check|List|Flag|Pin|Link|Mail|Message|Chart|BarChart|PieChart|LineChart|Bug|Code|Terminal|Palette|Image|Camera|Video|Music|Mic|Headphones|Laptop|Monitor|Smartphone|Server|Database|Globe|Map|Rocket|Target|Briefcase|Package|Truck|Home|Building|Users|User|Shield|Lock|Key|Bell|Star|Lightbulb|Wrench|Settings|Pen|Pencil|Edit|Search|Filter|Layers|Grid|Columns|Rows|Kanban|StickyNote)/.test(
        name
      ) && name.length <= 16
    )
    .slice(0, 130)
].filter((value, index, list) => list.indexOf(value) === index);

export default function PageHeader({
  title,
  emoji,
  coverUrl,
  isSaving = false,
  authorName,
  updatedAt,
  commentCount = 0,
  onTitleChange,
  onIconChange,
  onCoverChange
}: PageHeaderProps) {
  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverInput, setCoverInput] = useState(coverUrl ?? "");
  const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : "just now";

  const openCoverModal = () => {
    setCoverInput(coverUrl ?? "");
    setIsCoverModalOpen(true);
  };

  return (
    <div className="surface-card overflow-visible p-0">
      <div
        className="relative h-[120px] w-full rounded-t-[16px] bg-[var(--bg-card-2)] sm:h-[160px] lg:h-[180px]"
        style={
          coverUrl
            ? {
                backgroundImage: `linear-gradient(180deg, transparent 0%, rgba(14,13,21,0.28) 100%), url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }
            : {
                backgroundImage: "linear-gradient(120deg, rgba(24,35,70,0.22), rgba(61,83,135,0.28) 50%, rgba(191,169,186,0.2))"
              }
        }
      >
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button variant="secondary" onClick={openCoverModal}>Change cover</Button>
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              className="inline-flex items-center gap-2"
              onClick={() => setIsIconMenuOpen((open) => !open)}
            >
              <PageIcon icon={emoji} className="h-5 w-5 text-[var(--text-secondary)]" />
              Page icon
            </Button>
            {isIconMenuOpen ? (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-10 w-[320px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-lg">
                <div className="mb-2 max-h-44 overflow-y-auto pr-1">
                  <div className="grid grid-cols-8 gap-2">
                  {ICON_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-label={`Set icon to ${option}`}
                      onClick={() => {
                        onIconChange(option);
                        setIsIconMenuOpen(false);
                      }}
                      className={`min-h-0 min-w-0 inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                        emoji === option
                          ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-card)]"
                          : "border-[var(--border-subtle)]"
                      }`}
                    >
                      <PageIcon icon={option} className="h-6 w-6 text-[var(--text-secondary)]" />
                    </button>
                  ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onIconChange("FileText");
                    setIsIconMenuOpen(false);
                  }}
                  className="w-full rounded-md px-2 py-1 text-left text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-card-2)]"
                >
                  Use default icon
                </button>
              </div>
            ) : null}
          </div>

          <span className="rounded-full bg-[var(--bg-card-2)] px-2 py-1 text-[12px] text-[var(--text-secondary)]">
            {isSaving ? "Saving..." : "Saved ✓"}
          </span>
        </div>

        <input
          aria-label="Page title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full border-none bg-transparent text-[28px] font-bold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-hint)] sm:text-[32px] lg:text-[40px]"
          placeholder="Untitled"
        />

        <p className="text-[12px] text-[var(--text-secondary)]">
          Created by {authorName ?? "You"} · Last edited {updatedLabel} · {commentCount} comments
        </p>
      </div>

      <LinkPromptModal
        open={isCoverModalOpen}
        title="Change cover"
        message="Paste a cover page link. Leave empty to remove the current cover."
        value={coverInput}
        saveLabel="Save cover"
        onChange={setCoverInput}
        onCancel={() => setIsCoverModalOpen(false)}
        onSave={() => {
          onCoverChange(coverInput.trim() || null);
          setIsCoverModalOpen(false);
        }}
      />
    </div>
  );
}
