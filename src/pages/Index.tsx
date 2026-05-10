import { useEffect, useRef, useState } from "react";

const PWA_URL = "/app";

const FeatureCard = ({ emoji, title, description, delay }: { emoji: string; title: string; description: string; delay: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="feature-card" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      <div className="feature-emoji">{emoji}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </div>
  );
};

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

      {/* Hero — компактный, с большим CTA */}
      <section className="landing-hero" style={{ minHeight: "auto", paddingBottom: 48 }}>
        <div className="hero-bg-blob hero-bg-blob--1" />
        <div className="hero-bg-blob hero-bg-blob--2" />
        <div className="hero-bg-blob hero-bg-blob--3" />

        <div
          className="hero-content"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          <div className="hero-badge">🎮 Превращаем рутину в приключение</div>
          <h1 className="hero-title">
            Домашние дела —<br />
            <span className="hero-title-accent">как игра, где дети</span><br />
            сами хотят победить!
          </h1>
          <p className="hero-subtitle">
            Ребёнок выполняет задания, получает звёзды, прокачивает уровень и тратит их на реальные призы. Никаких уговоров.
          </p>

          {/* Большой CTA */}
          <a
            href={PWA_URL}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              background: "linear-gradient(135deg, #6B7BFF 0%, #9B6BFF 100%)",
              color: "#fff",
              borderRadius: 24,
              padding: "18px 48px",
              fontSize: 20,
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(107,123,255,0.35)",
              marginTop: 8,
              marginBottom: 4,
              transition: "transform 0.15s, box-shadow 0.15s",
              letterSpacing: "-0.3px",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            👨‍👩‍👧 Попробовать бесплатно
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>Без установки · Прямо в браузере</span>
          </a>

          <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 10 }}>
            Регистрация за 1 минуту · Бесплатно
          </p>
        </div>

        {/* Phone mockup */}
        <div
          className="hero-mockup"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0) rotate(-2deg)" : "translateY(48px) rotate(-2deg)",
            transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
          }}
        >
          <div className="phone-shell">
            <div className="phone-screen">
              <div className="phone-header">
                <div className="phone-avatar">🧒</div>
                <div>
                  <div className="phone-name">Маша · 42⭐</div>
                  <div className="phone-status">🔥 серия 5 дней</div>
                </div>
              </div>
              <div className="phone-body">
                <div className="phone-card phone-card--purple"><span>🧹 Убраться в комнате</span><span className="phone-stars">+3 ⭐</span></div>
                <div className="phone-card phone-card--pink"><span>📚 Сделать уроки</span><span className="phone-stars">+4 ⭐</span></div>
                <div className="phone-card phone-card--orange"><span>📸 Полить цветы</span><span className="phone-stars">+2 ⭐</span></div>
                <div className="phone-card phone-card--green"><span>✅ Почистить зубы</span><span className="phone-stars">выполнено</span></div>
                <div className="phone-progress">
                  <div className="phone-progress__label"><span>Уровень 4 🥈</span><span>42/50 ⭐</span></div>
                  <div className="phone-progress__bar"><div className="phone-progress__fill" style={{ width: "84%" }} /></div>
                </div>
                <div className="phone-achievements"><span>🏆</span><span>⚡</span><span>🌟</span><span>🔥</span><span style={{ opacity: 0.3 }}>🎯</span></div>
              </div>
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

      {/* Features */}
      <section className="section features-section">
        <div className="section-label">Игровая механика</div>
        <h2 className="section-title">Почему дети сами просят<br />дать им задание?</h2>
        <div className="features-grid">
          <FeatureCard emoji="⭐" title="Звёзды за каждое дело" description="Убрал комнату — получи 3⭐. Получил пятёрку — ещё 5⭐. Ребёнок видит прямую связь: старание = награда." delay={0} />
          <FeatureCard emoji="🎮" title="Уровни как в играх" description="От Новичка до Легенды — 10+ уровней с уникальными значками. Каждый уровень — ощущение победы." delay={100} />
          <FeatureCard emoji="🏆" title="Секретные достижения" description="16 скрытых ачивок: «Первая звезда», «Серия 7 дней», «Коллекционер». Дети обожают открывать их неожиданно!" delay={200} />
          <FeatureCard emoji="🛍️" title="Магазин желаний" description="Ребёнок сам выбирает, на что потратить звёзды: пицца, поход в кино, лишний час игр. Родитель создаёт — ребёнок копит." delay={300} />
          <FeatureCard emoji="🔥" title="Серии без пропусков" description="Каждый день активности — бонус. Чем длиннее серия, тем больше награда. Прерывать серию? Ни за что!" delay={400} />
          <FeatureCard emoji="📸" title="Фото «я сделал!»" description="Ребёнок фотографирует результат, родитель подтверждает одним нажатием. Честно, быстро, без споров." delay={500} />
        </div>
      </section>

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
