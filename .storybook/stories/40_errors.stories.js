import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Task from "../../src/data/task";
import Resource from "../../src/data/resource";
import {LCal, LCalHelper} from "../../src";

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _40Errors = () => {
    let resources = [];
    let tasks = [];

    let res = new Resource(1, "Res", "Techniker", false);
    let start = new LCal().setJulianMinutes(LCalHelper.unixToJulian(1000));
    let end = start.clone().addMinutes(30);
    let task = new Task(1, start, end, 1, "Task", "Ein Vorgang", null);

    resources.push(res);
    tasks.push(task);

  return <div>
    Fehlerhandling
    <br/>
    <br/>
    <ReactCanvasTimeline
        resources = {resources}
        tasks = {tasks}
    />
  </div>;
}

