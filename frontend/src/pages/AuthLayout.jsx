import Header from "../components/Header";

export default function AuthLayout({ title, text, children }) {
  return (
    <>
      <Header />
      <main className="auth">
        <aside className="auth-side">
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <svg className="strata" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 Q100 20 200 40 T400 36 V200 H0Z" fill="var(--soil-1)" />
            <path d="M0 90 Q120 70 220 92 T400 84 V200 H0Z" fill="var(--soil-2)" />
            <path d="M0 140 Q140 124 240 142 T400 136 V200 H0Z" fill="#2E1D0D" />
          </svg>
          <p className="quote">“Soil test first, then fertilizer.” — the advice every Krishi Vigyan Kendra gives.</p>
        </aside>
        <div className="auth-main"><div className="auth-box">{children}</div></div>
      </main>
    </>
  );
}
