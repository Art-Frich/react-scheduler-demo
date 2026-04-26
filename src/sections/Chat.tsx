import { useEffect, useRef, useState, useTransition } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import FpsMeter from "../components/FpsMeter";
import { startFakeStream, type FakeMessage } from "../components/FakeWebSocket";

let ownId = -1;

export default function Chat() {
  const [messages, setMessages] = useState<FakeMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [useTransitionMode, setUseTransitionMode] = useState(false);
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
    }, 150);
    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [streaming, useTransitionMode]);

  const toggleStream = () => setStreaming((s) => !s);

  const reset = () => {
    setMessages([]);
    setStreaming(false);
    stopRef.current?.();
    stopRef.current = null;
  };

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: ownId--, author: "Вы", text, timestamp: Date.now() },
    ]);
  };

  return (
    <div className="section">
      <h2>Чат с потоком сообщений</h2>
      <p className="subtitle">
        Поток входящих сообщений + поле ввода. Включи поток, попробуй печатать в обоих режимах.
        Чем больше сообщений накопится — тем заметнее разница.
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
            <div className="stream-stats">{messages.length} сообщений</div>
            {messages.length > 0 && (
              <button className="tear-reset-btn" onClick={reset}>очистить</button>
            )}
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
                оборачивает <code>setMessages</code> — рендер списка попадает в
                Transition Lane, ввод и FPS остаются плавными.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--accent-sync)" }}>
                  Синхронный режим
                </strong>{" "}
                — каждое входящее сообщение блокирует main thread. Чем больше сообщений в
                списке, тем дольше ре-рендер и тем сильнее лагает ввод.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
