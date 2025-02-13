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
  const COLORS = ['FF005D', '0085B6', '0BB4C1', '00D49D', 'FEDF03', '233D4D', 'FE7F2D', 'FCCA46', 'A1C181', '579C87']
  let color = -1
  const nextColor = () => {
    color = (color + 1) % COLORS.length
    return COLORS[color]
  }

  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];
  //Groups
  for(let n=0; n<15; n++) {
    let now = new LCal().initNow();
    now.setPrecision(n)
    let start = now.clone();
    let end = start.clone();


    let task = new Task(n, start, end, 1, "Precision "+n, "Ein Vorgang", null);
    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);

    task.getDisplayData().setShape(0);

    tasks.push(task);
  }

  return {
    resources,
    tasks
  }
}

export const _17Precision = () => {
  const testData = buildTestData();
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);

  return <div>
    Precisions
    <br/>
    <br/>
    <div>
      <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
        brightBackground = {true}
      />
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

