import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const buildTestData = () => {
  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];
  //Groups

    let now = new LCal().initNow();
    now.setTimeZone("Europe/Berlin");
    now.setPrecision(14);

    let start = now;
    let end = start.clone().addDay(2);

    let task = new Task(1, start, end, 1, "Task 1\nzweite Zeile\ndritte Zeile", "Ein Vorgang", null);
    let barColor = "#F00";
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setShape(0);
    task.imageurl = "./logo192.png";
    task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white

    tasks.push(task);

    task = new Task(2, start, end, 1, "Task 2\nzweite Zeile\ndritte Zeile", "Ein Vorgang\nmit einer zweiten Zeile", null);
    barColor = "#0F0";
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setShape(0);
    task.imageurl = "./logo192.png";
    task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white
    task.getDisplayData().setExpansionFactor(2);
    tasks.push(task);
  return {
    resources,
    tasks
  }
}

export const _22Barsizes = () => {
  const testData = buildTestData();
  const [shortLabels, setShortLabels] = useState(false);

  return <div>
    Barsizes
    <br/>
    <br/>
    <div>
      <div style={{background: "red",color: "white", borderRadius: 5, width: 300, padding: 10, cursor: "pointer", margin: 10}} onClick={()=>{
        setShortLabels(!shortLabels);
      }}>
        Toggle short labels
      </div>
    </div>
    <br/>
    <div>
      <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        initialBarSize = {40}
        paintShadows = {true}
        brightBackground = {false}
        shortLabels = {shortLabels}
      />
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

