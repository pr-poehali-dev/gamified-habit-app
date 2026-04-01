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
};

const TASK_EMOJIS = ["📋", "🧹", "📚", "🦷", "🗑️", "📖", "🌸", "🐕", "🍽️", "🛁", "🧺", "🏃", "🎨", "🎵"];

const TASK_TEMPLATES = [
  { title: "Убраться в комнате", emoji: "🧹", stars: 3 },
  { title: "Почистить зубы", emoji: "🦷", stars: 1 },
  { title: "Полить цветы", emoji: "🌸", stars: 2 },
  { title: "Сделать домашнее задание", emoji: "📚", stars: 4 },
  { title: "Помыть посуду", emoji: "🍽️", stars: 3 },
  { title: "Пропылесосить", emoji: "🧺", stars: 3 },
  { title: "Вынести мусор", emoji: "🗑️", stars: 2 },
  { title: "Почитать книгу", emoji: "📖", stars: 2 },
  { title: "Заправить кровать", emoji: "🛁", stars: 1 },
  { title: "Погулять с собакой", emoji: "🐕", stars: 3 },
  { title: "Сделать зарядку", emoji: "🏃", stars: 2 },
  { title: "Нарисовать рисунок", emoji: "🎨", stars: 2 },
];

const DEADLINE_OPTIONS = [
  { label: "Без срока", value: null },
  { label: "1 час", hours: 1 },
  { label: "2 часа", hours: 2 },
  { label: "Сегодня", hours: "today" as const },
  { label: "Завтра", hours: "tomorrow" as const },
  { label: "3 дня", hours: 72 },
  { label: "Неделя", hours: 168 },
];

