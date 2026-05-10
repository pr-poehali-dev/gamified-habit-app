import { useState } from "react";
import { getSubjectsByAge, GRADE_STARS, type GradeValue } from "@/lib/gameTypes";

type GradeReq = {
  id: number; subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null; createdAt: string;
};

type GradesProps = {
  level: number;
  age: number;
  gradeRequests: GradeReq[];
  pendingGrades: GradeReq[];
  onSubmitGrade: (subject: string, grade: GradeValue, date: string) => void;
};

export function ChildTabGrades({ level, age, gradeRequests, pendingGrades, onSubmitGrade }: GradesProps) {
  const subjects = getSubjectsByAge(age || 9);
  const [gradeSubject, setGradeSubject] = useState(subjects[0]);
  const [gradeValue, setGradeValue] = useState<GradeValue>(5);
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [gradeSent, setGradeSent] = useState(false);

  const handleSubmit = async () => {
    if (!gradeSubject) return;
    setGradeSent(true);
    onSubmitGrade(gradeSubject, gradeValue, gradeDate);
    setTimeout(() => setGradeSent(false), 2000);
  };

  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Оценки → Звёзды</h2>

      {level < 2 && (
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-5 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="font-black text-gray-500 text-base">Доступно с уровня 2</p>
          <p className="text-sm text-gray-400 mt-1">Ты на уровне {level}. Выполняй задания!</p>
        </div>
      )}

      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${level < 2 ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
          <p className="text-white font-black text-base">📝 Отправить оценку</p>
          <p className="text-white/70 text-xs mt-0.5">Курс: 1 балл = 1 звезда ⭐</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Предмет ({age} лет)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {subjects.map(s => (
                <button key={s} onClick={() => setGradeSubject(s)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all leading-tight ${gradeSubject === s ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm" : "bg-gray-50 text-gray-600"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Оценка</label>
            <div className="grid grid-cols-4 gap-2">
              {([5, 4, 3, 2] as GradeValue[]).map(g => (
                <button key={g} onClick={() => setGradeValue(g)}
                  className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 ${gradeValue === g ? (g >= 4 ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-400 text-white shadow-md scale-105" : "bg-gradient-to-br from-orange-400 to-red-500 border-orange-400 text-white shadow-md scale-105") : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                  <span className="text-lg">{g >= 4 ? "😊" : g >= 3 ? "😐" : "😔"}</span>
                  <span className="text-base font-black">{g}</span>
                  <span className="text-[9px]">{GRADE_STARS[g]}⭐</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Дата</label>
            <input type="date" value={gradeDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setGradeDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold" />
          </div>
          <button onClick={handleSubmit} disabled={gradeSent}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${gradeSent ? "bg-green-500 text-white" : "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md"}`}>
            {gradeSent ? "✅ Запрос отправлен!" : "📤 Отправить родителю"}
          </button>
        </div>
      </div>

      {pendingGrades.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ожидают подтверждения</p>
          {pendingGrades.map(g => (
            <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center gap-3 mb-2">
              <span className="text-2xl">{g.grade >= 4 ? "😊" : "😐"}</span>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-sm">{g.subject}</p>
                <p className="text-xs text-gray-400">{g.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-amber-500 text-sm">{g.grade} балл</p>
                <p className="text-xs text-amber-400">⏳ ждём</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {gradeRequests.filter(g => g.status !== "pending").length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">История</p>
          {gradeRequests.filter(g => g.status !== "pending").map(g => (
            <div key={g.id} className={`bg-white rounded-2xl p-3 shadow-sm border flex items-center gap-3 mb-2 ${g.status === "approved" ? "border-green-100" : "border-red-100"}`}>
              <span className="text-xl">{g.grade >= 4 ? "😊" : "😐"}</span>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-sm">{g.subject}</p>
                <p className="text-xs text-gray-400">{g.date}</p>
              </div>
              {g.status === "approved"
                ? <span className="text-xs font-bold text-green-500">+{g.starsAwarded}⭐</span>
                : <span className="text-xs font-bold text-red-400">Отклонено</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
