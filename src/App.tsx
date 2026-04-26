import { useState } from "react";
import Nav, { type Tab } from "./components/Nav";
import Chat from "./sections/Chat";
import SchedulerVisualizer from "./sections/SchedulerVisualizer";
import EventLoop from "./sections/EventLoop";
import DeferredSearch from "./sections/DeferredSearch";
import TearingDemo from "./sections/TearingDemo";
import Quiz from "./sections/Quiz";

export default function App() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <>
      <Nav active={tab} onChange={setTab} />
      {tab === "chat" && <Chat />}
      {tab === "visualizer" && <SchedulerVisualizer />}
      {tab === "eventloop" && <EventLoop />}
      {tab === "deferred" && <DeferredSearch />}
      {tab === "tearing" && <TearingDemo />}
      {tab === "quiz" && <Quiz />}
    </>
  );
}
