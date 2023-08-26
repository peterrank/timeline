import React, {useState, useRef} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import TaskModel from "../../src/model/taskmodel";
import SliderHelper from "../../src/slider/sliderhelper";
import InstrumentedTimeline from "../../src/timeline/instrumentedtimeline";

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
  for(let n=0; n<100; n++) {
    let now = new LCal().initNow();

    let start = now.clone().addDay(Math.round(n/10+ random()*10));
    let end = start.clone().addDay(1 + random()*10);

    let task = new Task(n, start, end, 1, "Task "+n, "Ein Vorgang", null);
    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setBorderColor("red");
    if(n%3 === 0) {
      task.getDisplayData().setShape(1);
    } else {
      task.getDisplayData().setShape(0);
    }
    task.getDisplayData().setBarGroup("BarGroup #"+(n%20));
    tasks.push(task);
  }
  return {
    resources,
    tasks
  }
}


export const _32ZoomAll = {
  render: () => {
    const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);
    const testData = buildTestData();

    let model = new TaskModel();
    model.getResourceModel().setAll(testData.resources);
    model.setAll(testData.tasks);
    model.barSize = 40;

    let sliderValues = SliderHelper.getSliderValues(model.getAll());
    let now = new LCal().initNow();
    let displStart = now.clone().addDay(-10);
    let displEnd = now.clone().addDay(10);

    return <div>
      <button onClick={() => {
        instrumentedTimeline.fitToScreen();
      }}>
        Fit to Screen
      </button>

      <button onClick={() => {
        instrumentedTimeline.fitToScreen(20, 50);
      }}>
        Fit to Screen (minHeight 20)
      </button>

      <button onClick={() => {
        instrumentedTimeline.zoomAll(true, null);
      }}>
        Zoom all
      </button>
      <button onClick={() => {
        instrumentedTimeline.goToResource(model.getResourceModel().getAll().slice(-1)[0]);
      }}>
        To bottom
      </button>

      <br/>
      <br/>
      <div>
        <InstrumentedTimeline
            paintShadows={true}
            brightBackground={true}
            instrumentedTimelineCallback={(instrumentedTimeline) => setInstrumentedTimeline(instrumentedTimeline)}
            width={window.innerWidth * 0.9}
            height={window.innerHeight * 0.9}
            showWaitOverlay={false}
            model={model}
            start={displStart}
            end={displEnd}
            timeZone={"Europe/Berlin"}
            sliderValues={sliderValues}
            yearPositions={12}
            backgroundImage={null}
            texts={{
              presshere: "Drücke hier 2 Sekunden, um ein neues Ereignis zu erstellen"
            }}
        />
      </div>
    </div>;
  }
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

