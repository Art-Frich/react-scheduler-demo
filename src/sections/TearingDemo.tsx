import { useState, useTransition, useSyncExternalStore } from "react";

let count = 0;
const intervalId = setInterval(() => count++, 1);

if (import.meta.hot) {
  import.meta.hot.dispose(() => clearInterval(intervalId));
}

const store = {
  subscribe() {
    return () => {};
  },
  getSnapshot() {
    return count;
  },
};

const ExpensiveComponent = () => {
  const now = performance.now();
  while (performance.now() - now < 100);
  return <>Expensive count is {count}</>;
};

const ExpensiveComponentFixed = () => {
  const consistentCount = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );
  const now = performance.now();
  while (performance.now() - now < 100);
  return <>Expensive count is {consistentCount}</>;
};

export default function TearingDemo() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [fixTearing, setFixTearing] = useState(false);

  const updateName = (newVal: string) => {
    startTransition(() => {
      setName(newVal);
    });
  };

  const Item = fixTearing ? ExpensiveComponentFixed : ExpensiveComponent;

  return (
    <div className="section">
      <h2>Разрыв (Tearing)</h2>
      <p className="subtitle">
        Пример один в один из книги. Печатай в поле — должны появляться разные значения count
        в экземплярах ExpensiveComponent (иногда, не всегда).
      </p>

      <div className="chat-container">
        <div className="tearing-main">
          <div className="tearing-input-row">
            <input
              className="deferred-input"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Печатай..."
            />
            {isPending && <span className="stale-badge">Loading...</span>}
          </div>

          <ul className="tearing-items" style={{ listStyle: "none", padding: 0 }}>
            <li className="expensive-item-v2"><Item /></li>
            <li className="expensive-item-v2"><Item /></li>
            <li className="expensive-item-v2"><Item /></li>
            <li className="expensive-item-v2"><Item /></li>
            <li className="expensive-item-v2"><Item /></li>
          </ul>
        </div>

        <div className="chat-sidebar">
          <div className="toggle-card">
            <h3>Режим</h3>
            <div className="toggle-row">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={fixTearing}
                  onChange={(e) => setFixTearing(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">
                {fixTearing ? "useSyncExternalStore" : "Без защиты"}
              </span>
            </div>
          </div>

          <div className="hint-card">
            <div className="hint-title">Цитата из книги</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontStyle: "italic", lineHeight: 1.6 }}>
              «Мы ожидаем увидеть несогласованные значения count... React «останавливает» рендеринг
              при вводе пользователем данных... оставляя устаревшее значение count.
              <strong style={{ color: "var(--text)", fontStyle: "normal" }}> Но не каждый раз, только иногда.</strong>»
              <div style={{ marginTop: 6, color: "var(--text-dim)" }}>— стр. 249</div>
            </div>
          </div>

          <div className="info-card">
            {fixTearing ? (
              <>
                <strong style={{ color: "var(--accent-micro)" }}>useSyncExternalStore</strong>{" "}
                гарантирует одинаковое значение <code>count</code> во всех экземплярах за один рендер.
                <br /><br />
                Разрыв устранён — числа всегда синхронны.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--accent-sync)" }}>Без защиты:</strong>{" "}
                каждый <code>ExpensiveComponent</code> читает глобальный <code>count</code> в момент
                своего рендера. React может прервать рендер ради ввода — и после возобновления
                следующие компоненты увидят уже новый <code>count</code>.
                <br /><br />
                Разрыв проявляется не стабильно — нужно печатать, чтобы спровоцировать прерывания.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
