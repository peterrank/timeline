import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import { PIN_INTERVAL } from "../../src/timeline/timeline";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _50CustomNowLine = () => {
  const base = new LCal().initNow();
  base.setTimeZone("Europe/Berlin");

  const res = new Resource(1, "Ressource", "Ressource", false);
  const t = new Task(1, base.clone().addDay(-2), base.clone().addDay(5), 1, "Task", "Task", null);
  t.getDisplayData().setShape(PIN_INTERVAL);

  // Eigene Zeit: 3 Tage in der Zukunft
  const customTime = base.clone().addDay(3);

  return (
    <div>
      <h3>Eigene "Jetzt"-Linie (fett gestrichelt, in 3 Tagen)</h3>
      <ReactCanvasTimeline
        resources={[res]}
        tasks={[t]}
        brightBackground={true}
        nowTimeCallback={() => customTime}
        nowLinePainter={(ctx, { x, top, bottom }) => {
          ctx.strokeStyle = "#0066CC";
          ctx.lineWidth = 4;
          ctx.setLineDash([14, 8]);
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.stroke();
        }}
      />
    </div>
  );
};
