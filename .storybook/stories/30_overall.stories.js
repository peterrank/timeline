import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import {
  PIN_INTERVAL,
  TRANSPARENTBACK
} from "../../src/index";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

let id = 1;

const makeBar = (res, name, type, expansionFactor, isPointInTime, withLabels, withIcons, start, end, bargroup, position) => {
  let now = new LCal().initNow();
  now.setTimeZone("Europe/Berlin");
  now.setPrecision(12);

  if(!start) {
    start = now;
  }
  if(!end) {
    end = isPointInTime ? start : start.clone().addDay(1);
  }

  let task = new Task(id++, start, end, res.id,
      withLabels ? name : undefined, withLabels ? "Ein Vorgang" : undefined, null);
  const barColor = "#000000";
  task.getDisplayData().setColor(barColor);
  task.getDisplayData().setShape(type);
  if(withIcons) {
    task.imageurl = "./test.jpg";
  }
  task.getDisplayData().setExpansionFactor(expansionFactor);
  task.getDisplayData().setBarGroup(bargroup);
  task.getDisplayData().setPosition(position);
  return task;
}

const buildTestData = (barExpansion, withLabels, withIcons) => {
  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);
  let res2 = new Resource(2, "Res 2", "Techniker 2", false);
  resources.push(res2);

  let tasks = [];

  /*tasks.push(makeBar("1. Balken\nmit einer langen zweiten Zeile\ndritte Zeile\nvierte Zeile", SMALL_CIRCLE, 5, true, withLabels, withIcons));
  tasks.push(makeBar("1. Balken\nmit einer langen zweiten Zeile\ndritte Zeile\nvierte Zeile", SMALL_SUN, 5, true, withLabels, withIcons));
  tasks.push(makeBar("2. Balken\nmit einer langen zweiten Zeile\ndritte Zeile\nvierte Zeile", SMALL_PIN_INTERVAL, 5, true, withLabels, withIcons));
  tasks.push(makeBar("3. Balken\nmit einer langen zweiten Zeile\ndritte Zeile\nvierte Zeile", PIN_INTERVAL, 5, true, withLabels, withIcons));*/

  let start = new LCal().initYMDHM(2021,3,2,0,0);
  start.setTimeZone("Europe/Berlin");
  start.setPrecision(14);
  let end = new LCal().initYMDHM(2022,5,14,0,0);

  let start2 = new LCal().initYMDHM(2021,3,13,0,0);
  start2.setTimeZone("Europe/Berlin");
  start2.setPrecision(14);
  let end2 = start2.clone().addDay(2);

  let start3 = new LCal().initYMDHM(2022,8,9,0,0);
  start3.setTimeZone("Europe/Berlin");
  start3.setPrecision(14);
  let end3 = start3.clone().addDay(2);

  //tasks.push(makeBar(res, "Transparent", PIN_INTERVAL , 2, false, withLabels, withIcons, start, end,"Gruppe 1", 0));

  tasks.push(makeBar(res2, "TRANSPARENTBACK Pos 80", TRANSPARENTBACK , 1, false, withLabels, withIcons, start, end, "Gruppe 2", 80));
  tasks.push(makeBar(res2, "PIN_INTERVAL", PIN_INTERVAL , 1, false, withLabels, withIcons, start, end, "Gruppe 1", 0));
  tasks.push(makeBar(res2, "PIN_INTERVAL", PIN_INTERVAL , 1, false, withLabels, withIcons, start2, end2, "Gruppe 2", 0));
  tasks.push(makeBar(res2, "PIN_INTERVAL", PIN_INTERVAL , 2, false, withLabels, withIcons, start3, end3, "Gruppe 2", -30));
  tasks.push(makeBar(res2, "PIN_INTERVAL Pos -30", PIN_INTERVAL , 3, false, withLabels, withIcons, start, end, "Gruppe 2", -30));

  tasks.push(makeBar(res2, "TRANSPARENTBACK Pos 70", TRANSPARENTBACK , 1, false, withLabels, withIcons, start, end, "Gruppe 3", 70));
  tasks.push(makeBar(res2, "PIN_INTERVAL Pos 70", PIN_INTERVAL , 1, false, withLabels, withIcons, start2, end2, "Gruppe 3", 70));
  tasks.push(makeBar(res2, "PIN_INTERVAL Pos -70", PIN_INTERVAL , 1, false, withLabels, withIcons, start3, end3, "Gruppe 3", -70));
  tasks.push(makeBar(res2, "PIN_INTERVAL Pos -50", PIN_INTERVAL , 1, false, withLabels, withIcons, start2, end2, "Gruppe 3", -50));
  tasks.push(makeBar(res2, "PIN_INTERVAL Pos -30", PIN_INTERVAL , 3, false, withLabels, withIcons, start, end, "Gruppe 3", -30));

  return {
    resources,
    tasks
  }
}

export const _30Overall = () => {
  const [shortLabels, setShortLabels] = useState(false);
  const [barExpansion, setBarExpansion] = useState(2);
  const [withLabels, setWithLabels] = useState(true);
  const [withIcons, setWithIcons] = useState(true);

  const timelineEvent = (type, evt) => {
    setCurrentEvent(evt);
    setCurrentEventType(type);
  }

  const testData = buildTestData(barExpansion, withLabels, withIcons);

  return <div>
    Barsizes
    <br/>
    <br/>
    <input type="number" value={barExpansion} onChange={(evt)=>setBarExpansion(evt.target.value)}/>
    <div>
      <button style={{
        background: "red",
        color: "white",
        borderRadius: 5,
        width: 300,
        padding: 10,
        cursor: "pointer",
        margin: 10
      }} onClick={() => {
        setShortLabels(!shortLabels);
      }}>
        Toggle short labels
      </button>
      <button style={{
        background: "red",
        color: "white",
        borderRadius: 5,
        width: 300,
        padding: 10,
        cursor: "pointer",
        margin: 10
      }} onClick={() => {
        setWithLabels(!withLabels);
      }}>
        Toggle labels
      </button>
      <button style={{
        background: "red",
        color: "white",
        borderRadius: 5,
        width: 300,
        padding: 10,
        cursor: "pointer",
        margin: 10
      }} onClick={() => {
        setWithIcons(!withIcons);
      }}>
        Toggle icons
      </button>
    </div>
    <br/>
    <div>
      <ReactCanvasTimeline
          resources={testData.resources}
          tasks={testData.tasks}
          paintShadows={true}
          brightBackground={false}
          shortLabels={shortLabels}
      />
    </div>
  </div>;
}
