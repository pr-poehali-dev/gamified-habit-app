import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onDone: () => void;
}

const ua = () => navigator.userAgent;
const isIos = () => /iphone|ipad|ipod/i.test(ua());
const isAndroid = () => /android/i.test(ua());

// Встроенный браузер Telegram (iOS и Android)
const isTelegramBrowser = () => /telegram/i.test(ua());

// iOS, но не Safari (Chrome на iOS, Firefox на iOS, встроенный в Telegram)
const isIosNotSafari = () => isIos() && !/safari/i.test(ua());

// Нужно перенаправить пользователя в нужный браузер
const needsBrowserSwitch = () => isTelegramBrowser() || isIosNotSafari();

// ─── Иллюстрации ──────────────────────────────────────────────────────────────

function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 180, height: 320 }}>
      <svg viewBox="0 0 180 320" className="absolute inset-0 w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="176" height="316" rx="24" fill="#1a1a2e" stroke="#444" strokeWidth="3"/>
        <rect x="8" y="8" width="164" height="304" rx="20" fill="#f8f9ff"/>
        <rect x="72" y="12" width="36" height="6" rx="3" fill="#444"/>
      </svg>
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 24, paddingBottom: 12, paddingLeft: 10, paddingRight: 10 }}>
        {children}
      </div>
    </div>
  );
}

function SafariBrowserBar({ url = "starkids.ru" }: { url?: string }) {
  return (
    <div className="flex items-center gap-1 mb-1 px-1">
      <div className="flex-1 bg-gray-100 rounded-lg px-2 py-0.5 text-[7px] text-gray-500 truncate text-center">{url}</div>
    </div>
  );
}

function ChromeBrowserBar({ url = "starkids.ru" }: { url?: string }) {
  return (
    <div className="bg-white border-b border-gray-200 flex items-center gap-1 px-1 py-1 mb-1">
      <div className="flex gap-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400"/>
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
      </div>
      <div className="flex-1 bg-gray-100 rounded px-1 py-0.5 text-[6px] text-gray-500 text-center truncate">{url}</div>
      <div className="text-gray-400 text-[8px] font-bold">⋮</div>
    </div>
  );
}

function AppScreenContent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1">
      <div className="text-2xl">⭐</div>
      <div className="text-[8px] font-bold text-gray-700">СтарКидс</div>
      <div className="text-[6px] text-gray-400">Задания и награды</div>
    </div>
  );
}

// iOS шаги
function IosStep1() {
  return (
    <PhoneMockup>
      <SafariBrowserBar />
      <AppScreenContent />
      {/* Bottom Safari toolbar */}
      <div className="bg-gray-50 border-t border-gray-200 flex justify-around items-center px-2 py-1 rounded-b-lg">
        <div className="text-[10px] text-gray-400">←</div>
        <div className="text-[10px] text-gray-400">→</div>
        {/* Share button highlighted */}
        <div className="bg-[#6B7BFF] rounded-md p-1 shadow-md">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
        </div>
        <div className="text-[10px] text-gray-400">⊡</div>
        <div className="text-[10px] text-gray-400">≡</div>
      </div>
    </PhoneMockup>
  );
}

