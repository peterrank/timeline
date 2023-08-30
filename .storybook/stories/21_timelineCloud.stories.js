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

var seed = 1;
const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

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

    let task = new Task(1, start, end, 1, "Task 1", "Ein Vorgang", null);
    let barColor = "#F00";
    task.getDisplayData().setColor(barColor);

    task.getDisplayData().setShape(6);
    task.imageurl = "./logo192.png";
    tasks.push(task);
  return {
    resources,
    tasks
  }
}

export const _21Cloud = () => {
  const testData = buildTestData();
  const [shortLabels, setShortLabels] = useState(false);

  return <div>
    Shapes
    <br/>
    <br/>
    <div>
      <button onClick={()=>{
        setShortLabels(!shortLabels);
      }}>
        Toggle short labels
      </button>
    </div>
    <br/>
    <div>
      <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
        brightBackground = {false}
        shortLabels = {shortLabels}
      />
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

