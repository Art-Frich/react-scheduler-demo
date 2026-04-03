import { useEffect, useRef } from "react";
import type { FakeMessage } from "./FakeWebSocket";
import HeavyMessage from "./HeavyMessage";

interface Props {
  messages: FakeMessage[];
  isPending?: boolean;
}

export default function MessageList({ messages, isPending }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  return (
    <>
      {isPending && <div className="pending-bar" />}
      <div className="message-list">
        {messages.map((msg) => (
          <HeavyMessage key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </>
  );
}
