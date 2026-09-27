import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline';
import Resource from '../../src/data/resource';
import Task from '../../src/data/task';
import LCal from '../../src/calendar/lcal';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const makeLCal = (year, month, day) =>
  new LCal().initYMDHM(year, month, day, 0, 0, 'Europe/Berlin', 13, 580);

const buildData = () => {
  const resources = [
    new Resource(0, 'Antike', '', false),
    new Resource(1, 'Mittelalter', '', false),
    new Resource(2, 'Neuzeit', '', false),
    new Resource(3, 'Moderne', '', false),
  ];

  const tasks = [
    new Task('A', makeLCal(-500, 1, 1), makeLCal(-31, 12, 31), 0, 'Römische Republik', '', null),
    new Task('B', makeLCal(-31, 1, 1),  makeLCal(476, 12, 31),  0, 'Römisches Reich',  '', null),
    new Task('C', makeLCal(800, 1, 1),  makeLCal(1806, 8, 6),   1, 'Heiliges Röm. Reich', '', null),
    new Task('D', makeLCal(1347, 1, 1), makeLCal(1353, 12, 31), 1, 'Schwarzer Tod', '', null),
    new Task('E', makeLCal(1517, 10, 31), makeLCal(1648, 10, 24), 2, 'Reformation & 30j. Krieg', '', null),
    new Task('F', makeLCal(1789, 7, 14), makeLCal(1799, 11, 9),   2, 'Französische Revolution', '', null),
    new Task('G', makeLCal(1914, 7, 28), makeLCal(1918, 11, 11),  3, 'Erster Weltkrieg', '', null),
    new Task('H', makeLCal(1939, 9, 1),  makeLCal(1945, 5, 8),    3, 'Zweiter Weltkrieg', '', null),
    new Task('I', makeLCal(1969, 7, 16), makeLCal(1969, 7, 24),   3, 'Mondlandung', '', null),
    new Task('J', makeLCal(1989, 11, 9), makeLCal(1989, 11, 9),   3, 'Mauerfall', '', null),
  ];

  tasks.forEach((t, i) => {
    t.getDisplayData().setColor(['#c0392b','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e74c3c','#34495e','#16a085'][i % 10]);
  });

  return {resources, tasks};
};

export const _49GoToViewStateAndMaybeHighlightTask = () => {
  const {resources, tasks} = buildData();
  const [it, setIt] = useState(null);
  const [animationSteps, setAnimationSteps] = useState(20);
  const [resOffset, setResOffset] = useState(0);

  const btn = (label, onClick) => (
    <button onClick={onClick} style={{margin: 4, padding: '4px 10px', fontSize: 12}}>
      {label}
    </button>
  );

  // Simuliert einen mit "Ansichtsbereich aufnehmen" erfassten Ausschnitt: fixe Dauer,
  // Balkengröße und Scrollbar-Position (resOffset), unabhängig von der gewählten Task.
  const antikeView  = {start: makeLCal(-500, 1, 1), end: makeLCal(500, 1, 1),  barSize: 40, resOffset};
  const moderneView = {start: makeLCal(1900, 1, 1), end: makeLCal(2000, 1, 1), barSize: 60, resOffset};

  return (
    <div style={{fontFamily: 'sans-serif'}}>
      <h3 style={{margin: '8px 0'}}>goToViewStateAndMaybeHighlightTask — Ansichtsbereich + optionaler Ereignis-Sprung</h3>
      <div style={{marginBottom: 12}}>
        Animationsgeschwindigkeit (Steps):&nbsp;
        <input
          type="range" min="5" max="60" step="5"
          value={animationSteps}
          onChange={e => setAnimationSteps(Number(e.target.value))}
          style={{verticalAlign: 'middle'}}
        />
        &nbsp;{animationSteps}
      </div>

      <div style={{marginBottom: 12}}>
        Aufgenommene Scrollbar-Position (resOffset) der beiden Ansichtsbereiche unten:&nbsp;
        <input
          type="range" min="-800" max="200" step="20"
          value={resOffset}
          onChange={e => setResOffset(Number(e.target.value))}
          style={{verticalAlign: 'middle'}}
        />
        &nbsp;{resOffset}px — klein/negativ genug scrollt die Zeilen "Neuzeit"/"Moderne" aus dem Bild.
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Nur Ansichtsbereich (kein Ereignis) — smoother Direktsprung, kein Highlight:</strong><br/>
        {btn('Antike-Bereich (-500 bis 500)', () => it?.goToViewStateAndMaybeHighlightTask(antikeView, null))}
        {btn('Moderne-Bereich (1900 bis 2000)', () => it?.goToViewStateAndMaybeHighlightTask(moderneView, null))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Ansichtsbereich "Antike" (-500 bis 500) + Ereignis:</strong><br/>
        A/B liegen zeitlich im Bereich (sichtbar, falls resOffset die Zeile nicht wegscrollt → Direktsprung).
        C—J liegen zeitlich außerhalb (nicht sichtbar → Zoom-raus/rein-Kinematik mit fixer Dauer/Balkengröße).<br/>
        {tasks.map(t => btn(t.name, () => it?.goToViewStateAndMaybeHighlightTask(antikeView, t)))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Ansichtsbereich "Moderne" (1900 bis 2000) + Ereignis:</strong><br/>
        G/H/I/J liegen zeitlich im Bereich, A—F liegen außerhalb.<br/>
        {tasks.map(t => btn(t.name, () => it?.goToViewStateAndMaybeHighlightTask(moderneView, t)))}
      </div>

      <ReactCanvasTimeline
        instrumentedTimelineCallback={(i) => setIt(i)}
        resources={resources}
        tasks={tasks}
        paintShadows={true}
        animationSteps={animationSteps}
      />
    </div>
  );
};
