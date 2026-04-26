import { useEffect, useRef, useState, useTransition } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import FpsMeter from "../components/FpsMeter";
import { startFakeStream, type FakeMessage } from "../components/FakeWebSocket";

let ownId = -1;

export default function FastChat() {
  const [messages, setMessages] = useState<FakeMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [useTransitionMode, setUseTransitionMode] = useState(true);
  const [isPending, startTransition] = useTransition();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!streaming) return;
    stopRef.current?.();
    stopRef.current = startFakeStream((msg) => {
      if (useTransitionMode) {
        startTransition(() => {
          setMessages((prev) => [...prev, msg]);
        });
      } else {
        setMessages((prev) => [...prev, msg]);
      }
    }, 200);
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [streaming, useTransitionMode]);

  const toggleStream = () => setStreaming((s) => !s);

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: ownId--, author: "Вы", text, timestamp: Date.now() },
    ]);
  };

  return (
    <div className="section">
      <h2>Быстрый чат</h2>
      <p className="subtitle">
        Переключайте режим и сравнивайте. С <code>useTransition</code> ввод
        остаётся отзывчивым даже при потоке сообщений.
      </p>

      <div className="chat-container">
        <div className="chat-main">
          <MessageList messages={messages} isPending={isPending} />
          <MessageInput onSend={handleSend} />
        </div>

        <div className="chat-sidebar">
          <div className="stream-card">
            <h3>Поток сообщений</h3>
            <button
              className={`stream-btn ${streaming ? "active" : ""}`}
              onClick={toggleStream}
            >
              {streaming ? "Остановить поток" : "Запустить поток"}
            </button>
          </div>

          <div className="toggle-card">
            <h3>Режим обновления</h3>
            <div className="toggle-row">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useTransitionMode}
                  onChange={(e) => setUseTransitionMode(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">
                {useTransitionMode ? "startTransition" : "Синхронный"}
              </span>
            </div>
          </div>

          <FpsMeter />

          <div className="info-card">
            {useTransitionMode ? (
              <>
                <strong style={{ color: "var(--accent-transition)" }}>
                  startTransition
                </strong>{" "}
                оборачивает <code>setMessages</code> — React откладывает
                рендеринг списка, давая приоритет вводу пользователя.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--accent-sync)" }}>
                  Синхронный режим
                </strong>{" "}
                — обновления рендерятся немедленно, блокируя main thread и
                замедляя ввод.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
