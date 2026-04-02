import { useState, useCallback } from "react";
import { createPortal } from "react-dom";

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

type Props = {
  tasks: Task[];
  children: Child[];
  pendingTasks: Task[];
  onConfirmTask: (id: number) => void;
  onRejectTask: (id: number) => void;
  onGrantExtension?: (taskId: number, hours: number) => void;
  onDenyExtension?: (taskId: number) => void;
};

const EXTENSION_HOURS_OPTIONS = [
  { label: "+1 час", hours: 1 },
  { label: "+2 часа", hours: 2 },
  { label: "+1 день", hours: 24 },
  { label: "+2 дня", hours: 48 },
];

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

export function PendingTasksList({ tasks, children, pendingTasks, onConfirmTask, onRejectTask, onGrantExtension, onDenyExtension }: Props) {
  const [extensionTaskId, setExtensionTaskId] = useState<number | null>(null);
  const [extensionHours, setExtensionHours] = useState(24);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const openPhoto = useCallback((url: string) => setPhotoViewUrl(url), []);
  const closePhoto = useCallback(() => setPhotoViewUrl(null), []);

  const extensionTasks = tasks.filter(t => t.extensionRequested && t.status === "pending");

  return (
    <>
      {photoViewUrl && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closePhoto}
          style={{ animation: "fadeIn 0.2s ease" }}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <img
              src={photoViewUrl}
              alt="Фото выполнения задания"
              className="w-full rounded-3xl shadow-2xl object-contain max-h-[70vh]"
            />
            <button
              onClick={closePhoto}
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white font-black text-sm active:scale-90 transition-transform">
              ✕
            </button>
            <p className="text-center text-white/70 text-xs mt-3 font-semibold">Нажми вне фото для закрытия</p>
          </div>
        </div>,
        document.body
      )}

      {extensionTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span>⏰</span>
            <p className="text-sm font-black text-[#1E1B4B]">Запросы доп. времени</p>
            <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{extensionTasks.length}</span>
          </div>
          {extensionTasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-3">
              <div className="flex items-center gap-3 p-4">
                <span className="text-2xl">{task.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-[#1E1B4B]">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{children.find(c => c.id === task.childId)?.name} · {task.stars}⭐</p>
                  {task.deadline && (
                    <p className={`text-xs font-bold mt-0.5 ${isOverdue(task.deadline) ? "text-red-500" : "text-orange-500"}`}>
                      {isOverdue(task.deadline) ? "⚠️ Срок истёк" : formatDeadline(task.deadline)}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 font-bold mt-0.5">⏰ Ребёнок просит доп. время</p>
                </div>
              </div>

              {extensionTaskId === task.id ? (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Сколько добавить?</p>
                  <div className="flex gap-2 flex-wrap">
                    {EXTENSION_HOURS_OPTIONS.map(opt => (
                      <button key={opt.hours} onClick={() => setExtensionHours(opt.hours)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${extensionHours === opt.hours ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white" : "bg-gray-100 text-gray-600"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setExtensionTaskId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">Отмена</button>
                    <button onClick={() => { onGrantExtension?.(task.id, extensionHours); setExtensionTaskId(null); }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm active:scale-95 transition-transform">✓ Продлить</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 px-4 pb-4">
                  <button onClick={() => onDenyExtension?.(task.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Отказать</button>
                  <button onClick={() => setExtensionTaskId(task.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-sm active:scale-95 transition-transform">⏰ Продлить</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span>⏳</span>
            <p className="text-sm font-black text-[#1E1B4B]">Ждут подтверждения</p>
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pendingTasks.length}</span>
          </div>
          {pendingTasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden mb-3">
              <div className="flex items-center gap-3 p-4">
                <span className="text-2xl">{task.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-[#1E1B4B]">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {children.find(c => c.id === task.childId)?.name} · {task.stars}⭐
                    {task.requirePhoto && <span className="ml-1 text-purple-500">· 📸</span>}
                  </p>
                  {task.deadline && (
                    <p className={`text-xs font-bold mt-0.5 ${isOverdue(task.deadline) ? "text-green-600" : "text-orange-500"}`}>
                      {isOverdue(task.deadline) ? "✅ Выполнено вовремя" : formatDeadline(task.deadline)}
                    </p>
                  )}
                </div>
              </div>

              {task.photoUrl && (
                <div className="px-4 pb-3">
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
                    onClick={() => openPhoto(task.photoUrl!)}>
                    <img
                      src={task.photoUrl}
                      alt="Фото выполнения"
                      className="w-full object-cover max-h-48 rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                      <span className="text-white font-black text-sm bg-black/40 px-3 py-1.5 rounded-xl">🔍 Открыть</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openPhoto(task.photoUrl!)}
                    className="mt-2 w-full py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 font-bold text-sm active:scale-95 transition-transform">
                    🔍 Посмотреть фото
                  </button>
                </div>
              )}

              {task.requirePhoto && !task.photoUrl && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-amber-600 font-bold bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                    ⚠️ Фото ещё не прикреплено
                  </p>
                </div>
              )}

              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => onRejectTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Вернуть</button>
                <button onClick={() => onConfirmTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PendingTasksList;
