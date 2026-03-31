import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhotoReviewCard, PhotoProofBadge } from "./TaskPhotoProof";
import {
  SHOP_ITEMS, PARENT_TASKS_LIST, PARENT_ACTION_XP,
  type ParentAction, type PhotoProof, type Task,
} from "./types";

// ─── Reusable toggle row ──────────────────────────────────────────────────────

function ToggleRow({
  icon, label, desc, active,
  activeColor, activeTextColor, activeIconBg, activeToggleBg,
  onToggle,
}: {
  icon: string; label: string; desc: string; active: boolean;
  activeColor: string; activeTextColor: string; activeIconBg: string; activeToggleBg: string;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        active ? activeColor : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
        active ? activeIconBg : "bg-white border border-gray-200"
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-black ${active ? activeTextColor : "text-gray-600"}`}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${active ? activeToggleBg : "bg-gray-300"}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 mt-0.5 ${active ? "ml-6" : "ml-0.5"}`} />
      </div>
    </div>
  );
}

// ─── Task emoji picker options ────────────────────────────────────────────────

const TASK_EMOJIS = ["🧹", "📚", "🦷", "🗑️", "📖", "🌸", "🐕", "🍽️", "🛁", "🧺", "🏃", "🎨", "🎵", "💤", "🌿"];
const TASK_STAR_OPTIONS = [1, 2, 3, 4, 5];

// ─── Add task form ────────────────────────────────────────────────────────────

type AddTaskFormProps = {
  childNames: { id: number; name: string }[];
  onSave: (task: Omit<Task, "id">, childId: number) => void;
  onClose: () => void;
};

