"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { useProjects } from "../../hooks/useProjects";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { setActiveModal } from "../../store/slices/uiSlice";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PROJECT_SWATCHES } from "../../lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DropdownMenu from "../../components/ui/DropdownMenu";
import { usePinnedItems } from "../../hooks/usePinnedItems";
import { toPinnedProjectId } from "../../lib/pinnedItems";

const projectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { items, isLoading, error, loadProjects, createProject } = useProjects();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const [tab, setTab] = useState<"all" | "mine" | "shared">("all");
  const [query, setQuery] = useState("");
  const { isPinned, togglePin } = usePinnedItems();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { color: "#3D5387" }
  });

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      dispatch(setActiveModal("newProject"));
    }
  }, [dispatch, searchParams]);

  const onSubmit = async (values: ProjectForm): Promise<void> => {
    const result = await createProject(values);
    if (result.meta.requestStatus === "fulfilled") {
      dispatch(setActiveModal(null));
    }
  };

  const progressClass = (percent: number): string => {
    if (percent >= 100) return "progress-100";
    if (percent >= 75) return "progress-75";
    if (percent >= 50) return "progress-50";
    if (percent >= 25) return "progress-25";
    return "progress-0";
  };

  const swatchClass = (color: string): string => {
    const key = color.toLowerCase().replace("#", "");
    const map: Record<string, string> = {
      '0e0d15': "swatch-0e0d15",
      bfa9ba: "swatch-bfa9ba",
      '3d5387': "swatch-3d5387",
      '182346': "swatch-182346",
      '7c83ad': "swatch-7c83ad",
      c2f04b: "swatch-7c83ad",
      a8d63e: "swatch-bfa9ba",
      '4a5075': "swatch-3d5387",
      '243060': "swatch-182346"
    };

    return map[key] ?? "bg-[var(--accent)]";
  };

  const exportProjectCsv = (projectId: string): void => {
    const project = items.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }

    const rows = [
      ["Task ID", "Title", "Status", "Priority", "Due Date", "Assignee"],
      ...project.tasks.map((task) => [
        task.id,
        task.title,
        task.status,
        task.priority,
        task.dueDate ? new Date(task.dueDate).toISOString() : "",
        task.assignee?.name ?? ""
      ])
    ];

    const escapeCsv = (value: string): string => {
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    };

    const csv = rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-tasks.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const visibleItems = useMemo(() => {
    const base = items.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()));
    if (tab === "all") {
      return base;
    }

    if (tab === "mine") {
      return base.filter((project) => project.members.some((member) => member.role === "owner"));
    }

    return base.filter((project) => project.members.some((member) => member.role !== "owner"));
  }, [items, query, tab]);

  return (
    <PageWrapper>
      <Topbar />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold">Projects</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">All the work your team is running.</p>
        </div>
        <Button onClick={() => dispatch(setActiveModal("newProject"))}>+ New Project</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All" },
          { key: "mine", label: "My projects" },
          { key: "shared", label: "Shared with me" }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as "all" | "mine" | "shared")}
            className={`rounded-full border px-3 py-1 text-[12px] ${
              tab === item.key
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects..."
          className="ml-auto h-10 min-w-[220px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 text-[12px]"
        />
      </div>

      {error ? <div className="surface-card mb-4 p-4 text-[var(--blush)]">{error}</div> : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface-card h-44 animate-pulse" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="surface-card p-6 text-center">
          <svg width="124" height="72" viewBox="0 0 124 72" fill="none" className="mx-auto mb-4" aria-hidden="true">
            <rect x="12" y="18" width="100" height="46" rx="10" stroke="#3D5387" strokeWidth="3" />
            <path d="M20 30h84" stroke="#BFA9BA" strokeWidth="3" />
            <circle cx="28" cy="24" r="3" fill="#C2F04B" />
            <path d="M30 42h38" stroke="#7C83AD" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 50h52" stroke="#7C83AD" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="mb-1 text-[18px] font-semibold">No projects yet</p>
          <p className="text-[13px] text-[var(--text-secondary)]">Create your first project to start planning work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((project) => {
            const done = project.tasks.filter((task) => task.status === "done").length;
            const total = Math.max(project.tasks.length, 1);
            const progress = Math.round((done / total) * 100);
            const pinnedId = toPinnedProjectId(project.id);

            return (
              <article key={project.id} className="surface-card overflow-hidden p-4 transition hover:-translate-y-0.5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className={`h-3 w-full rounded-full ${swatchClass(project.color)}`} />
                  <DropdownMenu
                    trigger={<span className="text-[16px]">...</span>}
                    items={[
                      {
                        label: isPinned(pinnedId) ? "Unpin project" : "Pin project",
                        onClick: () => {
                          void togglePin(pinnedId);
                        }
                      },
                      {
                        label: "Export tasks as CSV",
                        onClick: () => exportProjectCsv(project.id)
                      }
                    ]}
                  />
                </div>

                <Link href={`/projects/${project.id}`} className="block">
                  <h3 className="text-[16px] font-semibold">{project.name}</h3>
                  <p className="mb-3 text-[12px] text-[var(--text-secondary)]">{project.members.length} members • {project.tasks.length} tasks</p>
                  <div className="h-2 rounded-full bg-[var(--bg-card-2)]">
                    <div className={`h-2 rounded-full bg-[var(--accent)] ${progressClass(progress)}`} />
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={activeModal === "newProject"}
        onClose={() => dispatch(setActiveModal(null))}
        title="Create New Project"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Description" error={errors.description?.message} {...register("description")} />

          <div>
            <p className="mb-2 text-meta text-[var(--text-secondary)]">Color</p>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Select ${swatch}`}
                  onClick={() => setValue("color", swatch)}
                  className={`h-12 w-full rounded-xl border transition ${swatchClass(swatch)} ${
                    watch("color") === swatch
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-card)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Project
          </Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
