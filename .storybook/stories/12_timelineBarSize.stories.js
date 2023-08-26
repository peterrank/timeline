import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};


export const _12InitialBarSize = {
  render: () => {
    const testData = buildTestData();
    const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);

    return <div>
      Bar size
      <br/>
      <br/>
      <div>
        <ReactCanvasTimeline
            resources={testData.resources}
            tasks={testData.tasks}
            paintShadows={true}
            barSize={100}
        />
      </div>
    </div>;
  }
}


//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

