type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; requirePhoto: boolean; requireConfirm: boolean; photoStatus: string;
  deadline?: string | null;
  extensionRequested?: boolean;
  extensionGranted?: boolean;
};

type Props = {
  tasks: Task[];
  pendingTasks: Task[];
  doneTasks: Task[];
  approvedTasks: Task[];
  onCompleteTask: (id: number) => void;
  onRequestExtension: (id: number) => void;
};

function formatDeadlineChild(deadline: string): { text: string; urgent: boolean; overdue: boolean } {
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return { text: "⚠️ Срок истёк", urgent: true, overdue: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const urgent = diff < 2 * 3600000; // менее 2 часов
  if (h > 48) {
    const days = Math.ceil(h / 24);
    return { text: `⏰ ${days} дн.`, urgent: false, overdue: false };
  }
  if (h > 0) return { text: `⏰ ${h}ч ${m}м`, urgent, overdue: false };
  return { text: `⏰ ${m}м`, urgent: true, overdue: false };
}

export function ChildTabTasks({ tasks, pendingTasks, doneTasks, approvedTasks, onCompleteTask, onRequestExtension }: Props) {
  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Мои задачи</h2>

      {doneTasks.map(task => (
        <div key={task.id} className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-amber-300 to-orange-400 shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
          <div className="flex-1">
            <p className="font-black text-base text-white">{task.title}</p>
            <p className="text-white/80 text-sm font-bold">⏳ Ждёт проверки родителя</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
            <span className="text-lg">⏳</span>
          </div>
        </div>
      ))}

      {pendingTasks.map((task, i) => {
        const deadlineInfo = task.deadline ? formatDeadlineChild(task.deadline) : null;
        const isOverdue = deadlineInfo?.overdue ?? false;
        const canComplete = !isOverdue; // нельзя выполнить после просрочки (только запросить продление)
        const extensionAlreadyRequested = task.extensionRequested;

        return (
          <div key={task.id}
            className="rounded-3xl overflow-hidden bg-white/90 shadow-sm"
            style={{ animationDelay: `${i * 0.07}s` }}>
            <div
              onClick={() => canComplete && !extensionAlreadyRequested ? onCompleteTask(task.id) : undefined}
              className={`p-4 flex items-center gap-4 ${canComplete && !extensionAlreadyRequested ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300" : ""}`}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-[#FF9BE0]/20 to-[#9B6BFF]/20">{task.emoji}</div>
              <div className="flex-1">
                <p className="font-black text-base text-[#2D1B69]">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-sm font-bold text-yellow-500">{task.stars}⭐</p>
                  {task.requireConfirm && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✅ нужна проверка</span>}
                  {task.requirePhoto && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">📸 нужно фото</span>}
                </div>
                {deadlineInfo && (
                  <p className={`text-xs font-bold mt-1 ${deadlineInfo.overdue ? "text-red-500" : deadlineInfo.urgent ? "text-orange-500" : "text-gray-500"}`}>
                    {deadlineInfo.text}
                  </p>
                )}
                {extensionAlreadyRequested && !isOverdue && (
                  <p className="text-xs font-bold text-blue-500 mt-0.5">⏰ Запрос на доп. время отправлен</p>
                )}
                {task.extensionGranted && (
                  <p className="text-xs font-bold text-green-600 mt-0.5">✅ Родитель продлил срок!</p>
                )}
              </div>
              {canComplete && !extensionAlreadyRequested && (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B]">
                  <span className="text-white text-sm">→</span>
                </div>
              )}
            </div>

            {/* Кнопки когда срок истёк */}
            {isOverdue && !extensionAlreadyRequested && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => onRequestExtension(task.id)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-sm active:scale-95 transition-transform">
                  ⏰ Попросить у родителя доп. время
                </button>
              </div>
            )}

            {/* Кнопка запроса доп. времени до истечения срока, если срок близится */}
            {!isOverdue && deadlineInfo?.urgent && !extensionAlreadyRequested && (
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => onCompleteTask(task.id)}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B] text-white font-bold text-sm active:scale-95 transition-transform">
                  ✓ Выполнил!
                </button>
                <button
                  onClick={() => onRequestExtension(task.id)}
                  className="flex-1 py-2.5 rounded-2xl bg-white border-2 border-blue-200 text-blue-500 font-bold text-sm active:scale-95 transition-transform">
                  ⏰ Нужно время
                </button>
              </div>
            )}
          </div>
        );
      })}

      {approvedTasks.map(task => (
        <div key={task.id} className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-green-400 to-emerald-500 scale-[0.98] shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
          <div className="flex-1">
            <p className="font-black text-base text-white line-through opacity-80">{task.title}</p>
            <p className="text-white/70 text-sm font-bold">+{task.stars}⭐ начислено</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
            <span className="text-white text-base">✓</span>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-bold text-gray-500">Все задачи выполнены!</p>
        </div>
      )}
    </>
  );
}
