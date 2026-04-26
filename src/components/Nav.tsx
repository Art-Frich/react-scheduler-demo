export type Tab = "chat" | "visualizer" | "eventloop" | "deferred" | "tearing" | "quiz";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "1. Чат: useTransition" },
  { id: "visualizer", label: "2. Планировщик React" },
  { id: "eventloop", label: "3. Event Loop" },
  { id: "deferred", label: "4. useDeferredValue" },
  { id: "tearing", label: "5. Разрыв (Tearing)" },
  { id: "quiz", label: "6. Проверь себя" },
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
