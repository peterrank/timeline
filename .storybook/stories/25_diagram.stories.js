import React, {useRef, useEffect} from 'react';
import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";
import TaskModel from "../../src/model/taskmodel";
import InstrumentedTimeline from "../../src/timeline/instrumentedtimeline";
import SliderHelper from "../../src/slider/sliderhelper";
import dataset from "./dataset";
import {paintChart} from "../../src/index";

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

  let now = new LCal().initYMDHM(1800,1,1,0,0);
  now.setTimeZone("Europe/Berlin");
  now.setPrecision(14);

  let start = now;
  let end = start.clone();
  end.addYear(220);

  let task = new Task(1, start, end, 1, "Task 1", "Ein Vorgang", null);
  let barColor = "#AAA";
  task.getDisplayData().setColor(barColor);

  task.getDisplayData().setShape(0);

  task.getDisplayData().setExpansionFactor(5);
  task.dataset = JSON.stringify(dataset);
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

export const _25Diagram = {
  render: () => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      const chartInset = {
        CHART_INSET: 10,
        resSubFont: "12px Roboto, sans-serif"
      }
      const getXPosForTime = (julMin) => {
        const julMinStart = new LCal().initYMDHM(1800, 1, 1, 0, 0).getJulianMinutes();
        const julMinEnd = new LCal().initYMDHM(2030, 1, 1, 0, 0).getJulianMinutes();
        const totalJulMins = julMinEnd - julMinStart;
        const x = (julMin - julMinStart) * 500 / totalJulMins;
        return x;
      }
      paintChart(context, 0, 20, 0, 500, 0, 500, dataset, getXPosForTime, chartInset);
    }, [])

    return <div style={{display: "flex", flexDirection: "column"}}>
      Nur Canvas
      <div>
        <canvas width={500} height={500} ref={canvasRef} style={{background: "#AABBCC"}}>

        </canvas>
      </div>
      <br/>
      <br/>
      Canvas in InstrumentedTimeline
      <InstrumentedTimeline
          width={window.innerWidth / 1.5}
          height={window.innerHeight / 1.5}
          model={model}
          paintShadows={true}
          headerType='inline'
          start={displStart}
          end={displEnd}
          timeZone={"Europe/Berlin"}
          sliderValues={sliderValues}
      />
    </div>;
  }
}


