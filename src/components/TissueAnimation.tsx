import { useEffect, useRef, useState } from "react";

export type TissueState = "viable" | "reduced" | "non-viable";

const PHASES: { state: TissueState; label: string; level: number; hold: number }[] = [
  { state: "viable", label: "VIABLE", level: 1, hold: 5200 },
  { state: "reduced", label: "REDUCED PERFUSION", level: 0.52, hold: 5200 },
  { state: "non-viable", label: "NON-VIABLE", level: 0.12, hold: 5200 },
];

const LABELS: Record<TissueState, string> = {
  viable: "VIABLE",
  reduced: "REDUCED PERFUSION",
  "non-viable": "NON-VIABLE",
};

const LEVELS: Record<TissueState, number> = {
  viable: 1,
  reduced: 0.52,
  "non-viable": 0.12,
};

type Cell = { t: number; lane: number; wobble: number; size: number };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixRgb(a: number[], b: number[], t: number) {
  return `rgb(${Math.round(lerp(a[0]!, b[0]!, t))}, ${Math.round(lerp(a[1]!, b[1]!, t))}, ${Math.round(lerp(a[2]!, b[2]!, t))})`;
}

/**
 * Educational visualization of tissue perfusion. It illustrates circulation,
 * oxygenation and pulse — it does not perform any diagnosis.
 */
export function TissueAnimation({
  mode = "auto",
  state,
  caption,
}: {
  /** "auto" loops viable -> reduced perfusion -> non-viable. */
  mode?: "auto" | "fixed" | undefined;
  /** Used when mode is "fixed" (e.g. driven by a patient's blood flow). */
  state?: TissueState | undefined;
  caption?: string | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [label, setLabel] = useState(mode === "fixed" && state ? LABELS[state] : PHASES[0]!.label);
  const [activeState, setActiveState] = useState<TissueState>(
    mode === "fixed" && state ? state : "viable",
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lanes = [0.3, 0.52, 0.74];
    const cells: Cell[] = Array.from({ length: 66 }, (_, i) => ({
      t: Math.random(),
      lane: i % lanes.length,
      wobble: Math.random() * Math.PI * 2,
      size: 0.85 + Math.random() * 0.5,
    }));

    let frame = 0;
    const start = performance.now();
    let phaseIndex = 0;
    let currentLevel = mode === "fixed" && state ? LEVELS[state] : PHASES[0]!.level;
    let targetLevel = currentLevel;
    let last = start;

    const cycle = PHASES.reduce((sum, p) => sum + p.hold, 0);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (mode === "auto") {
        const elapsed = (now - start) % cycle;
        let acc = 0;
        let index = 0;
        for (let i = 0; i < PHASES.length; i++) {
          acc += PHASES[i]!.hold;
          if (elapsed < acc) {
            index = i;
            break;
          }
        }
        if (index !== phaseIndex) {
          phaseIndex = index;
          setLabel(PHASES[index]!.label);
          setActiveState(PHASES[index]!.state);
        }
        targetLevel = PHASES[index]!.level;
      } else {
        targetLevel = LEVELS[state ?? "viable"];
      }

      // Smooth (gradual) transition between perfusion states.
      currentLevel += (targetLevel - currentLevel) * Math.min(dt / 900, 1);
      const level = currentLevel;

      // Pulse: strong and regular when perfused, weak/absent when not.
      const pulse = Math.sin(now / (520 - level * 160)) * 0.5 + 0.5;
      const pulseStrength = 0.15 + level * 0.85;

      // Tissue bed: healthy red-pink -> dull pale grey.
      const healthy = [176, 58, 66];
      const pale = [178, 166, 165];
      const base = mixRgb(healthy, pale, 1 - level);
      const deep = mixRgb([120, 30, 40], [130, 122, 122], 1 - level);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, deep);
      bg.addColorStop(0.5, base);
      bg.addColorStop(1, deep);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Tissue texture (cell bodies)
      ctx.save();
      for (let i = 0; i < 46; i++) {
        const x = ((i * 97) % 100) / 100;
        const y = ((i * 61) % 100) / 100;
        const r = 12 + ((i * 13) % 18);
        ctx.beginPath();
        ctx.globalAlpha = 0.06 + level * 0.05;
        ctx.fillStyle = i % 2 ? "#ffffff" : "#000000";
        ctx.ellipse(x * w, y * h, r, r * 0.7, i, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Oxygenation glow
      const glow = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h);
      glow.addColorStop(0, `rgba(255, 120, 120, ${0.16 * level * (0.7 + pulse * 0.3)})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Vessels
      const vesselWidth = (h * 0.075 + h * 0.035 * level) * (1 + pulse * 0.06 * pulseStrength);
      lanes.forEach((laneY, laneIndex) => {
        const y = laneY * h;
        const amp = h * (0.05 + laneIndex * 0.012);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const yy = y + Math.sin(x / (w / 3) + laneIndex * 1.4) * amp;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.lineCap = "round";
        ctx.lineWidth = vesselWidth;
        ctx.strokeStyle = mixRgb([92, 26, 34], [150, 142, 142], 1 - level);
        ctx.stroke();

        ctx.lineWidth = vesselWidth * 0.62;
        ctx.strokeStyle = mixRgb([196, 74, 74], [186, 178, 176], 1 - level);
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Red blood cells: count and speed scale with perfusion.
      const activeCells = Math.max(2, Math.round(cells.length * (0.12 + level * 0.88)));
      const speed = (0.00006 + 0.00028 * level) * dt * 60;
      cells.forEach((cell, i) => {
        cell.t += speed * (0.75 + (i % 5) * 0.1);
        if (cell.t > 1) cell.t -= 1;
        if (i >= activeCells) return;

        const laneY = lanes[cell.lane]!;
        const amp = h * (0.05 + cell.lane * 0.012);
        const x = cell.t * w;
        const y =
          laneY * h +
          Math.sin(x / (w / 3) + cell.lane * 1.4) * amp +
          Math.sin(now / 600 + cell.wobble) * (h * 0.012);

        const r = vesselWidth * 0.2 * cell.size;
        ctx.beginPath();
        ctx.fillStyle = mixRgb([228, 66, 66], [198, 186, 182], 1 - level);
        ctx.globalAlpha = 0.55 + level * 0.45;
        ctx.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.18 + level * 0.2})`;
        ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Pulse ring, fading out as perfusion drops
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,255,255,${0.05 + 0.22 * pulseStrength * pulse})`;
      ctx.lineWidth = 2;
      ctx.arc(w * 0.5, h * 0.5, h * (0.22 + pulse * 0.16), 0, Math.PI * 2);
      ctx.stroke();

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [mode, state]);

  useEffect(() => {
    if (mode === "fixed" && state) {
      setLabel(LABELS[state]);
      setActiveState(state);
    }
  }, [mode, state]);

  return (
    <div className={`tissue-visual-wrap tissue-${activeState}`}>
      <canvas ref={canvasRef} className="tissue-canvas" aria-hidden="true" />
      <span className="tissue-state-label">{label}</span>
      <span className="tissue-visual-note">
        {caption ?? "Educational visualization – not a diagnostic output"}
      </span>
    </div>
  );
}

export function bloodFlowToState(bloodFlow: string | undefined): TissueState {
  if (bloodFlow === "Normal") return "viable";
  if (bloodFlow === "Moderate") return "reduced";
  return "non-viable";
}
