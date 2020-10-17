import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';
import {ReactComponent as Arrow} from "../../src/icons/arrow.svg";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _7FindTask = () => {
  const testData = buildTestData();
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);

  return <div>
    Find Task
    <br/>
    <br/>
    <div style={{display: "flex", flexDirection: "row"}}>
    <div style={{background: "red",color: "white", borderRadius: 5, padding: 10, cursor: "pointer"}} onClick={()=>{instrumentedTimeline.goToStartAndHighlight(testData.tasks[0])}}>
      Scroll anywhere and click me to find task #0
    </div>
    </div>
    <br/>
    <br/>
    <div>
      <ReactCanvasTimeline
        instrumentedTimelineCallback = {(instrumentedTimeline) => setInstrumentedTimeline(instrumentedTimeline)}
        resources = {testData.resources}
        tasks = {testData.tasks}
        paintShadows = {true}
        highlightArrow = <Arrow/>
      />

    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

