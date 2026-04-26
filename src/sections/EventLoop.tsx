import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskTemplate {
  label: string;
  spawnMicro?: TaskTemplate[];
  spawnMacro?: TaskTemplate[];
  spawnStack?: TaskTemplate[];
  logColor?: string;
  logNote?: string;
}

interface Task extends TaskTemplate {
  id: number;
}

interface LogEntry {
  id: number;
  text: string;
  color: string;
}

type Phase = "idle" | "executing" | "checking-micro" | "micro-drain" | "checking-macro" | "paint";

const PHASE_LABELS: Record<Phase, string> = {
  idle: "Ожидание",
  executing: "Выполнение кода",
  "checking-micro": "Проверка микрозадач",
  "micro-drain": "Выполнение микрозадач",
  "checking-macro": "Выбор макрозадачи",
  paint: "Отрисовка (paint)",
};

let nextId = 1;
const nid = () => nextId++;

function materialize(t: TaskTemplate): Task {
  return { ...t, id: nid() };
}

function buildSyncScenario(): { stack: Task[]; micro: Task[]; macro: Task[] } {
  return {
    stack: [
      materialize({
        label: "onClick()",
        spawnStack: [{
          label: "setState()",
          spawnStack: [{
            label: "ensureRootIsScheduled()",
            logNote: "Добавляет root в расписание, планирует микрозадачу",
            spawnMicro: [{
              label: "processRootSchedule",
              logNote: "Микрозадача — здесь React решает куда поставить работу",
              spawnStack: [{
                label: "scheduleTaskForRoot()",
                logNote: "lane = SyncLane → рендер прямо сейчас!",
                spawnStack: [{
                  label: "flushSyncWork()",
                  logNote: "React рендерит СИНХРОННО. Main thread заблокирован!",
                  logColor: "var(--accent-sync)",
                  spawnStack: [{
                    label: "renderRoot() + commitRoot()",
                    logNote: "DOM обновлён. Всё это ДО paint — UI был заморожен.",
                    logColor: "var(--accent-sync)",
                  }],
                }],
              }],
            }],
          }],
        }],
      }),
    ],
    micro: [],
    macro: [
      materialize({
        label: "setTimeout callback",
        logNote: "Обычная макрозадача — выполнится после paint",
      }),
    ],
  };
}

function buildTransitionScenario(): { stack: Task[]; micro: Task[]; macro: Task[] } {
  return {
    stack: [
      materialize({
        label: "onMessage()",
        spawnStack: [{
          label: "startTransition()",
          logNote: "Помечает обновление как TransitionLane",
          spawnStack: [{
            label: "setState()",
            spawnStack: [{
              label: "ensureRootIsScheduled()",
              logNote: "Тот же путь — добавляет root, планирует микрозадачу",
              spawnMicro: [{
                label: "processRootSchedule",
                logNote: "Микрозадача — определяем lane...",
                spawnStack: [{
                  label: "scheduleTaskForRoot()",
                  logNote: "lane = TransitionLane (НЕ Sync!) → scheduleCallback()",
                  logColor: "var(--accent-transition)",
                  spawnMacro: [{
                    label: "Scheduler: performWork",
                    logNote: "Через MessageChannel → макрозадача! Рендер ПОСЛЕ paint",
                    logColor: "var(--accent-transition)",
                    spawnStack: [{
                      label: "renderRootConcurrent()",
                      logNote: "React рендерит в фоне. Может прерваться (time slicing).",
                      logColor: "var(--accent-transition)",
                    }],
                  }],
                }],
              }],
            }],
          }],
        }],
      }),
    ],
    micro: [],
    macro: [],
  };
}

