import React, {useState} from 'react';
import NoRefreshTimeline from './norefreshtimeline'
import buildTestData from './testdatabuilder';
import ReactCanvasTimeline from "../../src/timeline/reactcanvastimeline";

export default {
  title: 'timeline',
  component: NoRefreshTimeline,
};

export const _5EventsInTimeline = () => {
  let testData = buildTestData();
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentEventType, setCurrentEventType] = useState(null);

  const timelineEvent = (type, evt) => {
    setCurrentEvent(evt);
    setCurrentEventType(type);
  }

    return <div>
      Test events
      <br/>
      <div style={{height: 500}}>
      <NoRefreshTimeline
          resources={testData.resources}
          tasks={testData.tasks}
          onClick={(evt) => timelineEvent("Click", evt)}
          onPress={(evt) => timelineEvent("Press", evt)}
          onLongPress={(evt) => timelineEvent("LongPress", evt)}
          onZoomChange={(startLCal, endLCal) => console.log("Zoom changed: " + startLCal + " - " + endLCal)}
          onMouseMove={(evt) => timelineEvent("MouseMove", evt)}
          onMousePan={(evt) => timelineEvent("MousePan", evt)}
          paintShadows = {true}
          height={500}
      />
      </div>
      {currentEventType}
      <br/>
      <textarea id="test" name="test" value={JSON.stringify(currentEvent, 0, 4)} style={{width: 600, height: 300}} onChange={()=>console.log("noop")}/>
    </div>;
  }


