import { AnimatePresence, motion } from "framer-motion";
import type { VizState } from "./scenarioData";

interface Props {
  state: VizState;
}

const itemAnim = {
  initial: { opacity: 0, scale: 0.7, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.7, y: 8 },
};

function FlowArrow({ label, color, active }: { label: string; color: string; active?: boolean }) {
  return (
    <div className="flow-arrow-wrap">
      <svg width="100%" height="28" viewBox="0 0 200 28">
        <defs>
          <marker id={`arr-${color.replace(/[^a-z]/g, "")}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8" fill={active ? color : "var(--border)"} />
          </marker>
        </defs>
        <line
          x1="10" y1="14" x2="180" y2="14"
          stroke={active ? color : "var(--border)"}
          strokeWidth={active ? 2 : 1}
          strokeDasharray={active ? "none" : "4 4"}
          markerEnd={`url(#arr-${color.replace(/[^a-z]/g, "")})`}
        />
      </svg>
      <span className="flow-arrow-label" style={{ color: active ? color : "var(--text-dim)" }}>
        {label}
      </span>
    </div>
  );
}

function QueueBox({
  title,
  items,
  type,
  accentColor,
  glowing,
}: {
  title: string;
  items: string[];
  type: string;
  accentColor: string;
  glowing?: boolean;
}) {
  return (
    <motion.div
      className="flow-box"
      animate={{
        borderColor: glowing ? accentColor : "var(--border)",
        boxShadow: glowing ? `0 0 20px ${accentColor}33` : "none",
      }}
      transition={{ duration: 0.4 }}
    >
      <div className="flow-box-header" style={{ borderBottomColor: glowing ? accentColor : "var(--border)" }}>
        <span className="flow-box-dot" style={{ background: accentColor }} />
        <span className="flow-box-title">{title}</span>
      </div>
      <div className="flow-box-items">
        <AnimatePresence mode="popLayout">
          {items.length === 0 && (
            <motion.span key="empty" className="viz-empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}>
              пусто
            </motion.span>
          )}
          {items.map((item, i) => (
            <motion.div
              key={`${type}-${item}-${i}`}
              className={`viz-item ${type}`}
              variants={itemAnim}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {item}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function EventLoopPanel({ state }: Props) {
  const hasMicro = state.microtaskQueue.length > 0;
  const hasMacro = state.macrotaskQueue.length > 0;
  const hasStack = state.callStack.length > 0;

  return (
    <div className="flow-panel">
      {/* Row 1: Call Stack */}
      <QueueBox
        title="Call Stack"
        items={state.callStack}
        type="callstack"
        accentColor="var(--accent-purple)"
        glowing={hasStack}
      />

      {/* Arrow: stack → root schedule */}
      <FlowArrow label="добавляет root" color="var(--accent-purple)" active={state.rootSchedule.length > 0 && hasStack} />

      {/* Row 2: Root Schedule linked list */}
      <QueueBox
        title="Root Schedule (linked list)"
        items={state.rootSchedule}
        type="root"
        accentColor="var(--text)"
        glowing={state.rootSchedule.length > 0}
      />

      {/* Arrow: root → microtask */}
      <FlowArrow label="scheduleImmediateTask()" color="var(--accent-micro)" active={hasMicro} />

      {/* Row 3: Microtask Queue */}
      <QueueBox
        title="Microtask Queue"
        items={state.microtaskQueue}
        type="micro"
        accentColor="var(--accent-micro)"
        glowing={hasMicro}
      />

      {/* Fork: sync vs transition */}
      <div className="flow-fork">
        <div className="flow-fork-branch">
          <div className="flow-fork-label sync">
            Sync Lane
          </div>
          <div className="flow-fork-desc">
            flushSyncWork() — рендеринг прямо в микрозадаче
          </div>
          <motion.div
            className="flow-fork-bar"
            style={{ background: "var(--accent-sync)" }}
            animate={{ width: `${state.laneSyncFill}%`, opacity: state.laneSyncFill > 0 ? 1 : 0.2 }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flow-fork-or">или</div>
        <div className="flow-fork-branch">
          <div className="flow-fork-label transition">
            Transition Lane
          </div>
          <div className="flow-fork-desc">
            scheduleCallback() → Macrotask Queue
          </div>
          <motion.div
            className="flow-fork-bar"
            style={{ background: "var(--accent-transition)" }}
            animate={{ width: `${state.laneTransitionFill}%`, opacity: state.laneTransitionFill > 0 ? 1 : 0.2 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Row 4: Macrotask Queue */}
      <QueueBox
        title="Macrotask Queue (via MessageChannel)"
        items={state.macrotaskQueue}
        type="macro"
        accentColor="var(--accent-macro)"
        glowing={hasMacro}
      />

      {/* Flag + paint indicator */}
      <div className="flow-bottom-row">
        <div className="flag-row">
          <span className={`flag-dot ${state.flagSync ? "on" : ""}`} />
          <span className="flag-name">mightHavePendingSyncWork</span>
        </div>
        <motion.div
          className="paint-indicator"
          animate={{
            opacity: state.paintReady ? 1 : 0.2,
            scale: state.paintReady ? 1 : 0.95,
          }}
          transition={{ duration: 0.3 }}
        >
          {state.paintReady ? "Браузер может рисовать!" : "Браузер ждёт..."}
        </motion.div>
      </div>
    </div>
  );
}
