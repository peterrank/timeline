import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const SHAPES = [
  { shape: 0, label: "Balken" },
  { shape: 1, label: "Schmaler Balken" },
  { shape: 2, label: "Klammer" },
  { shape: 6, label: "Wolke" },
];

const SLOT_LENGTH = 220;
const SPAN_LENGTH = 180;

const buildTestData = (pos0Line, pos0Fill, pos1Line, pos1Fill, opacity, pos0Mini, pos1Mini) => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const at = (days) => base.clone().addDay(days);

  let id = 0;

  const res = new Resource(1, "Zeitabschnitte", "Zeitabschnitte", false);
  const pos0 = { headerColor: "#C0392B", bgColor: "rgba(192,57,43,0.15)", text: "Hauptelemente" };
  const pos1 = { headerColor: "#2980B9", bgColor: "rgba(41,128,185,0.15)", text: "Nebenelemente" };
  if (pos0Mini) pos0.timelineBottom = true;
  if (pos1Mini) pos1.timelineTop = true;

  res.decorationdescriptor = JSON.stringify({ positions: { "0": pos0, "1": pos1 } });

  const tasks = [];

  const addSpan = (startDay, endDay, pos, shape, label, showLine, fillOpacity) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setColor(pos === 0 ? "#C0392B" : "#2980B9");
    t.getDisplayData().setPosition(pos);
    t.getDisplayData().setShape(shape);
    t.getDisplayData().setShowGuideLine(showLine);
    t.getDisplayData().setGuideLineFillOpacity(fillOpacity ? opacity : 0);
    tasks.push(t);
  };

  SHAPES.forEach(({ shape, label }, i) => {
    const startDay = i * SLOT_LENGTH;
    const endDay = startDay + SPAN_LENGTH;
    addSpan(startDay, endDay, 0, shape, `${label} A${i + 1}`, pos0Line, pos0Fill);
    addSpan(startDay, endDay, 1, shape, `${label} B${i + 1}`, pos1Line, pos1Fill);
  });

  return { resources: [res], tasks };
};

export const _47GuideLineFill = () => {
  const [pos0Line, setPos0Line] = useState(true);
  const [pos0Fill, setPos0Fill] = useState(true);
  const [pos1Line, setPos1Line] = useState(false);
  const [pos1Fill, setPos1Fill] = useState(true);
  const [pos0Mini, setPos0Mini] = useState(true);
  const [pos1Mini, setPos1Mini] = useState(true);
  const [opacity, setOpacity] = useState(0.25);

  const { resources, tasks } = buildTestData(pos0Line, pos0Fill, pos1Line, pos1Fill, opacity, pos0Mini, pos1Mini);

  return (
    <div>
      <h3>Füllfläche an Hilfslinien</h3>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <label><input type="checkbox" checked={pos0Line} onChange={e => setPos0Line(e.target.checked)} /> Pos1 Hilfslinie</label>
        <label><input type="checkbox" checked={pos0Fill} onChange={e => setPos0Fill(e.target.checked)} /> Pos1 Füllung</label>
        <label><input type="checkbox" checked={pos0Mini} onChange={e => setPos0Mini(e.target.checked)} /> Pos1 Mini-Timeline</label>
        <label><input type="checkbox" checked={pos1Line} onChange={e => setPos1Line(e.target.checked)} /> Pos2 Hilfslinie</label>
        <label><input type="checkbox" checked={pos1Fill} onChange={e => setPos1Fill(e.target.checked)} /> Pos2 Füllung</label>
        <label><input type="checkbox" checked={pos1Mini} onChange={e => setPos1Mini(e.target.checked)} /> Pos2 Mini-Timeline</label>
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
