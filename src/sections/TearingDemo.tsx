import { useState, useTransition, useSyncExternalStore } from "react";

// Глобальный счётчик — обновляется вне React каждую миллисекунду
let count = 0;
const intervalId = setInterval(() => { count++; }, 1);

// Очищаем при HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => clearInterval(intervalId));
}

// Store для useSyncExternalStore
const countStore = {
  subscribe(cb: () => void) {
    const id = setInterval(cb, 1);
    return () => clearInterval(id);
  },
  getSnapshot() {
    return count;
  },
};

// "use no memo" — отключаем React Compiler, чтобы компонент честно ре-рендерился
function ExpensiveItem({ fixTearing, baseCount }: { fixTearing: boolean; baseCount: number }) {
  "use no memo";

  // С fix: useSyncExternalStore гарантирует один снимок для всех экземпляров
  // Без fix: читаем глобальную переменную напрямую — разные моменты времени
  const syncCount = useSyncExternalStore(
    countStore.subscribe,
    countStore.getSnapshot
  );

  // Блокируем поток ~80мс — имитация дорогого рендера
  const start = performance.now();
  while (performance.now() - start < 80) {
    // ждём
  }

  const displayCount = fixTearing ? syncCount : count;
  const isTorn = !fixTearing && displayCount !== baseCount;

  return (
    <div className={`expensive-item ${isTorn ? "torn" : "consistent"}`}>
      <span className="expensive-label">Expensive count is</span>
      <span className={`expensive-value ${isTorn ? "torn-value" : "ok-value"}`}>
        {displayCount}
      </span>
      {isTorn && <span className="torn-badge">разрыв</span>}
    </div>
  );
}

export default function TearingDemo() {
  const [name, setName] = useState("");
  const [fixTearing, setFixTearing] = useState(false);
  const [, startTransition] = useTransition();
  const [tearCount, setTearCount] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  // Базовое значение на момент начала рендера — для детекции разрывов
  const [baseCount, setBaseCount] = useState(count);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setName(val);
      setBaseCount(count); // базовое значение на момент начала рендера
      setRenderKey(k => k + 1);
    });
  };

  return (
    <div className="section">
      <h2>Разрыв (Tearing) и useSyncExternalStore</h2>
      <p className="subtitle">
        Введите текст быстро — React прерывает рендер чтобы обновить инпут, и 5 компонентов
        читают глобальный счётчик в разные моменты времени.
      </p>

      <div className="chat-container">
        <div className="tearing-main">
          <div className="tearing-input-row">
            <input
              className="deferred-input"
              value={name}
              onChange={handleInput}
              placeholder="Быстро печатайте сюда для провокации разрыва..."
            />
          </div>

          <div className="tearing-items" key={renderKey}>
            {Array.from({ length: 5 }, (_, i) => (
              <ExpensiveItem
                key={i}
                fixTearing={fixTearing}
                baseCount={baseCount}
              />
            ))}
          </div>
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

          <div className="tear-counter-card">
            <div className="tear-counter-label">Разрывов замечено</div>
            <div className="tear-counter-value">{tearCount}</div>
            <button className="tear-reset-btn" onClick={() => setTearCount(0)}>сбросить</button>
          </div>

          <div className="info-card">
            {fixTearing ? (
              <>
                <strong style={{ color: "var(--accent-micro)" }}>
                  useSyncExternalStore
                </strong>{" "}
                гарантирует: все 5 экземпляров получают{" "}
                <strong>один снимок</strong> значения за рендер.
                <br /><br />
                <code>getSnapshot()</code> вызывается синхронно и возвращает одно и то же
                значение для всех компонентов в этом рендере.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--accent-sync)" }}>
                  Без защиты:
                </strong>{" "}
                каждый компонент читает <code>count</code> напрямую.
                Конкурентный рендер прерывается ради ввода — и за эти ~80мс
                счётчик успевает вырасти. Числа расходятся.
                <br /><br />
                Это и есть <strong>разрыв</strong> — UI показывает несогласованное состояние.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
