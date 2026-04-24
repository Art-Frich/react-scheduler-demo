export type Tab = "slow" | "fast" | "visualizer" | "eventloop" | "deferred" | "tearing" | "quiz";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "slow", label: "1. Медленный чат" },
  { id: "fast", label: "2. Быстрый чат" },
  { id: "visualizer", label: "3. Планировщик React" },
  { id: "eventloop", label: "4. Event Loop" },
  { id: "deferred", label: "5. useDeferredValue" },
  { id: "tearing", label: "6. Разрыв (Tearing)" },
  { id: "quiz", label: "7. Проверь себя" },
];

export default function Nav({ active, onChange }: Props) {
  return (
    <nav className="nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={active === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
