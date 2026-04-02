type GradeRequest = {
  id: number; childId: number; childName: string;
  subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null;
};

type GradesProps = {
  gradeRequests: GradeRequest[];
  pendingGrades: GradeRequest[];
  onApproveGrade: (id: number) => void;
  onRejectGrade: (id: number) => void;
};

export function ParentTabGrades({ gradeRequests, pendingGrades, onApproveGrade, onRejectGrade }: GradesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E1B4B]">Оценки детей</h2>
      {pendingGrades.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingGrades.length} новых</span>
          </div>
          {pendingGrades.map(g => (
            <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
              <div className="flex items-center gap-3 p-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${g.grade >= 4 ? "bg-green-100" : "bg-orange-100"}`}>
                  {g.grade >= 4 ? "😊" : g.grade >= 3 ? "😐" : "😔"}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#1E1B4B]">{g.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{g.date} · {g.childName}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${g.grade >= 4 ? "text-green-600" : "text-orange-500"}`}>{g.grade}</p>
                  <p className="text-xs text-gray-400">+{g.grade}⭐</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => onRejectGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Отклонить</button>
                <button onClick={() => onApproveGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {gradeRequests.filter(g => g.status !== "pending").map(g => (
        <div key={g.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <span className="text-xl">{g.grade >= 4 ? "😊" : "😐"}</span>
          <div className="flex-1">
            <p className="font-bold text-[#1E1B4B] text-sm">{g.subject} · {g.grade}</p>
            <p className="text-xs text-gray-400">{g.childName} · {g.date}</p>
          </div>
          {g.status === "approved" ? <span className="text-xs font-bold text-green-500">+{g.starsAwarded}⭐</span> : <span className="text-xs font-bold text-red-400">Отклонено</span>}
        </div>
      ))}
      {gradeRequests.length === 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">📝</div>
            <p className="font-bold text-[#1E1B4B] mb-1">Как это работает?</p>
            <p className="text-sm text-gray-500">Ребёнок получает звёзды за хорошие оценки в школе</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">1️⃣</span>
              <p className="text-sm text-gray-600">Ребёнок получает оценку в школе и отправляет запрос через своё приложение</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">2️⃣</span>
              <p className="text-sm text-gray-600">Вы получаете уведомление и проверяете — подтверждаете или отклоняете</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">3️⃣</span>
              <p className="text-sm text-gray-600">После подтверждения ребёнок получает звёзды: оценка 5 = 5⭐, оценка 4 = 4⭐ и т.д.</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-xs text-gray-400">Запросы появятся здесь, когда ребёнок отправит первую оценку</p>
          </div>
        </div>
      )}
    </div>
  );
}