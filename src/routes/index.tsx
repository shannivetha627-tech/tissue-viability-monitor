import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { TissueAnimation } from "@/components/TissueAnimation";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "TissueGuard AI | Tissue Viability Monitoring" },
      {
        name: "description",
        content:
          "AI-assisted post-microsurgical monitoring: physiological indicators and a Random Forest tissue viability prediction in one clinical workspace.",
      },
      { property: "og:title", content: "TissueGuard AI | Tissue Viability Monitoring" },
      {
        property: "og:description",
        content:
          "Predict tissue viability from structured clinical and physiological patient data with an AI-assisted clinical workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Home() {
  useReveal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.add("landing");
    return () => document.body.classList.remove("landing");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`landing-nav${scrolled ? " is-scrolled" : ""}`}
        aria-label="Primary navigation"
      >
        <a className="landing-brand" href="#top" aria-label="TissueGuard AI home">
          TissueGuard <b>AI</b>
        </a>
        <button
          className="landing-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="landing-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        </button>
        <div className={`landing-menu${menuOpen ? " is-open" : ""}`} id="landing-menu">
          <div className="landing-menu-head">
            <span>
              TissueGuard <b>AI</b>
            </span>
            <button
              className="landing-menu-close"
              type="button"
              aria-label="Close navigation"
              onClick={close}
            >
              ×
            </button>
          </div>
          <a href="#top" onClick={close}>
            Home
          </a>
          <a href="#how-it-works" onClick={close}>
            How it works
          </a>
          <a href="#monitoring" onClick={close}>
            Monitoring
          </a>
          <a href="#security" onClick={close}>
            Security
          </a>
          <Link className="nav-login" to="/login" onClick={close}>
            Doctor login <span aria-hidden="true">↗</span>
          </Link>
          <Link className="nav-patient-login" to="/login" onClick={close}>
            Patient login
          </Link>
        </div>
      </nav>
      <div className={`landing-backdrop${menuOpen ? " is-visible" : ""}`} onClick={close}></div>

      <main id="top">
        <section className="landing-main">
          <div className="landing-copy" data-reveal>
            <p className="eyebrow">AI-powered microsurgical monitoring</p>
            <h1>
              Predict tissue viability. <span>Understand risk earlier.</span>
            </h1>
            <p className="lead">
              AI-assisted postoperative monitoring that brings physiological indicators and
              machine-learning analysis into one focused clinical workspace.
            </p>
            <p className="landing-secondary">
              TissueGuard AI brings patient observations, physiological indicators, and
              machine-learning predictions together in one secure clinical workspace.
            </p>
            <div className="landing-actions">
              <a className="primary-action" href="#how-it-works">
                Explore the platform <span aria-hidden="true">→</span>
              </a>
              <Link className="secondary-action" to="/login">
                Secure doctor access <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className="action-note">
              <span className="secure-dot"></span>Secure role-based clinical access
            </p>
          </div>
          <div
            className="signal-panel"
            aria-label="System visualization of tissue, blood flow, oxygenation and AI analysis"
            data-reveal
          >
            <div className="signal-header">
              <span>Live system visualization</span>
              <span className="signal-status">
                <i></i> Analysis ready
              </span>
            </div>
            <TissueAnimation
              mode="auto"
              caption="Healthy circulation → reduced perfusion → non-viable"
            />
            <div className="signal-scan" aria-hidden="true"></div>
            <div className="signal-caption">
              <span>TISSUE / PERFUSION / OXYGENATION</span>
              <strong>AI-assisted analysis</strong>
            </div>
          </div>
        </section>

        <div className="landing-trust">
          <span>AI-assisted decision support</span>
          <b>•</b>
          <span>Designed for clinical review</span>
          <b>•</b>
          <span>Prototype workspace</span>
        </div>

        <section className="landing-section capability-section" aria-labelledby="capability-title">
          <div className="section-intro">
            <p className="eyebrow">A clearer clinical picture</p>
            <h2 id="capability-title">Signals in one focused workspace.</h2>
            <p>
              Review the indicators that matter to postoperative tissue viability without losing the
              context around them.
            </p>
          </div>
          <div className="capability-grid">
            <article
              className="capability-card"
              data-reveal
              style={{ "--delay": "0ms" } as React.CSSProperties}
            >
              <span className="capability-label">AI intelligence</span>
              <span className="capability-icon">✦</span>
              <h3>AI-assisted prediction</h3>
              <p>Machine-learning based tissue viability assessment.</p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
              <span className="card-visual neural-visual" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </article>
            <article
              className="capability-card"
              data-reveal
              style={{ "--delay": "100ms" } as React.CSSProperties}
            >
              <span className="capability-label">Physiology</span>
              <span className="capability-icon">◌</span>
              <h3>Physiological monitoring</h3>
              <p>Review oxygenation, blood flow, perfusion and temperature indicators.</p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
              <span className="card-visual waveform-visual" aria-hidden="true"></span>
            </article>
            <article
              className="capability-card"
              data-reveal
              style={{ "--delay": "200ms" } as React.CSSProperties}
            >
              <span className="capability-label">Access control</span>
              <span className="capability-icon">⌁</span>
              <h3>Secure clinical access</h3>
              <p>Role-based access for doctors and patients.</p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
              <span className="card-visual shield-visual" aria-hidden="true">
                ◈
              </span>
            </article>
            <article
              className="capability-card"
              data-reveal
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              <span className="capability-label">Clinical continuity</span>
              <span className="capability-icon">↗</span>
              <h3>Prediction history</h3>
              <p>Track previous viability predictions and clinical observations.</p>
              <span className="card-arrow" aria-hidden="true">
                →
              </span>
              <span className="card-visual bars-visual" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
            </article>
          </div>
        </section>

        <section
          className="landing-section process-section"
          id="how-it-works"
          aria-labelledby="process-title"
        >
          <div className="section-intro">
            <p className="eyebrow">How TissueGuard AI works</p>
            <h2 id="process-title">From patient data to clinical insight.</h2>
          </div>
          <div className="process-grid" data-timeline>
            <article data-reveal>
              <b>01</b>
              <h3>Patient data</h3>
              <p>Capture relevant patient and postoperative parameters.</p>
            </article>
            <article data-reveal>
              <b>02</b>
              <h3>AI analysis</h3>
              <p>Analyze physiological indicators using the trained ML model.</p>
            </article>
            <article data-reveal>
              <b>03</b>
              <h3>Viability prediction</h3>
              <p>Generate an AI-assisted tissue viability prediction.</p>
            </article>
            <article data-reveal>
              <b>04</b>
              <h3>Clinical review</h3>
              <p>Present the result and supporting indicators for professional review.</p>
            </article>
          </div>
        </section>

        <section
          className="landing-section monitoring-section"
          id="monitoring"
          aria-labelledby="monitoring-title"
        >
          <div className="section-intro">
            <p className="eyebrow">What we monitor</p>
            <h2 id="monitoring-title">The parameters already in your workflow.</h2>
            <p>Only the existing project features are represented here.</p>
          </div>
          <div className="monitoring-grid">
            {[
              ["♡", "Heart rate", "Cardiac rate indicator used in postoperative assessment."],
              [
                "⌁",
                "Blood pressure",
                "Systolic pressure indicator recorded with the patient profile.",
              ],
              ["O₂", "SpO₂", "Oxygen saturation indicator used as part of assessment."],
              ["°", "Tissue temperature", "Local temperature indicator for tissue monitoring."],
              ["≈", "Blood flow", "Flow indicator supporting the tissue viability review."],
              ["◉", "Perfusion index", "Perfusion indicator included in the clinical snapshot."],
              ["◷", "Capillary refill time", "Recorded refill measure available for review."],
              ["↕", "Surgery duration", "Procedure duration included in the patient parameters."],
            ].map(([icon, title, text], i) => (
              <article
                className="metric-tile"
                data-reveal
                key={title}
                style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
              >
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section preview-section" aria-labelledby="preview-title">
          <div className="preview-copy">
            <p className="eyebrow">System preview</p>
            <h2 id="preview-title">A shared language for tissue viability.</h2>
            <p>
              This interface illustration shows how indicators and an AI-assisted result can sit
              together for professional review. Values shown are illustrative only, not live patient
              data.
            </p>
            <Link className="text-link" to="/login">
              Enter the clinical workspace <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div
            className="analysis-window"
            aria-label="Illustrative tissue viability analysis panel"
          >
            <div className="analysis-top">
              <span>Tissue viability analysis</span>
              <span className="analysis-live">
                <i></i>System preview
              </span>
            </div>
            <div className="analysis-body">
              <div className="analysis-visual">
                <TissueAnimation mode="fixed" state="viable" caption="AI signal map" />
              </div>
              <div className="analysis-data">
                <div>
                  <span>Blood flow</span>
                  <strong>Normal</strong>
                </div>
                <div>
                  <span>Oxygenation</span>
                  <strong>95%</strong>
                </div>
                <div>
                  <span>Perfusion</span>
                  <strong>6.57</strong>
                </div>
                <div>
                  <span>Temperature</span>
                  <strong>36.5°C</strong>
                </div>
                <div className="analysis-result">
                  <span>AI prediction</span>
                  <strong>Viable</strong>
                  <small>Illustrative result</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section workspace-section" aria-labelledby="workspace-title">
          <div className="section-intro">
            <p className="eyebrow">Two paths, one secure workspace</p>
            <h2 id="workspace-title">Built around the people reviewing the record.</h2>
          </div>
          <div className="workspace-grid">
            <article>
              <span className="workspace-kicker">01 / Doctor workspace</span>
              <h3>Review with context.</h3>
              <p>
                Review patient parameters, run AI-assisted viability predictions, and monitor
                prediction history.
              </p>
              <Link className="text-link" to="/login">
                Doctor login <span aria-hidden="true">↗</span>
              </Link>
            </article>
            <article>
              <span className="workspace-kicker">02 / Patient workspace</span>
              <h3>Stay close to your record.</h3>
              <p>
                Securely view your own clinical information and prediction history. Patients cannot
                access other patients' information.
              </p>
              <Link className="text-link" to="/login">
                Patient login <span aria-hidden="true">↗</span>
              </Link>
            </article>
          </div>
        </section>

        <section className="security-section" id="security" aria-labelledby="security-title">
          <div className="security-intro">
            <p className="eyebrow">Access by design</p>
            <h2 id="security-title">Built around secure clinical access.</h2>
            <p>Clear boundaries keep each workspace focused on the people it is intended for.</p>
          </div>
          <div className="security-grid">
            <article>
              <b>01</b>
              <h3>Role-based access</h3>
              <p>Separate doctor and patient access paths.</p>
            </article>
            <article>
              <b>02</b>
              <h3>Signed sessions</h3>
              <p>Server-side signed session cookies protect workspace access.</p>
            </article>
            <article>
              <b>03</b>
              <h3>Confidential records</h3>
              <p>Patient information is restricted to authorized access.</p>
            </article>
            <article>
              <b>04</b>
              <h3>Scoped data access</h3>
              <p>Patients can only retrieve their own clinical record.</p>
            </article>
          </div>
        </section>

        <section className="final-cta">
          <p className="eyebrow">TissueGuard AI</p>
          <h2>Turn postoperative data into clearer clinical insight.</h2>
          <p>
            TissueGuard AI provides an AI-assisted workspace for monitoring tissue viability and
            reviewing postoperative indicators.
          </p>
          <div className="landing-actions">
            <Link className="primary-action" to="/login">
              Doctor login <span aria-hidden="true">↗</span>
            </Link>
            <Link className="secondary-action" to="/login">
              Patient login
            </Link>
          </div>
        </section>

        <Disclaimer />
      </main>

      <footer className="landing-footer">
        <div>
          <a className="landing-brand" href="#top">
            TissueGuard <b>AI</b>
          </a>
          <p>AI-assisted postoperative tissue viability monitoring.</p>
        </div>
        <div className="footer-links">
          <Link to="/login">Doctor login</Link>
          <Link to="/login">Patient login</Link>
        </div>
        <small>Confidential clinical workspace • Prototype AI decision-support system</small>
      </footer>
    </>
  );
}
