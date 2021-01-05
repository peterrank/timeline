import React from 'react';
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

  let task = new Task(1, start, end, 1, "Task 1", "Ein Vorgang", null);
  let barColor = "#F00";
  task.getDisplayData().setColor(barColor);

  task.getDisplayData().setShape(6);
  task.imageurl = "./logo192.png";
  task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white

  tasks.push(task);
  return {
    resources,
    tasks
  }
}

export const _24ChangeShape = () => {
  let testData = buildTestData();
  return <div>
    <button onClick={()=>{
      testData.tasks[0].getDisplayData().setShape(7);
    }}>
      Change shape
    </button>
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
      headerType = 'inline'
    />
  </div>;
}


