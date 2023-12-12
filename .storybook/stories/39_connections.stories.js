import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from "./testdatabuilder";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _39Connections = () => {
  let testData = buildTestData();

    let task = testData.tasks[0];
    task.connections = [];
  /*task.connections.push({id: 10, name: "connection from "+task.name, fillStyle: "#F44", lineWidth: 3, textPosPercent: 50, startLinePosPercent: 100, endLinePosPercent: 0});

    task = testData.tasks[1];
    task.connections = [];
    task.connections.push({id: 20, name: "connection from "+task.name, fillStyle: "#4F4", lineWidth: 4, textPosPercent: 20, startLinePosPercent: 100, endLinePosPercent: 100});

    task = testData.tasks[2];
    task.connections = [];
    task.connections.push({id: 30, name: "connection from "+task.name, fillStyle: "#44F", lineWidth: 1, textPosPercent: 80, startLinePosPercent: 100, endLinePosPercent: 50});

    task = testData.tasks[3];
    task.connections = [];*/
    task.connections.push({id: 40, name: "connection from "+task.name, fillStyle: "#FFF", lineWidth: 2, textPosPercent: 0, startLinePosPercent: 99, endLinePosPercent: 1});

    task.connections = JSON.parse(
        '[{"id": "40", "name": "connection from Hadaikum", "fillStyle": "#F44", "lineWidth": "3", "textPosPercent": "50", "startLinePosPercent": "10", "endLinePosPercent": "0"}]');
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

