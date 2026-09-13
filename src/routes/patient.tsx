import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import {
  PatientProfile,
  ResultAndMonitor,
  PredictionHistoryPanel,
} from "@/components/PatientPanels";
import {
  getMyRecord,
  getPredictionHistory,
  type ViabilityAssessment,
  type PredictionHistoryRecord,
} from "@/lib/clinical.functions";
import type { PatientRecord } from "@/lib/patients.server";

export const Route = createFileRoute("/patient")({
  component: PatientDashboard,
  head: () => ({
    meta: [
      { title: "My Record | TissueGuard AI" },
      {
        name: "description",
        content:
          "View your own postoperative clinical record, perfusion indicators and AI-assisted tissue viability assessment.",
      },
      { property: "og:title", content: "My Record | TissueGuard AI" },
      {
        property: "og:description",
        content: "Your postoperative indicators and AI-assisted viability assessment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PatientDashboard() {
  const router = useRouter();
  const fetchRecord = useServerFn(getMyRecord);
  const fetchHistory = useServerFn(getPredictionHistory);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [assessment, setAssessment] = useState<ViabilityAssessment | null>(null);
  const [history, setHistory] = useState<PredictionHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    void (async () => {
      const result = await fetchRecord({});
      if (!result.ok) {
        setError(result.error);
        await router.navigate({ to: "/login" });
        return;
      }
      setPatient(result.patient);
      setAssessment(result.assessment);

      const histResult = await fetchHistory({ data: { patientId: result.patient.Patient_ID } });
      if (histResult.ok) {
        setHistory(histResult.history);
      }
    })();
  }, [fetchRecord, fetchHistory, router]);

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <p className="eyebrow">Your clinical record</p>
          <h1>Tissue Viability Overview</h1>
          <p className="subtitle">You can only view your own information in this workspace.</p>
        </div>
        <Link className="logout-link" to="/logout">
          Log out
        </Link>
      </header>

      {error && (
        <div className="notice notice-warn" role="alert">
          <strong>{error}</strong>
        </div>
      )}

      {patient && <PatientProfile patient={patient} />}
      {patient && assessment && (
        <>
          <ResultAndMonitor patient={patient} assessment={assessment} />
          <PredictionHistoryPanel history={history} />
        </>
      )}

      <Disclaimer />
      <footer>Confidential clinical workspace · Prototype decision-support system</footer>
    </main>
  );
}
