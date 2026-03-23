import type { PageTemplateRecord } from "../types/workspace";

const paragraph = (text: string) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : []
});

export const BUILT_IN_PAGE_TEMPLATES: Array<Omit<PageTemplateRecord, "id" | "userId" | "createdAt" | "updatedAt"> & { key: string; emoji: string }> = [
  {
    key: "meeting-notes",
    name: "Meeting notes",
    emoji: "📋",
    content: [
      paragraph("Date:"),
      paragraph("Attendees:"),
      paragraph("Agenda:"),
      paragraph("Key decisions:"),
      paragraph("Action items:")
    ]
  },
  {
    key: "project-brief",
    name: "Project brief",
    emoji: "🎯",
    content: [
      paragraph("Objective:"),
      paragraph("Scope:"),
      paragraph("Timeline:"),
      paragraph("Success metrics:"),
      paragraph("Risks:")
    ]
  },
  {
    key: "weekly-review",
    name: "Weekly review",
    emoji: "🔁",
    content: [
      paragraph("Wins this week:"),
      paragraph("Challenges:"),
      paragraph("Lessons learned:"),
      paragraph("Next week focus:")
    ]
  },
  {
    key: "bug-report",
    name: "Bug report",
    emoji: "🐛",
    content: [
      paragraph("Summary:"),
      paragraph("Steps to reproduce:"),
      paragraph("Expected result:"),
      paragraph("Actual result:"),
      paragraph("Environment:")
    ]
  },
  {
    key: "announcement",
    name: "Announcement",
    emoji: "📣",
    content: [
      paragraph("Headline:"),
      paragraph("What is changing:"),
      paragraph("Who is impacted:"),
      paragraph("Timeline:"),
      paragraph("Questions:")
    ]
  },
  {
    key: "how-to-guide",
    name: "How-to guide",
    emoji: "📖",
    content: [
      paragraph("Goal:"),
      paragraph("Prerequisites:"),
      paragraph("Step 1:"),
      paragraph("Step 2:"),
      paragraph("Troubleshooting:")
    ]
  }
];
