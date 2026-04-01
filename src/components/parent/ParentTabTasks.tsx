import { useState } from "react";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode?: string | null; connected?: boolean };
type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; childId: number; requirePhoto: boolean;
  requireConfirm: boolean; photoStatus: string;
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
};

const TASK_EMOJIS = ["📋", "🧹", "📚", "🦷", "🗑️", "📖", "🌸", "🐕", "🍽️", "🛁", "🧺", "🏃", "🎨", "🎵"];

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

export function ParentTabTasks({ tasks, children, pendingTasks, onConfirmTask, onRejectTask, onAddTask, onGrantExtension, onDenyExtension }: Props) {
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
  const extensionTasks = tasks.filter(t => t.extensionRequested && !t.extensionGranted && t.status === "pending");

  return (
    <div className="space-y-4">
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

            {[
              { key: "requireConfirm", icon: "✅", label: "Требовать подтверждение", desc: "Звёзды после проверки", color: "green" },
              { key: "requirePhoto", icon: "📸", label: "Требовать фото", desc: "Приложить фотоотчёт", color: "purple" },
            ].map(tog => {
              const active = newTask[tog.key as "requireConfirm" | "requirePhoto"];
              return (
                <div key={tog.key} onClick={() => setNewTask(t => ({ ...t, [tog.key]: !t[tog.key as "requireConfirm" | "requirePhoto"] }))}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${active ? `border-${tog.color}-400 bg-${tog.color}-50` : "border-gray-200 bg-gray-50"}`}>
                  <span className="text-xl">{tog.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-black ${active ? `text-${tog.color}-700` : "text-gray-600"}`}>{tog.label}</p>
                    <p className="text-xs text-gray-400">{tog.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all duration-300 ${active ? `bg-${tog.color}-500` : "bg-gray-300"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${active ? "ml-5" : "ml-0.5"}`} />
                  </div>
                </div>
              );
            })}
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
                  <p className="text-xs text-gray-400 mt-0.5">{children.find(c => c.id === task.childId)?.name} · {task.stars}⭐</p>
                  {task.deadline && (
                    <p className={`text-xs font-bold mt-0.5 ${isOverdue(task.deadline) ? "text-green-600" : "text-orange-500"}`}>
                      {isOverdue(task.deadline) ? "✅ Выполнено вовремя" : formatDeadline(task.deadline)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => onRejectTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Вернуть</button>
                <button onClick={() => onConfirmTask(task.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {tasks.filter(t => !["pending_confirm", "done"].includes(t.status) && !t.extensionRequested).map(task => (
          <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">{task.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-[#1E1B4B] text-sm">{task.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {children.find(c => c.id === task.childId)?.name}
                {task.requirePhoto && " · 📸"}
                {task.requireConfirm && " · ✅"}
              </p>
              {task.deadline && task.status === "pending" && (
                <p className={`text-xs font-bold mt-0.5 ${isOverdue(task.deadline) ? "text-red-500" : "text-orange-500"}`}>
                  {formatDeadline(task.deadline)}
                </p>
              )}
            </div>
            <span className={`text-sm font-bold ${task.status === "approved" ? "text-green-500" : "text-amber-500"}`}>
              {task.status === "approved" ? "✓" : ""}{task.stars}⭐
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
