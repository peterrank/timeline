import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _19ResourceHeader = () => {
  let testData = buildTestData(true);
  return <div>
    Resource-Header
    <br/>
    <br/>
    Default
    <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
        onClick={(evt) => alert(JSON.stringify(evt, 0, 4))}
    />
    <br/>
    <br/>
    Inline
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
      headerType = 'inline'
      onClick={(evt) => alert(JSON.stringify(evt, 0, 4))}
    />
    <br/>
    <br/>
    Overlay
    <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
        headerType = 'overlay'
        onClick={(evt) => alert(JSON.stringify(evt, 0, 4))}
    />
  </div>;
}


