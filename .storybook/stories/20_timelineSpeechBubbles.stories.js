import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

var seed = 1;
const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const buildTestData = () => {
  const COLORS = ['FF005D', '0085B6', '0BB4C1', '00D49D', 'FEDF03', '233D4D', 'FE7F2D', 'FCCA46', 'A1C181', '579C87']
  let color = -1
  const nextColor = () => {
    color = (color + 1) % COLORS.length
    return COLORS[color]
  }

  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];
  //Groups
  for(let n=0; n<100; n++) {
    let now = new LCal().initNow();

    let start = now.clone().addDay(Math.round(n/10+ random()*50));
    let end = start.clone();

    let task = new Task(n, start, end, 1, "Task "+n, "Ein Vorgang", null);
    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);

    task.getDisplayData().setShape(7);

    task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white
    if(n%4 === 0) {
      task.getDisplayData().setBarGroup("BarGroup #" + (n % 50));
    }

    tasks.push(task);
  }

  return {
    resources,
    tasks
  }
}

export const _20SpeechBubble = () => {
  const testData = buildTestData();
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);
  const [shortLabels, setShortLabels] = useState(false);

  return <div>
    Shapes
    <br/>
    <br/>
    <div>
      <div style={{background: "red",color: "white", borderRadius: 5, width: 300, padding: 10, cursor: "pointer", margin: 10}} onClick={()=>{
        if(instrumentedTimeline.getModel().getCollapsedGroups().size>0) {
          instrumentedTimeline.getModel().clearCollapsedGroups();
        } else {
          instrumentedTimeline.getModel().collapseAllGroups();
        }
      }}>
        Toggle bargroup expansion
      </div>
      <div style={{background: "red",color: "white", borderRadius: 5, width: 300, padding: 10, cursor: "pointer", margin: 10}} onClick={()=>{
        setShortLabels(!shortLabels);
      }}>
        Toggle short labels
      </div>
    </div>
    <br/>
    <div>
      <ReactCanvasTimeline
        instrumentedTimelineCallback = {(instrumentedTimeline) => setInstrumentedTimeline(instrumentedTimeline)}
        resources = {testData.resources}
        tasks = {testData.tasks}
        initialBarSize = {40}
        paintShadows = {true}
        brightBackground = {false}
        shortLabels = {shortLabels}
      />
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

