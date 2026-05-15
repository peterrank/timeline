import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const buildTestData = (withIcons, resCnt = 2) => {
  const COLORS = ['FF005D', '0085B6', '0BB4C1', '00D49D', 'FEDF03', '233D4D', 'FE7F2D', 'FCCA46', 'A1C181', '579C87']
  let color = -1
  const nextColor = () => {
    color = (color + 1) % COLORS.length
    return COLORS[color]
  }

  let resources = [];
  for(let n=0; n<resCnt; n++) {
    let res = new Resource(n, "Res "+String(n).padStart(3, '0'), "Techniker", false);
    resources.push(res);
  }

  let tasks = [];
  for(let n=0; n<30; n++) {
    let now = new LCal().initNow();

    let start = now.clone().addDay(Math.round(n*2));
    let end = start.clone().addHour(20);

    let resID = n%2;
    let task = new Task("ID#"+n, start, end, resID, "Task "+n, "Ein Vorgang", null);
    task.getDisplayData().setShape(n>15?0:1);

    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);

    tasks.push(task);

    if(n === 3 || n===6) {
      n++;
      resID = n%2;
      task = new Task("ID#"+n, start, end, resID, "Task "+n, "Ein Vorgang", null);
      task.getDisplayData().setShape(n>10?0:1);
      let barColor = "#"+nextColor();
      task.getDisplayData().setColor(barColor);

      tasks.push(task);
    }
  }

  return {
    resources,
    tasks
  }
}

export const _39Connections = () => {
  let testData = buildTestData();

    let task = testData.tasks[0];
    task.connections = [];
    task.connections.push({id: "ID#1", name: "connection from "+task.name, fillStyle: "#F44", lineWidth: 2, textPosPercent: 50, startLinePosPercent: 100, endLinePosPercent: 0, arrowHeadFactor: 0.7, bezierControlMax: 50});

    task = testData.tasks[3];
    task.connections = [];
    task.connections.push({id: "ID#4", name: "connection from "+task.name, fillStyle: "#4F4", lineWidth: 2, textPosPercent: 50, startLinePosPercent: 0, endLinePosPercent: 0, arrowHeadFactor: 0});

    task = testData.tasks[7];
    task.connections = [];
    task.connections.push({id: "ID#6", name: "", fillStyle: "#4F4", lineWidth: 2, textPosPercent: 50, startLinePosPercent: 10, endLinePosPercent: 90, arrowHeadFactor: 1});

    task = testData.tasks[8];
    task.connections = [];
    task.connections.push({id: "ID#9", name: "", fillStyle: "#4F4", lineWidth: 2, textPosPercent: 50, startLinePosPercent: 10, endLinePosPercent: 90, arrowHeadFactor: 1});

  return <div>
    Verbindungslinien
    <br/>
    <br/>
    <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
    />
  </div>;
}