export default function EventLoop() {
  const stackRef = useRef<Task[]>([]);
  const microRef = useRef<Task[]>([]);
  const macroRef = useRef<Task[]>([]);

  const [stackView, setStackView] = useState<Task[]>([]);
  const [microView, setMicroView] = useState<Task[]>([]);
  const [macroView, setMacroView] = useState<Task[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const abortRef = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  const sync = () => {
    setStackView([...stackRef.current]);
    setMicroView([...microRef.current]);
    setMacroView([...macroRef.current]);
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const tid = setTimeout(resolve, ms / speedRef.current);
      const check = setInterval(() => {
        if (abortRef.current) { clearTimeout(tid); clearInterval(check); resolve(); }
      }, 50);
    });

  const addLog = (text: string, color = "var(--text-dim)") => {
    setLog((prev) => [...prev, { id: nid(), text, color }]);
  };

  const executeTask = async (task: Task, source: string) => {
    const color = task.logColor || (
      source === "stack" ? "var(--accent-purple)" :
      source === "micro" ? "var(--accent-micro)" :
      "var(--accent-macro)"
    );
    addLog(`  ${task.label}`, color);
    if (task.logNote) {
      addLog(`    ↳ ${task.logNote}`, "var(--text-dim)");
    }

    if (task.spawnMicro?.length) {
      for (const t of task.spawnMicro) {
        await wait(300);
        addLog(`    → микрозадача: ${t.label}`, "var(--accent-micro)");
        microRef.current = [...microRef.current, materialize(t)];
        sync();
      }
    }
    if (task.spawnMacro?.length) {
      for (const t of task.spawnMacro) {
        await wait(300);
        addLog(`    → макрозадача: ${t.label}`, "var(--accent-macro)");
        macroRef.current = [...macroRef.current, materialize(t)];
        sync();
      }
    }
    if (task.spawnStack?.length) {
      for (const t of task.spawnStack) {
        await wait(200);
        const newTask = materialize(t);
        stackRef.current = [...stackRef.current, newTask];
        sync();
      }
    }

    await wait(400);
  };

  const runCycle = async () => {
    if (isRunning) return;
    setIsRunning(true);
    abortRef.current = false;

    setPhase("executing");
    addLog("▸ Выполняем Call Stack", "var(--accent-purple)");
    await wait(500);

    while (stackRef.current.length > 0 && !abortRef.current) {
      const frame = stackRef.current[stackRef.current.length - 1];
      stackRef.current = stackRef.current.slice(0, -1);
      sync();
      await executeTask(frame, "stack");
    }

    if (abortRef.current) { setIsRunning(false); return; }

    setPhase("checking-micro");
    addLog("▸ Проверяем Microtask Queue...", "var(--accent-micro)");
    await wait(400);

    if (microRef.current.length > 0) {
      setPhase("micro-drain");
      while (microRef.current.length > 0 && !abortRef.current) {
        const task = microRef.current[0];
        microRef.current = microRef.current.slice(1);
        sync();
        stackRef.current = [materialize({ label: task.label })];
        sync();
        await executeTask(task, "micro");
        stackRef.current = [];
        sync();

        while (stackRef.current.length > 0 && !abortRef.current) {
          const f = stackRef.current[stackRef.current.length - 1];
          stackRef.current = stackRef.current.slice(0, -1);
          sync();
          await executeTask(f, "stack");
        }

        await wait(200);
      }
    } else {
      addLog("  Microtask Queue пуста", "var(--text-dim)");
    }

    if (abortRef.current) { setIsRunning(false); return; }

    setPhase("paint");
    addLog("▸ Браузер рисует кадр (rAF → paint → composite)", "var(--accent-transition)");
    addLog("  UI обновлён, пользователь видит изменения", "var(--text-dim)");
    await wait(700);

    if (abortRef.current) { setIsRunning(false); return; }

    setPhase("checking-macro");
    if (macroRef.current.length > 0) {
      addLog("▸ Берём макрозадачу из очереди", "var(--accent-macro)");
      await wait(400);

      const task = macroRef.current[0];
      macroRef.current = macroRef.current.slice(1);
      sync();
      stackRef.current = [materialize({ label: task.label })];
      sync();
      await executeTask(task, "macro");
      stackRef.current = [];
      sync();

      while (stackRef.current.length > 0 && !abortRef.current) {
        const f = stackRef.current[stackRef.current.length - 1];
        stackRef.current = stackRef.current.slice(0, -1);
        sync();
        await executeTask(f, "stack");
      }

      if (microRef.current.length > 0 && !abortRef.current) {
        setPhase("micro-drain");
        addLog("▸ После макрозадачи — проверяем микрозадачи", "var(--accent-micro)");
        while (microRef.current.length > 0 && !abortRef.current) {
          const t = microRef.current[0];
          microRef.current = microRef.current.slice(1);
          sync();
          stackRef.current = [materialize({ label: t.label })];
          sync();
          await executeTask(t, "micro");
          stackRef.current = [];
          sync();
          while (stackRef.current.length > 0 && !abortRef.current) {
            const f = stackRef.current[stackRef.current.length - 1];
            stackRef.current = stackRef.current.slice(0, -1);
            sync();
            await executeTask(f, "stack");
          }
          await wait(200);
        }
      }
    } else {
      addLog("▸ Macrotask Queue пуста", "var(--text-dim)");
      await wait(300);
    }

    if (macroRef.current.length > 0) {
      addLog("", "var(--border)");
      addLog("  Ещё есть макрозадачи — нужен следующий цикл event loop", "var(--text-dim)");
    }

    setPhase("idle");
    addLog("─────────────────────────────", "var(--border)");
    setIsRunning(false);
  };

  const pushStack = (label: string) => {
    stackRef.current = [...stackRef.current, { id: nid(), label }];
    sync();
  };
  const addMicrotask = (label: string) => {
    microRef.current = [...microRef.current, { id: nid(), label }];
    sync();
  };
  const addMacrotask = (label: string) => {
    macroRef.current = [...macroRef.current, { id: nid(), label }];
    sync();
  };

  const loadScenario = (builder: () => { stack: Task[]; micro: Task[]; macro: Task[] }, name: string) => {
    const s = builder();
    stackRef.current = s.stack;
    microRef.current = s.micro;
    macroRef.current = s.macro;
    sync();
    setLog([]);
    addLog(`Загружен сценарий: ${name}`, "var(--accent-transition)");
    addLog("Нажмите ▶ Запустить цикл", "var(--text-dim)");
  };

  const reset = () => {
    abortRef.current = true;
    setTimeout(() => {
      stackRef.current = [];
      microRef.current = [];
      macroRef.current = [];
      sync();
      setLog([]);
      setPhase("idle");
      setIsRunning(false);
      abortRef.current = false;
    }, 100);
  };

  return (
    <div className="section">
      <h2>Event Loop</h2>
      <p className="subtitle">
        Визуализация цикла событий браузера. Задачи порождают новые задачи — видна цепочка причин и следствий.
      </p>

      <div className="el-layout">
        <div className="el-diagram">
          <div className="el-box el-callstack">
            <h4>Call Stack</h4>
            <div className="el-stack-items">
              <AnimatePresence mode="popLayout">
                {stackView.length === 0 && (
                  <motion.div key="empty" className="el-empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}>
                    пусто
                  </motion.div>
                )}
                {stackView.map((f) => (
                  <motion.div
                    key={f.id}
                    className="el-stack-frame"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    {f.label}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="el-loop-ring">
            <svg viewBox="0 0 200 200" className="el-ring-svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
              <circle
                cx="100" cy="100" r="80" fill="none"
                strokeWidth="4"
                stroke={
                  phase === "executing" ? "var(--accent-purple)" :
                  phase === "checking-micro" || phase === "micro-drain" ? "var(--accent-micro)" :
                  phase === "paint" ? "var(--accent-transition)" :
                  phase === "checking-macro" ? "var(--accent-macro)" :
                  "transparent"
                }
                strokeDasharray="83 420"
                strokeDashoffset={
                  phase === "executing" ? "0" :
                  phase === "checking-micro" || phase === "micro-drain" ? "-100" :
                  phase === "paint" ? "-200" :
                  phase === "checking-macro" ? "-300" :
                  "0"
                }
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s, stroke 0.3s" }}
              />
              <text x="100" y="12" textAnchor="middle" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-sans)">execute</text>
              <text x="190" y="104" textAnchor="start" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-sans)">micro</text>
              <text x="100" y="196" textAnchor="middle" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-sans)">paint</text>
              <text x="10" y="104" textAnchor="end" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-sans)">macro</text>
              <text x="100" y="96" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">Event</text>
              <text x="100" y="112" textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="var(--font-sans)">Loop</text>
            </svg>
            <div className="el-ring-label">{PHASE_LABELS[phase]}</div>
          </div>

          <div className="el-box el-micro">
            <h4>Microtask Queue</h4>
            <div className="el-queue-items">
              <AnimatePresence mode="popLayout">
                {microView.length === 0 && (
                  <motion.div key="empty" className="el-empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}>пусто</motion.div>
                )}
                {microView.map((t) => (
                  <motion.div key={t.id} className="el-queue-item micro" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} layout>{t.label}</motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="el-box el-macro">
            <h4>Macrotask Queue</h4>
            <div className="el-queue-items">
              <AnimatePresence mode="popLayout">
                {macroView.length === 0 && (
                  <motion.div key="empty" className="el-empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}>пусто</motion.div>
                )}
                {macroView.map((t) => (
                  <motion.div key={t.id} className="el-queue-item macro" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} layout>{t.label}</motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="el-sidebar">
          <div className="el-controls-card">
            <h4>Управление</h4>
            <div className="el-btn-group">
              <button className={`el-btn primary ${isRunning ? "disabled" : ""}`} onClick={runCycle} disabled={isRunning}>▶ Запустить цикл</button>
              <button className="el-btn" onClick={reset}>↺ Сброс</button>
            </div>
            <div className="el-speed-row">
              <span>Скорость:</span>
              <select className="speed-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
            <h4 style={{ marginTop: 12 }}>Добавить вручную</h4>
            <div className="el-btn-group">
              <button className="el-btn" onClick={() => pushStack("myFunction()")}>+ Call Stack</button>
              <button className="el-btn micro-btn" onClick={() => addMicrotask("Promise.then")}>+ Микрозадача</button>
              <button className="el-btn macro-btn" onClick={() => addMacrotask("setTimeout cb")}>+ Макрозадача</button>
            </div>
            <h4 style={{ marginTop: 12 }}>Сценарии React</h4>
            <div className="el-btn-group">
              <button className="el-btn" onClick={() => loadScenario(buildSyncScenario, "React: синхронный setState")}>
                Sync setState
              </button>
              <button className="el-btn" onClick={() => loadScenario(buildTransitionScenario, "React: startTransition")}>
                startTransition
              </button>
            </div>
          </div>
          <div className="el-log-card">
            <h4>Лог выполнения</h4>
            <div className="el-log">
              {log.map((entry) => (
                <div key={entry.id} className="el-log-line" style={{ color: entry.color }}>{entry.text}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
