import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const COLOR_OPTIONS = [
  { label: "keine", value: "" },
  { label: "Blau", value: "#2980B9" },
  { label: "Lila", value: "#8E44AD" },
  { label: "Grün", value: "#27AE60" },
  { label: "Rot", value: "#E74C3C" },
];

const buildTestData = (opacity, colorA, colorB) => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const at = (days) => base.clone().addDay(days);

  let id = 0;

  const res = new Resource(1, "Zeitabschnitte", "Zeitabschnitte", false);
  const groupDesc = (bgColor, bgImage) => {
    const desc = { bgImage, bgImageOpacity: opacity };
    if (bgColor) desc.bgColor = bgColor;
    return desc;
  };
  res.decorationdescriptor = JSON.stringify({
    barGroups: {
      "Gruppe A": groupDesc(colorA, "./freiheitsstatue.png"),
      "Gruppe B": groupDesc(colorB, "./logo192.png"),
    }
  });

  const tasks = [];

  const addSpan = (startDay, endDay, group, color, label) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setColor(color);
    t.getDisplayData().setShape(1);
    t.getDisplayData().setBarGroup(group);
    tasks.push(t);
  };

  addSpan(  0, 200, "Gruppe A", "#C0392B", "A1");
  addSpan(150, 350, "Gruppe A", "#C0392B", "A2");
  addSpan(300, 500, "Gruppe A", "#C0392B", "A3");

  addSpan( 50, 250, "Gruppe B", "#2980B9", "B1");
  addSpan(200, 400, "Gruppe B", "#2980B9", "B2");
  addSpan(350, 550, "Gruppe B", "#2980B9", "B3");

  return { resources: [res], tasks };
};

export const _46BarGroupBackgroundImage = () => {
  const [opacity, setOpacity] = useState(0.6);
  const [colorA, setColorA] = useState("#2980B9");
  const [colorB, setColorB] = useState("#8E44AD");

  const { resources, tasks } = buildTestData(opacity, colorA, colorB);

  return (
    <div>
      <h3>Hintergrundfarbe und -bild an BarGroup</h3>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <label>
          Deckkraft ({opacity.toFixed(2)}):{' '}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={e => setOpacity(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Farbe Gruppe A:{' '}
          <select value={colorA} onChange={e => setColorA(e.target.value)}>
            {COLOR_OPTIONS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Farbe Gruppe B:{' '}
          <select value={colorB} onChange={e => setColorB(e.target.value)}>
            {COLOR_OPTIONS.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
          </select>
        </label>
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
