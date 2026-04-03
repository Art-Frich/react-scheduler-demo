import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIOS } from "./scenarioData";
import Controls from "./Controls";
import CodePanel from "./CodePanel";
import EventLoopPanel from "./EventLoopPanel";

export default function SchedulerScene() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const state = scenario.steps[step];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const advance = useCallback(() => {
    setStep((prev) => {
      if (prev >= scenario.steps.length - 1) {
        setIsPlaying(false);
        clearTimer();
        return prev;
      }
      return prev + 1;
    });
  }, [scenario.steps.length]);

  useEffect(() => {
    clearTimer();
    if (isPlaying) {
      timerRef.current = setInterval(advance, 2200 / speed);
    }
    return clearTimer;
  }, [isPlaying, speed, advance]);

  const handleScenarioChange = (id: string) => {
    setScenarioId(id);
    setStep(0);
    setIsPlaying(false);
  };

  const handlePlay = () => {
    if (step >= scenario.steps.length - 1) setStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleStep = () => {
    setIsPlaying(false);
    advance();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
  };

  return (
    <div className="viz-container">
      <Controls
        scenarios={SCENARIOS}
        activeScenario={scenarioId}
        onScenarioChange={handleScenarioChange}
        currentStep={step}
        totalSteps={scenario.steps.length}
        isPlaying={isPlaying}
        speed={speed}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={setSpeed}
      />

      <CodePanel
        lines={scenario.codeLines}
        highlightLines={state.highlightLines}
        activeSection={state.activeSection}
      />
      <EventLoopPanel state={state} />

      <div className="viz-comment">
        <span className="step-num">{step + 1}</span>
        <span>{state.comment}</span>
      </div>
    </div>
  );
}
