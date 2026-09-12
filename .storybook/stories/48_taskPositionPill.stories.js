import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import { PIN_INTERVAL, STAR, CIRCLE, CLOUD, SPEECHBUBBLE, CROSS, ARROW_LEFT } from "../../src/timeline/timeline";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const buildTestData = () => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const at = (days) => base.clone().addDay(days);

  let id = 0;

  const res = new Resource(1, "Ressource", "Ressource", false);

  const tasks = [];

  const addTask = (startDay, endDay, position, shape, label) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setShape(shape);
    t.getDisplayData().setPosition(position);
    tasks.push(t);
  };

  addTask(  0, 150, 0,   PIN_INTERVAL,  "Pin");
  addTask(100, 250, 1,   STAR,          "Stern");
  addTask(200, 350, 2,   CIRCLE,        "Kreis");
  addTask(300, 450, 3,   CLOUD,         "Wolke");
  addTask(400, 550, 12,  SPEECHBUBBLE,  "Sprechblase, Position 12");
  addTask(500, 650, -1,  CROSS,         "Kreuz, Position -1");
  addTask(600, 750, -12, ARROW_LEFT,    "Pfeil, Position -12");

  return { resources: [res], tasks };
};

export const _48TaskPositionPill = () => {
  const [showTaskPositionPill, setShowTaskPositionPill] = useState(true);

  const { resources, tasks } = buildTestData();

  return (
    <div>
      <h3>Position-Pille an Tasks</h3>
      <div style={{ marginBottom: '12px' }}>
        <label>
          <input
            type="checkbox"
            checked={showTaskPositionPill}
            onChange={e => setShowTaskPositionPill(e.target.checked)}
          /> showTaskPositionPill
        </label>
      </div>
      <ReactCanvasTimeline
        resources={resources}
        tasks={tasks}
        showTaskPositionPill={showTaskPositionPill}
        brightBackground={true}
      />
    </div>
  );
};
