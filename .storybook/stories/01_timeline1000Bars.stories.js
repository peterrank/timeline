import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _1SimpleInstrumentedTimeline = () => {
  let testData = buildTestData();
  const [stackDirection, setStackDirection] = useState('bottomUp');
  return <div>
    100 Resources, 1000 Tasks, with traveltimes
    <br/>
    <label style={{marginRight: 16}}>
      <input type="radio" value="bottomUp" checked={stackDirection === 'bottomUp'} onChange={() => setStackDirection('bottomUp')} />
      {' bottomUp'}
    </label>
    <label>
      <input type="radio" value="topDown" checked={stackDirection === 'topDown'} onChange={() => setStackDirection('topDown')} />
      {' topDown'}
    </label>
    <br/>
    <br/>
    <ReactCanvasTimeline
      key={stackDirection}
      resources = {testData.resources}
      tasks = {testData.tasks}
      paintShadows = {true}
      stackDirection = {stackDirection}
    />
  </div>;
}



