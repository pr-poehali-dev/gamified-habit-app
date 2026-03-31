import Icon from "@/components/ui/icon";
import { PhotoReviewCard, PhotoProofBadge } from "./TaskPhotoProof";
import {
  SHOP_ITEMS, PARENT_TASKS_LIST, PARENT_ACTION_XP,
  type ParentAction, type PhotoProof,
} from "./types";

// ─── Tasks tab ────────────────────────────────────────────────────────────────

type TasksTabProps = {
  confirmedTasks: number[];
  photoProofs: (PhotoProof & { childName: string; taskTitle: string })[];
  onAction: (action: ParentAction) => void;
  onConfirmTask: (taskId: number) => void;
  onApprovePhoto: (childId: number, taskId: number) => void;
  onRejectPhoto: (childId: number, taskId: number) => void;
};

export function ParentTasksTab({
  confirmedTasks, photoProofs, onAction, onConfirmTask, onApprovePhoto, onRejectPhoto,
}: TasksTabProps) {
  const pendingPhotos = photoProofs.filter(p => p.status === "pending_review");

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
        <button
          onClick={() => onAction("task_create")}
          className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          + Добавить
        </button>
      </div>

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
                ) : proof?.status === "approved" ? (
                  <button
                    onClick={() => onConfirmTask(item.id)}
                    className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-lg hover:bg-green-200 transition-colors active:scale-95"
                  >
                    Подтвердить
                  </button>
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
