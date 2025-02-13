import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import {
  CLOUD,
  CURLYBRACE,
  PIN_INTERVAL,
  SMALL_PIN_INTERVAL,
  STAR,
  SMALL_STAR,
  CIRCLE,
  SPEECHBUBBLE,
  CIRCLE_MIDDLETEXT,
  TRANSPARENTBACK,
  BASELINE
} from "../../src/index";


export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

let id = 1;

const makeBar = (name, type, expansionFactor, isPointInTime, withLabels, withIcons, start, end) => {
  let now = new LCal().initNow();
  now.setTimeZone("Europe/Berlin");
  now.setPrecision(14);

  if(!start) {
    start = now;
  }
  if(!end) {
    end = isPointInTime ? start : start.clone().addDay(2);
  }

  let task = new Task(id++, start, end, 1,
      withLabels ? name + "\nzweite Zeile\ndritte Zeile\nvierte Zeile\nfünfte Zeile\nsechste Zeile\nsiebte Zeile\nachte Zeile\nneunte Zeile" : undefined, withLabels ? "Ein Vorgang" : undefined, null);
  const barColor = "#F00";
  task.getDisplayData().setColor(barColor);
  task.getDisplayData().setShape(type);
  if(withIcons) {
    task.imageurl = "./test.jpg";
  }
  task.getDisplayData().setExpansionFactor(expansionFactor);
  return task;
}

const buildTestData = (barExpansion, withLabels, withIcons) => {
  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];

  tasks.push(makeBar("Großer Balken", PIN_INTERVAL, 1, false, withLabels, withIcons));
  tasks.push(makeBar("Großer Balken, 2-fach", PIN_INTERVAL, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Großer Pin", PIN_INTERVAL, 1, true, withLabels, withIcons));
  tasks.push(makeBar("Großer Pin, 2-fach", PIN_INTERVAL, barExpansion, true, withLabels, withIcons));
  tasks.push(makeBar("Kleiner Balken", SMALL_PIN_INTERVAL, 1, false, withLabels, withIcons));
  tasks.push(makeBar("Kleiner Balken, 2-fach", SMALL_PIN_INTERVAL, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Kleiner Pin", SMALL_PIN_INTERVAL , 1, true, withLabels, withIcons));
  tasks.push(makeBar("Kleiner Pin, 2-fach", SMALL_PIN_INTERVAL, barExpansion, true, withLabels, withIcons));
  tasks.push(makeBar("Kleiner Stern", SMALL_STAR , 1, true, withLabels, withIcons));
  tasks.push(makeBar("Stern", STAR , 1, true, withLabels, withIcons));
  tasks.push(makeBar("Stern, 2-fach", STAR, barExpansion, true, withLabels, withIcons));
  tasks.push(makeBar("Kreis", CIRCLE , 1, true, withLabels, withIcons));
  tasks.push(makeBar("Kreis, 2-fach", CIRCLE, barExpansion, true, withLabels, withIcons));
  tasks.push(makeBar("Wolke", CLOUD , 1, false, withLabels, withIcons));
  tasks.push(makeBar("Wolke, 2-fach", CLOUD, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Klammer", CURLYBRACE , 1, false, withLabels, withIcons));
  tasks.push(makeBar("Klammer, 2-fach", CURLYBRACE, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Sprechblase", SPEECHBUBBLE , 1, false, withLabels, withIcons));
  tasks.push(makeBar("Sprechblase, 2-fach", SPEECHBUBBLE, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Kreis (Mitteltext)", CIRCLE_MIDDLETEXT , 1, false, withLabels, withIcons));
  tasks.push(makeBar("Kreis (Mitteltext), 2-fach", CIRCLE_MIDDLETEXT, barExpansion, false, withLabels, withIcons));
  tasks.push(makeBar("Baseline", BASELINE , 1, true, withLabels, withIcons));


  let start = new LCal().initNow();
  start.setTimeZone("Europe/Berlin");
  start.setPrecision(14);
  start.addDay(14);
  let end = start.clone().addDay(2);

  tasks.push(makeBar("Transparent", TRANSPARENTBACK , 1, false, withLabels, withIcons, start, end));

  start = new LCal().initNow();
  start.setTimeZone("Europe/Berlin");
  start.setPrecision(14);
  start.addDay(20);
  end = start.clone().addDay(2);
  tasks.push(makeBar("Transparent, 2-fach", TRANSPARENTBACK, 2, false, withLabels, withIcons,  start, end));

  return {
    resources,
    tasks
  }
}

export const _22Barsizes = () => {
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

//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

