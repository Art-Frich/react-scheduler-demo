import { memo, useDeferredValue, useMemo, useState } from "react";
import FpsMeter from "../components/FpsMeter";

function generateLargeListOfItems(count: number) {
  const words = ["react", "scheduler", "transition", "concurrent", "fiber",
    "lane", "hook", "render", "commit", "effect", "suspense", "memo", "ref", "context", "callback"];
  return Array.from({ length: count }, (_, i) =>
    `Item #${String(i + 1).padStart(5, "0")} — ${words[i % words.length]}`
  );
}

const ALL_ITEMS = generateLargeListOfItems(20_000);

const ItemList = memo(function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="deferred-list">
      {items.map((item, i) => (
        <li key={i} className="deferred-item">{item}</li>
      ))}
    </ul>
  );
});

export default function DeferredSearch() {
  const [filter, setFilter] = useState("");
  const [useDeferred, setUseDeferred] = useState(false);

  const deferredFilter = useDeferredValue(filter);

  const activeFilter = useDeferred ? deferredFilter : filter;

  const filteredItems = useMemo(() =>
    activeFilter === ""
      ? ALL_ITEMS
      : ALL_ITEMS.filter((item) => item.includes(activeFilter)),
    [activeFilter]
  );

  const isStale = useDeferred && filter !== deferredFilter;

  return (
    <div className="section">
      <h2>useDeferredValue</h2>
      <p className="subtitle">
        Поиск по 20 000 элементам. Включи режим и быстро напечатай несколько символов подряд.
      </p>

      <div className="chat-container">
        <div className="deferred-main">
          <div className="deferred-search-bar">
            <input
              className="deferred-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder='Быстро напечатай "react" или "fiber"...'
              autoFocus
            />
            {isStale
              ? <span className="stale-badge">обновляется...</span>
              : <span className="deferred-count">{filteredItems.length.toLocaleString()} эл.</span>
            }
          </div>

          <div className={`deferred-list-wrap ${isStale ? "stale" : ""}`}>
            <ItemList items={filteredItems} />
          </div>
        </div>

        <div className="chat-sidebar">
          <div className="toggle-card">
            <h3>Режим</h3>
            <div className="toggle-row">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useDeferred}
                  onChange={(e) => setUseDeferred(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">
                {useDeferred ? "useDeferredValue" : "Синхронный"}
              </span>
            </div>
          </div>

          <div className="hint-card">
            <div className="hint-title">Как проверить</div>
            <ol className="hint-list">
              <li>Оставь <strong>Синхронный</strong> режим</li>
              <li>Быстро напечатай <code>react</code> — список перерисовывается на <strong>каждую</strong> букву</li>
              <li>Очисти поле</li>
              <li>Включи <strong>useDeferredValue</strong></li>
              <li>Снова напечатай — список обновится <strong>один раз</strong> в конце</li>
            </ol>
            <div style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--text-dim)" }}>
              На быстром железе разница в скорости незаметна —<br />
              главное: <strong>количество рендеров</strong>, а не скорость.
            </div>
          </div>

          <FpsMeter />

          <div className="info-card">
            {useDeferred ? (
              <>
                <strong style={{ color: "var(--accent-transition)" }}>useDeferredValue</strong>{" "}
                — при быстром вводе React прерывает предыдущий transition и запускает новый.
                Список рендерится <strong>1 раз</strong> вместо N.
                <br /><br />
                Это обёртка над <code>startTransition</code> для случая когда{" "}
                <code>setState</code> снаружи твоего контроля.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--accent-sync)" }}>Синхронный</strong>{" "}
                — каждая буква вызывает полный ре-рендер <code>ItemList</code>.
                5 букв = 5 рендеров по 20к элементов.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
