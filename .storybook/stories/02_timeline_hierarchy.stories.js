import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';
import cfg from "../../src/timeline/timelineconfig";

export default {
    title: 'timeline',
    component: ReactCanvasTimeline,
};


//In this example only for horizontal case
const paintResource = (ctx, timelineHeaderHeight, res, resHeaderHeight, resHeight, resStartY) => {
    let resEndY = Math.min(resStartY + resHeight, ctx.canvas.height);
    let textStartY = Math.max(resStartY, timelineHeaderHeight);

    ctx.beginPath();
    ctx.rect(0, resStartY, resHeaderHeight, resHeight);
    ctx.fillStyle = res.type === "oe" ? "#C0C0C0" : "#E5E5E5";
    ctx.fill();
    ctx.clip();

    if (res.type === "oe") {
        ctx.font = "18px Roboto, sans-serif"
    } else {
        ctx.font = "14px Roboto, sans-serif"
    }
    ctx.fillStyle = res.type === "oe" ? "#7F7F7F" : "#E77722";
    ctx.fillText(res.getName(), res.type === "oe" ? 5 : 20, textStartY + 20);
    ctx.font = cfg.resSubFont;
    ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
    ctx.fillText(res.secname, res.type === "oe" ? 5 : 20, textStartY + 38);
}

export const _2HierarchyTimeline = {
    render: () => {
        let testData = buildTestData();

        for (let n = 0; n < testData.resources.length; n++) {
            let res = testData.resources[n];
            res.secname = n % 10 === 0 ? "" : "technician";
            res.type = n % 10 === 0 ? "oe" : "technician";
        }
        return <div>
            Resources and tasks with icons
            <br/>
            <br/>
            <ReactCanvasTimeline
                resources={testData.resources}
                tasks={testData.tasks}
                resourcePainter={paintResource}
                backgroundImage={"./backgroundX.png"}
                paintShadows={true}
            />
        </div>;
    }
}


