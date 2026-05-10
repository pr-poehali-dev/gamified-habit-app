import { useEffect, useRef, useState } from "react";
import AppMockup from "@/components/landing/AppMockup";

const PWA_URL = "/app";

// Телефон-проблема: ребёнок не хочет делать дела
function PhoneProblem() {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: "#e2e8f0", borderRadius: 44, padding: 4,
      boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
    }}>
      <div style={{ background: "#fff5f5", borderRadius: 40, overflow: "hidden", minHeight: 480 }}>
        {/* Status bar */}
        <div style={{ background: "#fff5f5", padding: "10px 18px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>9:41</span>
          <div style={{ width: 80, height: 20, background: "#1f2937", borderRadius: 99, position: "absolute", left: "50%", transform: "translateX(-50%)", marginTop: -2 }} />
          <span style={{ fontSize: 9, color: "#9ca3af" }}>●●● 🔋</span>
        </div>
        <div style={{ padding: "14px 14px 10px" }}>
          {/* Angry messages */}
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
              <div key={i} style={{
                display: "flex", justifyContent: m.from === "parent" ? "flex-start" : "flex-end", marginBottom: 5,
              }}>
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

          {/* Problem stats */}
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

// Телефон-решение: СтарКидс
function PhoneSolution() {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: "#e2e8f0", borderRadius: 44, padding: 4,
      boxShadow: "0 24px 60px rgba(107,123,255,0.25), 0 0 0 1px rgba(107,123,255,0.1)",
    }}>
      <div style={{ background: "linear-gradient(180deg,#f8f9ff,#f0f4ff)", borderRadius: 40, overflow: "hidden", minHeight: 480 }}>
        {/* Status bar */}
        <div style={{ background: "#f8f9ff", padding: "10px 18px 4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
          <div style={{ width: 80, height: 20, background: "#1f2937", borderRadius: 99, position: "absolute", left: "50%", transform: "translateX(-50%)", marginTop: -2 }} />
          <span style={{ fontSize: 9, color: "#9ca3af" }}>●●● 🔋</span>
        </div>
        <div style={{ padding: "10px 12px 10px" }}>
          {/* Child header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🦋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1E1B4B" }}>Катя</div>
              <div style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>42⭐ · Уровень 4 🥈</div>
            </div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, color: "#ea580c" }}>🔥 5 дней</div>
          </div>

          {/* Progress */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "7px 10px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>
              <span>До уровня 5 🥇</span><span>42/50 ⭐</span>
            </div>
            <div style={{ height: 7, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#f59e0b)", borderRadius: 99 }} />
            </div>
          </div>

          {/* Tasks */}
          <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>📋 Задания сегодня</div>
          {[
            { emoji: "🧹", title: "Убраться в комнате", stars: 3, bg: "#ede9fe", border: "#c4b5fd", done: true },
            { emoji: "📚", title: "Домашнее задание",   stars: 4, bg: "#fce7f3", border: "#f9a8d4", done: false },
            { emoji: "🦷", title: "Почистить зубы",     stars: 1, bg: "#dcfce7", border: "#86efac", done: true },
            { emoji: "🍽️", title: "Помыть посуду",      stars: 2, bg: "#fef9c3", border: "#fde047", done: false },
          ].map((t, i) => (
            <div key={i} style={{
              background: t.done ? "#f0fdf4" : "#fff",
              border: `1px solid ${t.done ? "#bbf7d0" : "#f3f4f6"}`,
              borderRadius: 11, padding: "7px 9px", marginBottom: 5,
              display: "flex", alignItems: "center", gap: 7,
              opacity: t.done ? 0.75 : 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ width: 26, height: 26, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{t.emoji}</div>
              <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#1E1B4B", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
              {t.done
                ? <span style={{ fontSize: 13 }}>✅</span>
                : <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 6, padding: "3px 6px", fontSize: 9, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>+{t.stars}⭐</div>
              }
            </div>
          ))}

          {/* Reward teaser */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "8px 10px", marginTop: 2, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1E1B4B" }}>Поход в кино</div>
              <div style={{ fontSize: 9, color: "#d97706" }}>Ещё 8⭐ до цели!</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div style={{ height: 5, width: 50, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: 99 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
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
        {/* Header */}
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

        {/* Two-column: problem + solution */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap" }}>

          {/* Problem side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, minWidth: 280, maxWidth: 340 }}>
            <div style={{
              background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 20,
              padding: "12px 20px", textAlign: "center", width: "100%",
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>😩</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#dc2626", marginBottom: 4 }}>Было</div>
              <div style={{ fontSize: 13, color: "#7f1d1d" }}>Уговоры, скандалы, повторения — каждый вечер одно и то же</div>
            </div>
            <PhoneProblem />
          </div>

          {/* Arrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, fontSize: 36, color: "#6B7BFF", flexShrink: 0 }}>
            →
          </div>

          {/* Solution side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, minWidth: 280, maxWidth: 340 }}>
            <div style={{
              background: "linear-gradient(135deg,#ede9fe,#f0f9ff)", border: "2px solid #c4b5fd", borderRadius: 20,
              padding: "12px 20px", textAlign: "center", width: "100%",
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#6B7BFF", marginBottom: 4 }}>Стало</div>
              <div style={{ fontSize: 13, color: "#4c1d95" }}>Ребёнок сам бежит выполнять задания — ведь за них дают звёзды на призы</div>
            </div>
            <PhoneSolution />
          </div>
        </div>

        {/* Key insight */}
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

const StepItem = ({ num, text, delay }: { num: string; text: string; delay: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="step-item" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-28px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms` }}>
      <div className="step-num">{num}</div>
      <p className="step-text">{text}</p>
    </div>
  );
};

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

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80);
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}>
        <div className="landing-nav__inner">
          <div className="landing-logo">
            <span className="landing-logo__icon">⭐</span>
            <span className="landing-logo__text">СтарКидс</span>
          </div>
          <a href={PWA_URL} className="landing-nav-btn">Открыть приложение</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" style={{ minHeight: "auto", paddingBottom: 56, alignItems: "center", gap: "4rem" }}>
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
            maxWidth: 480,
            textAlign: "left",
          }}
        >
          <div className="hero-badge">🎮 Геймификация домашних обязанностей</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)" }}>
            Домашние дела —<br />
            <span className="hero-title-accent">как игра, где дети</span><br />
            сами хотят победить!
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
                background: "linear-gradient(135deg, #ff6b9d 0%, #ff9b6b 100%)",
                color: "#fff", borderRadius: 18, padding: "16px 32px",
                fontSize: 17, fontWeight: 900, textDecoration: "none",
                boxShadow: "0 8px 32px rgba(255,107,157,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(255,107,157,0.55)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(255,107,157,0.4)"; }}
            >
              <span style={{ fontSize: 22 }}>👨‍👩‍👧</span>
              <span>
                <span style={{ display: "block" }}>Попробовать бесплатно</span>
                <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: 0.88, marginTop: 1 }}>Без установки · Прямо в браузере</span>
              </span>
            </a>
          </div>

          {/* Trust badges row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginBottom: 20 }}>
            {[
              { icon: "🔒", text: "Без личных данных ребёнка" },
              { icon: "⚡", text: "Старт за 1 минуту" },
              { icon: "💳", text: "Бесплатно" },
              { icon: "📱", text: "Без скачивания" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14 }}>{b.icon}</span>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{b.text}</span>
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
              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", marginBottom: 3 }}>Полная безопасность для ребёнка</div>
              <div style={{ fontSize: 11, color: "#4b7a5a", lineHeight: 1.5 }}>
                Мы не собираем имя, фото, геолокацию или школу ребёнка. Только игровые данные: задания и звёзды. Никакой рекламы.
              </div>
            </div>
          </div>
        </div>

        {/* Right: live phone mockup */}
        <div
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0) rotate(2deg)" : "translateY(48px) rotate(2deg)",
            transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Label above phone */}
          <div style={{
            position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,107,157,0.2)", border: "1px solid rgba(255,107,157,0.4)",
            borderRadius: 50, padding: "4px 14px", whiteSpace: "nowrap",
            fontSize: 11, fontWeight: 700, color: "#ff9b9b",
          }}>
            Так видит ребёнок 👆
          </div>

          {/* Phone shell */}
          <div style={{
            width: 250, background: "linear-gradient(145deg,#1a1040,#2a1860)",
            borderRadius: 40, padding: 3,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
            animation: "landing-float 5s ease-in-out infinite",
          }}>
            <div style={{ background: "linear-gradient(180deg,#f8f9ff 0%,#f0f4ff 100%)", borderRadius: 37, overflow: "hidden" }}>
              {/* Status bar */}
              <div style={{ background: "#f8f9ff", padding: "8px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1E1B4B" }}>9:41</span>
                <div style={{ width: 70, height: 18, background: "#1E1B4B", borderRadius: 99 }} />
                <span style={{ fontSize: 9, color: "#6b7280" }}>●●● 🔋</span>
              </div>
              {/* Child header */}
              <div style={{ padding: "8px 12px 6px", background: "#f8f9ff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🦋</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1E1B4B" }}>Маша · 42⭐</div>
                  <div style={{ fontSize: 9, color: "#ea580c", fontWeight: 700 }}>🔥 серия 5 дней</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, background: "#ede9fe", color: "#6B7BFF", borderRadius: 7, padding: "2px 6px" }}>ур.4 🥈</div>
              </div>
              {/* Progress */}
              <div style={{ padding: "6px 12px", background: "#f8f9ff", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#9ca3af", marginBottom: 3 }}>
                  <span>До уровня 5</span><span>42/50 ⭐</span>
                </div>
                <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg,#6B7BFF,#f59e0b)", borderRadius: 99 }} />
                </div>
              </div>
              {/* Tasks */}
              <div style={{ padding: "8px 10px 2px" }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>📋 Мои задания</div>
                {[
                  { emoji: "🧹", title: "Убраться в комнате", stars: 3, bg: "#ede9fe", border: "#c4b5fd", done: false },
                  { emoji: "📚", title: "Сделать уроки",      stars: 4, bg: "#fce7f3", border: "#f9a8d4", done: false },
                  { emoji: "🦷", title: "Почистить зубы",     stars: 1, bg: "#dcfce7", border: "#86efac", done: true  },
                  { emoji: "🌸", title: "Полить цветы",        stars: 2, bg: "#fef9c3", border: "#fde047", done: false },
                ].map((t, i) => (
                  <div key={i} style={{
                    background: t.done ? "#f0fdf4" : "#fff", border: `1px solid ${t.done ? "#bbf7d0" : "#f3f4f6"}`,
                    borderRadius: 10, padding: "6px 8px", marginBottom: 5,
                    display: "flex", alignItems: "center", gap: 6, opacity: t.done ? 0.65 : 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ width: 24, height: 24, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{t.emoji}</div>
                    <div style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "#1E1B4B", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                    {t.done
                      ? <span style={{ fontSize: 12 }}>✅</span>
                      : <div style={{ background: "linear-gradient(135deg,#6B7BFF,#9B6BFF)", borderRadius: 6, padding: "3px 5px", fontSize: 8, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>+{t.stars}⭐</div>
                    }
                  </div>
                ))}
              </div>
              {/* Achievements row */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "6px 0 10px", fontSize: 16 }}>
                <span>🏆</span><span>⚡</span><span>🌟</span><span>🔥</span><span style={{ opacity: 0.25 }}>🎯</span>
              </div>
              {/* Bottom nav */}
              <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", padding: "6px 0 10px" }}>
                {[["✅","Задачи",true],["📝","Оценки",false],["🛍️","Магазин",false],["🏆","Профиль",false]].map(([icon, label, active], i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{icon}</div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: active ? "#6B7BFF" : "#9ca3af" }}>{label}</div>
                    {active && <div style={{ width: 14, height: 2, background: "#6B7BFF", borderRadius: 99, margin: "2px auto 0" }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div style={{
            position: "absolute", bottom: 24, right: -20,
            background: "#fff", borderRadius: 14, padding: "8px 12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 7,
          }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#4ade80,#22c55e)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✅</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1E1B4B" }}>+3 ⭐ получено!</div>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>Маша · только что</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="stats-strip">
        <div className="stat-item"><span className="stat-num">⭐ 10+</span><span className="stat-label">уровней прокачки</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><span className="stat-num">🏆 16</span><span className="stat-label">достижений</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><span className="stat-num">🛍️ ∞</span><span className="stat-label">призов в магазине</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><span className="stat-num">🔥 365</span><span className="stat-label">дней серий подряд</span></div>
      </section>

      {/* App Mockup */}
      <AppMockup />

      {/* Problem → Solution */}
      <ProblemSolution />

      {/* For parents / for kids */}
      <section className="section roles-section">
        <div className="roles-grid">
          <div className="role-card role-card--parent">
            <div className="role-card__icon">👨‍👩‍👧</div>
            <h3 className="role-card__title">Для родителей</h3>
            <ul className="role-card__list">
              <li>✅ Создавай задания за минуту</li>
              <li>✅ Ставь дедлайны и контролируй</li>
              <li>✅ Проверяй фотоотчёты</li>
              <li>✅ Настраивай магазин призов</li>
              <li>✅ Смотри аналитику прогресса</li>
              <li>✅ Добавляй нескольких детей</li>
            </ul>
            <a href={PWA_URL} className="role-card__btn role-card__btn--parent">Начать бесплатно →</a>
          </div>
          <div className="role-card role-card--child">
            <div className="role-card__icon">🧒</div>
            <h3 className="role-card__title">Для детей</h3>
            <ul className="role-card__list">
              <li>⭐ Зарабатывай звёзды за всё</li>
              <li>⭐ Качай уровень и открывай ачивки</li>
              <li>⭐ Покупай призы в магазине</li>
              <li>⭐ Обменивай оценки на звёзды</li>
              <li>⭐ Проси награды у родителей</li>
              <li>⭐ Держи серию и получай бонусы</li>
            </ul>
            <a href={PWA_URL} className="role-card__btn role-card__btn--child">Подключить ребёнка →</a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section steps-section">
        <div className="section-label">Старт за 2 минуты</div>
        <h2 className="section-title">Как это работает?</h2>
        <div className="steps-grid">
          <div className="steps-col">
            <h3 className="steps-col__title">👨‍👩‍👧 Родитель</h3>
            <StepItem num="1" text="Открой приложение и зарегистрируйся по номеру телефона" delay={0} />
            <StepItem num="2" text="Добавь ребёнка и создай первое задание" delay={100} />
            <StepItem num="3" text="Отправь ребёнку ссылку-приглашение" delay={200} />
            <StepItem num="4" text="Подтверждай выполнение и начисляй звёзды" delay={300} />
          </div>
          <div className="steps-divider" />
          <div className="steps-col">
            <h3 className="steps-col__title">🧒 Ребёнок</h3>
            <StepItem num="1" text="Переходит по ссылке от родителя" delay={0} />
            <StepItem num="2" text="Входит в приложение одним нажатием" delay={100} />
            <StepItem num="3" text="Выполняет задания и зарабатывает звёзды" delay={200} />
            <StepItem num="4" text="Покупает призы и прокачивает уровень!" delay={300} />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section reviews-section">
        <div className="section-label">Отзывы семей</div>
        <h2 className="section-title">Родители уже в восторге</h2>
        <div className="reviews-grid">
          <ReviewCard text="Сын сам бежит убирать комнату, чтобы заработать звёзды на новую игру. Раньше это был ежедневный скандал!" author="Анна М." role="мама двух сыновей" stars={5} />
          <ReviewCard text="Дочь за неделю накопила на поход в кино. Открыла 5 ачивок и гордится больше, чем оценками." author="Дмитрий К." role="папа 9-летней Маши" stars={5} />
          <ReviewCard text="Фото-подтверждение решило все споры. Дети соревнуются кто быстрее выполнит задание." author="Елена В." role="мама трёх детей" stars={5} />
        </div>
      </section>

      {/* CTA финальный */}
      <section className="cta-section">
        <div className="cta-bg-blob cta-bg-blob--1" />
        <div className="cta-bg-blob cta-bg-blob--2" />
        <div className="cta-content">
          <div className="cta-emoji">🚀</div>
          <h2 className="cta-title">Попробуйте прямо сейчас!</h2>
          <p className="cta-subtitle">
            Без установки. Без карты. Прямо в браузере.<br />
            Регистрация займёт одну минуту.
          </p>
          <div className="cta-actions">
            <a href={PWA_URL} className="cta-btn cta-btn--parent">
              <span className="cta-btn-icon">👨‍👩‍👧</span>
              <span>
                <span className="cta-btn-main">Начать бесплатно</span>
                <span className="cta-btn-sub">Регистрация за 1 минуту</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo"><span>⭐</span><span>СтарКидс</span></div>
        <p className="footer-tagline">Превращаем рутину в игру ⭐</p>
        <div className="footer-links">
          <a href={PWA_URL}>Войти в приложение</a>
        </div>
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