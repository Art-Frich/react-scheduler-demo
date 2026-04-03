import { useState } from "react";
import Nav, { type Tab } from "./components/Nav";
import SlowChat from "./sections/SlowChat";
import FastChat from "./sections/FastChat";
import SchedulerVisualizer from "./sections/SchedulerVisualizer";
import EventLoop from "./sections/EventLoop";

export default function App() {
  const [tab, setTab] = useState<Tab>("slow");

  return (
    <>
      <Nav active={tab} onChange={setTab} />
      {tab === "slow" && <SlowChat />}
      {tab === "fast" && <FastChat />}
      {tab === "visualizer" && <SchedulerVisualizer />}
      {tab === "eventloop" && <EventLoop />}
    </>
  );
}