function AddTaskForm({ childNames, onSave, onClose }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [stars, setStars] = useState(3);
  const [emoji, setEmoji] = useState("🧹");
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [requireConfirm, setRequireConfirm] = useState(false);
  const [childId, setChildId] = useState(childNames[0]?.id ?? 0);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!title.trim()) { setError("Введи название задачи"); return; }
    setError("");
    onSave({ title: title.trim(), stars, emoji, requirePhoto, requireConfirm }, childId);
    onClose();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4 flex items-center justify-between">
        <p className="text-white font-black text-base">📋 Новая задача</p>
        <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
      </div>

      <div className="p-5 space-y-4">
        {/* Child selector */}
        {childNames.length > 1 && (
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Для кого</label>
            <div className="flex gap-2">
              {childNames.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    childId === c.id
                      ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emoji */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Иконка</label>
          <div className="flex gap-2 flex-wrap">
            {TASK_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                  emoji === e
                    ? "bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 ring-2 ring-[#6B7BFF] scale-110"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">
            Название <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Например: Убрать комнату"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40"
          />
        </div>

        {/* Stars */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Награда</label>
          <div className="flex gap-2">
            {TASK_STAR_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStars(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                  stars === s
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm scale-105"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s} ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Require confirmation toggle */}
        <ToggleRow
          icon="✅"
          label="Требовать подтверждение"
          desc={requireConfirm
            ? "Звёзды начисляются только после проверки родителем"
            : "Звёзды начисляются сразу при отметке"}
          active={requireConfirm}
          activeColor="border-green-400 bg-green-50"
          activeTextColor="text-green-700"
          activeIconBg="bg-green-100"
          activeToggleBg="bg-green-500"
          onToggle={() => setRequireConfirm(v => !v)}
        />

        {/* Require photo toggle */}
        <ToggleRow
          icon="📸"
          label="Требовать фотоотчёт"
          desc={requirePhoto
            ? "Ребёнок должен приложить фото перед отметкой"
            : "Задача выполняется без подтверждения фото"}
          active={requirePhoto}
          activeColor="border-purple-400 bg-purple-50"
          activeTextColor="text-purple-700"
          activeIconBg="bg-purple-100"
          activeToggleBg="bg-purple-500"
          onToggle={() => setRequirePhoto(v => !v)}
        />

        {error && (
          <p className="text-red-500 text-xs font-bold bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-all"
        >
          Добавить задачу
        </button>
      </div>
    </div>
  );
}

// ─── Tasks tab ────────────────────────────────────────────────────────────────

export type PendingConfirmTask = {
  taskId: number;
  childId: number;
  childName: string;
  childAvatar: string;
  taskTitle: string;
  taskEmoji: string;
  taskStars: number;
};

type TasksTabProps = {
  confirmedTasks: number[];
  photoProofs: (PhotoProof & { childName: string; taskTitle: string })[];
  pendingConfirmTasks: PendingConfirmTask[];
  childNames: { id: number; name: string }[];
  onAction: (action: ParentAction) => void;
  onAddTask: (task: Omit<Task, "id">, childId: number) => void;
  onConfirmTask: (taskId: number) => void;
  onConfirmChildTask: (childId: number, taskId: number) => void;
  onRejectConfirmTask: (childId: number, taskId: number) => void;
  onApprovePhoto: (childId: number, taskId: number) => void;
  onRejectPhoto: (childId: number, taskId: number) => void;
};

export function ParentTasksTab({
  confirmedTasks, photoProofs, pendingConfirmTasks, childNames,
  onAction, onAddTask, onConfirmTask, onConfirmChildTask, onRejectConfirmTask, onApprovePhoto, onRejectPhoto,
}: TasksTabProps) {
  const [showForm, setShowForm] = useState(false);
  const pendingPhotos = photoProofs.filter(p => p.status === "pending_review");

  const handleSave = (task: Omit<Task, "id">, childId: number) => {
    onAddTask(task, childId);
    onAction("task_create");
    setShowForm(false);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          {showForm ? "✕ Закрыть" : "+ Добавить"}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <AddTaskForm
          childNames={childNames}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Pending photo reviews */}
      {pendingPhotos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📸</span>
            <p className="text-sm font-black text-[#1E1B4B]">Фотоотчёты на проверке</p>
            <span className="bg-purple-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {pendingPhotos.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingPhotos.map(proof => (
              <PhotoReviewCard
                key={`${proof.childName}-${proof.taskId}`}
                proof={proof}
                onApprove={taskId => {
                  const task = PARENT_TASKS_LIST.find(t => t.id === taskId);
                  if (task) onApprovePhoto(task.childId, taskId);
                }}
                onReject={taskId => {
                  const task = PARENT_TASKS_LIST.find(t => t.id === taskId);
                  if (task) onRejectPhoto(task.childId, taskId);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending confirm tasks */}
      {pendingConfirmTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✅</span>
            <p className="text-sm font-black text-[#1E1B4B]">Ждут подтверждения</p>
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {pendingConfirmTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingConfirmTasks.map(pt => (
              <div key={`${pt.childId}-${pt.taskId}`} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {pt.taskEmoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#1E1B4B]">{pt.taskTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pt.childAvatar} {pt.childName} · {pt.taskStars} ⭐
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 font-black text-lg">{pt.taskStars} ⭐</p>
                  </div>
                </div>
                <div className="mx-4 mb-3 bg-amber-50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">Ребёнок отметил задачу выполненной</span>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => onRejectConfirmTask(pt.childId, pt.taskId)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95"
                  >
                    ✗ Вернуть
                  </button>
                  <button
                    onClick={() => onConfirmChildTask(pt.childId, pt.taskId)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all"
                  >
                    ✓ Подтвердить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XP hint */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-xs font-bold text-[#1E1B4B]">Зарабатывайте XP за действия</p>
          <p className="text-xs text-gray-400">Создание задачи +{PARENT_ACTION_XP.task_create} XP · Подтверждение +{PARENT_ACTION_XP.task_confirm} XP</p>
        </div>
      </div>

      {PARENT_TASKS_LIST.map((item, i) => {
        const isDone = confirmedTasks.includes(item.id) || item.status === "done";
        const proof = photoProofs.find(p => p.taskId === item.id);
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <p className="font-semibold text-[#1E1B4B] text-sm">{item.task}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-gray-400">Ребёнок: {item.child}</p>
                  {item.requirePhoto && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                      📸 фотоотчёт
                    </span>
                  )}
                  {proof && <PhotoProofBadge status={proof.status} />}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-sm font-bold text-amber-500">{item.stars} ⭐</div>
                {isDone ? (
                  <span className="text-xs font-semibold text-green-500">✓ Выполнено</span>
                ) : proof?.status === "pending_review" ? (
                  <span className="text-xs font-semibold text-purple-500">📸 Ждёт проверки</span>
                ) : (
                  <button
                    onClick={() => onConfirmTask(item.id)}
                    className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-lg hover:bg-green-200 transition-colors active:scale-95"
                  >
                    Подтвердить
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rewards tab ──────────────────────────────────────────────────────────────

export function ParentRewardsTab() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Магазин наград</h2>
        <button className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm">
          + Добавить
        </button>
      </div>
      {SHOP_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="text-2xl">{item.emoji}</div>
          <div className="flex-1">
            <p className="font-semibold text-[#1E1B4B] text-sm">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">Стоимость: {item.cost} ⭐</p>
          </div>
          <button className="text-gray-400 hover:text-red-400 transition-colors">
            <Icon name="Trash2" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}