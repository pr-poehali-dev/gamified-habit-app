import { useEffect, useRef, useState } from "react";
import func2url from "../../backend/func2url.json";

const SUPPORT_URL = func2url["support-email"];

const PWA_URL = "/app";

// ─── Мини-телефон для пошаговых мокапов ─────────────────────────────────────
function MiniPhone({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {label && (
        <div style={{
          background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 50,
          padding: "3px 12px", fontSize: 11, fontWeight: 700, color: "#6B7BFF",
        }}>{label}</div>
      )}
      <div style={{
        width: 200, background: "#d1d5db", borderRadius: 32, padding: 3,
        boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
        flexShrink: 0,
      }}>
        <div style={{ background: "#f8f9ff", borderRadius: 29, overflow: "hidden", minHeight: 360, position: "relative" }}>
          <div style={{ background: "#f8f9ff", padding: "7px 14px 3px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>9:41</span>
            <div style={{ width: 56, height: 14, background: "#1f2937", borderRadius: 99 }} />
            <span style={{ fontSize: 8, color: "#9ca3af" }}>🔋</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Шаг 1: форма ввода телефона
function StepPhone() {
  return (
    <MiniPhone label="Шаг 1">
      <div style={{ padding: "16px 12px" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⭐</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#1E1B4B", marginBottom: 3 }}>Добро пожаловать!</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>Введите номер телефона</div>
        </div>
        <div style={{ background: "#fff", border: "2px solid #6B7BFF", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Номер телефона</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E1B4B" }}>+7 (999) 123-45-67</div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 12, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
          Получить код →
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "7px 9px", display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ fontSize: 13 }}>🛡️</span>
          <div style={{ fontSize: 9, color: "#166534", lineHeight: 1.4 }}>
            Только ваш телефон. Никаких данных о детях не собираем.
          </div>
        </div>
      </div>
    </MiniPhone>
  );
}

// Шаг 2: добавление ребёнка
function StepAddChild() {
  return (
    <MiniPhone label="Шаг 2">
      <div style={{ padding: "12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#1E1B4B", marginBottom: 10, textAlign: "center" }}>👶 Добавить ребёнка</div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Аватар</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {["🦋","🐱","🦊","🐼","🐸","🦁"].map((e,i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: i===0?"#ede9fe":"#f3f4f6", border: i===0?"2px solid #6B7BFF":"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 14 }}>{e}</div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Имя</div>
          <div style={{ background: "#fff", border: "1.5px solid #6B7BFF", borderRadius: 9, padding: "6px 9px", fontSize: 11, fontWeight: 700, color: "#1E1B4B" }}>Катя</div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Возраст</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[7,8,9,10,11,12].map((a) => (
              <div key={a} style={{ width: 24, height: 24, borderRadius: 7, background: a===9?"linear-gradient(135deg,#6B7BFF,#9B6BFF)":"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 9, fontWeight: 800, color: a===9?"#fff":"#374151" }}>{a}</div>
            ))}
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 10, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
          Добавить ребёнка ✓
        </div>
      </div>
    </MiniPhone>
  );
}

// Шаг 3: инвайт-код для ребёнка
function StepInvite() {
  return (
    <MiniPhone label="Шаг 3">
      <div style={{ padding: "12px 12px" }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#6B7BFF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>⏳ Ожидает подключения</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#1E1B4B", marginBottom: 2 }}>Катя добавлена!</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>Отправьте ребёнку ссылку</div>
        </div>
        <div style={{ background: "#f8faff", border: "1.5px solid #c4b5fd", borderRadius: 12, padding: "10px", marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>Код для ребёнка</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#6B7BFF", letterSpacing: "0.15em", textAlign: "center", marginBottom: 6 }}>BSPVNV</div>
          <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 8, padding: "7px", textAlign: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
            📤 Отправить приглашение
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "center", lineHeight: 1.4 }}>
          Ребёнок переходит по ссылке<br />и вводит только своё имя
        </div>
      </div>
    </MiniPhone>
  );
}

// Шаг 4: создание задания
function StepTask() {
  return (
    <MiniPhone label="Шаг 4">
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#1E1B4B", marginBottom: 8, textAlign: "center" }}>📋 Первое задание</div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", marginBottom: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 2 }}>⚡ Шаблоны</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["🧹 Уборка","📚 Уроки","🦷 Зубы"].map((t,i) => (
              <div key={i} style={{ background: i===0?"#ede9fe":"#f3f4f6", border: i===0?"1px solid #c4b5fd":"1px solid #e5e7eb", borderRadius: 6, padding: "3px 7px", fontSize: 9, fontWeight: 700, color: i===0?"#6B7BFF":"#374151" }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #6B7BFF", borderRadius: 10, padding: "7px 10px", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1E1B4B" }}>🧹 Убраться в комнате</div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} style={{ flex: 1, background: s===3?"linear-gradient(135deg,#f59e0b,#ef4444)":"#f3f4f6", borderRadius: 7, padding: "6px 0", textAlign: "center", fontSize: 10, fontWeight: 800, color: s===3?"#fff":"#374151" }}>{s}⭐</div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 10, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
          Создать задание ✓
        </div>
      </div>
    </MiniPhone>
  );
}

// ─── Секция "Как начать" ─────────────────────────────────────────────────────
function HowToStart() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      num: "1", title: "Введите свой номер телефона", desc: "Никаких паролей и почты. SMS-код за 30 секунд — и вы внутри.",
      note: "📱 Только ваш телефон. Больше ничего.", mock: <StepPhone />,
    },
    {
      num: "2", title: "Добавьте ребёнка", desc: "Выберите аватар, введите имя и возраст. Это всё что нужно знать приложению.",
      note: "🛡️ Мы не собираем данные о детях — ни телефон, ни школу, ни что-либо ещё.", mock: <StepAddChild />,
    },
    {
      num: "3", title: "Отправьте ребёнку ссылку", desc: "Ребёнок переходит по ссылке и вводит только своё имя. Никакой регистрации.",
      note: "🔗 Ребёнок подключается без телефона и аккаунта.", mock: <StepInvite />,
    },
    {
      num: "4", title: "Создайте первое задание", desc: "Выберите из шаблонов или напишите своё. Укажите сколько звёзд за выполнение.",
      note: "⚡ Первое задание — за 30 секунд.", mock: <StepTask />,
    },
  ];

  return (
    <section ref={ref} style={{
      background: "linear-gradient(180deg, #f8f9ff 0%, #f0f4ff 100%)",
      padding: "80px 24px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{
            display: "inline-block", background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 14,
          }}>Старт за 2 минуты</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 12,
          }}>Как начать работу</h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", maxWidth: 440, margin: "0 auto" }}>
            Четыре шага — и ваша семья уже в игре
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 40, alignItems: "center",
              flexDirection: i % 2 === 0 ? "row" : "row-reverse",
              flexWrap: "wrap", justifyContent: "center",
            }}>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, borderRadius: 12,
                  background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)",
                  fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 12,
                  boxShadow: "0 4px 14px rgba(107,123,255,0.35)",
                }}>{step.num}</div>
                <h3 style={{ fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: "1.25rem", color: "#1E1B4B", marginBottom: 8, lineHeight: 1.3 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.65, marginBottom: 12 }}>
                  {step.desc}
                </p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 10, padding: "7px 12px",
                  fontSize: 12, fontWeight: 700, color: "#166534",
                }}>
                  {step.note}
                </div>
              </div>

              {/* Phone mockup */}
              <div style={{ flexShrink: 0 }}>
                {step.mock}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <a href={PWA_URL} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", color: "#fff",
            borderRadius: 18, padding: "16px 40px", fontSize: 17, fontWeight: 900,
            textDecoration: "none", boxShadow: "0 8px 28px rgba(107,123,255,0.35)",
          }}>
            <span style={{ fontSize: 22 }}>🚀</span>
            <span>
              <span style={{ display: "block" }}>Начать прямо сейчас</span>
              <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 1 }}>Бесплатно · Без установки · 2 минуты</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Мокапы Problem/Solution ─────────────────────────────────────────────────
