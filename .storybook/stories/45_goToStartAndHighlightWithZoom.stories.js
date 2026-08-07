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

export const _45GoToStartAndHighlightWithZoom = () => {
  const {resources, tasks} = buildData();
  const [it, setIt] = useState(null);
  const [animationSteps, setAnimationSteps] = useState(20);

  const narrow1yr   = { start: null, end: null, label: '1 Jahr Zoom',    years: 1   };
  const normal10yr  = { start: null, end: null, label: '10 Jahre Zoom',   years: 10  };
  const wide100yr   = { start: null, end: null, label: '100 Jahre Zoom',  years: 100 };
  const veryWide500 = { start: null, end: null, label: '500 Jahre Zoom',  years: 500 };

  const zoomAroundTask = (task, years) => {
    const midJulMin = task.start.getJulianMinutes();
    const halfMin = years * 365.25 * 24 * 60 / 2;
    const tStart = task.start.clone(); tStart.setJulianMinutes(midJulMin - halfMin);
    const tEnd   = task.start.clone(); tEnd.setJulianMinutes(midJulMin + halfMin);
    return {tStart, tEnd};
  };

  const btn = (label, onClick) => (
    <button onClick={onClick} style={{margin: 4, padding: '4px 10px', fontSize: 12}}>
      {label}
    </button>
  );

  return (
    <div style={{fontFamily: 'sans-serif'}}>
      <h3 style={{margin: '8px 0'}}>goToStartAndHighlight — mit optionalem Zielzoomlevel</h3>
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

      <div style={{marginBottom: 8}}>
        <strong>Ohne Zielzoom (aktueller Zoom bleibt):</strong><br/>
        {tasks.map(t => btn(t.name, () => it?.goToStartAndHighlight(t)))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Mit 1-Jahr-Zoom:</strong><br/>
        {tasks.map(t => btn(t.name, () => {
          const {tStart, tEnd} = zoomAroundTask(t, 1);
          it?.goToStartAndHighlight(t, tStart, tEnd);
        }))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Mit 100-Jahr-Zoom:</strong><br/>
        {tasks.map(t => btn(t.name, () => {
          const {tStart, tEnd} = zoomAroundTask(t, 100);
          it?.goToStartAndHighlight(t, tStart, tEnd);
        }))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Mit 100-Jahr-Zoom + große Balkenhöhe (80px):</strong><br/>
        {tasks.map(t => btn(t.name, () => {
          const {tStart, tEnd} = zoomAroundTask(t, 100);
          it?.goToStartAndHighlight(t, tStart, tEnd, 80);
        }))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>Mit 10-Jahr-Zoom + kleine Balkenhöhe (20px):</strong><br/>
        {tasks.map(t => btn(t.name, () => {
          const {tStart, tEnd} = zoomAroundTask(t, 10);
          it?.goToStartAndHighlight(t, tStart, tEnd, 20);
        }))}
      </div>

      <div style={{marginBottom: 8}}>
        <strong>animateToWithBarSize (kein Task-Sprung, nur Zoom+Balkenhöhe):</strong><br/>
        {btn('500 Jahre, 40px', () => {
          const s = makeLCal(1500, 1, 1);
          const e = makeLCal(2000, 1, 1);
          it?.animateToWithBarSize(s, e, 40);
        })}
        {btn('50 Jahre, 80px', () => {
          const s = makeLCal(1900, 1, 1);
          const e = makeLCal(1950, 1, 1);
          it?.animateToWithBarSize(s, e, 80);
        })}
        {btn('2000 Jahre, 15px', () => {
          const s = makeLCal(-500, 1, 1);
          const e = makeLCal(1500, 1, 1);
          it?.animateToWithBarSize(s, e, 15);
        })}
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
