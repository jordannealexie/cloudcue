export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
export const STATUS_OPTIONS = ["todo", "in_progress", "in_review", "done"] as const;

export const PROJECT_SWATCHES = [
  "#C2F04B",
  "#BFA9BA",
  "#3D5387",
  "#182346",
  "#7C83AD",
  "#4A5075",
  "#A8D63E",
  "#243060"
] as const;

export const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done"
};
