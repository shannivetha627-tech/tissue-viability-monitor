import { TissueAnimation, bloodFlowToState } from "@/components/TissueAnimation";
import type { PatientRecord } from "@/lib/patients.server";
import type { ViabilityAssessment, PredictionHistoryRecord } from "@/lib/clinical.functions";

export function PatientProfile({ patient }: { patient: PatientRecord }) {
  const rows: [string, string | number][] = [
    ["Age", patient.Age],
    ["Gender", patient.Gender],
    ["BMI", patient.BMI],
    ["Diabetes", patient.Diabetes],
    ["Smoking", patient.Smoking],
    ["Hypertension", patient.Hypertension],
    ["Heart rate", patient.Heart_Rate],
    ["Blood pressure", patient.Blood_Pressure_Sys],
    ["SpO₂", patient.SpO2],
    ["Tissue temperature", patient.Tissue_Temperature],
    ["Blood flow", patient.Blood_Flow],
    ["Perfusion index", patient.Perfusion_Index],
    ["Capillary refill", patient.Capillary_Refill_Time],
    ["Surgery duration", patient.Surgery_Duration],
    ["Flap type", patient.Flap_Type],
    ["Risk level (recorded)", patient.Risk_Level],
  ];

  return (
    <section className="panel patient-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Patient profile</p>
          <h2>{patient.Patient_ID}</h2>
        </div>
        <span className="record-pill">Confidential record</span>
      </div>
      <div className="data-grid">
        {rows.map(([label, value]) => (
          <div className="data-item" key={label}>
            <span>{label}</span>
            <strong>{value === null || value === undefined ? "Not recorded" : value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PredictionHistoryPanel({ history }: { history: PredictionHistoryRecord[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Automated Scheduler</p>
          <h2>Prediction History</h2>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="muted" style={{ padding: "1rem" }}>
          No prediction history available yet. The background scheduler will generate predictions
          shortly.
        </p>
      ) : (
        <div className="overflow-x-auto w-full mt-4 border border-slate-300 rounded-lg">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-900">
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-900">
                  Timestamp (IST)
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-900">
                  Prediction
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-900">
                  Probability
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-900">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {history.map((record, i) => {
                const isViable = record.prediction === "Yes";
                const date = new Date(record.createdAt);
                const formattedDate = Number.isNaN(date.getTime()) || date.getFullYear() === 1970
                  ? "Timestamp unavailable"
                  : date
                      .toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })
                      .replace(/\b(am|pm)\b/i, (period) => period.toUpperCase());

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${isViable ? "bg-emerald-100 text-emerald-950 border border-emerald-400" : "bg-rose-100 text-rose-950 border border-rose-400"}`}
                      >
                        {isViable ? "Viable" : "Not Viable"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-bold">
                      {record.viabilityProbability.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{record.confidence}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ResultAndMonitor({
  patient,
  assessment,
}: {
  patient: PatientRecord;
  assessment: ViabilityAssessment;
}) {
  const viable = assessment.prediction === "Yes";

  return (
    <section className="results-grid" id="monitor">
      <article className={`panel result-panel ${viable ? "result-good" : "result-alert"}`}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">AI tissue viability</p>
            <h2>{viable ? "Viable" : "Not viable"}</h2>
          </div>
          <span
            className="status-symbol"
            aria-label={viable ? "Stable tissue indicators" : "Tissue viability concern"}
          >
            {viable ? "✓" : "!"}
          </span>
        </div>
        <div className="result-score">
          {assessment.probability.toFixed(1)}
          <small>%</small>
        </div>
        <p className="result-caption">
          {viable ? "Stable tissue indicators" : "Tissue viability concern"} · viability probability
        </p>
        <div className="result-details">
          <div>
            <span>AI confidence</span>
            <strong>
              {assessment.confidence} ({assessment.predictedClassProbability.toFixed(1)}%)
            </strong>
          </div>
          <div>
            <span>Recorded status</span>
            <strong>{assessment.recordedViability === "Yes" ? "Viable" : "Not viable"}</strong>
          </div>
          <div>
            <span>Comparison</span>
            <strong className={assessment.comparison === "Match" ? "text-good" : "text-alert"}>
              {assessment.comparison}
            </strong>
          </div>
        </div>
        <p className="disclaimer">
          AI-assisted prediction from 15 clinical and physiological features (Risk_Level excluded).
          Clinical decisions must be made by qualified medical professionals.
        </p>
      </article>

      <article className="panel tissue-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live indicators</p>
            <h2>Tissue Perfusion Monitor</h2>
          </div>
          <span className="pulse-dot" aria-label="Monitoring active"></span>
        </div>
        <TissueAnimation
          mode="fixed"
          state={bloodFlowToState(patient.Blood_Flow)}
          caption="Educational visualization – not a diagnostic output"
        />
        <div className="indicator-list">
          <div>
            <span>Blood flow</span>
            <b>{patient.Blood_Flow}</b>
            <em
              style={
                {
                  "--level":
                    patient.Blood_Flow === "Normal"
                      ? "90%"
                      : patient.Blood_Flow === "Moderate"
                        ? "55%"
                        : "20%",
                } as React.CSSProperties
              }
            ></em>
          </div>
          <div>
            <span>Oxygenation</span>
            <b>{patient.SpO2}%</b>
            <em style={{ "--level": `${patient.SpO2}%` } as React.CSSProperties}></em>
          </div>
          <div>
            <span>Perfusion</span>
            <b>{patient.Perfusion_Index}</b>
            <em
              style={
                {
                  "--level": `${Math.min(patient.Perfusion_Index * 10, 100)}%`,
                } as React.CSSProperties
              }
            ></em>
          </div>
          <div>
            <span>Temperature</span>
            <b>{patient.Tissue_Temperature}</b>
            <em style={{ "--level": "70%" } as React.CSSProperties}></em>
          </div>
        </div>
      </article>
    </section>
  );
}
