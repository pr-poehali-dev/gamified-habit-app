type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; requirePhoto: boolean; requireConfirm: boolean; photoStatus: string;
};

type Props = {
  tasks: Task[];
  pendingTasks: Task[];
  doneTasks: Task[];
  approvedTasks: Task[];
  onCompleteTask: (id: number) => void;
};

export function ChildTabTasks({ tasks, pendingTasks, doneTasks, approvedTasks, onCompleteTask }: Props) {
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

      {pendingTasks.map((task, i) => (
        <div key={task.id}
          onClick={() => onCompleteTask(task.id)}
          className="rounded-3xl p-4 flex items-center gap-4 cursor-pointer bg-white/90 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 shadow-sm"
          style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-[#FF9BE0]/20 to-[#9B6BFF]/20">{task.emoji}</div>
          <div className="flex-1">
            <p className="font-black text-base text-[#2D1B69]">{task.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-sm font-bold text-yellow-500">{task.stars}⭐</p>
              {task.requireConfirm && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✅ нужна проверка</span>}
              {task.requirePhoto && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">📸 нужно фото</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B]">
            <span className="text-white text-sm">→</span>
          </div>
        </div>
      ))}

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
