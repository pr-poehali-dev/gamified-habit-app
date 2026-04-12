import { useState } from "react";
import { PremiumBadge } from "@/components/ui/PremiumBadge";

const isTelegramMiniApp = () => {
  const initData = window.Telegram?.WebApp?.initData;
  return typeof initData === "string" && initData.length > 0;
};

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode?: string | null; connected?: boolean };
type NewTask = {
  title: string; stars: number; emoji: string; childId: number;
  requirePhoto: boolean; requireConfirm: boolean;
  deadline: string | null;
};

type Props = {
  children: Child[];
  onAddTask: (task: NewTask) => void;
  onClose: () => void;
  isPremium?: boolean;
  trialUsed?: boolean;
  onActivateTrial?: () => Promise<void>;
  onSubscribe?: () => void;
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

export function AddTaskForm({ children, onAddTask, onClose, isPremium, trialUsed, onActivateTrial, onSubscribe }: Props) {
  const connectedChildren = children.filter(c => c.connected);
  const [selectedDeadlineIdx, setSelectedDeadlineIdx] = useState(0);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "", stars: 3, emoji: "📋",
    childId: connectedChildren[0]?.id ?? 0,
    requirePhoto: false, requireConfirm: false,
    deadline: null,
  });

  const handleAdd = () => {
    if (!newTask.title.trim() || !newTask.childId) return;
    if (!connectedChildren.some(c => c.id === newTask.childId)) return;
    const deadlineOpt = DEADLINE_OPTIONS[selectedDeadlineIdx];
    const deadline = getDeadlineDate(deadlineOpt);
    onAddTask({ ...newTask, deadline });
    onClose();
  };

  if (connectedChildren.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
          <p className="text-white font-black text-base">📋 Новая задача</p>
        </div>
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="font-bold text-[#1E1B4B] mb-1">Нет подключённых детей</p>
          <p className="text-sm text-gray-500">{isTelegramMiniApp() ? "Ребёнок должен подключить Telegram, чтобы получать задачи" : "Отправьте ребёнку ссылку-приглашение из раздела «Дети»"}</p>
        </div>
      </div>
    );
  }

  return (
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
                <button key={c.id}
                  onClick={() => c.connected && setNewTask(t => ({ ...t, childId: c.id }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    !c.connected
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : newTask.childId === c.id
                        ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white"
                        : "bg-gray-50 text-gray-600"
                  }`}>
                  {c.avatar} {c.name} {!c.connected && "⏳"}
                </button>
              ))}
            </div>
            {children.some(c => !c.connected) && (
              <p className="text-[10px] text-gray-400 mt-1.5">⏳ — ожидает подключения Telegram</p>
            )}
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

        <div className="relative">
          <div onClick={() => {
            if (!isPremium) return;
            setNewTask(t => {
              const newVal = !t.requirePhoto;
              return { ...t, requirePhoto: newVal, requireConfirm: newVal ? true : t.requireConfirm };
            });
          }}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
              !isPremium ? "border-gray-200 bg-gray-50 opacity-60" :
              newTask.requirePhoto ? "border-purple-400 bg-purple-50 cursor-pointer" : "border-gray-200 bg-gray-50 cursor-pointer"
            }`}>
            <span className="text-xl">📸</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-black ${!isPremium ? "text-gray-400" : newTask.requirePhoto ? "text-purple-700" : "text-gray-600"}`}>Требовать фото</p>
                {!isPremium && <PremiumBadge compact trialUsed={trialUsed} onActivateTrial={onActivateTrial} onSubscribe={onSubscribe} />}
              </div>
              <p className="text-xs text-gray-400">Ребёнок прикладывает фотоотчёт</p>
            </div>
            <div className={`w-10 h-5 rounded-full transition-all duration-300 ${newTask.requirePhoto && isPremium ? "bg-purple-500" : "bg-gray-300"}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${newTask.requirePhoto && isPremium ? "ml-5" : "ml-0.5"}`} />
            </div>
          </div>
        </div>

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
  );
}

export default AddTaskForm;