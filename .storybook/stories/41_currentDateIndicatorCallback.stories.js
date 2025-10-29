import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import Task from "../../src/data/task";
import Resource from "../../src/data/resource";
import {LCal, LCalHelper} from "../../src";

export default {
    title: 'timeline',
    component: ReactCanvasTimeline,
};

export const _41CurrentDateIndicator = () => {
    let resources = [];
    let tasks = [];

    let res = new Resource(1, "Res", "Techniker", false);
    resources.push(res);

    const currentDateIndicatorLeftCallback = (lcal) => {
        return "hallo";
    }

    const currentDateIndicatorRightCallback = (lcal) => {
        return lcal;
    }

    return <div>
        <br/>
        <br/>
        <ReactCanvasTimeline
            resources = {resources}
            tasks = {tasks}
            currentDateIndicatorLeftCallback = {currentDateIndicatorLeftCallback}
            currentDateIndicatorRightCallback = {currentDateIndicatorRightCallback}
        />
    </div>;
}

