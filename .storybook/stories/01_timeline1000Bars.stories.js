import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _1SimpleInstrumentedTimeline = () => {
  let testData = buildTestData();
  return <div>
    100 Resources, 1000 Tasks, with traveltimes
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
    />
  </div>;
}



