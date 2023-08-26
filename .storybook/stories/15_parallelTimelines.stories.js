import React, {useState}  from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _15ParallelTimelines = {
  render: () => {
    let testData1 = buildTestData();
    let testData2 = buildTestData();

    return <div>
      window size
      <br/>
      <br/>
      <ReactCanvasTimeline
          resources={testData1.resources}
          tasks={testData1.tasks}
          paintShadows={true}
          width={1000}
          height={500}
      />
      <hr/>
      <ReactCanvasTimeline
          resources={testData2.resources}
          tasks={testData2.tasks}
          paintShadows={true}
          width={1500}
          height={700}
      />
    </div>;
  }
}
