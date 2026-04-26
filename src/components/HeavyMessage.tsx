import type { FakeMessage } from "./FakeWebSocket";

function heavyWork() {
  const start = performance.now();
  while (performance.now() - start < 4);
}

export default function HeavyMessage({ msg }: { msg: FakeMessage }) {
  heavyWork();

  return (
    <div className="message-item">
      <strong>{msg.author}:</strong> {msg.text}
    </div>
  );
}
