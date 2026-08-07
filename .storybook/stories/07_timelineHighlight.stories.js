import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _7FindTask = () => {
  const testData = buildTestData();
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);
  const [animationSteps, setAnimationSteps] = useState(20);

  return <div>
    Find Task
    <br/>
    <br/>
    <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap"}}>
      <button onClick={()=>{instrumentedTimeline.goToStartAndHighlight(testData.tasks[382])}}>
        Find task #382
      </button>
      <button onClick={()=>{instrumentedTimeline.goToStartAndHighlight(testData.tasks[47])}}>
        Find task #47
      </button>
      <button onClick={()=>{instrumentedTimeline.goToStartAndHighlight(testData.tasks[94])}}>
        Find task #94
      </button>
      <button onClick={()=>{instrumentedTimeline.goToStartAndHighlight(testData.tasks[306])}}>
        Find task #306 (in Group)
      </button>
      <span style={{marginLeft: 16}}>
        Animationsgeschwindigkeit (Steps):&nbsp;
        <input
          type="range" min="5" max="60" step="5"
          value={animationSteps}
          onChange={e => setAnimationSteps(Number(e.target.value))}
          style={{verticalAlign: 'middle'}}
        />
        &nbsp;{animationSteps}
      </span>
    </div>
    <br/>
    <br/>
    <div>
      <ReactCanvasTimeline
        instrumentedTimelineCallback={(it) => setInstrumentedTimeline(it)}
        resources={testData.resources}
        tasks={testData.tasks}
        paintShadows={true}
        animationSteps={animationSteps}
      />
    </div>
  </div>;
}
