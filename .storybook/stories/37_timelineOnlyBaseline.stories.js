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
    now.setPrecision(14);

    let start = now;
    let end = start.clone();

    let task = new Task(1, start, end, 1, "", "", null);
    let barColor = "#F00";
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setExpansionFactor(5);
    task.getDisplayData().setShape(14);
    task.imageurl = "./freiheitsstatue.png";

    tasks.push(task);

  start = now.clone();
  end = start.clone();

  task = new Task(2, start, end, 1, "Task 2 mit Beschriftung", "Ein Vorgang", null);
  barColor = "#F00";
  task.getDisplayData().setColor(barColor);

  task.getDisplayData().setShape(14);
  task.imageurl = "./freiheitsstatue.png";

  tasks.push(task);


  return {
    resources,
    tasks
  }
}

export const _37OnlyBaseline = () => {
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
        brightBackground = {true}
        shortLabels = {shortLabels}
        headerType = 'inline'
      />
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

