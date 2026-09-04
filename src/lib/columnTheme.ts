export type ColumnVariant = "todo" | "progress" | "done";

export function columnVariant(name: string): ColumnVariant {
  const n = name.toLowerCase();
  if (n.includes("progress")) return "progress";
  if (n.includes("done") || n.includes("complete")) return "done";
  return "todo";
}

export function columnTheme(name: string) {
  const variant = columnVariant(name);

  if (variant === "progress") {
    return {
      variant,
      bar: "bg-orange-400",
      badge: "bg-orange-100 text-orange-600",
      emptyTitle: "No tasks yet",
      emptySub: "Tasks in progress will appear here",
    };
  }

  if (variant === "done") {
    return {
      variant,
      bar: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-600",
      emptyTitle: "No tasks completed",
      emptySub: "Completed tasks will appear here",
    };
  }

  return {
    variant,
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-600",
    emptyTitle: "No tasks yet",
    emptySub: "Tasks to do will appear here",
  };
}