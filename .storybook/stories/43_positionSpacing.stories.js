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

  // Eine einzige Ressource mit Farbdekoration für 3 Positionen
  const res = new Resource(1, "Zeitabschnitte", "Zeitabschnitte", false);
  res.decorationdescriptor = JSON.stringify({
    positions: {
      "0": { headerColor: "#C0392B", bgColor: "rgba(192,57,43,0.15)",  text: "Frühzeit"      },
      "1": { headerColor: "#2980B9", bgColor: "rgba(41,128,185,0.15)", text: "Mittlere Zeit" },
      "2": { headerColor: "#27AE60", bgColor: "rgba(39,174,96,0.15)",  text: "Spätzeit"      },
    }
  });

  const tasks = [];

  const addSpan = (startDay, endDay, pos, label, barGroup) => {
    const t = new Task(id++, at(startDay), at(endDay), 1, label, label, null);
    t.getDisplayData().setColor(pos === 0 ? "#C0392B" : pos === 1 ? "#2980B9" : "#27AE60");
    t.getDisplayData().setPosition(pos);
    t.getDisplayData().setShape(1);
    if (barGroup) t.getDisplayData().setBarGroup(barGroup);
    tasks.push(t);
  };

  const addPoint = (day, pos, label, barGroup) => {
    const t = new Task(id++, at(day), at(day), 1, label, label, null);
    t.getDisplayData().setColor(pos === 0 ? "#C0392B" : pos === 1 ? "#2980B9" : "#27AE60");
    t.getDisplayData().setPosition(pos);
    t.getDisplayData().setShape(0);
    if (barGroup) t.getDisplayData().setBarGroup(barGroup);
    tasks.push(t);
  };

  // Position 0 – Frühzeit
  addSpan(  0, 130, 0, "Abschnitt A1 – Gründungszeit");
  addSpan( 80, 220, 0, "Abschnitt A2 – Ausbau");
  addSpan(200, 320, 0, "Abschnitt A3 – Spätphase der Frühzeit");

  // Position 1 – Mittlere Zeit (beginnt im Übergangsbereich zu Position 0)
  addSpan(290, 440, 1, "Abschnitt B1 – Beginn der Mittleren Zeit");
  addSpan(410, 560, 1, "Abschnitt B2 – Blüte");
  addSpan(530, 680, 1, "Abschnitt B3 – Ausklang der Mittleren Zeit");

  // Position 2 – Spätzeit (beginnt im Übergangsbereich zu Position 1)
  addSpan(650,  800, 2, "Abschnitt C1 – Beginn der Spätzeit");
  addSpan(770,  920, 2, "Abschnitt C2 – Spätzeit Hauptphase");
  addSpan(900, 1000, 2, "Abschnitt C3 – Ende");

  // Bargroup "Medizin" bei Position 1 (Mittlere Zeit), beginnend in der Mitte von B2 (Tag 485)
  addPoint(485, 1, "Medizinischer Fund A", "Medizin");
  addPoint(620, 1, "Medizinischer Fund B", "Medizin");
  addPoint(780, 1, "Medizinischer Fund C", "Medizin");

  return { resources: [res], tasks };
};

export const _43PositionSpacing = () => {
  const { resources, tasks } = buildTestData();

  return (
    <div>
      <h3>Position-Abstand (inter-position padding)</h3>
      <p>
        Eine Ressource mit 3 Positionen (Frühzeit / Mittlere Zeit / Spätzeit). Die Bargroup „Medizin"
        liegt bei Position 1 (Mittlere Zeit). Zwischen den Positionswechseln soll sichtbarer Weißraum
        entstehen, damit die Übergänge nicht gedrängt wirken.
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
