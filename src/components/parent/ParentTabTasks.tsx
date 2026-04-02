import { useState } from "react";
import { AddTaskForm } from "./AddTaskForm";
import { PendingTasksList } from "./PendingTasksList";
import { TasksList } from "./TasksList";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode?: string | null; connected?: boolean };
type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; childId: number; requirePhoto: boolean;
  requireConfirm: boolean; photoStatus: string;
  photoUrl?: string | null;
  childName?: string;
  deadline?: string | null;
  extensionRequested?: boolean;
  extensionGranted?: boolean;
};
type NewTask = {
  title: string; stars: number; emoji: string; childId: number;
  requirePhoto: boolean; requireConfirm: boolean;
  deadline: string | null;
};

type Props = {
  tasks: Task[];
  children: Child[];
  pendingTasks: Task[];
  onConfirmTask: (id: number) => void;
  onRejectTask: (id: number) => void;
  onAddTask: (task: NewTask) => void;
  onGrantExtension?: (taskId: number, hours: number) => void;
  onDenyExtension?: (taskId: number) => void;
  onDeleteTask?: (taskId: number) => void;
  onCancelTask?: (taskId: number) => void;
  isPremium?: boolean;
  trialUsed?: boolean;
  onActivateTrial?: () => Promise<void>;
};

export function ParentTabTasks({ tasks, children, pendingTasks, onConfirmTask, onRejectTask, onAddTask, onGrantExtension, onDenyExtension, onDeleteTask, onCancelTask, isPremium, trialUsed, onActivateTrial }: Props) {
  const hasActiveTasks = tasks.some(t => t.status === "pending" || t.status === "pending_confirm");
  const [showAddTask, setShowAddTask] = useState(!hasActiveTasks);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
        <button onClick={() => setShowAddTask(v => !v)} className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
          {showAddTask ? "✕ Закрыть" : "+ Добавить"}
        </button>
      </div>

      {showAddTask && (
        <AddTaskForm
          children={children}
          onAddTask={onAddTask}
          onClose={() => setShowAddTask(false)}
          isPremium={isPremium}
          trialUsed={trialUsed}
          onActivateTrial={onActivateTrial}
        />
      )}

      <PendingTasksList
        tasks={tasks}
        children={children}
        pendingTasks={pendingTasks}
        onConfirmTask={onConfirmTask}
        onRejectTask={onRejectTask}
        onGrantExtension={onGrantExtension}
        onDenyExtension={onDenyExtension}
      />

      <TasksList
        tasks={tasks}
        children={children}
        onDeleteTask={onDeleteTask}
        onCancelTask={onCancelTask}
      />
    </div>
  );
}

export default ParentTabTasks;