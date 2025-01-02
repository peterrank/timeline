import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';
import LCal from "../../src/calendar/lcal";
import LCalInterval from "../../src/calendar/lcalinterval";
import {ReactComponent as Lock} from "../../src/icons/lock.svg";
import {ReactComponent as LockOpen} from "../../src/icons/lockopen.svg";
import {ReactComponent as ExitToApp} from "../../src/icons/exit.svg";
import LCalFormatter from "../../src/calendar/lcalformatter";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const measureResult = (val) => {
  //In real life we should use material-uis typography
  /*return <Typography variant="subtitle1"
                     style={{
                       color: "white",
                       background: "rgba(221, 44, 0, 0.7)",
                       padding: 10
                     }}>
    {LCalFormatter.formatDuration(this.state.measureInterval)}
  </Typography>*/
  return <div style={{
    color: "white",
    background: "rgba(221, 44, 0, 0.7)",
    padding: 10
  }}>{LCalFormatter.formatDuration(val)}</div>
}

export const _8MeasureTimeline = () => {
  let testData = buildTestData();
  let start = new LCal().initNow();
  let end = start.clone().addDay(10);
  const [measureDurationLock, setMeasureDurationLock] = useState(false);
  const [isAligning, setIsAligning] = useState(false);
  const [interval, setInterval] = useState(null);
  const [showMeasureInterval, setShowMeasureInterval] = useState(true);



  return <div>
    <div style={{marginBottom: '20px'}}>
      <label style={{marginRight: '20px'}}>
        <input 
          type="radio" 
          checked={showMeasureInterval} 
          onChange={() => setShowMeasureInterval(true)}
        /> Mit Messintervall
      </label>
      <label>
        <input 
          type="radio" 
          checked={!showMeasureInterval} 
          onChange={() => setShowMeasureInterval(false)}
        /> Ohne Messintervall
      </label>
    </div>
    Measuring: <div style={{color: isAligning ? "red" : "black"}}>{JSON.stringify(interval)}</div>
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      initialMeasureInterval={showMeasureInterval ? new LCalInterval(start, end) : null}
      measureResult = {(val) => measureResult(val)}
      measureDurationLock={measureDurationLock}
      paintShadows = {true}
      brightBackground = {true}
      onMeasureIntervalChanged={(interval, isAligning) => {
        setIsAligning(isAligning);
        setInterval(interval);
      }}
    />
  </div>;
}