function getDeadlineDate(option: typeof DEADLINE_OPTIONS[number]): string | null {
  if (option.value === null) return null;
  const now = new Date();
  if (option.hours === "today") {
    const d = new Date(now);
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  }
  if (option.hours === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  }
  const hours = option.hours as number;
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

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

const EXTENSION_HOURS_OPTIONS = [
  { label: "+1 час", hours: 1 },
  { label: "+2 часа", hours: 2 },
  { label: "+1 день", hours: 24 },
  { label: "+2 дня", hours: 48 },
];

export function ParentTabTasks({ tasks, children, pendingTasks, onConfirmTask, onRejectTask, onAddTask, onGrantExtension, onDenyExtension, onDeleteTask, onCancelTask }: Props) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedDeadlineIdx, setSelectedDeadlineIdx] = useState(0);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "", stars: 3, emoji: "📋",
    childId: children[0]?.id ?? 0,
    requirePhoto: false, requireConfirm: false,
    deadline: null,
  });
  const [extensionTaskId, setExtensionTaskId] = useState<number | null>(null);
  const [extensionHours, setExtensionHours] = useState(24);
  // Просмотр фото
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const openPhoto = useCallback((url: string) => setPhotoViewUrl(url), []);
  const closePhoto = useCallback(() => setPhotoViewUrl(null), []);
  // Подтверждение удаления/отмены
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newTask.title.trim() || !newTask.childId) return;
    const deadlineOpt = DEADLINE_OPTIONS[selectedDeadlineIdx];
    const deadline = getDeadlineDate(deadlineOpt);
    onAddTask({ ...newTask, deadline });
    setShowAddTask(false);
    setSelectedDeadlineIdx(0);
    setNewTask({ title: "", stars: 3, emoji: "📋", childId: children[0]?.id ?? 0, requirePhoto: false, requireConfirm: false, deadline: null });
  };

  // Tasks with extension requests
  const extensionTasks = tasks.filter(t => t.extensionRequested && t.status === "pending");

  return (
    <div className="space-y-4">
      {/* Модалка просмотра фото — рендерится в body через портал, чтобы fixed работал корректно в Telegram WebApp */}
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
        <button onClick={() => setShowAddTask(v => !v)} className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
          {showAddTask ? "✕ Закрыть" : "+ Добавить"}
        </button>
      </div>

      {showAddTask && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
            <p className="text-white font-black text-base">📋 Новая задача</p>
          </div>
          <div className="p-5 space-y-4">
            {children.length > 1 && (
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Для кого</label>
                <div className="flex gap-2">
                  {children.map(c => (
                    <button key={c.id} onClick={() => setNewTask(t => ({ ...t, childId: c.id }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${newTask.childId === c.id ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white" : "bg-gray-50 text-gray-600"}`}>
                      {c.avatar} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Иконка</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewTask(t => ({ ...t, emoji: e }))}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${newTask.emoji === e ? "ring-2 ring-[#6B7BFF] bg-[#6B7BFF]/10 scale-110" : "bg-gray-50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {/* Шаблоны задач */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">⚡ Быстрые шаблоны</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => setNewTask(t => ({ ...t, title: tpl.title, emoji: tpl.emoji, stars: tpl.stars }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${newTask.title === tpl.title ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm scale-105" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                    <span>{tpl.emoji}</span>
                    <span>{tpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Название *</label>
              <input type="text" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="Убрать комнату"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Награда</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setNewTask(t => ({ ...t, stars: s }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${newTask.stars === s ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-105" : "bg-gray-50 text-gray-600"}`}>
                    {s}⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline picker */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">⏰ Срок выполнения</label>
              <div className="flex gap-2 flex-wrap">
                {DEADLINE_OPTIONS.map((opt, idx) => (
                  <button key={idx} onClick={() => setSelectedDeadlineIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedDeadlineIdx === idx ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white scale-105" : "bg-gray-50 text-gray-600"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {selectedDeadlineIdx > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Ребёнок должен выполнить задачу до истечения срока. Иначе он сможет запросить дополнительное время.
                </p>
              )}
            </div>

            {/* Фото — независимый тогл, но при включении автоматически включает подтверждение */}
            <div onClick={() => setNewTask(t => {
              const newVal = !t.requirePhoto;
              return { ...t, requirePhoto: newVal, requireConfirm: newVal ? true : t.requireConfirm };
            })}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${newTask.requirePhoto ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
              <span className="text-xl">📸</span>
              <div className="flex-1">
                <p className={`text-sm font-black ${newTask.requirePhoto ? "text-purple-700" : "text-gray-600"}`}>Требовать фото</p>
                <p className="text-xs text-gray-400">Ребёнок прикладывает фотоотчёт</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all duration-300 ${newTask.requirePhoto ? "bg-purple-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${newTask.requirePhoto ? "ml-5" : "ml-0.5"}`} />
              </div>
            </div>

            {/* Подтверждение — если requirePhoto включён, подтверждение обязательно и заблокировано */}
            <div onClick={() => !newTask.requirePhoto && setNewTask(t => ({ ...t, requireConfirm: !t.requireConfirm }))}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${newTask.requireConfirm ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"} ${newTask.requirePhoto ? "opacity-80" : "cursor-pointer"}`}>
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className={`text-sm font-black ${newTask.requireConfirm ? "text-green-700" : "text-gray-600"}`}>Требовать подтверждение</p>
                <p className="text-xs text-gray-400">
                  {newTask.requirePhoto ? "🔒 Включено автоматически с фото" : "Звёзды после проверки"}
                </p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all duration-300 ${newTask.requireConfirm ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${newTask.requireConfirm ? "ml-5" : "ml-0.5"}`} />
              </div>
            </div>
            <button onClick={handleAdd} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-transform">
              Добавить задачу
            </button>
          </div>
        </div>
      )}

      {/* Extension requests */}
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

              {/* Фото выполнения — показываем если photoUrl есть (независимо от photoStatus) */}
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

              {/* Фото требуется, но ещё не загружено */}
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

      {/* Активные (pending) задания */}
      <div className="space-y-2">
        {tasks.filter(t => t.status === "pending" && !t.extensionRequested).map(task => (
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

            {/* Кнопка отмены задания */}
            {onCancelTask && (
              confirmCancelId === task.id ? (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs font-bold text-red-500 text-center">Отменить задание?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmCancelId(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs active:scale-95 transition-transform">Не отменять</button>
                    <button onClick={() => { onCancelTask(task.id); setConfirmCancelId(null); }} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs active:scale-95 transition-transform">Да, отменить</button>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4">
                  <button onClick={() => setConfirmCancelId(task.id)} className="w-full py-2 rounded-xl bg-red-50 border border-red-200 text-red-500 font-bold text-xs active:scale-95 transition-transform">
                    ✕ Отменить задание
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* Выполненные задания */}
      {tasks.filter(t => t.status === "approved" || t.status === "done").length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 mt-1">
            <span>✅</span>
            <p className="text-sm font-black text-[#1E1B4B]">Выполненные</p>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.status === "approved" || t.status === "done").map(task => (
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

                {/* Кнопка удаления выполненного задания */}
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
                        🗑 Удалить из истории
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}