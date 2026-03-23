import type { PageTemplateRecord } from "../types/workspace";

const paragraph = (text: string, styles: Record<string, unknown> = {}) => ({
  type: "paragraph",
  props: {
    textColor: "default",
    backgroundColor: "default",
    textAlignment: "left"
  },
  content: text
    ? [
        {
          type: "text",
          text,
          styles
        }
      ]
    : []
});

const title = (text: string) => paragraph(text, { bold: true });
const divider = () => paragraph("────────");
const bullet = (text: string) => paragraph(`• ${text}`);
const todo = (text: string) => paragraph(`☐ ${text}`);

export const BUILT_IN_PAGE_TEMPLATES: Array<Omit<PageTemplateRecord, "id" | "userId" | "createdAt" | "updatedAt"> & { key: string; emoji: string }> = [
  {
    key: "meeting-notes",
    name: "Meeting notes",
    emoji: "📋",
    content: [
      title("📋 Meeting notes"),
      paragraph("Date: "),
      paragraph("Attendees: "),
      divider(),
      title("Agenda"),
      bullet("Topic 1"),
      bullet("Topic 2"),
      divider(),
      title("Key decisions"),
      bullet("Decision #1"),
      divider(),
      title("Action items"),
      todo("Owner — task — due date")
    ]
  },
  {
    key: "project-brief",
    name: "Project brief",
    emoji: "🎯",
    content: [
      title("🎯 Project brief"),
      paragraph("Project name: "),
      paragraph("Owner: "),
      divider(),
      title("Objective"),
      paragraph("What problem are we solving?"),
      title("In scope"),
      bullet(""),
      title("Out of scope"),
      bullet(""),
      divider(),
      title("Timeline"),
      paragraph("Kickoff: "),
      paragraph("Milestone 1: "),
      paragraph("Launch: "),
      divider(),
      title("Success metrics"),
      bullet("Metric 1"),
      bullet("Metric 2"),
      title("Risks"),
      bullet("Risk + mitigation")
    ]
  },
  {
    key: "weekly-review",
    name: "Weekly review",
    emoji: "🔁",
    content: [
      title("🔁 Weekly review"),
      paragraph("Week of: "),
      divider(),
      title("Wins this week"),
      bullet(""),
      title("Challenges"),
      bullet(""),
      title("Lessons learned"),
      bullet(""),
      divider(),
      title("Next week focus"),
      todo("Top priority #1"),
      todo("Top priority #2")
    ]
  },
  {
    key: "bug-report",
    name: "Bug report",
    emoji: "🐛",
    content: [
      title("🐛 Bug report"),
      paragraph("Summary: "),
      paragraph("Severity: low / medium / high / critical"),
      divider(),
      title("Steps to reproduce"),
      bullet("1."),
      bullet("2."),
      divider(),
      title("Expected result"),
      paragraph(""),
      title("Actual result"),
      paragraph(""),
      divider(),
      title("Environment"),
      paragraph("Browser / OS / Version")
    ]
  },
  {
    key: "announcement",
    name: "Announcement",
    emoji: "📣",
    content: [
      title("📣 Announcement"),
      paragraph("Headline: "),
      paragraph("Date: "),
      divider(),
      title("What is changing"),
      paragraph(""),
      title("Who is impacted"),
      paragraph(""),
      title("Timeline"),
      bullet("Milestone 1"),
      bullet("Milestone 2"),
      divider(),
      title("Questions"),
      paragraph("Contact: ")
    ]
  },
  {
    key: "how-to-guide",
    name: "How-to guide",
    emoji: "📖",
    content: [
      title("📖 How-to guide"),
      paragraph("Goal: "),
      divider(),
      title("Prerequisites"),
      bullet("Access / permissions"),
      bullet("Tools needed"),
      divider(),
      title("Steps"),
      bullet("Step 1"),
      bullet("Step 2"),
      bullet("Step 3"),
      divider(),
      title("Troubleshooting"),
      bullet("Issue → fix")
    ]
  },
  {
    key: "sprint-plan",
    name: "Sprint plan",
    emoji: "🗓️",
    content: [
      title("🗓️ Sprint plan"),
      paragraph("Sprint number: "),
      paragraph("Dates: "),
      paragraph("Capacity: "),
      divider(),
      title("Sprint goal"),
      paragraph(""),
      title("Committed tasks"),
      todo(""),
      title("Stretch tasks"),
      todo(""),
      title("Risks and dependencies"),
      bullet("")
    ]
  },
  {
    key: "retrospective",
    name: "Retrospective",
    emoji: "🧭",
    content: [
      title("🧭 Retrospective"),
      paragraph("Sprint / period: "),
      divider(),
      title("What went well"),
      bullet(""),
      title("What did not go well"),
      bullet(""),
      title("Ideas for improvement"),
      bullet(""),
      divider(),
      title("Action owners"),
      todo("Owner — action")
    ]
  },
  {
    key: "release-notes",
    name: "Release notes",
    emoji: "🚀",
    content: [
      title("🚀 Release notes"),
      paragraph("Version: "),
      paragraph("Release date: "),
      divider(),
      title("Highlights"),
      bullet(""),
      title("Fixes"),
      bullet(""),
      title("Known issues"),
      bullet(""),
      title("Rollout notes"),
      paragraph(""),
      title("Rollback plan"),
      paragraph("")
    ]
  },
  {
    key: "daily-standup",
    name: "Daily standup",
    emoji: "☀️",
    content: [
      title("☀️ Daily standup"),
      paragraph("Date: "),
      divider(),
      title("Yesterday"),
      bullet(""),
      title("Today"),
      bullet(""),
      title("Blockers"),
      bullet(""),
      title("Need help from"),
      bullet("")
    ]
  },
  {
    key: "decision-log",
    name: "Decision log",
    emoji: "🧠",
    content: [
      title("🧠 Decision log"),
      paragraph("Decision ID: "),
      paragraph("Date: "),
      paragraph("Owner: "),
      divider(),
      title("Context"),
      paragraph(""),
      title("Options considered"),
      bullet("Option A"),
      bullet("Option B"),
      title("Chosen option and why"),
      paragraph(""),
      title("Follow-up"),
      todo("")
    ]
  },
  {
    key: "customer-interview",
    name: "Customer interview",
    emoji: "🎙️",
    content: [
      title("🎙️ Customer interview"),
      paragraph("Participant: "),
      paragraph("Role / company: "),
      paragraph("Date: "),
      divider(),
      title("Goals"),
      bullet(""),
      title("Questions"),
      bullet(""),
      title("Key insights"),
      bullet(""),
      divider(),
      title("Next actions"),
      todo("")
    ]
  }
];
