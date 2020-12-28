import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import {
  CLOUD,
  CURLYBRACE,
  PIN_INTERVAL,
  SMALL_PIN_INTERVAL,
  STAR,
  CIRCLE,
  SPEECHBUBBLE,
  TRANSPARENTBACK
} from "../../src/index";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

let id = 1;

const makeBar = (name, type, expansionFactor, isPointInTime, start, end) => {
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
      name + "\nzweite Zeile\ndritte Zeile\nvierte Zeile\nfünfte Zeile\nsechste Zeile\nsiebte Zeile\nachte Zeile\nneunte Zeile", "Ein Vorgang", null);
  const barColor = "#F00";
  task.getDisplayData().setColor(barColor);
  task.getDisplayData().setShape(type);
  task.imageurl = "./logo192.png";
  task.getDisplayData().setExpansionFactor(expansionFactor);
  task.getDisplayData().setLabelColor(
      Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white
  return task;
}

const buildTestData = (barExpansion) => {
  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];

  tasks.push(makeBar("Großer Balken", PIN_INTERVAL, 1, false));
  tasks.push(makeBar("Großer Balken, 2-fach", PIN_INTERVAL, barExpansion, false));
  tasks.push(makeBar("Großer Pin", PIN_INTERVAL, 1, true));
  tasks.push(makeBar("Großer Pin, 2-fach", PIN_INTERVAL, barExpansion, true));
  tasks.push(makeBar("Kleiner Balken", SMALL_PIN_INTERVAL, 1, false));
  tasks.push(makeBar("Kleiner Balken, 2-fach", SMALL_PIN_INTERVAL, barExpansion, false));
  tasks.push(makeBar("Kleiner Pin", SMALL_PIN_INTERVAL , 1, true));
  tasks.push(makeBar("Kleiner Pin, 2-fach", SMALL_PIN_INTERVAL, barExpansion, true));
  tasks.push(makeBar("Stern", STAR , 1, true));
  tasks.push(makeBar("Stern, 2-fach", STAR, barExpansion, true));
  tasks.push(makeBar("Kreis", CIRCLE , 1, true));
  tasks.push(makeBar("Kreis, 2-fach", CIRCLE, barExpansion, true));
  tasks.push(makeBar("Wolke", CLOUD , 1, false));
  tasks.push(makeBar("Wolke, 2-fach", CLOUD, barExpansion, false));
  tasks.push(makeBar("Klammer", CURLYBRACE , 1, false));
  tasks.push(makeBar("Klammer, 2-fach", CURLYBRACE, barExpansion, false));
  tasks.push(makeBar("Sprechblase", SPEECHBUBBLE , 1, false));
  tasks.push(makeBar("Sprechblase, 2-fach", SPEECHBUBBLE, barExpansion, false));

  let start = new LCal().initNow();
  start.setTimeZone("Europe/Berlin");
  start.setPrecision(14);
  start.addDay(14);
  let end = start.clone().addDay(2);

  tasks.push(makeBar("Transparent", TRANSPARENTBACK , 1, false, start, end));

  start = new LCal().initNow();
  start.setTimeZone("Europe/Berlin");
  start.setPrecision(14);
  start.addDay(20);
  end = start.clone().addDay(2);
  tasks.push(makeBar("Transparent, 2-fach", TRANSPARENTBACK, 2, false, start, end));

  return {
    resources,
    tasks
  }
}

export const _22Barsizes = () => {
  const [shortLabels, setShortLabels] = useState(false);
  const [barExpansion, setBarExpansion] = useState(2);

  const testData = buildTestData(barExpansion);

  return <div>
    Barsizes
    <br/>
    <br/>
    <input type="number" value={barExpansion} onChange={(evt)=>setBarExpansion(evt.target.value)}/>
    <div>
      <div style={{
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
      </div>
    </div>
    <br/>
    <div>
      <ReactCanvasTimeline
          resources={testData.resources}
          tasks={testData.tasks}
          initialBarSize={40}
          paintShadows={true}
          brightBackground={false}
          shortLabels={shortLabels}
      />
    </div>
  </div>;
}

//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

