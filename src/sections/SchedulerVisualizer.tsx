import SchedulerScene from "../visualizer/SchedulerScene";

export default function SchedulerVisualizer() {
  return (
    <div className="section full-width">
      <h2>Как React планирует обновления</h2>
      <p className="subtitle">
        Пошаговая визуализация <code>ensureRootIsScheduled</code> из исходников
        React 19. Переключайте сценарии: Sync vs Transition.
      </p>
      <SchedulerScene />
    </div>
  );
}
