import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _19OverlayHeader = () => {
  let testData = buildTestData();
  return <div>
    Overlay-Header
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
      overlayheader = {true}
    />
  </div>;
}


