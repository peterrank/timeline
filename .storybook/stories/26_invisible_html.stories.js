import React from 'react';
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import TaskModel from "../../src/model/taskmodel";
import InstrumentedTimeline from "../../src/timeline/instrumentedtimeline";
import SliderHelper from "../../src/slider/sliderhelper";
import dataset from "./dataset";

export default {
  title: 'timeline',
  component: InstrumentedTimeline,
};



const model = new TaskModel();

const sliderValues = SliderHelper.getSliderValues(model.getAll());
const now = new LCal().initNow();
const displStart = now.clone().addDay(-10);
const displEnd = now.clone().addDay(10);

export const _26InvisibleHTML = () => {
  return <div>
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
    >
      <div>Dies ist ein unsichtbares html, das die Beschreibung der Daten im Canvas enthält, damit dies von Suchmaschinen gefunden und barrierefrei gestaltet werden ann.</div>
    </InstrumentedTimeline>
  </div>;
}


