import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const myConfig = {
  timelineHeaderColor : "#FFFF00",
  resourceOverlayInlineColor: "rgba(255,255,0,0.8)",
  resMainFont : "18px Roboto, sans-serif",
  resMainFontColor: "#333",
  resSubFontColor: "#777",
  INLINE_RES_HEIGHT: 0
}

const testData = buildTestData(true);
export const _23Config = () => {
  return <div>
    Inline
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
      headerType = 'inline'
      onClick={(evt) => alert(JSON.stringify(evt, 0, 4))}
      config={myConfig}
    />
  </div>;
}


