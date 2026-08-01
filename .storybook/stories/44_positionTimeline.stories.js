import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const buildTestData = (pos0top, pos0bottom, pos1top, pos1bottom) => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const at = (days) => base.clone().addDay(days);

  let id = 0;

  const res = new Resource(1, "Zeitabschnitte", "Zeitabschnitte", false);
  const pos0 = { headerColor: "#C0392B", bgColor: "rgba(192,57,43,0.15)", text: "Hauptelemente" };
  const pos1 = { headerColor: "#2980B9", bgColor: "rgba(41,128,185,0.15)", text: "Nebenelemente" };
  if (pos0top)    pos0.timelineTop    = true;
  if (pos0bottom) pos0.timelineBottom = true;
  if (pos1top)    pos1.timelineTop    = true;
  if (pos1bottom) pos1.timelineBottom = true;

  res.decorationdescriptor = JSON.stringify({ positions: { "0": pos0, "1": pos1 } });

  const tasks = [];

  const addSpan = (startDay, endDay, pos, label) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setColor(pos === 0 ? "#C0392B" : "#2980B9");
    t.getDisplayData().setPosition(pos);
    t.getDisplayData().setShape(1);
    t.getDisplayData().setShowGuideLine(true);
    tasks.push(t);
  };

  addSpan(  0, 200, 0, "Hauptelement A1");
  addSpan(150, 350, 0, "Hauptelement A2");
  addSpan(300, 500, 0, "Hauptelement A3");

  addSpan( 50, 250, 1, "Nebenelement B1");
  addSpan(200, 400, 1, "Nebenelement B2");
  addSpan(350, 550, 1, "Nebenelement B3");

  return { resources: [res], tasks };
};

export const _44PositionTimeline = () => {
  const [pos0top,    setPos0top]    = useState(false);
  const [pos0bottom, setPos0bottom] = useState(true);
  const [pos1top,    setPos1top]    = useState(true);
  const [pos1bottom, setPos1bottom] = useState(false);

  const { resources, tasks } = buildTestData(pos0top, pos0bottom, pos1top, pos1bottom);

  return (
    <div>
      <h3>Mini-Timeline an Position</h3>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <label><input type="checkbox" checked={pos0top}    onChange={e => setPos0top(e.target.checked)}    /> Pos1 oben</label>
        <label><input type="checkbox" checked={pos0bottom} onChange={e => setPos0bottom(e.target.checked)} /> Pos1 unten</label>
        <label><input type="checkbox" checked={pos1top}    onChange={e => setPos1top(e.target.checked)}    /> Pos2 oben</label>
        <label><input type="checkbox" checked={pos1bottom} onChange={e => setPos1bottom(e.target.checked)} /> Pos2 unten</label>
      </div>
      <ReactCanvasTimeline
        resources={resources}
        tasks={tasks}
        paintShadows={true}
        brightBackground={true}
      />
    </div>
  );
};