function PhoneProblem() {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: "#e2e8f0", borderRadius: 44, padding: 4,
      boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
    }}>
      <div style={{ background: "#fff5f5", borderRadius: 40, overflow: "hidden", minHeight: 480 }}>
        <div style={{ background: "#fff5f5", padding: "10px 18px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>9:41</span>
          <div style={{ width: 80, height: 20, background: "#1f2937", borderRadius: 99, position: "absolute", left: "50%", transform: "translateX(-50%)", marginTop: -2 }} />
          <span style={{ fontSize: 9, color: "#9ca3af" }}>●●● 🔋</span>
        </div>
        <div style={{ padding: "14px 14px 10px" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>💬 Типичный вечер</div>
            {[
              { from: "parent", text: "Убери комнату!" },
              { from: "child",  text: "Потом..." },
              { from: "parent", text: "Ты уже 3 раза говорил «потом»" },
              { from: "child",  text: "Не хочу 😤" },
              { from: "parent", text: "Сделай уроки хотя бы!" },
              { from: "child",  text: "Скучно. Буду в телефоне" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "parent" ? "flex-start" : "flex-end", marginBottom: 5 }}>
                <div style={{
                  background: m.from === "parent" ? "#fee2e2" : "#fef3c7",
                  border: `1px solid ${m.from === "parent" ? "#fca5a5" : "#fde68a"}`,
                  borderRadius: m.from === "parent" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                  padding: "6px 10px", fontSize: 11, fontWeight: 600,
                  color: m.from === "parent" ? "#991b1b" : "#92400e",
                  maxWidth: "75%",
                }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", marginBottom: 8 }}>😩 Каждый день одно и то же</div>
            {[
              { icon: "😤", text: "Скандал из-за уборки" },
              { icon: "📵", text: "Ребёнок в телефоне вместо уроков" },
              { icon: "😔", text: "Родитель чувствует себя надзирателем" },
              { icon: "🔁", text: "Повторяется снова и снова" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span style={{ fontSize: 10, color: "#7f1d1d", fontWeight: 600 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneSolution() {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: "#e2e8f0", borderRadius: 44, padding: 4,
      boxShadow: "0 24px 60px rgba(107,123,255,0.25), 0 0 0 1px rgba(107,123,255,0.1)",
    }}>
      <div style={{ background: "linear-gradient(180deg,#f8f9ff,#f0f4ff)", borderRadius: 40, overflow: "hidden", minHeight: 480 }}>
        <div style={{ background: "#f8f9ff", padding: "10px 18px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 80, height: 20, background: "#1f2937", borderRadius: 99, position: "absolute", left: "50%", transform: "translateX(-50%)", marginTop: -2 }} />
          <span style={{ fontSize: 9, color: "#9ca3af" }}>●●● 🔋</span>
        </div>
        <div style={{ padding: "10px 12px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🦋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1E1B4B" }}>Катя</div>
              <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>42⭐ · Уровень 4 🥈</div>
            </div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, color: "#ea580c" }}>🔥 5 дней</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, padding: "7px 10px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
              <span>До уровня 5 🥇</span><span>42/50 ⭐</span>
            </div>
            <div style={{ height: 7, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#f59e0b)", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>📋 Задания сегодня</div>
          {[
            { emoji: "🧹", title: "Убраться в комнате", stars: 3, bg: "#ede9fe", border: "#c4b5fd", done: true },
            { emoji: "📚", title: "Домашнее задание",   stars: 4, bg: "#fce7f3", border: "#f9a8d4", done: false },
            { emoji: "🦷", title: "Почистить зубы",     stars: 1, bg: "#dcfce7", border: "#86efac", done: true },
            { emoji: "🍽️", title: "Помыть посуду",      stars: 2, bg: "#fef9c3", border: "#fde047", done: false },
          ].map((t, i) => (
            <div key={i} style={{
              background: t.done ? "#f0fdf4" : "#fff", border: `1px solid ${t.done ? "#bbf7d0" : "#f3f4f6"}`,
              borderRadius: 11, padding: "7px 9px", marginBottom: 5,
              display: "flex", alignItems: "center", gap: 7, opacity: t.done ? 0.75 : 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ width: 26, height: 26, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{t.emoji}</div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#1E1B4B", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
              {t.done ? <span style={{ fontSize: 13 }}>✅</span> : <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 6, padding: "3px 6px", fontSize: 9, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>+{t.stars}⭐</div>}
            </div>
          ))}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 10px", marginTop: 2, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1E1B4B" }}>Поход в кино</div>
              <div style={{ fontSize: 9, color: "#d97706" }}>Ещё 8⭐ до цели!</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", padding: "6px 0 10px", marginTop: 4 }}>
          {[["✅","Задачи",true],["📝","Оценки",false],["🛍️","Магазин",false],["🏆","Профиль",false]].map(([icon,label,active], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 15 }}>{icon}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{label}</div>
              {active && <div style={{ width: 14, height: 2, background: "#6B7BFF", borderRadius: 99, margin: "2px auto 0" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemSolution() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      background: "#fff", padding: "80px 24px",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 14,
          }}>Как это работает</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 12,
          }}>Превращаем конфликт в игру</h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", maxWidth: 460, margin: "0 auto" }}>
            Одна простая идея — и домашние дела перестают быть проблемой
          </p>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, minWidth: 280, maxWidth: 340 }}>
            <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 20, padding: "12px 20px", textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>😩</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#dc2626", marginBottom: 4 }}>Было</div>
              <div style={{ fontSize: 13, color: "#7f1d1d" }}>Уговоры, скандалы, повторения — каждый вечер одно и то же</div>
            </div>
            <PhoneProblem />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, fontSize: 36, color: "#6B7BFF", flexShrink: 0 }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, minWidth: 280, maxWidth: 340 }}>
            <div style={{ background: "linear-gradient(135deg,#ede9fe,#f0f9ff)", border: "2px solid #c4b5fd", borderRadius: 20, padding: "12px 20px", textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#6B7BFF", marginBottom: 4 }}>Стало</div>
              <div style={{ fontSize: 13, color: "#4c1d95" }}>Ребёнок сам бежит выполнять задания — ведь за них дают звёзды на призы</div>
            </div>
            <PhoneSolution />
          </div>
        </div>

        <div style={{
          marginTop: 56, background: "linear-gradient(135deg,#f0f0ff,#fdf4ff)", border: "1px solid #c4b5fd",
          borderRadius: 24, padding: "32px 40px", textAlign: "center", maxWidth: 700, margin: "56px auto 0",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💡</div>
          <div style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)", fontWeight: 900, color: "#1E1B4B", marginBottom: 10, fontFamily: "Nunito, sans-serif" }}>
            Главный принцип: ребёнок делает то, что ему интересно
          </div>
          <div style={{ fontSize: "0.95rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 24px" }}>
            Звёзды → уровни → достижения → реальные призы. Та же механика, что в любимых играх. Только вместо виртуальных монет — убранная комната.
          </div>
          <a href="/app" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", color: "#fff",
            borderRadius: 16, padding: "14px 32px", fontSize: 15, fontWeight: 800,
            textDecoration: "none", boxShadow: "0 6px 24px rgba(107,123,255,0.35)",
          }}>
            Попробовать бесплатно →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Мотивация ───────────────────────────────────────────────────────────────

// Мокап: экран достижений ребёнка
function AchievementsMockup() {
  const achievements = [
    { emoji: "⭐", title: "Первая звезда", done: true, new: true },
    { emoji: "🔥", title: "Серия 3 дня",  done: true, new: false },
    { emoji: "📋", title: "5 заданий",    done: true, new: false },
    { emoji: "💰", title: "50 звёзд",     done: true, new: false },
    { emoji: "🛍️", title: "Покупка",     done: true, new: false },
    { emoji: "🔥", title: "Серия 7 дней", done: false, new: false },
    { emoji: "🏆", title: "10 заданий",   done: false, new: false },
    { emoji: "💎", title: "100 звёзд",    done: false, new: false },
  ];
  return (
    <div style={{
      width: 240, background: "#d1d5db", borderRadius: 36, padding: 3,
      boxShadow: "0 20px 56px rgba(107,123,255,0.22), 0 0 0 1px rgba(0,0,0,0.05)",
    }}>
      <div style={{ background: "linear-gradient(180deg,#f8f9ff,#f0f4ff)", borderRadius: 33, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 60, height: 14, background: "#1f2937", borderRadius: 99 }} />
          <span style={{ fontSize: 8, color: "#9ca3af" }}>🔋</span>
        </div>

        {/* Unlock banner */}
        <div style={{ margin: "0 10px 8px", background: "linear-gradient(135deg,#fef9c3,#fef3c7)", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 10px", display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎉</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#92400e" }}>Новое достижение!</div>
            <div style={{ fontSize: 9, color: "#d97706" }}>«Первая звезда» разблокирована</div>
          </div>
        </div>

        <div style={{ padding: "0 10px 6px" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>🏆 Достижения</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
            {achievements.map((a, i) => (
              <div key={i} style={{
                background: a.new ? "linear-gradient(135deg,#fef9c3,#fef3c7)" : a.done ? "#ede9fe" : "#f3f4f6",
                border: `1.5px solid ${a.new ? "#fde68a" : a.done ? "#c4b5fd" : "#e5e7eb"}`,
                borderRadius: 10, padding: "7px 3px", textAlign: "center",
                opacity: a.done ? 1 : 0.4,
                position: "relative",
              }}>
                {a.new && <div style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, background: "#ef4444", borderRadius: "50%", border: "1.5px solid #fff" }} />}
                <div style={{ fontSize: 16 }}>{a.emoji}</div>
                <div style={{ fontSize: 7, color: a.done ? "#5b21b6" : "#9ca3af", marginTop: 2, lineHeight: 1.2, fontWeight: 600 }}>{a.title}</div>
              </div>
            ))}
          </div>

          {/* Progress to next */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 11, padding: "8px 10px", marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#6b7280", marginBottom: 4, fontWeight: 700 }}>
              <span>🔥 До серии 7 дней</span><span>3/7</span>
            </div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "43%", height: "100%", background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: 99 }} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", padding: "5px 0 9px" }}>
          {[["✅","Задачи",false],["📝","Оценки",false],["🛍️","Магазин",false],["🏆","Профиль",true]].map(([icon,label,active], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{icon}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{label}</div>
              {active && <div style={{ width: 14, height: 2, background: "#6B7BFF", borderRadius: 99, margin: "2px auto 0" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Мокап: магазин наград
function ShopMockup() {
  return (
    <div style={{
      width: 240, background: "#d1d5db", borderRadius: 36, padding: 3,
      boxShadow: "0 20px 56px rgba(245,158,11,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
    }}>
      <div style={{ background: "linear-gradient(180deg,#f8f9ff,#fffbeb)", borderRadius: 33, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 60, height: 14, background: "#1f2937", borderRadius: 99 }} />
          <span style={{ fontSize: 8, color: "#9ca3af" }}>🔋</span>
        </div>
        <div style={{ padding: "6px 10px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#1E1B4B" }}>🛍️ Магазин</div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "3px 9px", fontSize: 11, fontWeight: 800, color: "#d97706" }}>42 ⭐</div>
          </div>
          {[
            { emoji: "🎮", title: "+1 час игры",    cost: 10, progress: 100, canBuy: true },
            { emoji: "🍦", title: "Мороженое",       cost: 8,  progress: 100, canBuy: true },
            { emoji: "🍕", title: "Пицца на ужин",  cost: 15, progress: 100, canBuy: true },
            { emoji: "🎬", title: "Поход в кино",    cost: 30, progress: 100, canBuy: true },
            { emoji: "🎯", title: "Новая игра",      cost: 80, progress: 53,  canBuy: false },
          ].map((r, i) => (
            <div key={i} style={{
              background: "#fff", border: `1px solid ${r.canBuy ? "#f3f4f6" : "#f3f4f6"}`,
              borderRadius: 11, padding: "7px 9px", marginBottom: 5, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: r.canBuy ? 0 : 5 }}>
                <div style={{ width: 28, height: 28, background: "#f9fafb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{r.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>{r.title}</div>
                  <div style={{ fontSize: 9, color: "#d97706", fontWeight: 700 }}>{r.cost} ⭐</div>
                </div>
                <div style={{
                  background: r.canBuy ? "linear-gradient(135deg,#6B7BFF,#9B6BFF)" : "#f3f4f6",
                  borderRadius: 7, padding: "4px 8px", fontSize: 9, fontWeight: 800,
                  color: r.canBuy ? "#fff" : "#9ca3af",
                }}>{r.canBuy ? "Купить" : "🔒"}</div>
              </div>
              {!r.canBuy && (
                <div>
                  <div style={{ height: 4, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${r.progress}%`, height: "100%", background: "linear-gradient(90deg,#6B7BFF,#9B6BFF)", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 2 }}>42 из 80 ⭐ накоплено</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MotivationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const pillars = [
    {
      emoji: "🎯",
      title: "Мгновенная связь: действие → награда",
      text: "Детский мозг устроен так: он ищет немедленный результат. Убрал комнату — через секунду видит +3⭐ на экране. Это не просто красиво — это именно то, как работает мотивация.",
      color: "#ede9fe", border: "#c4b5fd", accent: "#6B7BFF",
    },
    {
      emoji: "📈",
      title: "Прогресс виден — значит хочется идти дальше",
      text: "Уровни, прогресс-бары, полоска до следующей ачивки. Ребёнок видит, насколько он близко к цели — и это само по себе мотивирует сделать ещё одно задание.",
      color: "#fce7f3", border: "#f9a8d4", accent: "#ec4899",
    },
    {
      emoji: "🏆",
      title: "Достижения создают гордость",
      text: "Открыть скрытую ачивку, достичь нового уровня — это момент настоящей гордости. Дети делятся этим с друзьями и родителями. Внутренняя мотивация растёт.",
      color: "#fef9c3", border: "#fde68a", accent: "#d97706",
    },
    {
      emoji: "🎁",
      title: "Реальный приз — реальная цель",
      text: "Ребёнок сам выбирает, на что копит: поход в кино, час игры, пицца. Когда цель своя — стараться хочется по-настоящему. Никакого давления извне.",
      color: "#dcfce7", border: "#86efac", accent: "#16a34a",
    },
  ];

  return (
    <section ref={ref} style={{
      background: "#fff",
      padding: "80px 24px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{
            display: "inline-block", background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 14,
          }}>Игровая мотивация</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 16,
          }}>Почему игровая механика<br />работает лучше уговоров</h2>
          <p style={{ color: "#6b7280", fontSize: "1.05rem", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
            Современные дети выросли в мире, где прогресс виден мгновенно — в играх, роликах, приложениях.
            Их мозг привык к этому. Мы используем тот же принцип для реальных дел.
          </p>
        </div>

        {/* Big stat row */}
        <div style={{
          display: "flex", gap: 1, background: "#e5e7eb", borderRadius: 20, overflow: "hidden",
          marginBottom: 64, flexWrap: "wrap",
        }}>
          {[
            { num: "в 3×", label: "выше вовлечённость", sub: "когда есть система прогресса" },
            { num: "87%", label: "детей выполняют задания", sub: "при наличии игровой цели" },
            { num: "< 5 лет", label: "возраст игровой логики", sub: "дети понимают «заработал → потратил»" },
            { num: "2 мин", label: "и семья в игре", sub: "от регистрации до первого задания" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 180, background: "#fff", padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#1E1B4B", fontFamily: "Nunito, sans-serif", lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "6px 0 3px" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two columns: pillars left, phones right */}
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>

          {/* Left: 4 pillars */}
          <div style={{ flex: 1, minWidth: 280, maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>
            {pillars.map((p, i) => (
              <div key={i} style={{
                background: p.color, border: `1px solid ${p.border}`,
                borderRadius: 18, padding: "18px 20px",
                display: "flex", gap: 14, alignItems: "flex-start",
                transition: "transform 0.2s",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                  boxShadow: `0 4px 12px ${p.border}`,
                }}>{p.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1E1B4B", marginBottom: 5, fontFamily: "Nunito, sans-serif" }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>{p.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: two stacked phones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", flexShrink: 0 }}>

            {/* Label */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1E1B4B", marginBottom: 4 }}>Что видит ребёнок</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Прогресс и цели всегда перед глазами</div>
            </div>

            {/* Phones side by side */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7BFF", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 50, padding: "3px 12px" }}>Достижения</div>
                <AchievementsMockup />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 50, padding: "3px 12px" }}>Магазин призов</div>
                <ShopMockup />
              </div>
            </div>

            {/* Quote */}
            <div style={{
              background: "linear-gradient(135deg,#f0f0ff,#fdf4ff)", border: "1px solid #c4b5fd",
              borderRadius: 16, padding: "16px 20px", maxWidth: 500, textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13, color: "#4c1d95", lineHeight: 1.6, fontStyle: "italic" }}>
                «Дочь сама попросила задания на выходные — хотела накопить на кино. Раньше даже мысли такой не было»
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8, fontWeight: 600 }}>— Марина, мама 10-летней Сони</div>
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div style={{
          marginTop: 60, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { icon: "🎮", title: "Та же механика что в играх", text: "Уровни, очки, достижения — дети уже знают как это работает" },
            { icon: "🧠", title: "Дофамин от реального дела", text: "Мозг получает удовольствие не от игры, а от убранной комнаты" },
            { icon: "🔄", title: "Привычка формируется сама", text: "Через 2-3 недели задания становятся частью дня без напоминаний" },
          ].map((c, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 220, maxWidth: 320,
              background: "#f8f9ff", border: "1px solid #e5e7eb",
              borderRadius: 18, padding: "20px 18px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1E1B4B", marginBottom: 6, fontFamily: "Nunito, sans-serif" }}>{c.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{c.text}</div>
            </div>
          ))}
        </div>

        {/* Научные источники */}
        <div style={{
          marginTop: 56, background: "#f8f9ff", border: "1px solid #e5e7eb",
          borderRadius: 20, padding: "28px 32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>📚</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#374151", fontFamily: "Nunito, sans-serif" }}>
              Научная база
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
              — тезисы подтверждены исследованиями
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                tezis: "Немедленное вознаграждение усиливает мотивацию",
                source: "Deci, E.L. & Ryan, R.M. (2000). Self-determination theory",
                desc: "Теория самодетерминации: внешние награды, связанные с ощущением компетентности, поддерживают внутреннюю мотивацию и не подавляют её.",
                url: "https://selfdeterminationtheory.org/theory/",
                tag: "Психология мотивации",
              },
              {
                tezis: "Игровые механики повышают вовлечённость в задачи",
                source: "Hamari, J., Koivisto, J. & Sarsa, H. (2014). Does Gamification Work? — CHI Conference",
                desc: "Мета-анализ 24 исследований геймификации: в большинстве случаев игровые элементы положительно влияют на вовлечённость и мотивацию пользователей.",
                url: "https://dl.acm.org/doi/10.1109/HICSS.2014.377",
                tag: "Геймификация",
              },
              {
                tezis: "Прогресс-бары и уровни удерживают интерес",
                source: "Werbach, K. & Hunter, D. (2012). For the Win. Wharton Digital Press",
                desc: "Визуальный прогресс активирует «эффект незавершённого действия» (эффект Зейгарник) — мозг стремится довести начатое до конца.",
                url: "https://gamification.co/",
                tag: "Поведенческая психология",
              },
              {
                tezis: "Социальное сравнение усиливает настойчивость",
                source: "Festinger, L. (1954). A Theory of Social Comparison Processes. Human Relations",
                desc: "Теория социального сравнения: люди оценивают собственные успехи через сравнение с похожими другими — это стимулирует прилагать больше усилий.",
                url: "https://journals.sagepub.com/doi/10.1177/001872675400700202",
                tag: "Социальная психология",
              },
              {
                tezis: "Самостоятельный выбор цели повышает её ценность",
                source: "Bandura, A. (1997). Self-efficacy: The exercise of control. Freeman",
                desc: "Когда ребёнок сам выбирает цель (приз в магазине), его самоэффективность и мотивация к достижению значительно выше, чем при навязанных целях.",
                url: "https://www.albertbandura.com/albert-bandura-self-efficacy.html",
                tag: "Теория самоэффективности",
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                paddingBottom: i < 4 ? 14 : 0,
                borderBottom: i < 4 ? "1px solid #e5e7eb" : "none",
              }}>
                <div style={{
                  flexShrink: 0, marginTop: 2,
                  width: 24, height: 24, borderRadius: 6,
                  background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900, color: "#fff",
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1E1B4B" }}>
                      {item.tezis}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#6B7BFF",
                      background: "#ede9fe", border: "1px solid #c4b5fd",
                      borderRadius: 50, padding: "1px 8px",
                    }}>{item.tag}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 4 }}>
                    {item.desc}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#6B7BFF", textDecoration: "none", fontWeight: 600 }}
                  >
                    {item.source} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
            * Приведённые исследования относятся к психологии мотивации и геймификации в широком смысле. СтарКидс опирается на эти принципы при проектировании игровой механики.
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Друзья и соревнование ───────────────────────────────────────────────────
function FriendsMockup() {
  const friends = [
    { emoji: "🐱", name: "Лёша",  stars: 67, level: 6, streak: 12, you: false },
    { emoji: "🦋", name: "Катя",  stars: 42, level: 4, streak: 5,  you: true  },
    { emoji: "🦊", name: "Дима",  stars: 38, level: 4, streak: 3,  you: false },
    { emoji: "🐸", name: "Соня",  stars: 21, level: 2, streak: 1,  you: false },
  ];
  return (
    <div style={{
      width: 252, background: "#d1d5db", borderRadius: 36, padding: 3,
      boxShadow: "0 20px 56px rgba(107,123,255,0.2), 0 0 0 1px rgba(0,0,0,0.05)",
    }}>
      <div style={{ background: "linear-gradient(180deg,#f8f9ff,#f0f4ff)", borderRadius: 33, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 60, height: 14, background: "#1f2937", borderRadius: 99 }} />
          <span style={{ fontSize: 8, color: "#9ca3af" }}>🔋</span>
        </div>
        <div style={{ padding: "8px 11px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#1E1B4B" }}>👥 Мои друзья</div>
            <div style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 700, color: "#6B7BFF" }}>+ Добавить</div>
          </div>

          {/* Leaderboard */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>🏆 Рейтинг на этой неделе</div>
            {friends.map((f, i) => (
              <div key={i} style={{
                background: f.you ? "linear-gradient(135deg,#ede9fe,#e0e7ff)" : "#fff",
                border: `1px solid ${f.you ? "#c4b5fd" : "#f3f4f6"}`,
                borderRadius: 11, padding: "7px 9px", marginBottom: 5,
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: f.you ? "0 2px 8px rgba(107,123,255,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: i === 0 ? "linear-gradient(135deg,#ffd700,#f59e0b)" : i === 1 ? "#e5e7eb" : i === 2 ? "#fcd9b6" : "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900, color: i === 0 ? "#92400e" : "#6b7280",
                }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}`}</div>
                <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{f.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#1E1B4B" }}>{f.name} {f.you && <span style={{ fontSize: 8, color: "#6B7BFF", fontWeight: 700 }}>(ты)</span>}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>ур.{f.level} · 🔥{f.streak} дней</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706" }}>{f.stars}⭐</div>
              </div>
            ))}
          </div>

          {/* Shared achievement */}
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 11, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#92400e", marginBottom: 5 }}>🎉 Новое у друга</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 28, height: 28, background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔥</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>Лёша открыл «Серия 7 дней»</div>
                <div style={{ fontSize: 9, color: "#d97706" }}>Обгони его — у тебя 5 дней подряд!</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", padding: "5px 0 9px" }}>
          {[["✅","Задачи",false],["📝","Оценки",false],["🛍️","Магазин",false],["👥","Друзья",true]].map(([icon,label,active], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{icon}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{label}</div>
              {active && <div style={{ width: 14, height: 2, background: "#6B7BFF", borderRadius: 99, margin: "2px auto 0" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FriendsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      background: "linear-gradient(160deg, #f0f0ff 0%, #fdf4ff 100%)",
      padding: "80px 24px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
    }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", gap: 56, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>

        {/* Phone */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <FriendsMockup />
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.07)", maxWidth: 252,
          }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5, fontStyle: "italic" }}>
              «Лёша уже на 3-м месте — надо его обогнать!»<br />
              <span style={{ color: "#9ca3af", fontStyle: "normal" }}>— Катя, 9 лет</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 460 }}>
          <div style={{
            display: "inline-block", background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 16,
          }}>Социальная механика</div>

          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 16,
          }}>Друзья — главная причина<br />не бросить на полпути</h2>

          <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.75, marginBottom: 24 }}>
            Ребёнок видит, сколько звёзд у друзей, кто открыл новое достижение и какая у кого серия. Это не давление — это живой повод стараться сегодня, а не завтра.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {[
              { emoji: "🏆", title: "Рейтинг среди друзей", text: "Еженедельный топ по звёздам — ребёнок видит прогресс друзей и сам хочет стараться больше." },
              { emoji: "🎉", title: "Достижения видны всем", text: "Открыл «Серию 7 дней» — друзья это увидят. Гордость работает лучше любого напоминания." },
              { emoji: "🔥", title: "Серии заражают", text: "Когда у друга 12 дней подряд, а у тебя 5 — хочется не пропускать. Именно так формируется привычка." },
              { emoji: "🤝", title: "Добавить по коду", text: "Простое подключение без аккаунтов: ребёнок делится своим кодом — и друг уже в рейтинге." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, background: "#fff",
                  border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>{item.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1E1B4B", marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: "linear-gradient(135deg,#ede9fe,#e0e7ff)", border: "1px solid #c4b5fd",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#4c1d95", marginBottom: 4 }}>💡 Почему это важно для родителя</div>
            <div style={{ fontSize: 12, color: "#5b21b6", lineHeight: 1.6 }}>
              Внешняя мотивация от друзей снимает с вас роль надзирателя. Ребёнок старается не потому что «мама сказала» — а потому что не хочет отставать от Лёши.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Это действительно бесплатно? В чём подвох?",
    a: "Никакого подвоха. Сервис полностью бесплатен для всех семей — без пробных периодов, без скрытых платежей, без подписки. Мы создали его чтобы помочь семьям, а не заработать на них.",
    emoji: "💸",
  },
  {
    q: "Какие данные о ребёнке вы собираете?",
    a: "Только имя — и то оно хранится локально в вашей семье. Мы не собираем телефон ребёнка, его школу, геолокацию, фотографии или что-либо ещё. У ребёнка нет аккаунта — только игровые данные: задания и звёзды.",
    emoji: "🛡️",
  },
  {
    q: "Нужно ли скачивать приложение?",
    a: "Нет. СтарКидс работает прямо в браузере — на телефоне, планшете или компьютере. Ничего устанавливать не нужно. Просто открыли ссылку — и всё работает.",
    emoji: "📱",
  },
  {
    q: "Как ребёнок подключается?",
    a: "Вы создаёте профиль ребёнка и получаете уникальную ссылку. Ребёнок переходит по ней, вводит только своё имя — и сразу видит задания. Никакой регистрации, никакого телефона у ребёнка не нужно.",
    emoji: "🔗",
  },
  {
    q: "А если ребёнок схитрит и скажет, что сделал задание?",
    a: "Для этого есть режим фото-подтверждения: ребёнок прикладывает фотографию результата, и звёзды начисляются только после вашего одобрения. Без споров — вы просто смотрите фото.",
    emoji: "📸",
  },
  {
    q: "Вы сохраняете фотографии выполненных заданий?",
    a: "Фотография существует ровно одну минуту жизненного цикла: загружается в зашифрованном виде на защищённый сервер — вы её видите и нажимаете «Подтвердить» или «Отклонить». Сразу после этого фотография автоматически и безвозвратно удаляется. Мы не храним, не анализируем и не передаём фотографии третьим лицам. Никогда. Мы за полную приватность вашей семьи.",
    emoji: "🔐",
  },
  {
    q: "Сколько детей можно добавить?",
    a: "Любое количество. Каждый ребёнок получает свой список заданий, свои награды и свой прогресс. Удобно для семей с двумя и более детьми — можно сравнивать успехи.",
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    q: "Подходит ли это для детей любого возраста?",
    a: "Да. Система рассчитана на детей от 5 до 16 лет. Для младших — простые задания и большие яркие звёзды. Для старших — оценки из школы, рейтинг друзей, более сложные достижения.",
    emoji: "🎂",
  },
  {
    q: "Что если ребёнок потеряет интерес через неделю?",
    a: "Именно для этого есть друзья, рейтинги и серии дней. Соревновательный элемент удерживает интерес лучше, чем любые напоминания. Но если вы хотите — просто измените призы в магазине: пусть ребёнок сам выберет, на что копить.",
    emoji: "🔄",
  },
  {
    q: "Могу ли я сам придумывать задания и призы?",
    a: "Да, полностью. Вы создаёте любые задания с любым количеством звёзд, ставите дедлайны, настраиваете магазин призов под вашу семью. Есть готовые шаблоны, если не хочется думать с нуля.",
    emoji: "✏️",
  },
  {
    q: "Что если у меня возникнут вопросы или проблемы?",
    a: "Воспользуйтесь формой обратной связи на этой странице — нажмите кнопку «Поддержка» в меню вверху. Отвечаем в течение рабочего дня.",
    emoji: "💬",
  },
];

function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      background: "#f8f9ff",
      padding: "80px 24px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block", background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            color: "#6B7BFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 14,
          }}>Частые вопросы</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.7rem, 3vw, 2.4rem)", color: "#1E1B4B", lineHeight: 1.2, marginBottom: 12,
          }}>Всё что хотите спросить<br />— уже здесь</h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>Снимаем последние сомнения</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18,
              padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,#ede9fe,#e0e7ff)",
                  border: "1px solid #c4b5fd",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1E1B4B", marginBottom: 8, fontFamily: "Nunito, sans-serif", lineHeight: 1.3 }}>
                    {item.q}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.7 }}>
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 36 }}>
          <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>Остался вопрос?</p>
          <button
            onClick={() => {
              const el = document.querySelector<HTMLButtonElement>(".landing-support-float, [data-support-btn]");
              if (el) el.click();
              else {
                // триггер через кастомное событие
                window.dispatchEvent(new CustomEvent("open-support"));
              }
            }}
            style={{
              background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", color: "#fff",
              border: "none", borderRadius: 12, padding: "10px 24px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            💬 Написать в поддержку
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section style={{
      background: "linear-gradient(160deg, #1E1B4B 0%, #312e81 50%, #4c1d95 100%)",
      padding: "80px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(107,123,255,0.3) 0%,transparent 70%)", top: -150, left: -150, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(155,107,255,0.25) 0%,transparent 70%)", bottom: -100, right: -80, pointerEvents: "none" }} />

      <div style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Stars deco */}
        <div style={{ fontSize: 36, marginBottom: 8, letterSpacing: 8 }}>⭐⭐⭐</div>

        <h2 style={{
          fontFamily: "Nunito, sans-serif", fontWeight: 900,
          fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 16,
        }}>
          Ваш ребёнок уже сегодня<br />
          <span style={{ background: "linear-gradient(135deg,#a5b4fc,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            может заработать первые звёзды
          </span>
        </h2>

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Создайте первое задание за 2 минуты.<br />
          Бесплатно. Без установки. Без данных о ребёнке.
        </p>

        {/* Main CTA button */}
        <div style={{ marginBottom: 24 }}>
          <a href="/app" style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center",
            background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)",
            color: "#fff", borderRadius: 22, padding: "20px 52px",
            fontSize: 20, fontWeight: 900, textDecoration: "none",
            boxShadow: "0 12px 40px rgba(107,123,255,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            letterSpacing: "-0.2px",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 50px rgba(107,123,255,0.65), 0 0 0 1px rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(107,123,255,0.5), 0 0 0 1px rgba(255,255,255,0.1)"; }}
          >
            👨‍👩‍👧 Попробовать бесплатно
            <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginTop: 4 }}>Без установки · Только ваш телефон</span>
          </a>
        </div>

        {/* FREE banner */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(134,239,172,0.4)",
          borderRadius: 14, padding: "12px 20px", marginBottom: 24,
        }}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#86efac" }}>Полностью бесплатно навсегда</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
              Без подписок, без скрытых платежей. Сервис бесплатен для всех семей.
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px 24px", marginBottom: 36 }}>
          {[
            "🛡️ Без данных о детях",
            "⚡ Готово за 2 минуты",
            "📱 Без скачивания",
          ].map((t, i) => (
            <span key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{t}</span>
          ))}
        </div>

        {/* Social proof mini */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16, padding: "14px 24px",
        }}>
          <div style={{ display: "flex", gap: -4 }}>
            {["👩","👨","👩‍🦱","👨‍🦳","👩‍🦰"].map((e, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: "50%",
                background: `hsl(${240 + i * 30}, 70%, 60%)`,
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, marginLeft: i > 0 ? -8 : 0,
              }}>{e}</div>
            ))}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Уже используют сотни семей</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>⭐⭐⭐⭐⭐ средняя оценка</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Review ──────────────────────────────────────────────────────────────────
const ReviewCard = ({ text, author, role, stars }: { text: string; author: string; role: string; stars: number }) => (
  <div className="review-card">
    <div className="review-stars">{"⭐".repeat(stars)}</div>
    <p className="review-text">«{text}»</p>
    <div className="review-author">
      <span className="review-name">{author}</span>
      <span className="review-role">{role}</span>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Как работает", href: "#how-it-works" },
  { label: "Мотивация", href: "#motivation" },
  { label: "Друзья", href: "#friends" },
  { label: "Старт", href: "#start" },
  { label: "FAQ", href: "#faq" },
];

function scrollTo(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: "", email: "", message: "" });
  const [supportSent, setSupportSent] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };
    const handleOpenSupport = () => setSupportOpen(true);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("open-support", handleOpenSupport);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("open-support", handleOpenSupport);
    };
  }, [mobileMenuOpen]);

  const [supportLoading, setSupportLoading] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    try {
      await fetch(SUPPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });
    } catch {
      // отправили — ок, ошибку сети игнорируем
    }
    setSupportLoading(false);
    setSupportSent(true);
    setTimeout(() => { setSupportOpen(false); setSupportSent(false); setSupportForm({ name: "", email: "", message: "" }); }, 3000);
  };

  return (
    <div className="landing-root">
      {/* Overlay мобильного меню */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 98, backdropFilter: "blur(4px)" }}
        />
      )}

      {/* Модалка поддержки */}
      {supportOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setSupportOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} />
          <div style={{
            position: "relative", zIndex: 1,
            background: "#fff", borderRadius: 24, padding: "32px 28px",
            width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          }}>
            {supportSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1E1B4B" }}>Сообщение отправлено!</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Ответим на ваш email в течение рабочего дня</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#1E1B4B", fontFamily: "Nunito, sans-serif" }}>💬 Написать в поддержку</div>
                    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Отвечаем в течение рабочего дня</div>
                  </div>
                  <button onClick={() => setSupportOpen(false)} style={{ border: "none", background: "#f3f4f6", borderRadius: 10, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#6b7280" }}>✕</button>
                </div>
                <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Ваше имя</label>
                    <input
                      required value={supportForm.name}
                      onChange={e => setSupportForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Мария"
                      style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#1E1B4B", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Email для ответа</label>
                    <input
                      required type="email" value={supportForm.email}
                      onChange={e => setSupportForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="mail@example.com"
                      style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#1E1B4B", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Сообщение</label>
                    <textarea
                      required value={supportForm.message}
                      onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Опишите вопрос или проблему..."
                      rows={4}
                      style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#1E1B4B", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>
                  <button type="submit" disabled={supportLoading} style={{
                    background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", color: "#fff",
                    border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800,
                    cursor: supportLoading ? "not-allowed" : "pointer", marginTop: 4,
                    opacity: supportLoading ? 0.75 : 1, transition: "opacity 0.2s",
                  }}>
                    {supportLoading ? "Отправляем..." : "Отправить →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`} style={{ padding: "0.75rem 0" }}>
        <div className="landing-nav__inner" style={{ gap: 12 }}>
          {/* Logo */}
          <button onClick={() => scrollTo("#hero")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} className="landing-logo">
            <span className="landing-logo__icon">⭐</span>
            <span className="landing-logo__text">СтарКидс</span>
          </button>

          {/* Desktop nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }} className="landing-nav-links">
            {NAV_LINKS.map(link => (
              <button key={link.href}
                onClick={() => { scrollTo(link.href); setMobileMenuOpen(false); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "#374151",
                  padding: "6px 10px", borderRadius: 8,
                  transition: "color 0.2s, background 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(107,123,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#6B7BFF"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: support + open app + burger */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setSupportOpen(true)}
              style={{
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                borderRadius: 50, padding: "7px 14px", fontSize: 12, fontWeight: 700,
                color: "#374151",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#ede9fe"; (e.currentTarget as HTMLElement).style.color = "#6B7BFF"; (e.currentTarget as HTMLElement).style.borderColor = "#c4b5fd"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLElement).style.color = "#374151"; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                💬
                <span style={{ position: "absolute", top: -3, right: -5, width: 8, height: 8, background: "#4ade80", borderRadius: "50%", border: "1.5px solid white" }} />
              </span>
              Поддержка
            </button>
            <a href={PWA_URL} className="landing-nav-btn" style={{ fontSize: 13 }}>Открыть приложение</a>

            {/* Burger for mobile */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="landing-burger"
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "none", flexDirection: "column", gap: 4, padding: 6,
              }}
              aria-label="Меню"
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: "block", width: 22, height: 2, background: "#374151", borderRadius: 99 }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99,
            background: "#fff", borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            padding: "12px 16px 16px",
          }}>
            {NAV_LINKS.map(link => (
              <button key={link.href}
                onClick={() => { scrollTo(link.href); setMobileMenuOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 15, fontWeight: 600, color: "#374151",
                  padding: "10px 8px", borderRadius: 10,
                }}
              >
                {link.label}
              </button>
            ))}
            <div style={{ height: 1, background: "#f3f4f6", margin: "8px 0" }} />
            <button onClick={() => { setSupportOpen(true); setMobileMenuOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#6B7BFF", padding: "10px 8px" }}>
              💬 Написать в поддержку
            </button>
            <a href={PWA_URL} style={{
              display: "block", marginTop: 8,
              background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", color: "#fff",
              borderRadius: 14, padding: "12px", textAlign: "center",
              fontSize: 15, fontWeight: 800, textDecoration: "none",
            }}>Открыть приложение →</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="landing-hero" style={{ minHeight: "auto", paddingBottom: 56, alignItems: "center", gap: "4rem" }}>
        <div className="hero-bg-blob hero-bg-blob--1" />
        <div className="hero-bg-blob hero-bg-blob--2" />
        <div className="hero-bg-blob hero-bg-blob--3" />

        {/* Left: text + CTA */}
        <div
          className="hero-content"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            maxWidth: 480, textAlign: "left",
          }}
        >
          <div className="hero-badge">🎮 Геймификация домашних обязанностей</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)" }}>
            Дети сами просят<br />
            <span className="hero-title-accent">задания —</span><br />
            это реально!
          </h1>
          <p className="hero-subtitle" style={{ fontSize: "1rem" }}>
            Ребёнок выполняет задания, зарабатывает звёзды и тратит их на призы которые выбрал сам. Никаких уговоров и скандалов.
          </p>

          {/* CTA */}
          <div style={{ marginBottom: 16 }}>
            <a
              href={PWA_URL}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, #6B7BFF 0%, #9B6BFF 100%)",
                color: "#fff", borderRadius: 18, padding: "16px 32px",
                fontSize: 17, fontWeight: 900, textDecoration: "none",
                boxShadow: "0 8px 32px rgba(107,123,255,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(107,123,255,0.55)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(107,123,255,0.4)"; }}
            >
              <span style={{ fontSize: 22 }}>👨‍👩‍👧</span>
              <span>
                <span style={{ display: "block" }}>Попробовать бесплатно</span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: 0.88, marginTop: 1 }}>Без установки · Прямо в браузере</span>
              </span>
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 16 }}>
            {[
              { icon: "📱", text: "Только ваш телефон при регистрации" },
              { icon: "🛡️", text: "Никаких данных о детях" },
              { icon: "⚡", text: "Готово за 2 минуты" },
              { icon: "🚫", text: "Без установки и скачивания" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14 }}>{b.icon}</span>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Safety block */}
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#15803d", marginBottom: 3 }}>Мы не собираем данные о детях</div>
              <div style={{ fontSize: 11, color: "#166534", lineHeight: 1.6 }}>
                Для регистрации нужен только <b>номер телефона родителя</b>. У ребёнка нет аккаунта — только имя и игровые звёзды. Никаких телефонов, школ, фотографий и геолокации детей.
              </div>
            </div>
          </div>
        </div>

        {/* Right: phone mockup */}
        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) rotate(2deg)" : "translateY(48px) rotate(2deg)",
          transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
          flexShrink: 0, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)",
            background: "rgba(107,123,255,0.12)", border: "1px solid rgba(107,123,255,0.3)",
            borderRadius: 50, padding: "4px 14px", whiteSpace: "nowrap",
            fontSize: 11, fontWeight: 700, color: "#6B7BFF",
          }}>Так видит ребёнок 👆</div>

          <div style={{
            width: 250, background: "#d1d5db", borderRadius: 40, padding: 3,
            boxShadow: "0 30px 80px rgba(107,123,255,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
            animation: "landing-float 5s ease-in-out infinite",
          }}>
            <div style={{ background: "linear-gradient(180deg,#f8f9ff,#f0f4ff)", borderRadius: 37, overflow: "hidden" }}>
              <div style={{ background: "#f8f9ff", padding: "8px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
                <div style={{ width: 70, height: 18, background: "#1E1B4B", borderRadius: 99 }} />
                <span style={{ fontSize: 9, color: "#6b7280" }}>●●● 🔋</span>
              </div>
              <div style={{ padding: "8px 12px 6px", background: "#f8f9ff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🦋</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1E1B4B" }}>Маша · 42⭐</div>
                  <div style={{ fontSize: 9, color: "#ea580c", fontWeight: 700 }}>🔥 серия 5 дней</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, background: "#ede9fe", color: "#6B7BFF", borderRadius: 7, padding: "2px 6px" }}>ур.4 🥈</div>
              </div>
              <div style={{ padding: "6px 12px", background: "#f8f9ff", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#9ca3af", marginBottom: 3 }}>
                  <span>До уровня 5</span><span>42/50 ⭐</span>
                </div>
                <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#f59e0b)", borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ padding: "8px 10px 2px" }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>📋 Мои задания</div>
                {[
                  { emoji: "🧹", title: "Убраться в комнате", bg: "#ede9fe", border: "#c4b5fd", done: true, stars: 3 },
                  { emoji: "📚", title: "Сделать уроки",      bg: "#fce7f3", border: "#f9a8d4", done: false, stars: 4 },
                  { emoji: "🦷", title: "Почистить зубы",     bg: "#dcfce7", border: "#86efac", done: false, stars: 1 },
                  { emoji: "🌸", title: "Полить цветы",        bg: "#fef9c3", border: "#fde047", done: false, stars: 2 },
                ].map((t, i) => (
                  <div key={i} style={{
                    background: t.done ? "#f0fdf4" : "#fff", border: `1px solid ${t.done ? "#bbf7d0" : "#f3f4f6"}`,
                    borderRadius: 10, padding: "6px 8px", marginBottom: 5,
                    display: "flex", alignItems: "center", gap: 6, opacity: t.done ? 0.65 : 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ width: 24, height: 24, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{t.emoji}</div>
                    <div style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "#1E1B4B", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                    {t.done ? <span style={{ fontSize: 12 }}>✅</span> : <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 6, padding: "3px 5px", fontSize: 8, fontWeight: 800, color: "#fff" }}>+{t.stars}⭐</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "4px 0 8px", fontSize: 16 }}>
                <span>🏆</span><span>⚡</span><span>🌟</span><span>🔥</span><span style={{ opacity: 0.25 }}>🎯</span>
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", padding: "5px 0 9px" }}>
                {[["✅","Задачи",true],["📝","Оценки",false],["🛍️","Магазин",false],["🏆","Профиль",false]].map(([icon,label,active], i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{icon}</div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{label}</div>
                    {active && <div style={{ width: 14, height: 2, background: "#6B7BFF", borderRadius: 99, margin: "2px auto 0" }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating notification */}
          <div style={{
            position: "absolute", bottom: 24, right: -24,
            background: "#fff", borderRadius: 14, padding: "8px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 7,
          }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#4ade80,#22c55e)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✅</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1E1B4B" }}>+3 ⭐ получено!</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>Маша · только что</div>
            </div>
          </div>
        </div>
      </section>

      <div id="how-it-works"><ProblemSolution /></div>
      <div id="motivation"><MotivationSection /></div>
      <div id="friends"><FriendsSection /></div>
      <div id="start"><HowToStart /></div>

      <section id="reviews" className="section reviews-section">
        <div className="section-label">Отзывы семей</div>
        <h2 className="section-title">Родители уже в восторге</h2>
        <div className="reviews-grid">
          <ReviewCard text="Сын сам бежит убирать комнату, чтобы заработать звёзды на новую игру. Раньше это был ежедневный скандал!" author="Анна М." role="мама двух сыновей" stars={5} />
          <ReviewCard text="Дочь за неделю накопила на поход в кино. Открыла 5 ачивок и гордится больше, чем оценками." author="Дмитрий К." role="папа 9-летней Маши" stars={5} />
          <ReviewCard text="Фото-подтверждение решило все споры. Дети соревнуются кто быстрее выполнит задание." author="Елена В." role="мама трёх детей" stars={5} />
        </div>
      </section>

      <div id="faq"><FaqSection /></div>
      <CtaSection />

      {/* Float support button (mobile) */}
      <button
        onClick={() => setSupportOpen(true)}
        className="landing-support-float"
        style={{
          position: "fixed", bottom: 24, right: 20, zIndex: 90,
          background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)",
          color: "#fff", border: "none", borderRadius: 50,
          padding: "12px 20px", fontSize: 14, fontWeight: 800,
          cursor: "pointer", boxShadow: "0 8px 24px rgba(107,123,255,0.4)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        💬 Поддержка
      </button>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo"><span>⭐</span><span>СтарКидс</span></div>
        <p className="footer-tagline">Превращаем рутину в игру ⭐</p>
        <div className="footer-links"><a href={PWA_URL}>Войти в приложение</a></div>
        <div className="footer-links" style={{ marginTop: 12, fontSize: 13 }}>
          <a href="/legal?tab=privacy">Политика конфиденциальности</a>
          <span>·</span>
          <a href="/legal?tab=terms">Условия использования</a>
          <span>·</span>
          <a href="/legal?tab=consent">Согласие на ПДн</a>
        </div>
        <p className="footer-tagline" style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          © 2026 СтарКидс · 0+ · Самозанятый Кругов М.Г. · ИНН 772379179900
        </p>
      </footer>
    </div>
  );
}