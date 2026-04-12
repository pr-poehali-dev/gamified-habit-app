import { useState } from "react";
import PushNotificationToggle from "@/components/pwa/PushNotificationToggle";

type Props = { name: string; parentId?: number; onDone: () => void };

const isPwa = () => {
  const d = window.Telegram?.WebApp?.initData;
  return !(typeof d === "string" && d.length > 0);
};

const BASE_STEPS = [
  {
    emoji: "👋",
    title: (name: string) => `Привет, ${name}!`,
    desc: "СтарКидс помогает мотивировать детей через задания и награды. Дети выполняют задания — получают звёзды ⭐, звёзды тратят на призы 🎁",
    btn: "Как это работает →",
    pushStep: false,
  },
  {
    emoji: "👨‍👧",
    title: () => "Добавь ребёнка",
    desc: "Перейди во вкладку «Дети» и нажми «+ Добавить». Отправь ребёнку ссылку-приглашение — он войдёт в приложение одним нажатием.",
    btn: "Понятно →",
    pushStep: false,
  },
  {
    emoji: "📋",
    title: () => "Создавай задания",
    desc: "После подключения ребёнка создавай задания во вкладке «Задачи». Можно требовать фото-отчёт или подтверждение перед начислением звёзд.",
    btn: "Далее →",
    pushStep: false,
  },
  {
    emoji: "🔔",
    title: () => "Включите уведомления",
    desc: "Получайте мгновенные уведомления когда ребёнок выполнил задание, отправил оценку или что-то запросил — даже когда приложение закрыто.",
    btn: "Начать!",
    pushStep: true,
  },
];

export function ParentOnboarding({ name, parentId, onDone }: Props) {
  const pwa = isPwa();
  const STEPS = pwa ? BASE_STEPS : BASE_STEPS.slice(0, 3).map((s, i) => i === 2 ? { ...s, btn: "Начать!" } : s);
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF] flex flex-col items-center justify-center px-6" style={{ fontFamily: "Golos Text, sans-serif" }}>
      {/* Steps indicator */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-[#6B7BFF]" : i < step ? "w-4 bg-[#6B7BFF]/40" : "w-4 bg-gray-200"}`} />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-7xl mb-6" style={{ animation: "bounceIn 0.4s ease" }}>{current.emoji}</div>
          <h2 className="text-2xl font-black text-[#1E1B4B] mb-3">{current.title(name)}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{current.desc}</p>
        </div>

        {/* Push-переключатель на шаге уведомлений */}
        {current.pushStep && pwa && (
          <div className="mb-4">
            <PushNotificationToggle parentId={parentId} autoSubscribe />
          </div>
        )}

        <button
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-base shadow-lg active:scale-95 transition-transform"
        >
          {current.btn}
        </button>

        {!isLast && (
          <button onClick={onDone} className="w-full mt-3 py-2 text-gray-400 text-sm font-semibold">
            Пропустить
          </button>
        )}

        {step === 0 && (
          <p className="mt-5 text-[11px] text-gray-400 text-center leading-relaxed px-2">
            Регистрируясь в сервисе, вы соглашаетесь с{" "}
            <a href="/legal?tab=terms" target="_blank" rel="noopener noreferrer" className="underline text-[#6B7BFF]">
              условиями использования
            </a>
            ,{" "}
            <a href="/legal?tab=about" target="_blank" rel="noopener noreferrer" className="underline text-[#6B7BFF]">
              публичной офертой
            </a>{" "}
            и{" "}
            <a href="/legal?tab=consent" target="_blank" rel="noopener noreferrer" className="underline text-[#6B7BFF]">
              согласием на обработку персональных данных
            </a>
          </p>
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
