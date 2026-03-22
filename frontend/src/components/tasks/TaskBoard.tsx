"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "../../types";
import TaskCard from "./TaskCard";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { STATUS_LABELS } from "../../lib/constants";

const statuses: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

interface TaskBoardProps {
  tasks: Task[];
  loading?: boolean;
  error?: string | null;
  onTaskClick: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  onReorder: (payload: { taskId: string; destinationStatus: TaskStatus; destinationPosition: number }) => void;
}

export default function TaskBoard({
  tasks,
  loading = false,
  error = null,
  onTaskClick,
  onAddTask,
  onReorder
}: TaskBoardProps) {
  const grouped = statuses.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => ({
      ...acc,
      [status]: tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position)
    }),
    { todo: [], in_progress: [], in_review: [], done: [] }
  );

  const handleDragEnd = (result: DropResult): void => {
    if (!result.destination) {
      return;
    }

    const destinationStatus = result.destination.droppableId as TaskStatus;
    onReorder({
      taskId: result.draggableId,
      destinationStatus,
      destinationPosition: result.destination.index
    });
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <div key={status} className="surface-card h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="surface-card p-4 text-[var(--blush)]">{error}</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="surface-card flex items-center justify-between gap-3 p-4">
        <p className="text-[var(--text-secondary)]">No tasks here yet. Add your first one to get started.</p>
        <Button variant="secondary" onClick={() => onAddTask("todo")}>+ Add task</Button>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-scroll flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {statuses.map((status) => (
          <Droppable key={status} droppableId={status}>
            {(dropProvided) => (
              <section
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`kanban-column surface-card min-h-[420px] min-w-[calc(100vw-2rem)] p-3 md:min-w-[360px] lg:min-w-0 status-${status.replace("_", "-")}`}
              >
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold">{STATUS_LABELS[status]}</h3>
                  <Badge>{grouped[status].length}</Badge>
                </header>

                <div className="space-y-3">
                  {grouped[status].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                        >
                          <TaskCard task={task} onClick={() => onTaskClick(task.id)} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>

                <Button className="mt-4 w-full" variant="secondary" onClick={() => onAddTask(status)}>
                  + Add task
                </Button>
              </section>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
