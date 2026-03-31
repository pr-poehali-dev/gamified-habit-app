import { useState, useEffect } from "react";
import {
  getSubjectsByAge, GRADE_STARS, GRADE_EMOJI, GRADE_LABEL, GRADE_UNLOCK_LEVEL,
  type GradeRequest, type GradeValue,
} from "./types";

// ─── Child: request form + history ───────────────────────────────────────────

type ChildGradeProps = {
  requests: GradeRequest[];
  level: number;
  age: number;
  onSubmit: (subject: string, grade: GradeValue, date: string) => void;
};

export function ChildGradeView({ requests, level, age, onSubmit }: ChildGradeProps) {
  const subjects = getSubjectsByAge(age);
  const [subject, setSubject] = useState(subjects[0]);
  const [grade, setGrade] = useState<GradeValue>(5);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sent, setSent] = useState(false);
  const locked = level < GRADE_UNLOCK_LEVEL;

  // Reset subject if age changes
  useEffect(() => { setSubject(subjects[0]); }, [age]);

  const handleSubmit = () => {
    if (locked) return;
    onSubmit(subject, grade, date);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const pending = requests.filter(r => r.status === "pending");
  const history = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {/* Locked banner */}
      {locked && (
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-5 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="font-black text-gray-500 text-base">Доступно с уровня {GRADE_UNLOCK_LEVEL}</p>
          <p className="text-sm text-gray-400 mt-1">
            Ты на уровне {level}. Ещё {GRADE_UNLOCK_LEVEL - level} {GRADE_UNLOCK_LEVEL - level === 1 ? "уровень" : "уровня"}!
          </p>
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: GRADE_UNLOCK_LEVEL }).map((_, i) => (
              <div key={i} className={`w-8 h-2 rounded-full ${i < level ? "bg-[#FF6B9D]" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Form card */}
      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${locked ? "opacity-50 pointer-events-none select-none" : ""}`}>
        <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
          <p className="text-white font-black text-base">📝 Отправить оценку родителю</p>
          <p className="text-white/70 text-xs mt-0.5">Курс обмена: 1 балл оценки = 1 звезда ⭐</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Subject — only buttons, no dropdown */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">
              Предмет · {age} лет
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all leading-tight ${
                    subject === s
                      ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Оценка</label>
            <div className="grid grid-cols-4 gap-2">
              {([5, 4, 3, 2] as GradeValue[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 ${
                    grade === g
                      ? g >= 4
                        ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-400 text-white shadow-md scale-105"
                        : "bg-gradient-to-br from-orange-400 to-red-500 border-orange-400 text-white shadow-md scale-105"
                      : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  <span className="text-xl">{GRADE_EMOJI[g]}</span>
                  <span className="text-lg font-black">{g}</span>
                  <span className="text-[9px] font-semibold opacity-80 leading-tight text-center">{GRADE_STARS[g]}⭐</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Дата</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold"
            />
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold">{subject} · {grade} балл</p>
              <p className="text-xs text-gray-400">{date}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-[#6B7BFF]">+{GRADE_STARS[grade]} ⭐</p>
              <p className="text-xs text-gray-400">после подтверждения</p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={sent}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
              sent
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md hover:shadow-lg"
            }`}
          >
            {sent ? "✅ Запрос отправлен!" : "📤 Отправить запрос родителю"}
          </button>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ожидают подтверждения</p>
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center gap-3">
                <span className="text-2xl">{GRADE_EMOJI[r.grade]}</span>
                <div className="flex-1">
                  <p className="font-bold text-[#1E1B4B] text-sm">{r.subject}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-amber-500 text-sm">{r.grade} балл</p>
                  <p className="text-xs text-amber-400">⏳ ждём</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">История обменов</p>
          <div className="space-y-2">
            {history.map(r => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 ${
                  r.status === "approved" ? "border-green-100" : "border-red-100"
                }`}
              >
                <span className="text-2xl">{GRADE_EMOJI[r.grade]}</span>
                <div className="flex-1">
                  <p className="font-bold text-[#1E1B4B] text-sm">{r.subject}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <div className="text-right">
                  {r.status === "approved" ? (
                    <>
                      <p className="font-black text-green-600 text-sm">+{r.starsAwarded} ⭐</p>
                      <p className="text-xs text-green-400">✓ Начислено</p>
                    </>
                  ) : (
                    <>
                      <p className="font-black text-red-500 text-sm">{r.grade} балл</p>
                      <p className="text-xs text-red-400">✗ Отклонено</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && !locked && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-5xl mb-3">📚</div>
          <p className="font-bold">Пока нет запросов</p>
          <p className="text-sm">Отправь первую оценку на обмен!</p>
        </div>
      )}
    </div>
  );
}

// ─── Parent: pending requests panel ──────────────────────────────────────────

type ParentGradeProps = {
  requests: GradeRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function ParentGradePanel({ requests, onApprove, onReject }: ParentGradeProps) {
  const pending = requests.filter(r => r.status === "pending");
  const history = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {/* Pending */}
      {pending.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⏳</span>
            <p className="text-sm font-black text-[#1E1B4B]">Ожидают подтверждения</p>
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="space-y-3">
            {pending.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    r.grade >= 4 ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    {GRADE_EMOJI[r.grade]}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#1E1B4B]">{r.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.date} · Маша</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-xl ${r.grade >= 4 ? "text-green-600" : "text-orange-500"}`}>
                      {r.grade}
                    </p>
                    <p className="text-xs text-gray-400">{GRADE_LABEL[r.grade]}</p>
                  </div>
                </div>

                {/* Exchange rate info */}
                <div className="mx-4 mb-3 bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">Запрос на начисление</span>
                  <span className="font-black text-[#6B7BFF]">+{GRADE_STARS[r.grade]} ⭐</span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => onReject(r.id)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95"
                  >
                    ✗ Отклонить
                  </button>
                  <button
                    onClick={() => onApprove(r.id)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
                  >
                    ✓ Подтвердить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-bold text-gray-500">Нет новых запросов</p>
          <p className="text-sm text-gray-400 mt-1">Ребёнок ещё не отправил оценки</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">История</p>
          <div className="space-y-2">
            {history.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-xl">{GRADE_EMOJI[r.grade]}</span>
                <div className="flex-1">
                  <p className="font-bold text-[#1E1B4B] text-sm">{r.subject} · {r.grade} балл</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <div>
                  {r.status === "approved"
                    ? <span className="text-xs font-bold text-green-500">+{r.starsAwarded}⭐</span>
                    : <span className="text-xs font-bold text-red-400">Отклонено</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

type GradeToastProps = {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  onClose: () => void;
};

export function GradeToast({ emoji, title, subtitle, color, onClose }: GradeToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div
        className={`pointer-events-auto bg-gradient-to-r ${color} rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 max-w-sm w-full`}
        onClick={onClose}
      >
        <span className="text-3xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm truncate">{title}</p>
          <p className="text-white/80 text-xs mt-0.5 leading-tight">{subtitle}</p>
        </div>
        <button className="text-white/60 hover:text-white flex-shrink-0 text-lg leading-none">×</button>
      </div>
    </div>
  );
}