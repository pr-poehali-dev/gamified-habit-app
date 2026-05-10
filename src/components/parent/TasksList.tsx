import { useState } from "react";
import func2url from "../../../backend/func2url.json";

const PUSH_URL = func2url["push-notify"];

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode?: string | null; connected?: boolean; pushSubscribed?: boolean };
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

type Props = {
  tasks: Task[];
  children: Child[];
  onDeleteTask?: (taskId: number) => void;
  onCancelTask?: (taskId: number) => void;
};

function formatDeadline(deadline: string): string {
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return "⚠️ Просрочено";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) {
    const days = Math.ceil(h / 24);
    return `⏰ ${days} дн.`;
  }
  if (h > 0) return `⏰ ${h}ч ${m}м`;
  return `⏰ ${m}м`;
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline).getTime() < Date.now();
}

export function TasksList({ tasks, children, onDeleteTask, onCancelTask }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [nudgingId, setNudgingId] = useState<number | null>(null);
  const [nudgedId, setNudgedId] = useState<number | null>(null);

  const handleNudge = async (task: Task) => {
    setNudgingId(task.id);
    const child = children.find(c => c.id === task.childId);
    try {
      await fetch(PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_to_child",
          child_id: task.childId,
          payload: {
            title: "⏰ Задание просрочено!",
            body: `${child?.name ?? "Привет"}! Задание «${task.emoji} ${task.title}» ждёт тебя — не забудь выполнить!`,
            url: "/app",
            tag: `overdue-task-${task.id}`,
          },
        }),
      });
      setNudgedId(task.id);
      setTimeout(() => setNudgedId(null), 3000);
    } catch { /* игнорируем */ }
    setNudgingId(null);
  };

  const activeTasks = tasks.filter(t => t.status === "pending" && !t.extensionRequested);
  const completedTasks = tasks.filter(t => t.status === "approved" || t.status === "done");

  return (
    <>
      <div className="space-y-2">
        {activeTasks.map(task => (
          <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <span className="text-2xl">{task.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-[#1E1B4B] text-sm">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {children.find(c => c.id === task.childId)?.name}
                  {task.requirePhoto && " · 📸"}
                  {task.requireConfirm && " · ✅"}
                </p>
                {task.deadline && (
                  <p className={`text-xs font-bold mt-0.5 ${isOverdue(task.deadline) ? "text-red-500" : "text-orange-500"}`}>
                    {formatDeadline(task.deadline)}
                  </p>
                )}
              </div>
              <span className="text-sm font-bold text-amber-500">{task.stars}⭐</span>
            </div>

            {/* Кнопка напоминания для просроченных */}
            {task.deadline && isOverdue(task.deadline) && (() => {
              const child = children.find(c => c.id === task.childId);
              const hasPush = child?.pushSubscribed;
              return (
                <div className="px-4 pb-0 space-y-1.5">
                  {nudgedId === task.id ? (
                    <div className="w-full py-2 rounded-xl bg-green-50 border border-green-200 text-green-600 font-bold text-xs text-center">
                      ✅ Уведомление отправлено!
                    </div>
                  ) : hasPush ? (
                    <button
                      onClick={() => handleNudge(task)}
                      disabled={nudgingId === task.id}
                      className="w-full py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 font-bold text-xs active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {nudgingId === task.id ? "⏳ Отправляем..." : "🔔 Напомнить ребёнку"}
                    </button>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-blue-700 mb-0.5">📱 Push-уведомления не настроены</p>
                      <p className="text-[11px] text-blue-600 leading-relaxed">
                        Чтобы отправлять напоминания ребёнку, установите приложение СтарКидс на его телефон: откройте{" "}
                        <span className="font-bold">tasks4kids.ru/app</span> в браузере и нажмите «Добавить на экран».
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {onCancelTask && (
              confirmCancelId === task.id ? (
                <div className="px-4 pb-4 pt-2 space-y-2">
                  <p className="text-xs font-bold text-red-500 text-center">Отменить задание?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmCancelId(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs active:scale-95 transition-transform">Не отменять</button>
                    <button onClick={() => { onCancelTask(task.id); setConfirmCancelId(null); }} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs active:scale-95 transition-transform">Да, отменить</button>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4 pt-2">
                  <button onClick={() => setConfirmCancelId(task.id)} className="w-full py-2 rounded-xl bg-red-50 border border-red-200 text-red-500 font-bold text-xs active:scale-95 transition-transform">
                    ✕ Отменить задание
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <span>✅</span>
            <p className="text-sm font-black text-[#1E1B4B]">Выполненные</p>
          </div>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{task.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1E1B4B] text-sm line-through opacity-60">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {children.find(c => c.id === task.childId)?.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-500">+{task.stars}⭐</span>
                </div>

                {onDeleteTask && (
                  confirmDeleteId === task.id ? (
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500 text-center">Удалить из истории?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs active:scale-95 transition-transform">Оставить</button>
                        <button onClick={() => { onDeleteTask(task.id); setConfirmDeleteId(null); }} className="flex-1 py-2 rounded-xl bg-gray-500 text-white font-bold text-xs active:scale-95 transition-transform">🗑 Удалить</button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <button onClick={() => setConfirmDeleteId(task.id)} className="w-full py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 font-bold text-xs active:scale-95 transition-transform">
                        🗑 Удалить
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default TasksList;