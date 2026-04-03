import { useEffect, useRef, useState } from "react";

export default function FpsMeter() {
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(0);
  const frames = useRef<number[]>([]);
  const rafId = useRef(0);

  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      frames.current.push(delta);
      if (frames.current.length > 30) frames.current.shift();

      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
      setFps(Math.round(1000 / avg));
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // Input latency: measure via PerformanceObserver if available
  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).processingStart) {
            const lat = (entry as any).processingStart - entry.startTime;
            setLatency(Math.round(lat));
          }
        }
      });
      obs.observe({ type: "event", buffered: false } as any);
      return () => obs.disconnect();
    } catch {
      // not supported
    }
  }, []);

  const fpsClass = fps >= 50 ? "good" : fps >= 30 ? "ok" : "bad";

  return (
    <div className="fps-meter">
      <h3>Производительность</h3>
      <div className="fps-row">
        <span className="fps-label">FPS</span>
        <span className={`fps-value ${fpsClass}`}>{fps}</span>
      </div>
      <div className="fps-row">
        <span className="fps-label">Input latency</span>
        <span className={`fps-value ${latency > 100 ? "bad" : latency > 50 ? "ok" : "good"}`}>
          {latency}ms
        </span>
      </div>
    </div>
  );
}
