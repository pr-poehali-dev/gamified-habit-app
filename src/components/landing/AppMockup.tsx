import { useState } from "react";

type Screen = "parent_tasks" | "parent_grades" | "child_tasks" | "child_shop" | "child_profile";

const screens: { id: Screen; label: string; emoji: string; who: "parent" | "child" }[] = [
  { id: "parent_tasks", label: "Задания", emoji: "📋", who: "parent" },
  { id: "parent_grades", label: "Оценки", emoji: "📝", who: "parent" },
  { id: "child_tasks", label: "Мои задачи", emoji: "✅", who: "child" },
  { id: "child_shop", label: "Магазин", emoji: "🛍️", who: "child" },
  { id: "child_profile", label: "Профиль", emoji: "🏆", who: "child" },
];

function PhoneFrame({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{
      width: 280,
      background: `linear-gradient(145deg, #1a1040, #2a1860)`,
      borderRadius: 40,
      padding: 3,
      boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 60px -10px ${accent}40`,
      flexShrink: 0,
    }}>
      {/* Notch */}
      <div style={{
        background: "linear-gradient(180deg, #130d35 0%, #0f0a2e 100%)",
        borderRadius: 37,
        overflow: "hidden",
        minHeight: 560,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 99 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Экран: задания родителя ── */
function ScreenParentTasks() {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Добро пожаловать</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>Мария</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: "rgba(255,165,0,0.2)", border: "1px solid rgba(255,165,0,0.4)", borderRadius: 8, padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>🔥 5 дней</div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 10px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>
          <span>⚡ Уровень 3 · Опытный</span><span>240 XP</span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg, #7b4fdb, #ff6b9d)", borderRadius: 99 }} />
        </div>
      </div>

      {/* Pending confirm */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>⏳ Ждут подтверждения</div>
      <div style={{ background: "rgba(255,107,157,0.12)", border: "1px solid rgba(255,107,157,0.3)", borderRadius: 14, padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>🧹 Убраться в комнате</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Катя · сегодня</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 8, padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "#4ade80" }}>✓</div>
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "#f87171" }}>✗</div>
        </div>
      </div>

      {/* Task list */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>📋 Активные задания</div>
      {[
        { emoji: "📚", title: "Сделать домашнее задание", child: "Катя", stars: 4, color: "#7b4fdb" },
        { emoji: "🦷", title: "Почистить зубы", child: "Катя", stars: 1, color: "#06b6d4" },
        { emoji: "🐕", title: "Погулять с собакой", child: "Катя", stars: 3, color: "#f59e0b" },
      ].map((t, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 10px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 16 }}>{t.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{t.title}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{t.child}</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#ffd700" }}>+{t.stars}⭐</div>
        </div>
      ))}

      {/* Add task btn */}
      <div style={{ background: "linear-gradient(135deg, #7b4fdb, #ff6b9d)", borderRadius: 12, padding: "10px", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff", marginTop: 4 }}>
        + Добавить задание
      </div>
    </div>
  );
}

/* ── Экран: оценки родителя ── */
function ScreenParentGrades() {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 12 }}>📝 Оценки</div>

      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Ждут подтверждения</div>
      {[
        { subject: "Математика", grade: 5, child: "Катя", stars: 5 },
        { subject: "Русский язык", grade: 4, child: "Катя", stars: 4 },
      ].map((g, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 12px", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{g.subject}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{g.child} · сегодня</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: g.grade === 5 ? "linear-gradient(135deg,#4ade80,#22c55e)" : g.grade === 4 ? "linear-gradient(135deg,#60a5fa,#3b82f6)" : "linear-gradient(135deg,#fbbf24,#f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#fff"
            }}>{g.grade}</div>
          </div>
          <div style={{ fontSize: 9, color: "#ffd700", marginBottom: 8 }}>Наградить {g.stars}⭐ за эту оценку</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 8, padding: "5px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#4ade80" }}>✓ Подтвердить</div>
            <div style={{ flex: 1, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "5px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#f87171" }}>✗ Отклонить</div>
          </div>
        </div>
      ))}

      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 4 }}>История</div>
      {[
        { subject: "Физика", grade: 3, stars: 3, status: "✅" },
        { subject: "История", grade: 5, stars: 5, status: "✅" },
        { subject: "Химия", grade: 4, stars: 4, status: "✅" },
      ].map((g, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{g.subject}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#ffd700" }}>+{g.stars}⭐</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: g.grade === 5 ? "#4ade80" : g.grade === 4 ? "#60a5fa" : "#fbbf24" }}>{g.grade}</div>
            <div style={{ fontSize: 11 }}>{g.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Экран: задания ребёнка ── */
function ScreenChildTasks() {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      {/* Child header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #7b4fdb, #ff6b9d)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🦋</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>Катя</div>
          <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 700 }}>42⭐ · Уровень 4 🥈</div>
        </div>
        <div style={{ marginLeft: "auto", background: "rgba(255,165,0,0.2)", border: "1px solid rgba(255,165,0,0.4)", borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, color: "#fbbf24" }}>🔥 5</div>
      </div>

      {/* Progress */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "8px 10px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
          <span>До уровня 5 🥇</span><span>42/50 ⭐</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: "84%", height: "100%", background: "linear-gradient(90deg, #7b4fdb, #ffd700)", borderRadius: 99 }} />
        </div>
      </div>

      {/* Tasks */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Мои задания</div>
      {[
        { emoji: "🧹", title: "Убраться в комнате", stars: 3, deadline: "до 20:00", color: "#7b4fdb", done: false },
        { emoji: "📚", title: "Домашнее задание", stars: 4, deadline: "до 22:00", color: "#ff6b9d", done: false },
        { emoji: "🦷", title: "Почистить зубы", stars: 1, deadline: "", color: "#06b6d4", done: true },
        { emoji: "🌸", title: "Полить цветы", stars: 2, deadline: "завтра", color: "#f59e0b", done: false },
      ].map((t, i) => (
        <div key={i} style={{
          background: t.done ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${t.done ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12, padding: "8px 10px", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 8,
          opacity: t.done ? 0.6 : 1,
        }}>
          <div style={{ fontSize: 18 }}>{t.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
            {t.deadline && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>⏰ {t.deadline}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#ffd700" }}>+{t.stars}⭐</div>
            {!t.done && (
              <div style={{ background: `${t.color}30`, border: `1px solid ${t.color}60`, borderRadius: 6, padding: "2px 5px", fontSize: 8, fontWeight: 700, color: t.color }}>Сделал!</div>
            )}
            {t.done && <div style={{ fontSize: 14 }}>✅</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Экран: магазин ребёнка ── */
function ScreenChildShop() {
  return (
    <div style={{ padding: "0 12px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>🛍️ Магазин</div>
        <div style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "#ffd700" }}>42 ⭐</div>
      </div>

      {/* Wish banner */}
      <div style={{ background: "rgba(123,79,219,0.15)", border: "1px solid rgba(123,79,219,0.3)", borderRadius: 12, padding: "8px 10px", marginBottom: 12, fontSize: 9, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14 }}>🎁</span>
        <span>Добавь желание — родители увидят что тебе подарить!</span>
      </div>

      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Доступные призы</div>
      {[
        { emoji: "🍕", title: "Пицца на ужин", cost: 15, can: true },
        { emoji: "🎬", title: "Поход в кино", cost: 30, can: true },
        { emoji: "🎮", title: "+1 час игры", cost: 10, can: true },
        { emoji: "🍦", title: "Мороженое", cost: 8, can: true },
        { emoji: "🎯", title: "Новая игра", cost: 80, can: false },
        { emoji: "🏖️", title: "Поездка на море", cost: 200, can: false },
      ].map((r, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid rgba(255,255,255,${r.can ? "0.1" : "0.05"})`,
          borderRadius: 12, padding: "8px 10px", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 8,
          opacity: r.can ? 1 : 0.45,
        }}>
          <div style={{ fontSize: 20 }}>{r.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{r.title}</div>
            <div style={{ fontSize: 9, color: "#ffd700", fontWeight: 700 }}>{r.cost} ⭐</div>
          </div>
          <div style={{
            background: r.can ? "linear-gradient(135deg,#7b4fdb,#ff6b9d)" : "rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "4px 8px", fontSize: 9, fontWeight: 800,
            color: r.can ? "#fff" : "rgba(255,255,255,0.3)",
          }}>{r.can ? "Купить" : "🔒"}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Экран: профиль ребёнка ── */
function ScreenChildProfile() {
  const achievements = [
    { emoji: "⭐", title: "Первая звезда", done: true },
    { emoji: "🔥", title: "Серия 3 дня", done: true },
    { emoji: "📋", title: "5 заданий", done: true },
    { emoji: "💰", title: "50 звёзд", done: true },
    { emoji: "🛍️", title: "Первая покупка", done: true },
    { emoji: "🔥", title: "Серия 7 дней", done: false },
    { emoji: "📋", title: "10 заданий", done: false },
    { emoji: "💎", title: "100 звёзд", done: false },
  ];
  return (
    <div style={{ padding: "0 12px 12px" }}>
      {/* Avatar + level */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ width: 60, height: 60, background: "linear-gradient(135deg, #7b4fdb, #ff6b9d)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 8px" }}>🦋</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Катя</div>
        <div style={{ fontSize: 12, color: "#ffd700", fontWeight: 700 }}>Уровень 4 · Серебро 🥈</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>42 ⭐ заработано всего</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["12", "заданий"], ["42⭐", "звёзд"], ["🔥5", "серия"]].map(([val, label], i) => (
          <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{val}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Достижения</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {achievements.map((a, i) => (
          <div key={i} style={{
            background: a.done ? "rgba(123,79,219,0.25)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${a.done ? "rgba(123,79,219,0.5)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 10, padding: "8px 4px", textAlign: "center",
            opacity: a.done ? 1 : 0.4,
          }}>
            <div style={{ fontSize: 18 }}>{a.emoji}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", marginTop: 2, lineHeight: 1.2 }}>{a.title}</div>
          </div>
        ))}
      </div>

      {/* Invite code */}
      <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 12, padding: "8px 10px", marginTop: 10, textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Мой код для друзей</div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#ffd700", letterSpacing: "0.15em" }}>STAR-42</div>
      </div>
    </div>
  );
}

function ScreenContent({ screen }: { screen: Screen }) {
  switch (screen) {
    case "parent_tasks": return <ScreenParentTasks />;
    case "parent_grades": return <ScreenParentGrades />;
    case "child_tasks": return <ScreenChildTasks />;
    case "child_shop": return <ScreenChildShop />;
    case "child_profile": return <ScreenChildProfile />;
  }
}

/* ── Bottom nav ── */
function BottomNav({ screen, onChange, who }: { screen: Screen; onChange: (s: Screen) => void; who: "parent" | "child" }) {
  const tabs = screens.filter(s => s.who === who);
  return (
    <div style={{
      display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(19,13,53,0.95)", backdropFilter: "blur(10px)",
      padding: "8px 4px 12px",
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            border: "none", background: "none", cursor: "pointer", padding: "2px 0",
            opacity: screen === t.id ? 1 : 0.4, transition: "opacity 0.2s",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.emoji}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: screen === t.id ? "#7b4fdb" : "rgba(255,255,255,0.5)" }}>{t.label}</span>
          {screen === t.id && (
            <div style={{ width: 16, height: 3, background: "linear-gradient(90deg, #7b4fdb, #ff6b9d)", borderRadius: 99 }} />
          )}
        </button>
      ))}
    </div>
  );
}

