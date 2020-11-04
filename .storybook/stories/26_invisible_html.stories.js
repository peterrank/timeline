import React from 'react';
import LCal from "../../src/calendar/lcal";
import TaskModel from "../../src/model/taskmodel";
import InstrumentedTimeline from "../../src/timeline/instrumentedtimeline";
import SliderHelper from "../../src/slider/sliderhelper";

export default {
  title: 'timeline',
  component: InstrumentedTimeline,
};

const model = new TaskModel();

const sliderValues = SliderHelper.getSliderValues(model.getAll());
const start = new LCal().initYMDHM(-1, 1, 1, 0, 0, "Europe/Berlin", 14, 0);
const end = new LCal().initYMDHM(2, 1, 1, 0, 0, "Europe/Berlin", 14, 0);


export const _26InvisibleHTML = () => {
  return <div>
    <InstrumentedTimeline
        width={window.innerWidth / 1.5}
        height={window.innerHeight / 1.5}
        model={model}
        paintShadows = {true}
        headerType = 'inline'
        start={start}
        end={end}
        timeZone={"Europe/Berlin"}
        sliderValues={sliderValues}
    >
      <div>Dies ist ein unsichtbares html, das die Beschreibung der Daten im Canvas enthält, damit dies von Suchmaschinen gefunden und barrierefrei gestaltet werden ann.</div>
    </InstrumentedTimeline>
  </div>;
}


