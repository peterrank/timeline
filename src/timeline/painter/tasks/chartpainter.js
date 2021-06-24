import LCal from "../../../calendar/lcal";
import Helper from "../../../helper/helper";
import roundedRect from "../roundrectpainter";

const paintChart = (ctx, taskBarInset, labelHeight, alignedStart, alignedEnd, resStartY, height, dataset, getXPosForTime, cfg) => {
    const adaptedHeight = height - 2 * taskBarInset - 2 * cfg.CHART_INSET - labelHeight;
    if (adaptedHeight > 10) {
        ctx.save();
        try {
            ctx.rect(alignedStart, resStartY, alignedEnd - alignedStart, height);
            ctx.clip();

            if(dataset.charts && dataset.charts.length > 0) {
                let minValue = Number.MAX_VALUE;
                let maxValue = Number.MIN_VALUE;
                for (let chart of dataset.charts) {
                    //Kleinste und größte Werte bestimmen
                    for (let ds of chart.dataset) {
                        let val = ds.value * 1;
                        if (val < minValue) {
                            minValue = val;
                        }
                        if (val > maxValue) {
                            maxValue = val;
                        }
                    }
                }
                for (let chart of dataset.charts) {
                    let isFirst = true;

                    const valueRange = maxValue - minValue;
                    const factor = adaptedHeight / valueRange;

                    //In welche 10er Potenzen lässt sich der valueRange aufteilen?
                    let tickspacing = Math.pow(10, ("" + Math.round(valueRange / 10)).length - 1);
                    let tickStart = Math.floor(minValue / tickspacing) * tickspacing;
                    //Tickspacing*factor muss mindestens etwas mehr sein als die Schrifthöhe
                    for(let n=0; n<100; n++) {
                        if (tickspacing * factor >= 12) {
                            break;
                        }
                            tickspacing += tickspacing;
                    }

                    ctx.setLineDash([1, 3]);
                    ctx.strokeStyle = "#777";
                    ctx.font = cfg.resSubFont;
                    ctx.fillStyle = "#000";
                    ctx.beginPath();
                    while (tickStart <= maxValue) {
                        let y = resStartY + cfg.CHART_INSET + adaptedHeight - (tickStart - minValue) * factor;
                        ctx.fillText(tickStart.toLocaleString(), alignedStart + cfg.CHART_INSET, y);
                        ctx.moveTo(alignedStart + cfg.CHART_INSET + 50, y);
                        ctx.lineTo(alignedEnd - cfg.CHART_INSET, y);
                        tickStart += tickspacing;
                    }
                    ctx.stroke();
                    ctx.setLineDash([])

                    const chartStart = alignedStart + cfg.CHART_INSET + 50;
                    ctx.rect(chartStart, resStartY, alignedEnd - chartStart - 25, height);
                    ctx.clip();
                    ctx.beginPath();
                    ctx.strokeStyle = chart.color;
                    for (let ds of chart.dataset) {
                        const da = ds.date.split(' ');
                        const lcal = new LCal().initYMDHM(da[2] * 1, da[1] * 1, da[0] * 1, da[3] * 1, da[4] * 1);
                        const xPos = getXPosForTime(lcal.getJulianMinutes());
                        //if (xPos > alignedStart + cfg.CHART_INSET + 50) {
                            if (isFirst) {
                                ctx.moveTo(xPos, resStartY + cfg.CHART_INSET + adaptedHeight - factor * (ds.value - minValue));
                                isFirst = false;
                            } else {
                                ctx.lineTo(xPos, resStartY + cfg.CHART_INSET + adaptedHeight - factor * (ds.value - minValue));
                            }
                        //}
                    }
                    ctx.stroke();
                }
            }
        } catch (e) {
                console.log(e);
        }
        ctx.restore();
    }
}


const paintChartMouseOverLabel = (ctx, labelHeight, model, task, mouseLCal, resStartY, getXPosForTime, fontProvider, cfg) => {
    if(mouseLCal) {
        const adaptedHeight = model.getHeight(task.getID()) - 2* cfg.getTaskBarInset(model, task) - 2 * cfg.CHART_INSET - labelHeight;
        if (adaptedHeight > 10) {
            let dataset = JSON.parse(task.dataset); //TODO: Cache

            let minValue = Number.MAX_VALUE;
            let maxValue = Number.MIN_VALUE;
            for (let chart of dataset.charts) {
                //Kleinste und größte Werte bestimmen
                for (let ds of chart.dataset) {
                    let val = ds.value * 1;
                    if (val < minValue) {
                        minValue = val;
                    }
                    if (val > maxValue) {
                        maxValue = val;
                    }
                }
            }

            for (let chart of dataset.charts) {
               
                const valueRange = maxValue - minValue;
                const factor = adaptedHeight / valueRange;

                ctx.save();

                let previousLCal;
                let previousYValue;

                for (let ds of chart.dataset) {
                    const da = ds.date.split(' ');
                    const lcal = new LCal().initYMDHM(da[2] * 1, da[1] * 1, da[0] * 1, da[3] * 1, da[4] * 1);

                    if (previousLCal && !mouseLCal.before(previousLCal) && !mouseLCal.after(lcal)) {
                        const successorX = getXPosForTime(lcal.getJulianMinutes());
                        const previousX = getXPosForTime(previousLCal.getJulianMinutes());
                        const deltaX = successorX - previousX;
                        const deltaY = ds.value - previousYValue;

                        const x = getXPosForTime(mouseLCal.getJulianMinutes());
                        const valy = previousYValue + (deltaY * (x - previousX) / deltaX);

                        const y = resStartY + cfg.CHART_INSET + adaptedHeight - factor * (valy - minValue);

                        ctx.fillStyle = chart.color;
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = "#FF0000";

                        ctx.beginPath();
                        ctx.arc(x, y, 10, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.font = fontProvider.getTimelineBarHeaderFont();

                        const labelStr = (Math.round(valy * 100) / 100).toLocaleString() + " " +chart.unit;
                        const width = Helper.textWidthFromCache(labelStr, fontProvider.getTimelineBarHeaderFontSize(), ctx) + 10;

                        ctx.beginPath();
                        roundedRect(ctx, x + 20, y - fontProvider.getTimelineBarHeaderFontSize(), width,  fontProvider.getTimelineBarHeaderFontSize() + 10, 5, 5, true);
                        ctx.fillStyle = "#666";
                        ctx.strokeStyle = "#AAA";
                        ctx.lineWidth = 1;
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = "#FFF";
                        ctx.fillText(labelStr, x + 25, y + 3);
                    }

                    previousYValue = ds.value * 1;
                    previousLCal = lcal;
                }
                ctx.restore();
            }
        }
    }
}

export {paintChart, paintChartMouseOverLabel};