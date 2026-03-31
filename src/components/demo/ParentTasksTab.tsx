import Icon from "@/components/ui/icon";
import {
  SHOP_ITEMS, PARENT_TASKS_LIST, PARENT_ACTION_XP,
  type ParentAction,
} from "./types";

// ─── Tasks tab ────────────────────────────────────────────────────────────────

type TasksTabProps = {
  confirmedTasks: number[];
  onAction: (action: ParentAction) => void;
  onConfirmTask: (taskId: number) => void;
};

export function ParentTasksTab({ confirmedTasks, onAction, onConfirmTask }: TasksTabProps) {
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

      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <p className="text-xs font-bold text-[#1E1B4B]">Зарабатывайте XP за действия</p>
          <p className="text-xs text-gray-400">Создание задачи +{PARENT_ACTION_XP.task_create} XP · Подтверждение +{PARENT_ACTION_XP.task_confirm} XP</p>
        </div>
      </div>

      {PARENT_TASKS_LIST.map((item, i) => {
        const isDone = confirmedTasks.includes(item.id) || item.status === "done";
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="text-2xl">{item.emoji}</div>
            <div className="flex-1">
              <p className="font-semibold text-[#1E1B4B] text-sm">{item.task}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ребёнок: {item.child}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="text-sm font-bold text-amber-500">{item.stars} ⭐</div>
              {isDone ? (
                <span className="text-xs font-semibold text-green-500">✓ Выполнено</span>
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
