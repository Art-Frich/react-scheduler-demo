import { useEffect, useRef, useState } from "react";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import FpsMeter from "../components/FpsMeter";
import { startFakeStream, type FakeMessage } from "../components/FakeWebSocket";

let ownId = -1;

export default function SlowChat() {
  const [messages, setMessages] = useState<FakeMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => stopRef.current?.();
  }, []);

  const toggleStream = () => {
    if (streaming) {
      stopRef.current?.();
      stopRef.current = null;
      setStreaming(false);
    } else {
      stopRef.current = startFakeStream((msg) => {
        // Синхронное обновление — блокирует UI
        setMessages((prev) => [...prev, msg]);
      }, 200);
      setStreaming(true);
    }
  };

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: ownId--, author: "Вы", text, timestamp: Date.now() },
    ]);
  };

  return (
    <div className="section">
      <h2>Медленный чат</h2>
      <p className="subtitle">
        Входящие сообщения рендерятся синхронно. Включите поток и попробуйте
        печатать — ввод будет лагать.
      </p>

      <div className="chat-container">
        <div className="chat-main">
          <MessageList messages={messages} />
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

          <FpsMeter />

          <div className="info-card">
            Каждое сообщение содержит искусственную задержку рендеринга (~4мс).
            При потоке 5 сообщений/сек это суммируется и блокирует ввод.
          </div>
        </div>
      </div>
    </div>
  );
}
