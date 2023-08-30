import React, {useState}  from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _14AdaptWidth = () => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(800);

  let testData = buildTestData();
  let resize = () => {

  }
  return <div>
    window size
    <br/>
    <br/>
    <button onClick={() => {setWidth(width===400?800:400); setHeight(height===400?800:400)}}>
      Click to change size
    </button>
    <br/>
    <br/>
    <ReactCanvasTimeline
        resources={testData.resources}
        tasks={testData.tasks}
        paintShadows={true}
        width={width}
        height={height}
    />
  </div>;
}