function IosStep2() {
  return (
    <PhoneMockup>
      <SafariBrowserBar />
      <AppScreenContent />
      {/* Share sheet popup */}
      <div className="absolute bottom-8 left-2 right-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
        <div className="flex justify-around mb-2">
          {["📋","📧","💬","📨"].map((e, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">{e}</div>
              <div className="text-[5px] text-gray-400">Поделиться</div>
            </div>
          ))}
        </div>
        {/* "Add to Home Screen" highlighted */}
        <div className="bg-[#F0F4FF] border border-[#6B7BFF] rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <div className="w-5 h-5 bg-[#6B7BFF] rounded-md flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>
            </svg>
          </div>
          <span className="text-[7px] font-bold text-[#6B7BFF]">На экран «Домой»</span>
        </div>
      </div>
    </PhoneMockup>
  );
}

function IosStep3() {
  return (
    <PhoneMockup>
      {/* Confirmation dialog */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-1.5 p-2">
            {["📱","📷","🎵","📞","🗓","📩","🔧","🌐","🛒","🎮","📸","⚙️"].map((e, i) => (
              <div key={i} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">{e}</div>
            ))}
          </div>
        </div>
        {/* Dock with highlighted new icon */}
        <div className="bg-white/70 backdrop-blur rounded-2xl mx-1 mb-1 flex justify-around items-center p-1.5">
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">📞</div>
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">📷</div>
          <div className="w-9 h-9 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-xl flex items-center justify-center text-base shadow-lg ring-2 ring-[#6B7BFF] ring-offset-1">⭐</div>
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm">🌐</div>
        </div>
      </div>
    </PhoneMockup>
  );
}

// Android шаги
function AndroidStep1() {
  return (
    <PhoneMockup>
      <ChromeBrowserBar />
      <AppScreenContent />
      {/* Menu highlight */}
      <div className="absolute top-10 right-2 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 w-20">
        <div className="text-[6px] text-gray-500 py-0.5 px-1">Новая вкладка</div>
        <div className="text-[6px] text-gray-500 py-0.5 px-1">Закладки</div>
        <div className="bg-[#F0F4FF] border border-[#6B7BFF] rounded py-0.5 px-1">
          <span className="text-[6px] font-bold text-[#6B7BFF]">Добавить на гл. экран</span>
        </div>
        <div className="text-[6px] text-gray-500 py-0.5 px-1">Настройки</div>
      </div>
      <div className="absolute top-6 right-3">
        <div className="bg-[#6B7BFF] rounded-full px-1 py-0.5">
          <span className="text-white text-[8px] font-bold">⋮</span>
        </div>
      </div>
    </PhoneMockup>
  );
}

function AndroidStep2() {
  return (
    <PhoneMockup>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-4xl">⭐</div>
        </div>
        {/* Bottom sheet */}
        <div className="bg-white rounded-t-2xl shadow-xl border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-xl flex items-center justify-center text-base">⭐</div>
            <div>
              <div className="text-[7px] font-bold text-gray-800">СтарКидс</div>
              <div className="text-[5px] text-gray-400">starkids.ru</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button className="flex-1 py-1 rounded-lg bg-gray-100 text-[6px] text-gray-500">Отмена</button>
            <button className="flex-1 py-1 rounded-lg bg-[#6B7BFF] text-[6px] text-white font-bold">Добавить</button>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
}

function AndroidStep3() {
  return (
    <PhoneMockup>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-1 bg-gray-800 px-2 py-1">
          <div className="text-[6px] text-gray-300">12:00</div>
          <div className="flex-1"/>
          <div className="text-[8px] text-gray-300">📶 🔋</div>
        </div>
        <div className="flex-1 bg-gray-100 p-2">
          <div className="grid grid-cols-4 gap-2">
            {["📱","📷","🎵","📞","🗓","📩","🔧","🌐","🛒","🎮","📸"].map((e, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-sm shadow">{e}</div>
                <div className="text-[4px] text-gray-500">Приложение</div>
              </div>
            ))}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-xl flex items-center justify-center text-base shadow-lg ring-2 ring-[#6B7BFF] ring-offset-1">⭐</div>
              <div className="text-[4px] font-bold text-[#6B7BFF]">СтарКидс</div>
            </div>
          </div>
        </div>
      </div>
    </PhoneMockup>
  );
}

// ─── Данные шагов ─────────────────────────────────────────────────────────────

const IOS_STEPS = [
  {
    illustration: <IosStep1 />,
    badge: "Шаг 1",
    title: "Нажмите кнопку «Поделиться»",
    desc: "Внизу экрана Safari найдите кнопку с квадратом и стрелкой вверх — и нажмите на неё.",
  },
  {
    illustration: <IosStep2 />,
    badge: "Шаг 2",
    title: "Выберите «На экран Домой»",
    desc: 'В появившемся меню прокрутите список и нажмите "На экран Домой".',
  },
  {
    illustration: <IosStep3 />,
    badge: "Готово!",
    title: "Иконка появится на экране",
    desc: "Теперь СтарКидс будет открываться как обычное приложение — без адресной строки браузера.",
  },
];

const ANDROID_STEPS = [
  {
    illustration: <AndroidStep1 />,
    badge: "Шаг 1",
    title: "Нажмите меню ⋮ в браузере",
    desc: "В правом верхнем углу Chrome нажмите три точки, затем выберите «Добавить на главный экран».",
  },
  {
    illustration: <AndroidStep2 />,
    badge: "Шаг 2",
    title: "Подтвердите установку",
    desc: "Появится диалог с названием приложения — нажмите «Добавить».",
  },
  {
    illustration: <AndroidStep3 />,
    badge: "Готово!",
    title: "Иконка на главном экране",
    desc: "СтарКидс теперь запускается как приложение — быстро и без браузера.",
  },
];

// ─── Экран "открой в другом браузере" ─────────────────────────────────────────

function BrowserSwitchScreen({ onDone }: { onDone: () => void }) {
  const inTg = isTelegramBrowser();
  const ios = isIos();
  const currentUrl = window.location.href;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF] flex flex-col" style={{ fontFamily: "Golos Text, sans-serif" }}>
      <div className="flex justify-end px-5 pt-8">
        <button onClick={onDone} className="text-sm text-gray-400 font-medium px-3 py-1 rounded-full hover:bg-gray-100 transition">
          Пропустить
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        <div className="text-6xl">{inTg ? "✈️" : "🌐"}</div>

        <div className="space-y-3 max-w-xs">
          <h2 className="text-xl font-black text-[#1E1B4B]">
            {inTg ? "Откройте в браузере" : "Откройте в Safari"}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {inTg && ios && "Встроенный браузер Telegram не поддерживает добавление на экран «Домой». Откройте ссылку в Safari."}
            {inTg && !ios && "Встроенный браузер Telegram не поддерживает добавление на главный экран. Откройте ссылку в Chrome."}
            {!inTg && ios && "Chrome и Firefox на iPhone не поддерживают добавление на экран «Домой». Используйте Safari."}
          </p>
        </div>

        {/* Визуальная инструкция */}
        <div className="w-full max-w-xs bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          {inTg ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">1</div>
                <p className="text-sm text-gray-700 text-left">
                  Нажмите <strong>«···»</strong> или <strong>⋮</strong> в правом верхнем углу
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">2</div>
                <p className="text-sm text-gray-700 text-left">
                  Выберите <strong>«Открыть в {ios ? "Safari" : "Chrome"}»</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">3</div>
                <p className="text-sm text-gray-700 text-left">
                  Следуйте инструкции по добавлению на экран
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">1</div>
                <p className="text-sm text-gray-700 text-left">Скопируйте адрес сайта</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">2</div>
                <p className="text-sm text-gray-700 text-left">Откройте <strong>Safari</strong> и вставьте адрес</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6B7BFF]/10 rounded-full flex items-center justify-center text-sm font-bold text-[#6B7BFF]">3</div>
                <p className="text-sm text-gray-700 text-left">Добавьте на экран «Домой» через кнопку «Поделиться»</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 pb-8 space-y-2">
        {!inTg && (
          <Button
            className="w-full h-12 text-base bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg"
            onClick={() => {
              navigator.clipboard?.writeText(currentUrl).catch(() => {});
              onDone();
            }}
          >
            Скопировать адрес сайта
          </Button>
        )}
        <button onClick={onDone} className="w-full text-sm text-gray-400 text-center py-2">
          Продолжить без установки
        </button>
      </div>
    </div>
  );
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function InstallPwaGuide({ onDone }: Props) {
  const ios = isIos();
  const [step, setStep] = useState(0);

  // Если браузер не поддерживает установку — показываем инструкцию переключиться
  if (needsBrowserSwitch()) {
    return <BrowserSwitchScreen onDone={onDone} />;
  }

  const steps = ios ? IOS_STEPS : ANDROID_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF] flex flex-col" style={{ fontFamily: "Golos Text, sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📲</span>
          <span className="text-sm font-bold text-gray-700">Добавить на экран</span>
        </div>
        <button
          onClick={onDone}
          className="text-sm text-gray-400 font-medium px-3 py-1 rounded-full hover:bg-gray-100 transition"
        >
          Пропустить
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center py-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-[#6B7BFF]" : i < step ? "w-4 bg-[#6B7BFF]/40" : "w-4 bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Illustration */}
        <div className="relative">
          {current.illustration}
          {/* Badge */}
          <div className="absolute -top-2 -right-2 bg-[#6B7BFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            {current.badge}
          </div>
        </div>

        {/* Text */}
        <div className="text-center max-w-xs space-y-2">
          <h2 className="text-xl font-black text-[#1E1B4B]">{current.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{current.desc}</p>
        </div>
      </div>

      {/* OS switcher */}
      <div className="flex justify-center gap-2 px-6 pb-2">
        <span className="text-xs text-gray-400">
          Инструкция для: <strong className="text-[#6B7BFF]">{ios ? "iPhone / iPad" : "Android"}</strong>
        </span>
      </div>

      {/* Buttons */}
      <div className="px-5 pb-8 space-y-2">
        <Button
          className="w-full h-12 text-base bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg"
          onClick={() => isLast ? onDone() : setStep((s) => s + 1)}
        >
          {isLast ? "Всё понятно!" : "Дальше →"}
        </Button>
      </div>
    </div>
  );
}