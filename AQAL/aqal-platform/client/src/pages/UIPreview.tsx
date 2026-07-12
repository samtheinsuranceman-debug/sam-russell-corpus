import { useState } from "react";

// ============================================================
// AQAL — Warm Institutional UI Direction (Mockup)
// Palette: Cream/ivory background, deep charcoal text, brass accents.
// Typography: Fraunces (serif display), Inter (body), JetBrains Mono (data).
// Philosophy: McKinsey meets Stanford. Quiet authority. Zero decoration.
// ============================================================

export default function UIPreview() {
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "science">("home");

  return (
    <div className="wi-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .wi-root {
          --cream: #FAF8F3;
          --cream2: #F2EDE4;
          --cream3: #E8E1D5;
          --charcoal: #1A1A1A;
          --charcoal2: #3D3D3D;
          --muted: #7A7568;
          --brass: #9E7B33;
          --brass-light: #C9A24B;
          --sage: #6B7F5E;
          --blue: #4A6B8A;
          --terracotta: #9E5E3A;
          --border: rgba(26,26,26,0.08);
          --shadow: 0 1px 3px rgba(26,26,26,0.04);

          background: var(--cream);
          color: var(--charcoal);
          min-height: 100vh;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.5;
        }
        .wi-root * { box-sizing: border-box; }

        /* Navigation */
        .wi-nav {
          max-width: 1080px;
          margin: 0 auto;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wi-logo {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 500;
          color: var(--charcoal);
          letter-spacing: -0.02em;
        }
        .wi-nav-links {
          display: flex;
          gap: 32px;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
        }
        .wi-nav-links a {
          text-decoration: none;
          color: inherit;
          transition: color 0.2s;
          cursor: pointer;
        }
        .wi-nav-links a:hover, .wi-nav-links a.active {
          color: var(--charcoal);
        }
        .wi-nav-cta {
          font-size: 13px;
          font-weight: 500;
          padding: 10px 22px;
          background: var(--charcoal);
          color: var(--cream);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.2s;
        }
        .wi-nav-cta:hover { background: var(--charcoal2); }

        /* Tab switcher for mockup */
        .wi-tabs {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border);
        }
        .wi-tab {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 12px 20px;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .wi-tab.active {
          color: var(--charcoal);
          border-bottom-color: var(--brass);
        }

        /* Hero */
        .wi-hero {
          max-width: 1080px;
          margin: 0 auto;
          padding: 80px 40px 60px;
        }
        .wi-hero-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--brass);
          margin-bottom: 16px;
        }
        .wi-hero h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 400;
          line-height: 1.1;
          color: var(--charcoal);
          margin: 0 0 20px;
          max-width: 14ch;
          letter-spacing: -0.02em;
        }
        .wi-hero p {
          font-size: 17px;
          line-height: 1.65;
          color: var(--muted);
          max-width: 52ch;
          margin: 0 0 36px;
        }
        .wi-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          padding: 14px 28px;
          background: var(--charcoal);
          color: var(--cream);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.2s;
        }
        .wi-hero-cta:hover { background: var(--charcoal2); }

        /* Cards grid */
        .wi-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 60px 40px;
        }
        .wi-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .wi-section h2 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 400;
          color: var(--charcoal);
          margin: 0 0 32px;
          letter-spacing: -0.01em;
        }
        .wi-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) { .wi-cards { grid-template-columns: 1fr; } }
        .wi-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 28px 24px;
          box-shadow: var(--shadow);
        }
        .wi-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .wi-card h3 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--charcoal);
        }
        .wi-card p {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--muted);
          margin: 0;
        }

        /* Profile mockup */
        .wi-profile-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 880px) { .wi-profile-grid { grid-template-columns: 1fr; } }
        .wi-stat-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .wi-stat-label {
          font-size: 14px;
          color: var(--charcoal);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wi-stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 6px;
          flex: none;
        }
        .wi-stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.02em;
        }
        .wi-stat-ev {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--muted);
          margin-top: 2px;
        }
        .wi-composite {
          background: white;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 32px 28px;
          box-shadow: var(--shadow);
        }
        .wi-composite-big {
          font-family: 'Fraunces', serif;
          font-size: 48px;
          font-weight: 400;
          color: var(--charcoal);
          line-height: 1;
          margin: 8px 0;
        }
        .wi-composite-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: var(--brass);
          letter-spacing: 0.03em;
        }

        /* Science mockup */
        .wi-steps {
          display: grid;
          gap: 0;
        }
        .wi-step {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 20px;
          padding: 28px 0;
          border-bottom: 1px solid var(--border);
        }
        .wi-step-num {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          color: var(--cream3);
          text-align: center;
          padding-top: 2px;
        }
        .wi-step h3 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 6px;
          color: var(--charcoal);
        }
        .wi-step p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--muted);
          margin: 0;
          max-width: 56ch;
        }

        /* Footer */
        .wi-footer {
          max-width: 1080px;
          margin: 0 auto;
          padding: 40px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--muted);
        }
        .wi-footer-brand {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          color: var(--charcoal);
        }
      `}</style>

      {/* Navigation */}
      <nav className="wi-nav">
        <div className="wi-logo">AQAL</div>
        <div className="wi-nav-links">
          <a className={activeTab === "home" ? "active" : ""} onClick={() => setActiveTab("home")}>About</a>
          <a className={activeTab === "science" ? "active" : ""} onClick={() => setActiveTab("science")}>Science</a>
          <a>Pricing</a>
          <a className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>Profile</a>
        </div>
        <button className="wi-nav-cta">Begin Assessment</button>
      </nav>

      {/* Tab switcher */}
      <div className="wi-tabs">
        <button className={`wi-tab ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>Landing</button>
        <button className={`wi-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>Profile</button>
        <button className={`wi-tab ${activeTab === "science" ? "active" : ""}`} onClick={() => setActiveTab("science")}>Science</button>
      </div>

      {/* HOME / LANDING */}
      {activeTab === "home" && (
        <>
          <div className="wi-hero">
            <div className="wi-hero-label">Intelligence Assessment</div>
            <h1>A rigorous map of how you actually think.</h1>
            <p>
              32 dimensions. A panel of AIs cross-checking each other. Evidence you upload, not claims you make.
              Built for people who want precision, not flattery.
            </p>
            <button className="wi-hero-cta">
              Start the assessment
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L8 4m3 3L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          <div className="wi-section">
            <div className="wi-section-label">How it works</div>
            <h2>Three measurement modes, honestly labeled</h2>
            <div className="wi-cards">
              <div className="wi-card">
                <div className="wi-card-icon" style={{ background: "rgba(201,162,75,0.1)", color: "var(--brass)" }}>M</div>
                <h3>Measured</h3>
                <p>Normed against representative populations. Real percentiles from standardized scores you upload.</p>
              </div>
              <div className="wi-card">
                <div className="wi-card-icon" style={{ background: "rgba(74,107,138,0.1)", color: "var(--blue)" }}>D</div>
                <h3>Developmental</h3>
                <p>Stage estimates from structured probes. No fake percentiles — just where you are on a well-studied ladder.</p>
              </div>
              <div className="wi-card">
                <div className="wi-card-icon" style={{ background: "rgba(158,94,58,0.1)", color: "var(--terracotta)" }}>V</div>
                <h3>Demonstrated</h3>
                <p>Verified achievement floors from real-world evidence. Your track record, not your self-report.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="wi-section">
          <div className="wi-profile-grid">
            <div>
              <div className="wi-section-label">27-line assessment</div>
              <h2>Intelligence Profile</h2>

              {[
                { label: "Logical", mode: "measured", color: "var(--brass)", value: "95th pct", ev: "LSAT 172" },
                { label: "Linguistic", mode: "measured", color: "var(--brass)", value: "97th pct", ev: "GRE-V 168" },
                { label: "Mathematical", mode: "measured", color: "var(--brass)", value: "93rd pct", ev: "SAT-M 790" },
                { label: "Volitional", mode: "measured", color: "var(--brass)", value: "90th pct", ev: "Conscientiousness inv." },
                { label: "Meta-Cognitive", mode: "calibration", color: "var(--sage)", value: "84 / 100", ev: "Calibration test" },
                { label: "Integrative", mode: "altitude", color: "var(--blue)", value: "Integral", ev: "Cross-domain synthesis" },
                { label: "Existential", mode: "altitude", color: "var(--blue)", value: "Integrative", ev: "Structured probes" },
                { label: "Strategic", mode: "demonstrated", color: "var(--terracotta)", value: "Elite", ev: "Two ventures built" },
                { label: "Influence", mode: "demonstrated", color: "var(--terracotta)", value: "Elite", ev: "$40M raised" },
                { label: "Resilient", mode: "demonstrated", color: "var(--terracotta)", value: "Strong", ev: "Documented recovery" },
              ].map((item) => (
                <div key={item.label} className="wi-stat-row">
                  <div>
                    <div className="wi-stat-label">
                      <span className="wi-stat-dot" style={{ background: item.color }} />
                      {item.label}
                    </div>
                    <div className="wi-stat-ev">{item.ev}</div>
                  </div>
                  <span className="wi-stat-value" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="wi-composite">
              <div className="wi-section-label">Composite</div>
              <div className="wi-composite-big">99.6%</div>
              <div className="wi-composite-sub">&asymp; 1 in 4,200 · estimated</div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginTop: "16px" }}>
                Covariance-adjusted across ~6.5 effective dimensions. Not a product of 27 independent lines — that would double-count shared variance.
              </p>
              <div style={{ marginTop: "20px", padding: "12px 14px", background: "var(--cream)", borderRadius: "4px", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--muted)" }}>
                  Effective dimensions
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: "24px", color: "var(--charcoal)", margin: "4px 0" }}>~6.5</div>
                <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                  6 genuinely independent lines widen the base beyond g-loaded cognition.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCIENCE */}
      {activeTab === "science" && (
        <div className="wi-section">
          <div className="wi-section-label">Methodology</div>
          <h2>How the assessment works</h2>
          <div className="wi-steps">
            {[
              { n: "01", title: "Voice capture", desc: "A 12-minute structured interview. A panel of AIs from different developers analyzes the same audio independently." },
              { n: "02", title: "Cross-validation", desc: "Each system scores blind. Agreement raises confidence; disagreement triggers deeper probes or flags uncertainty." },
              { n: "03", title: "Evidence upload", desc: "Standardized test scores, certifications, and documented achievements anchor measured lines to real population norms." },
              { n: "04", title: "Honest rendering", desc: "Each line is reported in its correct verb — percentile, stage, or verified floor — never inflated beyond what the data supports." },
              { n: "05", title: "Composite modeling", desc: "Mahalanobis distance across effective dimensions, accounting for covariance. Not multiplication of 27 fake-independent lines." },
            ].map((step) => (
              <div key={step.n} className="wi-step">
                <div className="wi-step-num">{step.n}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="wi-footer">
        <div className="wi-footer-brand">AQAL</div>
        <div>&copy; 2025 AQAL Intelligence. Methodology disclosed. No data sold.</div>
      </footer>
    </div>
  );
}
