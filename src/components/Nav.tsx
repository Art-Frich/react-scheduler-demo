export type Tab = "slow" | "fast" | "visualizer" | "eventloop";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "slow", label: "1. Медленный чат" },
  { id: "fast", label: "2. Быстрый чат" },
  { id: "visualizer", label: "3. Планировщик React" },
  { id: "eventloop", label: "4. Event Loop" },
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
