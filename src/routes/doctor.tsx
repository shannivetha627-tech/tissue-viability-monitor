import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import {
  PatientProfile,
  ResultAndMonitor,
  PredictionHistoryPanel,
} from "@/components/PatientPanels";
import { TissueAnimation, bloodFlowToState } from "@/components/TissueAnimation";
import {
  getCurrentSession,
  getRegistrySummary,
  searchPatient,
  getPredictionHistory,
  type ViabilityAssessment,
  type PredictionHistoryRecord,
} from "@/lib/clinical.functions";
import type { PatientRecord } from "@/lib/patients.server";
import { FEATURE_IMPORTANCE, VALIDATION } from "@/lib/validation";

export const Route = createFileRoute("/doctor")({
  component: DoctorDashboard,
  head: () => ({
    meta: [
      { title: "Doctor Workspace | TissueGuard AI" },
      {
        name: "description",
        content:
          "Search real patient records, run the Random Forest tissue viability prediction and review perfusion indicators.",
      },
      { property: "og:title", content: "Doctor Workspace | TissueGuard AI" },
      {
        property: "og:description",
        content:
          "AI-assisted tissue viability predictions with probability, confidence and recorded-viability comparison.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function DoctorDashboard() {
  const router = useRouter();
  const session = useServerFn(getCurrentSession);
  const summaryFn = useServerFn(getRegistrySummary);
  const search = useServerFn(searchPatient);

  const [username, setUsername] = useState("");
  const [summary, setSummary] = useState<{
    totalPatients: number;
    stable: number;
    atRisk: number;
    highRisk: number;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [assessment, setAssessment] = useState<ViabilityAssessment | null>(null);
  const [history, setHistory] = useState<PredictionHistoryRecord[]>([]);
  const fetchHistory = useServerFn(getPredictionHistory);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    void (async () => {
      const s = await session({});
      if (s.role !== "doctor") {
        await router.navigate({ to: "/login" });
        return;
      }
      setUsername(s.username ?? "");
      setSummary(await summaryFn({}));
    })();
  }, [session, summaryFn, router]);

  const onSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSearched(true);
    try {
      const result = await search({ data: { patientId } });
      if (!result.ok) {
        setPatient(null);
        setAssessment(null);
        setHistory([]);
        setError(result.error);
        return;
      }
      setPatient(result.patient);
      setAssessment(result.assessment);

      const histResult = await fetchHistory({ data: { patientId } });
      if (histResult.ok) {
        setHistory(histResult.history);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="menu-toggle"
        type="button"
        aria-label="Open navigation"
        onClick={() => setMenuOpen(true)}
      >
        <span aria-hidden="true">☰</span>
        <span className="sr-only">Open navigation</span>
      </button>
      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <button
          className="sidebar-close"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </button>
        <div className="brand">
          <span className="brand-mark">TG</span>
          <span>
            TissueGuard <b>AI</b>
          </span>
        </div>
        <div className="sidebar-label">Clinical workspace</div>
        <nav className="side-nav" aria-label="Dashboard navigation">
          <a className="active" href="#overview" onClick={() => setMenuOpen(false)}>
            Overview
          </a>
          <a href="#patient" onClick={() => setMenuOpen(false)}>
            Patients
          </a>
          <a href="#monitor" onClick={() => setMenuOpen(false)}>
            Monitoring
          </a>
          <a href="#model" onClick={() => setMenuOpen(false)}>
            Model
          </a>
        </nav>
        <div className="sidebar-footer">
          <span className="secure-dot"></span> Secure session
          <Link className="logout-link" to="/logout">
            Log out
          </Link>
        </div>
      </aside>
      <div
        className={`sidebar-backdrop${menuOpen ? " is-visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI-assisted clinical intelligence</p>
            <h1>Tissue Viability Monitoring</h1>
            <p className="subtitle">AI-assisted postoperative tissue assessment</p>
          </div>
          <div className="doctor-chip">
            <span className="avatar">{(username || "D").slice(0, 1).toUpperCase()}</span>
            <span>Dr. {username || "Doctor"}</span>
          </div>
        </header>

        <section className="metric-grid" id="overview" aria-label="Dashboard summary">
          <article className="metric-card">
            <span className="metric-label">Total patients</span>
            <strong>{summary ? summary.totalPatients.toLocaleString() : "—"}</strong>
            <span className="metric-foot">Records in registry</span>
          </article>
          <article className="metric-card metric-green">
            <span className="metric-label">Viable</span>
            <strong>{summary ? summary.stable.toLocaleString() : "—"}</strong>
            <span className="metric-foot">Recorded viable tissue</span>
          </article>
          <article className="metric-card metric-amber">
            <span className="metric-label">Non-viable</span>
            <strong>{summary ? summary.atRisk.toLocaleString() : "—"}</strong>
            <span className="metric-foot">Requires clinical review</span>
          </article>
          <article className="metric-card metric-blue">
            <span className="metric-label">High risk level</span>
            <strong>{summary ? summary.highRisk.toLocaleString() : "—"}</strong>
            <span className="metric-foot">Recorded in dataset</span>
          </article>
        </section>

        <section className="panel search-panel" id="patient">
          <div style={{ flex: 1, minWidth: "260px" }}>
            <p className="eyebrow">Patient lookup</p>
            <h2>Find a patient record</h2>
            <p className="muted">Search authorized clinical records by patient ID.</p>
            <form className="search-form" onSubmit={onSearch} style={{ marginTop: "16px" }}>
              <label className="sr-only" htmlFor="patient-id">
                Patient ID
              </label>
              <input
                id="patient-id"
                name="patient_id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter Patient ID"
                autoComplete="off"
                required
              />
              <button type="submit" disabled={busy}>
                {busy ? "Searching…" : "Search"}
              </button>
            </form>
          </div>
          <div style={{ width: "260px", flexShrink: 0 }} className="search-animation-wrap">
            <TissueAnimation
              mode={patient ? "fixed" : "auto"}
              state={patient ? bloodFlowToState(patient.Blood_Flow) : undefined}
              caption={
                patient
                  ? `Patient ${patient.Patient_ID} Perfusion`
                  : "Live tissue perfusion preview"
              }
            />
          </div>
        </section>

        {searched && error && (
          <div className="notice notice-warn" role="alert">
            <strong>{error}</strong> Check the Patient ID and try again.
          </div>
        )}

        {patient && <PatientProfile patient={patient} />}
        {patient && assessment && (
          <>
            <ResultAndMonitor patient={patient} assessment={assessment} />
            <PredictionHistoryPanel history={history} />
          </>
        )}

        <section className="panel" id="model">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Random Forest</p>
              <h2>Validation results on the current dataset</h2>
            </div>
            <span className="muted">200 trees · 15 features</span>
          </div>
          <div className="validation-grid">
            <div>
              <span>Accuracy</span>
              <strong>{VALIDATION.accuracy}</strong>
            </div>
            <div>
              <span>ROC-AUC</span>
              <strong>{VALIDATION.rocAuc}</strong>
            </div>
            <div>
              <span>Validation records</span>
              <strong>{VALIDATION.records}</strong>
            </div>
            <div>
              <span>Correct predictions</span>
              <strong>{VALIDATION.correct}</strong>
            </div>
            <div>
              <span>Confusion matrix</span>
              <strong style={{ fontSize: 14 }}>
                [[{VALIDATION.confusionMatrix[0]!.join(", ")}], [
                {VALIDATION.confusionMatrix[1]!.join(", ")}]]
              </strong>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 14 }}>
            Feature importance (from model/feature_importance.csv). Risk_Level is excluded from the
            model as a target-leakage feature.
          </p>
          <div className="importance-list">
            {FEATURE_IMPORTANCE.map((f) => (
              <div className="importance-row" key={f.name}>
                <span>{f.name}</span>
                <b>{(f.value * 100).toFixed(2)}%</b>
                <i
                  style={{ "--level": `${Math.min(f.value * 350, 100)}%` } as React.CSSProperties}
                ></i>
              </div>
            ))}
          </div>
        </section>

        <Disclaimer />

        <footer>Confidential clinical workspace · Prototype decision-support system</footer>
      </main>
    </>
  );
}
