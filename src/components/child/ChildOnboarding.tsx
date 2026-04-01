import { useState } from "react";

type Props = { name: string; onDone: () => void };

const STEPS = [
  {
    emoji: "🌟",
    title: (name: string) => `Привет, ${name}!`,
    desc: "Добро пожаловать в СтарКидс! Здесь ты выполняешь задания от родителей и получаешь звёзды ⭐",
    btn: "Круто, что дальше? →",
  },
  {
    emoji: "📋",
    title: () => "Выполняй задания",
    desc: "Нажимай на задание чтобы отметить его как выполненное. За каждое задание начисляются звёзды — чем сложнее, тем больше!",
    btn: "Понятно →",
  },
  {
    emoji: "🎁",
    title: () => "Трать звёзды на призы",
    desc: "Накопленные звёзды можно обменять на награды в магазине. Договорись с родителями какие призы там появятся!",
    btn: "Начать!",
  },
];

export function ChildOnboarding({ name, onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF] flex flex-col items-center justify-center px-6" style={{ fontFamily: "Nunito, sans-serif" }}>
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-[#FF6B9D]" : i < step ? "w-4 bg-[#FF6B9D]/40" : "w-4 bg-gray-200"}`} />
        ))}
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-7xl mb-6" style={{ animation: "bounceIn 0.4s ease" }}>{current.emoji}</div>
          <h2 className="text-2xl font-black text-[#2D1B69] mb-3">{current.title(name)}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{current.desc}</p>
        </div>

        <button
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-base shadow-lg active:scale-95 transition-transform"
        >
          {current.btn}
        </button>

        {!isLast && (
          <button onClick={onDone} className="w-full mt-3 py-2 text-gray-400 text-sm font-semibold">
            Пропустить
          </button>
        )}
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
