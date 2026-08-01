import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const buildTestData = () => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const at = (days) => base.clone().addDay(days);

  let id = 0;

  const res = new Resource(1, "Zeitabschnitte", "Zeitabschnitte", false);
  res.decorationdescriptor = JSON.stringify({
    positions: {
      "0": {
        headerColor: "#C0392B",
        bgColor: "rgba(192,57,43,0.15)",
        text: "Hauptelemente",
        timelineBottom: true,
      },
      "1": {
        headerColor: "#2980B9",
        bgColor: "rgba(41,128,185,0.15)",
        text: "Nebenelemente",
        timelineTop: true,
      },
    }
  });

  const tasks = [];

  const addSpan = (startDay, endDay, pos, label, barGroup) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setColor(pos === 0 ? "#C0392B" : "#2980B9");
    t.getDisplayData().setPosition(pos);
    t.getDisplayData().setShape(1);
    if (barGroup) t.getDisplayData().setBarGroup(barGroup);
    tasks.push(t);
  };

  // Position 0 – Hauptelemente (unten), Mini-Timeline unten
  addSpan(  0, 200, 0, "Hauptelement A1");
  addSpan(150, 350, 0, "Hauptelement A2");
  addSpan(300, 500, 0, "Hauptelement A3");

  // Position 1 – Nebenelemente (oben), Mini-Timeline oben
  addSpan( 50, 250, 1, "Nebenelement B1");
  addSpan(200, 400, 1, "Nebenelement B2");
  addSpan(350, 550, 1, "Nebenelement B3");

  return { resources: [res], tasks };
};

export const _44PositionTimeline = () => {
  const { resources, tasks } = buildTestData();

  return (
    <div>
      <h3>Mini-Timeline an Position</h3>
      <p>
        Position 0 (Hauptelemente) hat <code>timelineBottom: true</code>,
        Position 1 (Nebenelemente) hat <code>timelineTop: true</code>.
        Jede Mini-Timeline ist mit der Haupttimeline synchronisiert.
      </p>
      <ReactCanvasTimeline
        resources={resources}
        tasks={tasks}
        paintShadows={true}
        brightBackground={true}
      />
    </div>
  );
};
