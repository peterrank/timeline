import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};


export const _3IconsTimeline = () => {
  let testData = buildTestData();
  for(let res of testData.resources) {
    res.imageurl = "./logo192.png";
  }
  for(let task of testData.tasks) {
    task.imageurl = "./logo192.png";
  }
  return <div>
    Resources and tasks with icons
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
    />
  </div>;
}


