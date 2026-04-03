import type { FakeMessage } from "./FakeWebSocket";

// Искусственная блокирующая задержка рендеринга (~50ms)
function heavyWork() {
  const start = performance.now();
  while (performance.now() - start < 4) {
    // блокируем main thread
  }
}

export default function HeavyMessage({ msg }: { msg: FakeMessage }) {
  heavyWork();

  return (
    <div className="message-item">
      <strong>{msg.author}:</strong> {msg.text}
    </div>
  );
}