export default function AppMockup() {
  const [screen, setScreen] = useState<Screen>("parent_tasks");
  const who = screens.find(s => s.id === screen)!.who;

  return (
    <section style={{
      background: "linear-gradient(180deg, #0f0a2e 0%, #150d3a 50%, #0f0a2e 100%)",
      padding: "80px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,79,219,0.2) 0%, transparent 70%)", top: -100, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,157,0.15) 0%, transparent 70%)", bottom: -80, right: -80, pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,107,157,0.15)", border: "1px solid rgba(255,107,157,0.4)",
            color: "#ff9b9b", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 50, marginBottom: 16,
          }}>Живое превью приложения</div>
          <h2 style={{
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#fff", lineHeight: 1.2, marginBottom: 12,
          }}>Посмотри, как это работает</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", maxWidth: 480, margin: "0 auto" }}>
            Нажимай на вкладки — переключай экраны между интерфейсом родителя и ребёнка
          </p>
        </div>

        {/* Who switcher */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32 }}>
          {[
            { label: "👨‍👩‍👧 Родитель", screens: ["parent_tasks", "parent_grades"] as Screen[], color: "#7b4fdb" },
            { label: "🧒 Ребёнок", screens: ["child_tasks", "child_shop", "child_profile"] as Screen[], color: "#ff6b9d" },
          ].map(group => {
            const active = group.screens.includes(screen);
            return (
              <button
                key={group.label}
                onClick={() => setScreen(group.screens[0])}
                style={{
                  background: active ? `${group.color}30` : "rgba(255,255,255,0.06)",
                  border: `2px solid ${active ? group.color : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 16, padding: "10px 24px",
                  fontSize: 14, fontWeight: 800, color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer", transition: "all 0.2s",
                  boxShadow: active ? `0 4px 20px ${group.color}40` : "none",
                }}
              >{group.label}</button>
            );
          })}
        </div>

        {/* Layout: tab pills + phone */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>

          {/* Left: screen tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Экраны</div>
            {screens.filter(s => s.who === who).map(s => (
              <button
                key={s.id}
                onClick={() => setScreen(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: screen === s.id ? "rgba(123,79,219,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${screen === s.id ? "rgba(123,79,219,0.6)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 12, padding: "10px 16px",
                  cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                  boxShadow: screen === s.id ? "0 4px 16px rgba(123,79,219,0.3)" : "none",
                }}
              >
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: screen === s.id ? "#fff" : "rgba(255,255,255,0.45)" }}>{s.label}</span>
                {screen === s.id && (
                  <span style={{ marginLeft: "auto", color: "#7b4fdb", fontSize: 12 }}>▶</span>
                )}
              </button>
            ))}

            {/* CTA under tabs */}
            <a
              href="/app"
              style={{
                display: "block", marginTop: 16,
                background: "linear-gradient(135deg, #7b4fdb, #ff6b9d)",
                borderRadius: 14, padding: "12px 16px", textAlign: "center",
                fontSize: 13, fontWeight: 800, color: "#fff", textDecoration: "none",
                boxShadow: "0 6px 24px rgba(123,79,219,0.4)",
              }}
            >
              🚀 Попробовать бесплатно
            </a>
          </div>

          {/* Phone mockup */}
          <PhoneFrame accent={who === "parent" ? "#7b4fdb" : "#ff6b9d"}>
            <div style={{ overflowY: "auto", maxHeight: 480, scrollbarWidth: "none" }}>
              <ScreenContent screen={screen} />
            </div>
            <BottomNav screen={screen} onChange={setScreen} who={who} />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
