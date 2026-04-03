import type { Scenario } from "./scenarioData";

interface Props {
  scenarios: Scenario[];
  activeScenario: string;
  onScenarioChange: (id: string) => void;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function Controls({
  scenarios,
  activeScenario,
  onScenarioChange,
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
}: Props) {
  return (
    <div className="viz-controls">
      {isPlaying ? (
        <button onClick={onPause}>⏸ Пауза</button>
      ) : (
        <button className="primary" onClick={onPlay}>
          ▶ Играть
        </button>
      )}
      <button onClick={onStep} disabled={currentStep >= totalSteps - 1}>
        ⏭ Шаг
      </button>
      <button onClick={onReset}>↺ Сброс</button>

      <select
        className="speed-select"
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>

      <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
        Шаг {currentStep + 1} / {totalSteps}
      </span>

      <div className="scenario-btns">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            className={activeScenario === sc.id ? "active-scenario" : ""}
            onClick={() => onScenarioChange(sc.id)}
          >
            {sc.title}
          </button>
        ))}
      </div>
    </div>
  );
}
