import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import {LCalFormatter} from "../../src";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

var seed = 1;
const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const pointInTimeShapes = [0,1,4,5,7];
const timeSpanShapes = [0,1,2,3,6];

const buildTestData = (showIcons) => {
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
  let pointInTimeCnt = 0;
  let timeSpanCnt = 0;
  for(let n=0; n<100; n++) {
    let now = new LCal().initNow();
    now.setTimeZone("Europe/Berlin");

    let start = now.clone().addDay(Math.round(n/10+ random()*50));
    let end = start.clone();

    let shape = 0;
    if(n%3 === 0) {
      end.addDay(1 + random()*10);
      shape = timeSpanShapes[pointInTimeCnt%5];
      pointInTimeCnt++;
    } else {
      shape = pointInTimeShapes[pointInTimeCnt%5];
      timeSpanCnt++;
    }

    let task = new Task(n, start, end, 1, shape + "/" + LCalFormatter.formatDateTime(start), "Ein Vorgang", null);
    if(showIcons) {
      task.imageurl = "./logo192.png";
    }
    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setShape(shape);

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

export const _16Shapes = () => {
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);
  const [shortLabels, setShortLabels] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  const testData = buildTestData(showIcons);

  return <div>
    Shapes
    <br/>
    <br/>
    <div>
      <button onClick={()=>{
        if(instrumentedTimeline.getModel().getCollapsedGroups().size>0) {
          instrumentedTimeline.getModel().clearCollapsedGroups();
        } else {
          instrumentedTimeline.getModel().collapseAllGroups();
        }
      }}>
        Toggle bargroup expansion
      </button>
      <button onClick={()=>{
        setShortLabels(!shortLabels);
      }}>
        Toggle short labels
      </button>
      <button onClick={()=>{
        setShowIcons(!showIcons);
      }}>
        Toggle icons
      </button>
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

