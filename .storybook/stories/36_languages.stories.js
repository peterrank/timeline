import React, {useState} from 'react';
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import TaskModel from "../../src/model/taskmodel";
import InstrumentedTimeline from "../../src/timeline/instrumentedtimeline";
import SliderHelper from "../../src/slider/sliderhelper";


export default {
  title: 'timeline',
  component: InstrumentedTimeline,
};

const buildTestData = () => {
  let resources = [];
  let res = new Resource(1, "Res 1", "Techniker 1", false);
  resources.push(res);

  let tasks = [];
  //Groups

  let now = new LCal().initNow();
  now.setTimeZone("Europe/Berlin");
  now.setPrecision(14);

  let start = now;
  let end = start.clone();

  let task = new Task(1, start, end, 1, "Task 1", "Ein Vorgang", null);
  let barColor = "#F00";
  task.getDisplayData().setColor(barColor);

  task.getDisplayData().setShape(4);
  task.imageurl = "./logo192.png";
  task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white

  tasks.push(task);
  return {
    resources,
    tasks
  }
}

const model = new TaskModel();
const data = buildTestData();
model.getResourceModel().setAll(data.resources);
model.setAll(data.tasks);

const sliderValues = SliderHelper.getSliderValues(model.getAll());
const now = new LCal().initNow();
const displStart = now.clone().addDay(-10);
const displEnd = now.clone().addDay(10);

export const _36Language= () => {
  const [language, setLanguage] = useState("ua");
  return <div>
    <button onClick={()=>{
      setLanguage("");
    }}>
      Deutsch
    </button>
    <button onClick={()=>{
      setLanguage("en");
    }}>
      Englisch
    </button>
    <button onClick={()=>{
      setLanguage("ua");
    }}>
      Ukrainisch
    </button>
    <br/>
    <br/>
    <InstrumentedTimeline
        width={window.innerWidth / 1.5}
        height={window.innerHeight / 1.5}
        model={model}
        paintShadows = {true}
        headerType = 'inline'
        start={displStart}
        end={displEnd}
        timeZone={"Europe/Berlin"}
        sliderValues={sliderValues}
        languageCode={language}
    />
  </div>;
}


