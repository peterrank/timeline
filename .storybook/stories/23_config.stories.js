import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const myConfig = {
  timelineHeaderColor : "rgb(150,150,150)",
  resourceOverlayInlineColor: "rgba(40,40,40,0.8)",
  resMainFont : "18px Roboto, sans-serif",
  resMainFontColor: "#FFF",
  resSubFontColor: "#AAA",
  timelineMainFontColor: "#FFF",
  timelineSubFontColor: "#CCC",
  currentDateOnMousePositionColor: "rgba(60,60,60,0.7)",
  currentDateOnMousePositionBorderColor: "#FFF",
  timelineHeaderMainTickColor: "white"
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


