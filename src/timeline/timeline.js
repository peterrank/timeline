/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import BasicTimeline from './basictimeline';
import LCal from '../calendar/lcal';
import LCalFormatter from '../calendar/lcalformatter';
import LCalHelper from '../calendar/lcalhelper';
import Helper from '../helper/helper'
import TimelineEvent from './timelineevent';
import TaskBarBounds from './taskbarbounds';
import LCalInterval from "../calendar/lcalinterval";
import isTouchDevice from "../system/touchdevicerecognition";
import paintCurlyBrace from "./painter/tasks/curlybracepainter";
import paintStar from "./painter/tasks/starpainter";
import paintCircle from "./painter/tasks/circlepainter";
import paintPin from "./painter/tasks/pinpainter";
import roundedRect from "./painter/roundrectpainter";
import paintCloud from "./painter/tasks/cloudpainter";
import paintSpeechBubble from "./painter/tasks/speechbubblepainter";
import {paintResource} from "./painter/resourcepainter";
import {
    paintChart,
    paintChartMouseOverLabel
} from "./painter/tasks/chartpainter";
import getNextSnapTime from "./utils/snaptime";
import config from "./timelineconfig";
import paintGrid from "./painter/gridpainter";
import paintTimelineHeader from "./painter/timelineheaderpainter";

export const PIN_INTERVAL = 0;
export const SMALL_PIN_INTERVAL = 1;
export const CURLYBRACE = 2;
export const TRANSPARENTBACK = 3;
export const STAR = 4;
export const CIRCLE = 5;
export const CLOUD = 6;
export const SPEECHBUBBLE = 7;
/**
 * Hier wird die konkrete Timeline gezeichnet
 **/
class Timeline extends BasicTimeline {
    constructor(props) {
        super(props);

        //Überschreiben der Werte aus der Config
        this.cfg = {...config, ...this.props.config}

        props.model.addDataChangeCallback(() => {this.offsetResetted();this._updateCanvas()});
        props.model.addMovedTasksChangeCallback(() => this._updateCanvas()); //TODO: Wenn auf separates Canvas gezeichnet wird, dann auch hier das Update entsprechend ändern

        this.resOffset = 0; //Offset für die Ressourcen
        this.workResOffset = 0;

        this.beforeMovementJulMin = 0;
        this.beforeMovementY = 0;

        this.animationTimeoutHandle = 0;
        this.fullPaintHandle = null;

        this.lastPaintDuration = 0;

        this.centerPinchTime = null;

        this.oldWidth = null;
        this.oldHeight = null;

        this.getTaskBarBounds = this.getTaskBarBounds.bind(this);

        this.lockDuration = 0;

        this.initMeasureSliders(this.props);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.offscreenImage = null;

        this.mouseLCal = null;

        this.maxDateOnMousePositionWidth = 0;

        this.mouseOverTimeHeader = false;

        this.lastTimelineEvent = null;

        this.virtualCanvasWidth = this.props.width;
        this.virtualCanvasHeight = this.props.height;

        this.markedBarGroup = null;

        this.props.model.setInlineResourceHeaderHeight(this.props.headerType === 'inline' ? this.cfg.INLINE_RES_HEIGHT : 0);

        this.positionCollector = new Map();
    }

    //Größe der Haupt-Balkenbeschriftung
    getTimelineBarHeaderFontSize(taskID) {
        return this.props.model.barSize / 2;   //  font size basierend auf der Balkenbreite (Standard = 100)
    }

    getTimelineBarHeaderFont(taskID) {
        return (this.getTimelineBarHeaderFontSize(taskID)) + 'px sans-serif'; // set font
    }

    getTimelineBarSubHeaderFontSize(taskID) {
        return this.props.model.barSize / 4;   //  font size basierend auf der Balkenbreite (Standard = 100)
    }

    getTimelineBarSubHeaderFont(taskID) {
        return (this.getTimelineBarSubHeaderFontSize(taskID)) + 'px sans-serif'; // set font
    }

    //Größe der Gruppenbeschriftung
    getGroupFontSize() {
        return this.props.model.barSize / 2;   //  font size basierend auf der Balkenbreite (Standard = 100)
    }

    getGroupFont() {
        return (this.getGroupFontSize()) + 'px sans-serif'; // set font
    }

    initMeasureSliders(p) {
        let start = p.initialMeasureInterval ? p.initialMeasureInterval.start.clone() : null;
        if (start) {
            start.precision = 13;
        }
        let end = p.initialMeasureInterval ? p.initialMeasureInterval.end.clone() : null;
        if (end) {
            end.precision = 13;
        }
        if ((!this.initialMeasureStart && start)
            || (this.initialMeasureStart && !this.initialMeasureStart.equals(start))
            || (!this.initialMeasureEnd && end)
            || (this.initialMeasureEnd && !this.initialMeasureEnd.equals(end))) {
            this.measureSliderStart = start;
            this.measureSliderEnd = end;
            this.initialMeasureStart = start;
            this.initialMeasureEnd = end;
            this.measureSliderOffset = 0;
            this.activeMeasureSlider = 0;
            this.paintMeasureStart = null;
            this.paintMeasureEnd = null;
            this.recomputeMeasureSliderTimes();
            this.recomputeMeasureInterval();
        }
        if (p.measureDurationLock) {
            this.lockDuration = new LCalInterval(this.paintMeasureStart, this.paintMeasureEnd).getAbsDurationMinutesConsiderPrecision();
        }
    }

    componentDidMount() {
        super.componentDidMount();
        this.timelineHeaderHeight = this.props.headerHeight || 55;
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.model !== this.props.model) {
            //TODO: Remove old listeners
            nextProps.model.addDataChangeCallback(() => {this.offsetResetted();this._updateCanvas()});
            nextProps.model.addMovedTasksChangeCallback(() => this._updateCanvas());
        }
        nextProps.model._setDisplayDataDirty(true);
        nextProps.model.setInlineResourceHeaderHeight(nextProps.headerType === 'inline' ? this.cfg.INLINE_RES_HEIGHT : 0);
        this.timelineHeaderHeight = nextProps.headerHeight || 55;
        this.initMeasureSliders(nextProps);
        //TODO: Nicht immer alles aktualisieren, es reicht den Messschieber zu aktualisieren, falls der angezeigt wird, und sich start und ende nicht geändert haben
        // Klappt aber noch nicht so richtig über die props
        this._updateCanvas();
    }

    componentWillUnmount() {
        clearTimeout(this.animationTimeoutHandle);
    }

    //Wenn sich die Orientation ändert, dann gibt es ein Update
    componentDidUpdate() {
        if (this.oldWidth !== this.props.width
            || this.oldHeight !== this.props.height
            || this.props.measureDurationLock !== this.oldMeasureDurationLock
        ) {
            this.oldWidth = this.props.width;
            this.oldHeight = this.props.height;
            this.oldMeasureDurationLock = this.props.measureDurationLock;

            this.offscreenCanvas.width = this.ctx.canvas.width;
            this.offscreenCanvas.height = this.ctx.canvas.height;

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx2 && this.ctx2.setTransform(1, 0, 0, 1, 0, 0);
            this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);

            this.virtualCanvasWidth = this.props.width;
            this.virtualCanvasHeight = this.props.height;

            this.resourceHeaderHeightChanged();
            this._updateCanvas();
        }
    }

    getModel() {
        return this.props.model;
    }

    getLastTimelineEvent() {
        return this.lastTimelineEvent;
    }

    _createTimelineEvent(evt, pressed) {
        //befindet sich die Maus über einem Task, über einer Resource, oder über der Zeitleiste?
        let mousePos = Helper.getCursorPosition(this.refs.canvas, evt);
        if (evt.center) {
            return this._createTimelineEventXY(mousePos[0], mousePos[1], evt.center.x, evt.center.y, pressed);
        } else {
            return this._createTimelineEventXY(mousePos[0], mousePos[1], evt.clientX, evt.clientY, pressed);
        }
    }

    _createTimelineEventXY(x, y, absX, absY, pressed) {
        let retVal = new TimelineEvent();

        //Timeline-Header wurde gedrückt
        //Zu welcher Zeit?
        let t = this.getTimeForXPos(x);
        let lcal = new LCal().setTimeZone("Europe/Berlin");
        lcal.setJulianMinutes(t);
        this.mouseLCal = lcal;

        retVal.setTime(lcal);

        this.mouseOverTimeHeader = x > this.resourceHeaderHeight && y <= this.timelineHeaderHeight;
        retVal.setTimeHeaderPressed(this.mouseOverTimeHeader);

        retVal.setTask(this.getTask(x, y));

        retVal.setResource(this.getResource(y));

        retVal.setX(x);

        retVal.setY(y);

        retVal.setAbsX(absX);

        retVal.setAbsY(absY);

        if (this.measureSliderStart && this.measureSliderEnd) {
            let xStartSlider = this.getXPosForTime(this.measureSliderStart.getJulianMinutes());

            if (x >= xStartSlider - 40 && x <= xStartSlider) {
                retVal.mouseOverStartMeasureSlider = true;
            } else {
                let xEndSlider = this.getXPosForTime(this.measureSliderEnd.getJulianMinutes());
                if (x >= xEndSlider && x <= xEndSlider + 40) {
                    retVal.mouseOverEndMeasureSlider = true;
                }
            }
        }

        if(pressed) {
            retVal.setPressedBarGroupHeader(this.getBarGroupThatHeaderContains(x, y));
        }

        if(retVal.getResource()) {
            const pos = this.positionCollector.get(retVal.getResource().id);
            if (pos) {
                if (x >= pos.iconX && x < pos.iconX + 16 && y >= pos.iconY && y
                    < pos.iconY + 16) {
                    retVal.setResourceCheckboxPressed(true);
                    retVal.setTask(null);
                } else if (x >= pos.x && x < pos.width + pos.x && y >= pos.y
                    && y < pos.height + pos.y) {
                    retVal.setResourceHeaderPressed(true);
                    retVal.setTask(null);
                }
            }
        }

        this.lastTimelineEvent = retVal;

        return retVal;
    }

    onTap(evt) {
        super.onTap(evt);
        const e = this._createTimelineEvent(evt, true);
        if(e.getPressedBarGroupHeader()) {
            let origY = this.getGroup2GroupInfo().get(e.getPressedBarGroupHeader()).yStart;
            this.getModel().toggleBarGroupCollapse(e.getPressedBarGroupHeader(), this.getTaskBarBounds);
            let newY = this.getGroup2GroupInfo().get(e.getPressedBarGroupHeader()).yStart;
            this.markedBarGroup = e.getPressedBarGroupHeader();
            //um diesen Betrag versuchen zu scrollen, falls dies möglich ist
            this.scrollRelativeY(origY - newY);
            setTimeout(()=>{this.markedBarGroup = null; this.paint()}, 700);
        }
        this._fireClickCallback(e);
    }

    _pressUp(evt) {
        super._pressUp(evt);
        this.props.model._setDisplayDataDirty(true);
        this.props.model.recomputeDisplayData(this.getTaskBarBounds);
    }

    onMouseMove(evt) {
        super.onMouseMove(evt);
        const tEvt = this._createTimelineEvent(evt);
        this._fireMouseMoveCallback(tEvt);
        this.paintCanvas2();
    }

    onMouseOut(evt) {
        this.mouseLCal = null;
        this.paintCanvas2();
    }

    onLongPress(evt) {
        super.onLongPress(evt);
        this._fireLongPressCallback(this._createTimelineEvent(evt));
    }

    _press(evt) {
        super._press(evt);
        const mousePos = Helper.getCursorPosition(this.refs.canvas, evt);
        const tlEvt = this._createTimelineEvent(evt, true);

        //Maus über einer Task? Initiiere Drag'n'Drop
        if(tlEvt.task && this.props.dragEnabled) {
            this.props.model.setMovedTasks([tlEvt.task.clone()]);
        }


        //Ist die Maus / Geste über einem Measureslider?
        //(aktuelle x-Position -40 oder +40 je nach direction)
        if (this.measureSliderStart && this.measureSliderEnd) {
            let sliderStartX = this.getXPosForTime(this.measureSliderStart.getJulianMinutes());
            let sliderEndX = this.getXPosForTime(this.measureSliderEnd.getJulianMinutes());
            if (mousePos[0] >= sliderStartX - 40 && mousePos[0] <= sliderStartX) {
                this.activeMeasureSlider = 1;
            } else if (mousePos[0] >= sliderEndX && mousePos[0] <= sliderEndX + 40) {
                this.activeMeasureSlider = -1;
            } else {
                this.activeMeasureSlider = 0;
            }
            this.recomputeMeasureSliderTimes();
        }

        this._firePressCallback(tlEvt);
    }

    recomputeMeasureInterval() {
        if (this.paintMeasureStart && this.paintMeasureEnd) {
            //Die Zeit zwischen den beiden Slidern ausgeben
            let interval = new LCalInterval(this.paintMeasureStart, this.paintMeasureEnd);
            this.props.onMeasureIntervalChanged && this.props.onMeasureIntervalChanged(this.paintMeasureStart ? interval : null, true);
        }
    }


    recomputeMeasureSliderTimes() {
        if (this.measureSliderStart && this.measureSliderEnd) {
            let t = this.measureSliderStart;
            if (this.activeMeasureSlider === 1) {
                let x = this.getXPosForTime(this.measureSliderStart.getJulianMinutes()) + this.measureSliderOffset;
                let julMin = this.getTimeForXPos(x);
                if (!this.props.measureDurationLock && julMin >= this.paintMeasureEnd.getJulianMinutes()) {
                    //Maximal so weit nach rechts schieben, bis der zweite Slider kommmt
                    t = this.paintMeasureEnd;
                } else {
                    t = getNextSnapTime(x, julMin, this.props.model, this);
                    if (!t) {
                        //Nichts zum einschnappen? Ist der Lock gesetzt, dann auch beim anderen Slider das einrasten versuchen
                        if (this.props.measureDurationLock) {
                            let x2 = this.getXPosForTime(this.measureSliderStart.getJulianMinutes() + this.lockDuration) + this.measureSliderOffset;
                            let julMin2 = this.getTimeForXPos(x);
                            t = getNextSnapTime(x2, julMin2, this.props.model, this);
                            if (t) {
                                t = new LCal().setJulianMinutes(t.getJulianMinutes() - this.lockDuration).setTimeZone(this.measureSliderStart);
                            }
                        }

                        if (!t) {
                            t = new LCal().setJulianMinutes(julMin).setTimeZone(this.measureSliderStart);
                        }
                    }


                }
            }
            this.paintMeasureStart = t ? t.clone().setPrecision(13) : null;

            t = this.measureSliderEnd;
            if (this.activeMeasureSlider === -1) {
                let x = this.getXPosForTime(this.measureSliderEnd.getJulianMinutes()) + this.measureSliderOffset;
                let julMin = this.getTimeForXPos(x);
                if (!this.props.measureDurationLock && julMin <= this.paintMeasureStart.getJulianMinutes()) {
                    //Maximal so weit nach links schieben, bis der erste Slider kommt
                    t = this.paintMeasureStart;
                } else {
                    t = getNextSnapTime(x, julMin, this.props.model, this);
                    if (!t) {
                        //Nichts zum einschnappen? Ist der Lock gesetzt, dann auch beim anderen Slider das einrasten versuchen
                        if (this.props.measureDurationLock) {
                            let x2 = this.getXPosForTime(this.measureSliderEnd.getJulianMinutes() - this.lockDuration) + this.measureSliderOffset;
                            let julMin2 = this.getTimeForXPos(x);
                            t = getNextSnapTime(x2, julMin2, this.props.model, this);
                            if (t) {
                                t = new LCal().setJulianMinutes(t.getJulianMinutes() + this.lockDuration).setTimeZone(this.measureSliderStart);
                            }
                        }

                        if (!t) {
                            t = new LCal().setJulianMinutes(julMin).setTimeZone(this.measureSliderEnd);
                        }
                    }
                }

            }

            this.paintMeasureEnd = t ? t.clone().setPrecision(13) : null;

            //Falls die Messdauer gelockt ist
            if (this.props.measureDurationLock) {
                if (this.activeMeasureSlider === 1) {
                    this.paintMeasureEnd = this.paintMeasureStart.clone();
                    this.paintMeasureEnd.addMinutes(this.lockDuration);
                } else if (this.activeMeasureSlider === -1) {
                    this.paintMeasureStart = this.paintMeasureEnd.clone();
                    this.paintMeasureStart.addMinutes(-this.lockDuration);
                }
            }
        } else {
            this.paintMeasureStart = null;
            this.paintMeasureEnd = null;
        }
    }

    offsetResetted() {
        //this.props.model._setDisplayDataDirty(true);
        this._alignWorkResOffset();
        this.resOffset = this.workResOffset;

        this.measureSliderStart = this.paintMeasureStart;
        this.measureSliderEnd = this.paintMeasureEnd;

        this.measureSliderOffset = 0;
        this.activeMeasureSlider = 0;

        if (this.measureSliderStart && this.measureSliderEnd) {
            this.recomputeMeasureSliderTimes();
        }

        super.offsetResetted();

        if (this.measureSliderStart && this.measureSliderEnd) {
            let interval = new LCalInterval(this.paintMeasureStart, this.paintMeasureEnd);
            this.props.onMeasureIntervalChanged && this.props.onMeasureIntervalChanged(this.paintMeasureStart ? interval : null, false);
        }
    }

    beforeMovement() {
        super.beforeMovement();
        this.saveOffscreenImage();
    }

    offsetChanged() {
        if(this.props.model && this.props.model.getMovedTasks() && this.props.model.getMovedTasks().length>0) {
            console.log("drag tasks");
        } else {
            if (this.activeMeasureSlider === 0) {
                this.workResOffset = this.resOffset + this.offsetY;

                this._alignWorkResOffset();
                super.offsetChanged();
                this._fireOffsetChanged();
            } else {
                this.measureSliderOffset = this.offsetX;
                this.recomputeMeasureSliderTimes();
                this.recomputeMeasureInterval();
            }
        }
    }

    _pan(evt) {
        //TODO: Maus über Scrollbar? workResOffset setzen, bzw. das, was die Änderung bewirkt.         this._updateCanvas();

       if (this.activeMeasureSlider === 0) {
            super._pan(evt);
        } else {
            super._panInternal(evt);
            //Nur das zweite Canvas updaten
        }
        this._fireMousePanCallback(this._createTimelineEvent(evt));
    }

    _panEnd(evt) {
        this.props.onPanEnd && this.props.onPanEnd(this);
        this.props.model.setMovedTasks([]);
        this.props.model._setDisplayDataDirty(true);
        this._updateCanvas();
    }

    drop(obj, x, y) {
        this.props.onDrop && this.props.onDrop(this, obj, x, y);
        this._updateCanvas();
    }

    _alignWorkResOffset() {
        let refHeight = Math.max(this.props.model.getResourceModel().getTotalResourceHeight() + this.timelineHeaderHeight, this.virtualCanvasHeight);
        if (this.workResOffset < this.virtualCanvasHeight - refHeight) {
            this.workResOffset = this.virtualCanvasHeight - refHeight;
        } else if (this.workResOffset > 0) {
            this.workResOffset = 0;
        }
    }

    getDisplayedMinutes() {
        return this.workStartTime.getDistanceInMinutes(this.workEndTime);
    }

    animateTo(startLCal, endLCal, animationCompletedCB) {
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }

        if (!endLCal) {
            //Nur das isSwiping-Flag setzen, falls nicht gezoomt wird (falls keine Ende-Zeit angegeben wird)
            this.isSwiping = true;
            let dist = this.workStartTime.getDistanceInMinutes(this.workEndTime);
            endLCal = startLCal.clone();
            endLCal.addMinutes(dist);
        }

        //Je nach Anzahl der Balken wird entweder animiert, oder gleich ohne Animation gezoomed
        this._animateTo(startLCal, endLCal, this.props.model.size() > 100 ? 9 : 0, 10, animationCompletedCB);
    }

    saveOffscreenImage() {
        this.beforeMovementJulMin = this.workStartTime.getJulianMinutes();
        this.beforeMovementY = this.workResOffset;
        this.paint(true);
        this.offscreenCtx.save();
        this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.offscreenImage = this.offscreenCtx.getImageData(this.resourceHeaderHeight, this.timelineHeaderHeight, this.props.width - this.resourceHeaderHeight, this.props.height - this.timelineHeaderHeight);
        this.offscreenCtx.restore();
    }

    paintFromOffscreen() {
        if (this.offscreenImage) {
            this.ctx.save();
            //Zunächst wird wie beim normalen paint der Timelineheader gezeichnet.
            //Es werden aber keine Ereignisse gezeichnet
            this.ctx.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);
            paintTimelineHeader(this.ctx,this.cfg,
                this.timeZone,
                this.getMinutesPerPixel(),
                this.workStartTime,
                this.workEndTime,
                this.resourceHeaderHeight,
                this.timelineHeaderHeight,
                this.virtualCanvasWidth,
                this.virtualCanvasHeight,
                this.getTimelineBarHeaderFontSize(),
                this.getXPosForTime);
            this.ctx.restore();

            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            let distX = this.getXPosForTime(this.beforeMovementJulMin) - this.getXPosForTime(this.workStartTime.getJulianMinutes());
            let distY = this.workResOffset - this.beforeMovementY;

            const x = Math.max(this.resourceHeaderHeight + distX);
            const y = Math.max(this.timelineHeaderHeight + distY);

            let dirtyX = 0;
            let dirtyY = 0;
            let dirtyWidth = this.props.width;
            let dirtyHeight = this.props.height;
            if (distX < 0) {
                dirtyX = -distX;
                dirtyWidth = this.props.width + distX;
            }
            if (distY < 0) {
                dirtyY = -distY;
                dirtyHeight = this.props.height + distY;
            }

            this.ctx.putImageData(this.offscreenImage, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
            this.ctx.restore();

            this.ctx.save();
            //Zeichnen der Messlineale
            //this.paintMeasureSliders(this.ctx);

            //aktuelle Zeit zeichnen
            let now = LCalHelper.getNowMinutes();
            let nowX = this.getXPosForTime(now);
            if(nowX > this.resourceHeaderHeight) {
                this.ctx.strokeStyle = "#FF0000";
                this.ctx.beginPath();
                this.ctx.moveTo(nowX, this.timelineHeaderHeight);
                this.ctx.lineTo(nowX, this.ctx.canvas.height);
                this.ctx.stroke();
            }

            this.ctx.restore();

            this.paintScrollBar(this.ctx);

            //Ressourcen zeichnen
            this.ctx.save();
            this.ctx.rect(0, this.timelineHeaderHeight, this.virtualCanvasWidth, this.virtualCanvasHeight - this.timelineHeaderHeight);
            this.ctx.clip();
            this.paintResources(this.ctx);
            this.ctx.restore();
        }
    }


    _updateCanvas() {
        //this.props.model._setDisplayDataDirty(true);
        //this.props.model.getResourceModel()._setDisplayDataDirty(true);
        if (!this.isInMovement()) {
            super._updateCanvas();
        } else {
            if (this.lastPaintDuration < 10) {
                //Bei 10ms zum Zeichnen werden genügend fps geschafft
                super._updateCanvas();
            } else {
                //100 ms Stillstand? -> Voll zeichnen
                clearTimeout(this.fullPaintHandle);
                this.fullPaintHandle = setTimeout(() => {
                    super._updateCanvas();
                }, 100);

                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(function () {
                        this.paintFromOffscreen();
                    }.bind(this));
                } else {
                    this.paintFromOffscreen();
                }
            }
        }
        this.paintCanvas2();
    }

    _wheel(evt) {
        super._wheel(evt);
        if(!evt.ctrlKey && !this.overlayMessage) {
            clearTimeout(this.overlayMessageTimeout);
            this.overlayMessage = "Verwende Strg+Scrollen zum Zoomen der Timeline";
            this.paintCanvas2();
            this.overlayMessageTimeout = setTimeout(()=>{
                this.overlayMessage = null;
                this.paintCanvas2();
            }, 1500);
        }

    }

    paintCanvas2() {
        if(this.ctx2) {
            this.ctx2.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);
            if (!this.props.printLayout) {
                if (this.lastTimelineEvent!=null && this.lastTimelineEvent.getTask() != null) {
                    this.ctx2.setLineDash([2, 2]);
                    this.ctx2.lineWidth = 2;
                    this.ctx2.strokeStyle = "black";
                    this.paintTaskSelection(this.ctx2, this.lastTimelineEvent.getTask());
                    this.ctx2.setLineDash([]);
                    this.ctx2.lineWidth = 1;

                    if (this.lastTimelineEvent.getTask().dataset && this.lastTimelineEvent.getTask().dataset.length > 0) {
                        //Es handelt sich um ein Diagramm
                        const resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(this.lastTimelineEvent.getTask().getID()) + this.workResOffset;
                        paintChartMouseOverLabel(this.ctx2, this.getTimelineBarHeaderFontSize(this.lastTimelineEvent.getTask().id), this.props.model, this.lastTimelineEvent.getTask(), this.mouseLCal, resStartY, this, this, this.cfg);
                    }
                }

                if (this.paintMeasureStart && this.paintMeasureEnd) {
                    //Zeichnen der Messlineale
                    this.paintMeasureSliders(this.ctx2);
                } else {
                    this.paintCurrentDateOnMousePosition();
                }
            }

            this.paintOverlayMessage(this.ctx2);
        }
    }

    paintOverlayMessage(ctx) {
        if(this.overlayMessage) {
            let txtWidth = ctx.measureText(this.overlayMessage).width;
            ctx.fillStyle = "rgba(100,100,100,0.5)";
            ctx.fillRect(0, this.virtualCanvasHeight - 30, txtWidth + 20, 30);
            ctx.font = this.cfg.overlayMessageFont;
            ctx.fillStyle = "white";
            ctx.fillText(this.overlayMessage, 10, this.virtualCanvasHeight - 10);
        }
    }

    _animateTo(targetStartLCal, targetEndLCal, step, totalSteps, animationCompletedCB) {
        let SELF = this;
        clearTimeout(this.animationTimeoutHandle);

        if (step < totalSteps) {
            //Zunächst eine ganz einfache Funktion: Wie viele Steps habe ich noch prozentual, so viel nähere ich mich dem Ziel an
            const startStepWidth = this.workStartTime.getDistanceInMinutes(targetStartLCal) / (totalSteps - step);
            const endStepWidth = this.workEndTime.getDistanceInMinutes(targetEndLCal) / (totalSteps - step);

            this.workStartTime.setJulianMinutes(this.workStartTime.getJulianMinutes() + startStepWidth);
            this.workEndTime.setJulianMinutes(this.workEndTime.getJulianMinutes() + endStepWidth);
            this.offsetResetted();
            this._updateCanvas();
            this._fireZoomChanged();
            this._fireOffsetChanged();

            this.animationTimeoutHandle = setTimeout(function () {
                step++;
                SELF._animateTo(targetStartLCal, targetEndLCal, step, totalSteps, animationCompletedCB);
            }, 17);
        } else {
            this.isSwiping = false;
            this._updateCanvas();
            if (animationCompletedCB) {
                animationCompletedCB();
            }
        }
    }

    _fireZoomChanged() {
        this.props.onZoomChange && this.props.onZoomChange(this.workStartTime, this.workEndTime);
        this.props.model._setDisplayDataDirty(true);
    }

    _fireClickCallback(timelineEvt) {
        this.props.onClick && this.props.onClick(timelineEvt);
    }

    _fireMouseMoveCallback(timelineEvt) {
        this.props.onMouseMove && this.props.onMouseMove(timelineEvt);
    }

    _fireMousePanCallback(timelineEvt) {
        this.props.onMousePan && this.props.onMousePan(timelineEvt);
    }

    _firePressCallback(timelineEvt) {
        this.props.onPress && this.props.onPress(timelineEvt);
    }

    _fireLongPressCallback(timelineEvt) {
        this.props.onLongPress && this.props.onLongPress(timelineEvt);
    }

    _fireToolTip(timelineEvt) {
        this.props.onToolTip && this.props.onToolTip(timelineEvt);
    }

    _fireOffsetChanged() {
        this.props.onOffsetChange && this.props.onOffsetChange(this.workStartTime, this.workEndTime, this.workResOffset);
    }


    zoomToDisplayMinutes(newDuration) {
        super.zoomToDisplayMinutes(newDuration);
        this._fireOffsetChanged();
    }

    zoom(delta, offsetFromStart) {
        var timeForPixel = this.getTimeForXPos(offsetFromStart);

        let scale = 1 - Math.min(9, Math.abs(delta)) * 0.1;
        if (delta < 0) {
            scale = 1 / scale;
        }

        let zoomTotalTime = Math.round((this.workEndTime.getJulianMinutes() - this.workStartTime.getJulianMinutes()) / scale);

        if (zoomTotalTime > 1 && zoomTotalTime < 30000000000000000) {
            super.zoom(delta, offsetFromStart);

            var origDurationToCenter = timeForPixel - this.workStartTime.getJulianMinutes();

            var newStart = this.workStartTime.getJulianMinutes() - origDurationToCenter / scale + origDurationToCenter;

            this.workStartTime.setJulianMinutes(newStart);
            this.workEndTime.setJulianMinutes(newStart + zoomTotalTime);

            this.offsetResetted();

            this._updateCanvas();

            this._fireZoomChanged();
            this._fireOffsetChanged();
        }
    }

    startPinch(center) {
        super.startPinch(center);
        this.centerPinchTime = this.getTimeForXPos(center);
    }

    pinch(scale) {
        let zoomTotalTime = Math.round((this.canvasEndTime.getJulianMinutes() - this.canvasStartTime.getJulianMinutes()) / scale);

        let timeToCenter = this.centerPinchTime - this.canvasStartTime.getJulianMinutes();
        let newStart = this.canvasStartTime.getJulianMinutes() - timeToCenter / scale + timeToCenter;
        let newEnd = newStart + zoomTotalTime;

        this.workStartTime.setJulianMinutes(newStart);
        this.workEndTime.setJulianMinutes(newEnd);

        this._fireZoomChanged();
        this._updateCanvas();
    }

    endPinch() {
        super.endPinch();
        this.offsetResetted();
        this._fireZoomChanged();
    }

    paintCurrentDateOnMousePosition() {
        if (this.mouseLCal && this.ctx2) {
            this.ctx2.save();

            this.ctx2.font = this.cfg.currentDateOnMousePositionFont;
            const now = new LCal().setJulianMinutes(LCalHelper.getNowMinutes()).setTimeZone("Europe/Berlin");

            //Die Genauigkeit des mouseLCal ändern, je nach dem wie groß der Abstand ist (damit nicht immer Minuten mit angezeigt werden, wenn z.B. der Abstand 1000 Jahre beträgt)
            const adaptedMouseLCal = LCalHelper.adaptPrecisionByDistance(this.mouseLCal, now);

            const interval = new LCalInterval(adaptedMouseLCal, now);

            const isPast = this.mouseLCal && this.mouseLCal.before(now);
            const durationTxt = (isPast ? "vor " : "in ") + LCalFormatter.formatDuration(interval)

            let mouseX = this.getXPosForTime(this.mouseLCal.getJulianMinutes());
            const dateTxt = this.formatBarDate(this.mouseLCal)

            const dateWidth = this.ctx2.measureText(dateTxt).width;
            const durationWidth = this.ctx2.measureText(durationTxt).width;
            const width = dateWidth + durationWidth + 10;
            if (width > this.maxDateOnMousePositionWidth) {
                this.maxDateOnMousePositionWidth = width;
            }

            const halfBarWidth = this.maxDateOnMousePositionWidth / 2 + 5;
            const halfArrowWidth = 10;
            const offset = -14;
            const height = 32;

            //Nur, wenn die Maus schon mal bewegt wurde (also nicht, wenn das Gerät nur touch kann)
            if (!isTouchDevice()) {
                this.ctx2.strokeStyle = "#FFF";
                this.ctx2.fillStyle = "rgba(44,60,80,0.7)";
                if (!this.mouseOverTimeHeader) {
                    this.ctx2.beginPath();
                    this.ctx2.moveTo(mouseX, this.timelineHeaderHeight + offset);
                    this.ctx2.lineTo(mouseX + halfArrowWidth, this.timelineHeaderHeight - halfArrowWidth + offset);
                    this.ctx2.lineTo(mouseX + halfBarWidth, this.timelineHeaderHeight - halfArrowWidth + offset);
                    this.ctx2.lineTo(mouseX + halfBarWidth, this.timelineHeaderHeight - height + offset);
                    this.ctx2.lineTo(mouseX - halfBarWidth, this.timelineHeaderHeight - height + offset);
                    this.ctx2.lineTo(mouseX - halfBarWidth, this.timelineHeaderHeight - halfArrowWidth + offset);
                    this.ctx2.lineTo(mouseX - halfArrowWidth, this.timelineHeaderHeight - halfArrowWidth + offset);
                    this.ctx2.lineTo(mouseX, this.timelineHeaderHeight + offset);
                    this.ctx2.fill();
                    this.ctx2.stroke();
                    this.ctx2.fillStyle = "#FFF";
                    this.ctx2.fillText(dateTxt, mouseX -halfBarWidth + 5, this.timelineHeaderHeight - halfArrowWidth - 20);
                    this.ctx2.fillText(durationTxt, mouseX + halfBarWidth - durationWidth - 5, this.timelineHeaderHeight - halfArrowWidth - 20);
                }

                this.ctx2.beginPath();
                this.ctx2.moveTo(mouseX, this.timelineHeaderHeight + offset);
                this.ctx2.setLineDash([1, 3]);
                this.ctx2.lineTo(mouseX, this.ctx.canvas.height);
                this.ctx2.stroke();

            }
            this.ctx2.restore();
        }
    }

    getGroup2GroupInfo() {
        let group2GroupInfo = new Map();
        for (let n = 0; n < this.props.model.size(); n++) {
            let task = this.props.model.getItemAt(n);
            if (!task.isDeleted()) {
                const bg = task.getDisplayData().getBarGroup();
                if (bg && bg.trim().length > 0) {
                    let groupInfo = group2GroupInfo.get(
                        task.getResID() + "@" + bg);

                    if (!groupInfo) {
                        groupInfo = {};
                        group2GroupInfo.set(task.getResID() + "@" + bg,
                            groupInfo);
                    }

                    groupInfo.name = bg;

                    let tbb = this.getTaskBarBounds(task);

                    if (!groupInfo.xStart || tbb.getMinStartX()
                        < groupInfo.xStart) {
                        groupInfo.xStart = tbb.getMinStartX();
                    }
                    if (!groupInfo.xEnd || tbb.getMaxEndX() > groupInfo.xEnd) {
                        groupInfo.xEnd = tbb.getMaxEndX();
                    }

                    let resStartY = this.timelineHeaderHeight
                        + this.props.model.getRelativeYStart(task.getID())
                        + this.workResOffset;

                    if (!groupInfo.yStart || resStartY
                        - this.props.model.barSize * 4 / 5
                        < groupInfo.yStart) {
                        groupInfo.yStart = resStartY
                            - this.props.model.barSize * 4 / 5;
                    }

                    let resEndY = resStartY + this.props.model.getHeight(
                        task.getID());
                    if (!groupInfo.yEnd || resEndY > groupInfo.yEnd) {
                        groupInfo.yEnd = resEndY;
                    }

                    if(groupInfo.xEnd - groupInfo.xStart < this.props.model.minimumGroupWidth) {
                        groupInfo.xEnd = groupInfo.xStart + this.props.model.minimumGroupWidth;
                    }
                }
            }
        }
        return group2GroupInfo;
    }

    paintBarGroups(ctx) {
        let group2GroupInfo = this.getGroup2GroupInfo();

        for (let group of group2GroupInfo.keys()) {
            const gi = group2GroupInfo.get(group);

            ctx.save();
            if(this.markedBarGroup === group) {
                ctx.lineWidth = 10;
                ctx.strokeStyle = "#F00";
                ctx.fillStyle = "rgba(255,0, 0,0.7)";
            } else {
                ctx.lineWidth = 3;
                ctx.strokeStyle = this.props.brightBackground ? "#000" : "#FFF";
                ctx.fillStyle = this.props.brightBackground ? "rgba(0,0, 0,0.2)"
                    : "rgba(255,255, 255,0.2)";
            }

            ctx.beginPath();
            const inset = this.cfg.getTaskBarInsetByCollapseState(this.props.model.isCollapsed(group));
            roundedRect(ctx, gi.xStart - inset, gi.yStart, gi.xEnd - gi.xStart + 2 * inset, gi.yEnd - gi.yStart +3, 5);
            ctx.fill();
            ctx.clip();

            ctx.fillRect(gi.xStart - inset, gi.yStart, gi.xEnd - gi.xStart + 2 * inset, this.props.model.barSize * 4/5);

            ctx.fillStyle = this.props.brightBackground ? "#000" : "#FFF";
            ctx.font = this.getGroupFont();

            const txt = (this.props.printLayout ? "" : (this.props.model.isCollapsed(group) ? '\u25BC' : '\u25B2')) + gi.name;

            let txtStart = Math.max(this.resourceHeaderHeight, gi.xStart + 5);
            ctx.fillText(txt, txtStart, gi.yStart + 2 + this.getGroupFontSize());

            ctx.stroke();
            ctx.restore();
        }
    }

    getBarGroupThatHeaderContains(x, y) {
        let group2GroupInfo = this.getGroup2GroupInfo();
        for (let group of group2GroupInfo.keys()) {
            const gi = group2GroupInfo.get(group);
            if(gi.xStart <= x && gi.xEnd >= x && gi.yStart <= y && gi.yStart + this.props.model.barSize >= y) {
                return group;
            }
        }
        return null;
    }

    paint(forOffscreenUse) {
        let paintStart = Date.now();
        let ctx = forOffscreenUse ? this.offscreenCtx : this.ctx;

        ctx.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);

        if (this.props.brightBackground) {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);
        }
        ctx.lineWidth = 1;
        paintTimelineHeader(this.ctx,this.cfg,
            this.timeZone,
            this.getMinutesPerPixel(),
            this.workStartTime,
            this.workEndTime,
            this.resourceHeaderHeight,
            this.timelineHeaderHeight,
            this.virtualCanvasWidth,
            this.virtualCanvasHeight,
            this.getTimelineBarHeaderFontSize(),
            this.getXPosForTime);

        //Ereignisse Zeichnen
        ctx.save();
        ctx.rect(this.resourceHeaderHeight, this.timelineHeaderHeight, this.virtualCanvasWidth - this.resourceHeaderHeight, this.virtualCanvasHeight - this.timelineHeaderHeight);
        ctx.clip();

        ctx.lineWidth = 3;

        this.prePaintResources(ctx);

        this.paintTransparentShapedTasks(ctx);
        this.paintBarGroups(ctx);
        this.paintTasks(ctx);
        this.paintMovedTasks(ctx);

        ctx.lineWidth = 1;

        if (!forOffscreenUse && !this.props.printLayout) {
            //aktuelle Zeit zeichnen
            let now = LCalHelper.getNowMinutes();
            let x = this.getXPosForTime(now);
            ctx.strokeStyle = "#FF0000";
            ctx.beginPath();
            ctx.moveTo(x, this.timelineHeaderHeight);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }

        ctx.restore();

        if (!forOffscreenUse) {
            this.paintScrollBar(ctx);

            //Ressourcen zeichnen
            ctx.save();
            ctx.rect(0, this.timelineHeaderHeight, this.virtualCanvasWidth, this.virtualCanvasHeight - this.timelineHeaderHeight);
            ctx.clip();
            this.paintResources(ctx);
            ctx.restore();
        }

        if (!forOffscreenUse) {
            this.lastPaintDuration = Date.now() - paintStart;
        }

        if (this.props.heightOverlap > 0) {
            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, this.virtualCanvasHeight - this.props.heightOverlap, this.virtualCanvasWidth, this.props.heightOverlap);
        }

        this.props.additionalPainter && this.props.additionalPainter(ctx, this.virtualCanvasHeight - this.props.heightOverlap);
    }

    getTaskBarInset(task) {
        return this.cfg.getTaskBarInset(this.props.model, task);
    }
    /**
     * Liefert die TaskBarBounds, die zum Anzeigen benötigt werden. Hier wird der alignedStart berücksichtigt
     * @param task
     */
    getTaskBarBounds(task) {
        let startX = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
        let endX = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());
        const lineheight = this.props.model.barSize * task.getDisplayData().getExpansionFactor();

        const isPointInTime = task.isPointInTime();
        const shape = this.getShape(task);

        if (isPointInTime && shape!==SPEECHBUBBLE) {
            startX -= this.props.model.getHeight(task.getID()) / 2;
            endX += this.props.model.getHeight(task.getID()) / 2;
        } else {
            if (!task.getStart()) {  //Falls kein Start vorhanden, dann noch mal für den Pfeil etwas abziehen.
                startX -= this.cfg.ARROWHEADLENGTH;
            } else if (!task.getEnd()) {//Falls kein Ende vorhanden, dann noch mal für den Pfeil etwas draufschlagen.
                endX += this.cfg.ARROWHEADLENGTH;
            }
        }

        let labelArr;
        let maxLabelWidth = 0;
        let imgWidth = 0;
        let imgHeight = 0;
        if(!this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
            const icon = this.props.model.getIcon(task);
            if(icon && icon.height>0) {
                imgHeight = (shape === CURLYBRACE ? this.props.model.barSize: lineheight) - 2 * this.getTaskBarInset(task) - 4;
                imgWidth = icon.width * imgHeight / icon.height;

                if(shape === SMALL_PIN_INTERVAL && isPointInTime) {
                    imgWidth = imgWidth / 2;
                    imgHeight = imgHeight / 2;
                } else if(shape === SPEECHBUBBLE) {
                    imgWidth = imgWidth * 2/ 3;
                    imgHeight = imgHeight * 2/ 3;
                }
            }

            this.ctx.font = this.getTimelineBarHeaderFont(task.id);
            let taskLabel = task.getName() && task.getName().length > 0
                ? task.getName() : (task.secname ? task.secname : "");

            if (task.mapDescriptor && task.mapDescriptor.length > 0
                && !this.props.printLayout) {
                taskLabel = "\u25B6 " + taskLabel;
            }

                //this.props.longlabels: Wenn das Label nicht komplett einzeilig in den Balken passt, dann darf es maximal bis zum Ende des Bildschirms gehen
                labelArr = taskLabel ? Helper.textToArrayFromCache(taskLabel)
                    : [];

                //Der längste Text im Array bestimmt die Länge des Labels im horizontalen Fall
                for (let a of labelArr) {
                    let w = Helper.textWidthFromCache(a,
                        this.getTimelineBarHeaderFontSize(task.id), this.ctx);
                    if (w > maxLabelWidth) {
                        maxLabelWidth = w;
                    }
                }
        }

        //Im labelStartX ist schon das Image enthalten, d.h. ein Label startet mit dem Image
        let labelIncludingIconWidth = maxLabelWidth + imgWidth;
        if(this.isPaintShortLabels(task)) {
            labelIncludingIconWidth = 0;
            maxLabelWidth = 0;
        }

        //Curly-Braces, Background-Task or Cloud?->Center label
        if(shape===CURLYBRACE || shape===TRANSPARENTBACK || shape ===CLOUD) {
            const barWidth = endX - startX;
            const labelIncludingIconStartX = startX - (labelIncludingIconWidth - barWidth) / 2
            const labelEndX = labelIncludingIconStartX + labelIncludingIconWidth;

            return new TaskBarBounds(startX, endX, labelIncludingIconStartX + imgWidth + 5,
                labelEndX + 5, labelIncludingIconStartX, imgWidth, imgHeight, labelArr);
        } else if (shape === SPEECHBUBBLE) {
            //Speechbubble
            if(labelIncludingIconWidth<40) {
                labelIncludingIconWidth = 40;
            }
            const labelIncludingIconStartX = startX - labelIncludingIconWidth / 2;
            const labelEndX = labelIncludingIconStartX + labelIncludingIconWidth;
            return new TaskBarBounds(labelIncludingIconStartX-10, labelEndX+10, labelIncludingIconStartX + imgWidth + 5,
                labelEndX + 5, labelIncludingIconStartX, imgWidth, imgHeight, labelArr);
        } else {
            let xOffset;
            let imgOffset = 2;
            if(isPointInTime) {
                xOffset = lineheight + 5;
                imgOffset = + (lineheight - imgWidth)/2;
            } else {
                xOffset = shape === PIN_INTERVAL ? Math.min(imgWidth, endX-startX) : imgWidth;
                if(imgWidth > 0) {
                    xOffset +=10;
                } else {
                    xOffset += 2;
                }
            }
            let labelStart = startX + xOffset;
            if(labelStart < this.resourceHeaderHeight && endX > this.resourceHeaderHeight) {
                labelStart = this.resourceHeaderHeight;
            }
            return new TaskBarBounds(startX, endX, labelStart,
                labelStart + maxLabelWidth, startX + imgOffset, imgWidth, imgHeight, labelArr);
        }
    }

    //Liefert ein ResourceInerval, falls sich an dieser Position eines befindet
    getTask(x, y) {
        if (x > this.resourceHeaderHeight && y > this.timelineHeaderHeight) {

            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);

                let tbb = this.getTaskBarBounds(task);
                let xStart = tbb.getMinStartX();
                if (xStart <= this.virtualCanvasWidth) {
                    let xEnd = tbb.getMaxEndX();
                    if (xEnd > this.resourceHeaderHeight) {
                        let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID()) + this.workResOffset;

                        if (x >= xStart && x <= xEnd && y >= resStartY && y <= (resStartY + this.props.model.getHeight(task.getID()))) {
                            return task;
                        }
                    }
                }
            }
        }
        return null;
    }

    getTaskStartPosition(task) {
        let tbb = this.getTaskBarBounds(task);
        let yCenter = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID()) + this.workResOffset + this.props.model.getHeight(task.getID()) / 2;
        let xCenter = tbb.barStartX;
        return {x: xCenter, y: yCenter};
    }

    getResource(y) {
        if (this.props.model !== undefined && y > this.timelineHeaderHeight) {
            let resModel = this.props.model.getResourceModel();

            resModel.recomputeDisplayData();

            for (let n = 0; n < resModel.size(); n++) {
                let res = resModel.getItemAt(n);
                let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                let resStartY = this.timelineHeaderHeight + relResStartY + this.workResOffset;

                if (y >= resStartY && y < resStartY + this.getModel().getResourceModel().getHeight(res.getID())) {
                    return res;
                }
            }
        }
        return null;
    }

    scrollToResource(res) {
        if (res) {
            let resModel = this.props.model.getResourceModel();

            resModel.recomputeDisplayData();
            this.props.model._setDisplayDataDirty(true);
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());


                //Immer auf die untere Basis der Timeline scrollen, falls diese höher ist als die verfügbare Höhe
                let hightOverlap = this.getModel().getResourceModel().getHeight(res.getID()) + this.timelineHeaderHeight - this.virtualCanvasHeight;
                if (hightOverlap < 0) {
                    hightOverlap = 0;
                }
                this.offsetY = -relResStartY - this.resOffset - hightOverlap;
                this.offsetChanged();
                this.offsetY = 0;
                this.offsetResetted();


            this._updateCanvas();
        }
    }

    scrollToTaskY(task) {
        if (task) {
            let resModel = this.props.model.getResourceModel();

            resModel.recomputeDisplayData();
            this.props.model._setDisplayDataDirty(true);
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const relTaskStartY = this.props.model.getRelativeYStart(task.getID());

            //Immer auf die untere Basis der Timeline scrollen, falls diese höher ist als die verfügbare Höhe
            let hightOverlap = this.props.model.getHeight(task.getID()) + this.timelineHeaderHeight - this.virtualCanvasHeight;

            //console.log("relTaskStartY (hier startet der Vorgang von der ersten Zeile gerechnet): "+relTaskStartY);
            //console.log("hightOverlap: "+hightOverlap);
            //console.log("resOffset (so viel wurde aktuell nach unten gescrolled): "+this.resOffset);

            if (hightOverlap < 0) {
                hightOverlap = 0;
            }


            this.offsetY = -relTaskStartY - this.resOffset - hightOverlap + this.virtualCanvasHeight/2;
            this.offsetChanged();
            this.offsetY = 0;
            this.offsetResetted();

        }
    }

    scrollRelativeY(yOffset) {
        this.offsetY = yOffset;
        this.offsetChanged();
        this.offsetY = 0;
        this.offsetResetted();
    }

    paintTaskBar(ctx, task, col, borderCol) {
        let xStart = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
        if (xStart <= this.virtualCanvasWidth) {
            let xEnd = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());
            //TODO
            //if (xEnd > this.resourceHeaderHeight && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
            if (xEnd > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset;
                let shape = this.getShape(task);
                if (shape === TRANSPARENTBACK || (resStartY + this.props.model.getHeight(task.getID()) - this.getTaskBarInset(task) > this.timelineHeaderHeight && resStartY < this.virtualCanvasHeight)) {
                    let mode = 0;
                    if (task.getStart() && !task.getEnd()) {
                        mode = -1;
                    } else if (task.getEnd() && !task.getStart()) {
                        mode = 1;
                    } else if ((task.isPointInTime())) {
                        mode = 2;
                    }

                    this.paintBar(ctx, col, xStart, xEnd,
                        resStartY + this.getTaskBarInset(task),
                        this.props.model.getHeight(task.getID())
                        - this.getTaskBarInset(task) * 2, mode, false, shape, task, borderCol);

                    let alignedStart = xStart < this.resourceHeaderHeight
                    - 1 ? this.resourceHeaderHeight - 1 : xStart;

                    this.paintIcon(ctx, task, alignedStart, resStartY);

                    if(task.innerEvents) {
                        const borderCol = Helper.isDarkBackground(col) ? "#000" : "#FFF";
                        this.paintInnerTasks(ctx,
                            resStartY + this.props.model.getHeight(task.getID())
                            / 2, this.props.model.getHeight(task.getID()) / 2
                            - this.getTaskBarInset(task), task.innerEvents,
                            xStart, xEnd,
                            shape, borderCol);
                    }
                }
            }
        }
    }


    paintInnerTasks(ctx, resStartY, height, innerEvents, minStart, maxEnd, shape, borderColor) {
        //Für jedes innerEvent auch noch einen Balken innerhalb zeichnen
        if (innerEvents) {
            for (let innerT of innerEvents) {
                let xStart = this.getXPosForTime(this.props.model.getDisplayedStart(innerT).getJulianMinutes());
                if (xStart <= this.virtualCanvasWidth) {
                    let xEnd = this.getXPosForTime(this.props.model.getDisplayedEnd(innerT).getJulianMinutes());
                    if (xEnd > this.resourceHeaderHeight) {
                        let mode = 0;
                        if (innerT.getStart() && !innerT.getEnd()) {
                            mode = -1;
                            maxEnd -= 20;
                        } else if (innerT.getEnd() && !innerT.getStart()) {
                            mode = 1;
                            minStart += 20;
                        } else if (this.props.model.getDisplayedStart(innerT).getJulianMinutes() === this.props.model.getDisplayedEnd(innerT).getJulianMinutes()) {
                            mode = 2;
                        }
                        this.paintBar(ctx, innerT.color || "rgba(200,200,200,0.9)", Math.max(xStart, minStart), Math.min(xEnd, maxEnd), resStartY, height, mode, true, shape, innerT, borderColor);
                    }
                }
            }
        }
    }

    paintTransparentBackground(ctx, task, alignedStart, alignedEnd, col) {
        let res = this.props.model.getResourceModel().getItemByID(task.getResID());
        if (res) {
            let yStart = this.timelineHeaderHeight + this.getModel().getResourceModel().getRelativeYStart(res.getID()) + this.workResOffset;
            let h = this.getModel().getResourceModel().getHeight(res.getID());
            ctx.rect(alignedStart, yStart, alignedEnd - alignedStart, h);
            ctx.fillStyle = this.getGradient(ctx, task, Helper.toTransparent(col, 0.3), alignedStart, alignedEnd);
            ctx.fill();
        }
    }

    paintCharts(ctx, task) {
        let xStart = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
        if (xStart <= this.virtualCanvasWidth) {
            let xEnd = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());
            if (xEnd > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset;
                let alignedStart = xStart < this.resourceHeaderHeight - 1 ? this.resourceHeaderHeight - 1 : xStart;
                let alignedEnd = xEnd > this.virtualCanvasWidth + 1 ? this.virtualCanvasWidth + 1 : xEnd;
                if (task.dataset && task.dataset.length > 0) {
                    let dataset = JSON.parse(task.dataset); //TODO: Cache
                    paintChart(ctx, this.props.model, task, this.getTimelineBarHeaderFontSize(task.id), alignedStart, alignedEnd, resStartY, this.props.model.getHeight(task.getID()), dataset, this, this.cfg);
                }
            }
        }
    }


    getGradient(ctx, task, c, alignedStart, alignedEnd) {
        let gradient = c;
        if(task) {
            let startPrecision = task.getStart() ? task.getStart().getPrecision() : 14;
            let endPrecision = task.getEnd() ? task.getEnd().getPrecision() : 14;


            if (startPrecision < 11 || endPrecision < 11) {
                gradient = ctx.createLinearGradient(alignedStart, 0, alignedEnd, 0);

                let transpCol = Helper.toTransparent(c, 0);

                if (startPrecision < 11) {
                    gradient.addColorStop(0, transpCol);
                    gradient.addColorStop(.1, c);
                }
                if (endPrecision < 11) {
                    gradient.addColorStop(.9, c);
                    gradient.addColorStop(1, transpCol);
                }
            }
        }
        return gradient;
    }

    paintBar(ctx, col, xStart, xEnd, resStartY, height, mode, isInnerEvent, shape, task, borderColor) {
        const paintShadows = this.props.paintShadows && height > 5 && !isInnerEvent && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task));
        if(paintShadows) {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 5;
            ctx.shadowBlur = 10;
        }

        ctx.beginPath();

        if (shape === SMALL_PIN_INTERVAL && !task.isPointInTime()) { //Schmaler Balken
            let barHeight = Math.min(height/2, 5);
            resStartY = resStartY + height - barHeight;
            height = barHeight;
        } else if (shape === CURLYBRACE) {
            height = (this.props.model.barSize - 2 * this.getTaskBarInset(task)) / 2;
        }

        let alignedStart = xStart < -this.virtualCanvasWidth ? -this.virtualCanvasWidth : xStart;
        let alignedEnd = xEnd > this.virtualCanvasWidth *2 ? this.virtualCanvasWidth *2 : xEnd;
        let halfHeight = Math.round(height / 2);
        const rad = 4;

        switch (shape) {
            case 2: //geschweifte Klammer
                if (col) {
                    paintCurlyBrace(ctx, xStart, xEnd, resStartY, height, col)
                }
                break;
            case 3: //Transparenter Hintergrund
                if (col) {
                    this.paintTransparentBackground(ctx, task, alignedStart, alignedEnd, col);
                }
                break;
            case 4: //Stern zeichnen
                paintStar(ctx, task, alignedStart, alignedEnd, resStartY, height, col);
                break;
            case 5: //Kreis zeichnen
                paintCircle(ctx, alignedStart, resStartY, halfHeight, col);
                break;
            case 6: //Wolke zeichnen
                paintCloud(ctx, alignedStart, resStartY, alignedEnd - alignedStart, height, col);
                break;
            case 7: //Sprechblase zeichnen
                const tbb = this.getTaskBarBounds(task);
                paintSpeechBubble(ctx, tbb.barStartX, resStartY, tbb.barEndX - tbb.barStartX, height, col);
                break;
            default:
                switch (mode) {
                    //Start gegeben, aber kein Ende?
                    case -1:
                        if (isInnerEvent) {
                            ctx.moveTo(alignedStart, resStartY);
                            ctx.lineTo(alignedEnd + this.cfg.ARROWHEADLENGTH, resStartY);
                            ctx.lineTo(alignedEnd, resStartY + height);
                            ctx.lineTo(alignedStart, resStartY + height);
                            ctx.lineTo(alignedStart, resStartY);
                        } else {
                            ctx.moveTo(alignedStart + rad , resStartY);
                            ctx.lineTo(alignedEnd, resStartY);
                            ctx.lineTo(alignedEnd + this.cfg.ARROWHEADLENGTH, resStartY + halfHeight);
                            ctx.lineTo(alignedEnd, resStartY + height);
                            ctx.arcTo(alignedStart, resStartY + height, alignedStart, resStartY, rad);
                            ctx.arcTo(alignedStart, resStartY, alignedStart + 3, resStartY, rad);
                        }
                        if (col) {
                            ctx.fillStyle = this.getGradient(ctx,task, col, alignedStart, alignedEnd);
                            ctx.fill();
                        }
                        break;
                    case 1:
                        //Ende gegeben, aber kein Start?
                        if (isInnerEvent) {
                            ctx.moveTo(alignedEnd, resStartY);
                            ctx.lineTo(alignedStart - this.cfg.ARROWHEADLENGTH, resStartY);
                            ctx.lineTo(alignedStart, resStartY + height);
                            ctx.lineTo(alignedEnd, resStartY + height);
                            ctx.lineTo(alignedEnd, resStartY);
                        } else {
                            ctx.moveTo(alignedEnd - rad, resStartY);
                            ctx.lineTo(alignedStart, resStartY);
                            ctx.lineTo(alignedStart - this.cfg.ARROWHEADLENGTH, resStartY + halfHeight);
                            ctx.lineTo(alignedStart, resStartY + height);
                            ctx.arcTo(alignedEnd, resStartY + height, alignedEnd, resStartY, rad);
                            ctx.arcTo(alignedEnd, resStartY, alignedEnd - 3, resStartY, rad);
                        }
                        if (col) {
                            ctx.fillStyle = this.getGradient(ctx,task, col, alignedStart, alignedEnd);
                            ctx.fill();
                        }
                        break;
                    case 2:
                        //Zeitpunkt zeichnen
                        paintPin(ctx, task, alignedStart, alignedEnd, resStartY + (shape === SMALL_PIN_INTERVAL ? height / 4 : 0), shape === SMALL_PIN_INTERVAL ? height / 2 : height, col, !this.props.model.getIcon(task));
                        break;
                    default:
                        if(col) {
                            if (xEnd - xStart <= 1) {
                                ctx.beginPath();
                                ctx.strokeStyle = col;
                                ctx.moveTo(alignedStart, resStartY);
                                ctx.lineTo(alignedStart, resStartY + height);
                                ctx.stroke();
                            } else {
                                if(isInnerEvent) {
                                    //1 px kleiner zeichnen, damit passt das wegen dem Rahmen besser rein
                                    roundedRect(ctx, alignedStart + 1, resStartY + 1,
                                        alignedEnd - alignedStart - 2, height - 2, rad);
                                } else {
                                    roundedRect(ctx, alignedStart, resStartY,
                                        alignedEnd - alignedStart, height, rad);
                                }

                                ctx.fillStyle = this.getGradient(ctx,task, col, alignedStart, alignedEnd);
                                ctx.fill();
                                if(borderColor) {
                                    ctx.lineWidth = isInnerEvent ? 1 : 2;
                                    ctx.strokeStyle = borderColor
                                    ctx.stroke();
                                }
                            }
                        }
                }
        }

        if(paintShadows) {
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowColor = undefined;
            ctx.shadowBlur = 0;
        }
    }

    paintIcon(ctx, task, alignedStart, resStartY) {
        const icon = this.props.model.getIcon(task);
        if (icon) {
            ctx.save();
            if(!(task.getDisplayData().getShape() === SMALL_PIN_INTERVAL && !task.isPointInTime()) && task.getDisplayData().getShape() !== CURLYBRACE) { //Bei der geschweiften Klammer kein clip, beim schmalen Balken auch nicht
                ctx.clip();
            }
            try {
                let startPrecision = task.getStart() ? task.getStart().getPrecision() : 14;
                let endPrecision = task.getEnd() ? task.getEnd().getPrecision() : 14;
                if(startPrecision < 11 || endPrecision < 11) {
                    ctx.globalAlpha = 0.5;
                }
                const tbb = this.getTaskBarBounds(task);

                    const height = this.props.model.getHeight(task.getID());
                    const shape = task.getDisplayData().getShape();
                    if (task.isPointInTime()) {
                        ctx.drawImage(icon, tbb.iconStartX, resStartY + this.getTaskBarInset(task) + (shape === SMALL_PIN_INTERVAL ? height / 4 : 0), tbb.imgWidth, tbb.imgHeight);
                    } else {
                        if(shape === SMALL_PIN_INTERVAL) {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + height - tbb.imgHeight - 3, tbb.imgWidth, tbb.imgHeight - 5);
                        } else if(task.getDisplayData().getShape() === 2) {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + height - tbb.imgHeight +2, tbb.imgWidth, tbb.imgHeight);
                        } else {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + this.getTaskBarInset(task) + 2, tbb.imgWidth, tbb.imgHeight);
                        }
                    }

                ctx.globalAlpha = 1;
            } catch (e) {
                console.log(e);
            }
            ctx.restore();
        }
    }

    formatBarDate(d) {
        if (this.props.dateFormatter) {
            return this.props.dateFormatter(d);
        }
        return LCalFormatter.formatDate(d, true);
    }

    isPaintShortLabels(task) {
        const shape = task.getDisplayData().getShape();
        return this.props.shortLabels && !task.isPointInTime() && (shape === PIN_INTERVAL || shape === SMALL_PIN_INTERVAL);
    }

    paintTaskBarLabel(ctx, task) {
        const tbb = this.getTaskBarBounds(task);
        const txtXStart = tbb.lableStartX;
        const labelArr = tbb.labelArray;

        if (tbb.getMinStartX() <= this.virtualCanvasWidth && tbb.getMaxEndX() > this.resourceHeaderHeight && labelArr && labelArr.length > 0) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset;
                const barHeight = this.props.model.getHeight(task.getID());
                const inset = this.getTaskBarInset(task);
                if (resStartY + barHeight  > this.timelineHeaderHeight
                    && resStartY < this.virtualCanvasHeight
                    && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {

                    ctx.save();
                    ctx.font = this.getTimelineBarHeaderFont(task.id);


                    const lEnd = task.getEnd();

                    let shape = task.getDisplayData().getShape();

                    const LABEL_LINE_HEIGHT = this.getTimelineBarHeaderFontSize(task.id);
                    const SECLABEL_LINE_HEIGHT = this.getTimelineBarSubHeaderFontSize(task.id);

                        //Falls das Label über den Balken hinausgeht, dann einen grauen Hintergrund zeichnen
                        let maxLabelLines = 1;
                        if(shape === SPEECHBUBBLE) {
                            maxLabelLines = Math.max(1, Math.min(labelArr.length, Math.floor(
                                ((barHeight- 2 * inset) * 2 / 3) / LABEL_LINE_HEIGHT)));
                        } else {
                            maxLabelLines = Math.max(1,Math.min(labelArr.length, Math.floor(
                                (barHeight - 2 * inset) / LABEL_LINE_HEIGHT)));
                        }

                        if (maxLabelLines > 0) {
                            let txtYOffset = 0;
                            const totalLabelHeight = maxLabelLines * LABEL_LINE_HEIGHT;
                            if(task.dataset && task.dataset.length > 0) {
                                txtYOffset = barHeight - 2 * inset - this.getTimelineBarHeaderFontSize(task.id) - 0.5 * this.cfg.CHART_INSET;
                            } else if(shape === SPEECHBUBBLE) {
                                txtYOffset = LABEL_LINE_HEIGHT + 3;
                                txtYOffset = (barHeight * 2/3 - inset - totalLabelHeight) / 2 + LABEL_LINE_HEIGHT + 3;
                            } else if(shape === CURLYBRACE) {
                                txtYOffset = LABEL_LINE_HEIGHT + this.props.model.barSize / 2 - 3;
                            } else {
                                //Text in der Mitte des Balkens platzieren
                                txtYOffset = (barHeight - 2*inset - totalLabelHeight) / 2 + LABEL_LINE_HEIGHT + 3;

                                //txtYOffset = LABEL_LINE_HEIGHT + inset;
                            }

                            //nur, wenn der Text abgeschnitten werden soll
                            if(this.isPaintShortLabels(task)) {
                                ctx.beginPath();
                                ctx.rect(tbb.barStartX, resStartY,
                                    tbb.barEndX - tbb.barStartX,
                                    barHeight);
                                ctx.clip();
                            }

                            //Hintergrund hinter Schrift anzeigen?
                            if (tbb.hasLongLabel() && labelArr && !task.isPointInTime() && shape!==SMALL_PIN_INTERVAL && shape !== CURLYBRACE && (this.props.brightBackground ?  task.getDisplayData().getLabelColor() !== "#000" : task.getDisplayData().getLabelColor() !== "#FFF")) {
                                ctx.fillStyle = this.props.brightBackground ? "rgba(255,255,255,0.4)" : "rgba(50,50,50,0.4)";
                                ctx.beginPath();
                                ctx.fillRect(txtXStart, resStartY + txtYOffset - LABEL_LINE_HEIGHT * 0.9, tbb.labelEndX - txtXStart,  LABEL_LINE_HEIGHT * maxLabelLines);
                            }

                            if (labelArr) {
                                ctx.fillStyle = tbb.hasLongLabel() || shape === SMALL_PIN_INTERVAL || shape === CURLYBRACE ?  (this.props.brightBackground ? "#000": "#FFF"): task.getDisplayData().getLabelColor();

                                for (let i = 0; i < maxLabelLines; ++i) {
                                        //ctx.fillText(labelArr[i], txtXStart, resStartY + (i + 1) * LABEL_LINE_HEIGHT + txtYOffset - 2);
                                        ctx.fillText(labelArr[i], txtXStart, resStartY + i * LABEL_LINE_HEIGHT + txtYOffset);

                                }
                            }
                        }



                    ctx.restore();
                }
        }
    }

    paintTaskSelection(ctx, task) {
        let tbb = this.getTaskBarBounds(task);
        let xStart = tbb.getMinStartX();
        if (xStart <= this.virtualCanvasWidth) {
            let xEnd = tbb.getMaxEndX();
            if (xEnd > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID()) + this.workResOffset;

                ctx.save();

                this.ctx.setLineDash([13, 13]);
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.moveTo(xStart - this.getTaskBarInset(task), resStartY);
                ctx.lineTo(xEnd + this.getTaskBarInset(task), resStartY);
                ctx.lineTo(xEnd + this.getTaskBarInset(task), resStartY + this.props.model.getHeight(task.getID()));
                ctx.lineTo(xStart - this.getTaskBarInset(task), resStartY + this.props.model.getHeight(task.getID()));
                ctx.lineTo(xStart - this.getTaskBarInset(task), resStartY);
                ctx.stroke();

                this.ctx.setLineDash([]);
                this.ctx.lineWidth = 1;
                ctx.restore();
            }
        }
    }

    paintMeasureSliders(ctx) {
        if (this.paintMeasureStart && this.paintMeasureEnd) {
            this.paintMeasureSlider(ctx, this.paintMeasureStart, 1);
            this.paintMeasureSlider(ctx, this.paintMeasureEnd, -1);
        }
    }

    paintMeasureSlider(ctx, lcal, direction) {
        let x = this.getXPosForTime(lcal.getJulianMinutes());
        ctx.fillStyle = 'rgba(60,60,60, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        //Nicht relevante Zeiten links und rechts grau hinterlegen
        if (direction === 1) {
            if (x > this.resourceHeaderHeight) {
                ctx.rect(this.resourceHeaderHeight, this.timelineHeaderHeight, x - this.resourceHeaderHeight, this.virtualCanvasHeight - this.timelineHeaderHeight);
            }
        } else {
            if (x < this.virtualCanvasWidth) {
                ctx.rect(x, this.timelineHeaderHeight, this.virtualCanvasWidth - x, this.virtualCanvasHeight - this.timelineHeaderHeight);
            }
        }
        ctx.fill();

        ctx.strokeStyle = 'black';

        //Den angezeigten Zeitstring und dessen Breite bestimmen
        ctx.font = "bold 14px Helvetica, sans-serif";
        var str = LCalFormatter.formatDate(lcal, true) + " " + LCalFormatter.formatTime(lcal);
        var strWidth = Helper.textWidthFromCache(str, this.getTimelineBarHeaderFontSize(), ctx);//.measureText(str).width;

        if (this.props.measureDurationLock) {
            ctx.fillStyle = '#F50057';
        } else {
            ctx.fillStyle = '#F2EC53';
        }

        let lineThickness = 6;
        ctx.beginPath();
        ctx.moveTo(x, this.timelineHeaderHeight);
        ctx.lineTo(x, this.virtualCanvasHeight);
        ctx.lineTo(x - (direction * lineThickness), this.virtualCanvasHeight);
        ctx.lineTo(x - (direction * lineThickness), this.timelineHeaderHeight + 120 + strWidth);
        ctx.lineTo(x - (direction * 40), this.timelineHeaderHeight + 100 + strWidth);
        ctx.lineTo(x - (direction * 40), this.timelineHeaderHeight + 20);
        ctx.lineTo(x - (direction * lineThickness), this.timelineHeaderHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        //Der Pfeil auf dem Slider
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x - (direction * 15), this.timelineHeaderHeight + 40 - 10);
        ctx.lineTo(x - (direction * 25), this.timelineHeaderHeight + 40);
        ctx.lineTo(x - (direction * 15), this.timelineHeaderHeight + 40 + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(x + (direction === 1 ? -15 : 26), this.timelineHeaderHeight + strWidth + 80);
        ctx.rotate(-Math.PI / 2);

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(-5, -17, strWidth + 10, 23);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';

        ctx.fillText(str, 0, 0);
        ctx.restore();
    }

    //Die RessourcenZeitintervalle zeichnen (Tasks, Events, Moments, whatever..)
    paintTransparentShapedTasks(ctx) {
        if (this.props.model) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const shadowFillCol = 'rgba(150, 150, 150, 0.1)';

            //Farbige Balken zeichnen
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (!task.isDeleted() && task.getDisplayData().getShape(task) === 3) {
                    this.paintTaskBar(ctx, task, task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getColor());
                }
            }
        }
    }

    getLargestPaintedX() {
        let maxX = Number.NEGATIVE_INFINITY;
        for (let n = 0; n < this.props.model.size(); n++) {
            let task = this.props.model.getItemAt(n);
            let x = this.getTaskBarBounds(task).getMaxEndX();
            if (x > maxX) {
                maxX = x;
            }
        }
        return maxX;
    }

    //Die RessourcenZeitintervalle zeichnen (Tasks, Events, Moments, whatever..)
    paintTasks(ctx) {
        if (this.props.model !== undefined) {

            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const shadowFillCol = 'rgba(150, 150, 150, 0.1)';

            if(this.props.taskBackgroundPainter) {
                for (let n = 0; n < this.props.model.size(); n++) {
                    let task = this.props.model.getItemAt(n);
                    if (!task.isDeleted()) { //Ausser die Tasks für den transparenten Hintergrund, die werden vorher gezeichnet
                        this.props.taskBackgroundPainter(ctx, this, task);
                    }
                }
            }

            //Farbige Balken zeichnen
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (!task.isDeleted() && task.getDisplayData().getShape(task) !== 3) { //Ausser die Tasks für den transparenten Hintergrund, die werden vorher gezeichnet
                    this.paintTaskBar(ctx, task, task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getColor(), task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getBorderColor());
                }
            }

            //Diagramme zeichnen, falls vorhanden
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (!task.isDeleted()) {
                    this.paintCharts(ctx, task);
                }
            }

            //Die Bezeichnung
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (!task.getDisplayData().isShadowTask( )) {
                    this.paintTaskBarLabel(ctx, task);
                }
            }

            ctx.fillStyle = "#000000";
            //Selektierte Vorgänge zeichnen (Falls keine Schattenvorgänge)
            let ids = this.props.model.getSelectedItemIDs();
            for (let n = 0; n < ids.length; n++) {
                let task = this.props.model.getItemByID(ids[n]);
                if (task && !task.isDeleted() && !task.getDisplayData().isShadowTask()) {
                    this.paintTaskSelection(ctx, task);
                }
            }
        }
    }

    getShape(task) {
        return task.getDisplayData().getShape();
    }

    paintMovedTasks(ctx) {
        if (this.props.model) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            //Farbige Balken zeichnen
            for (let task of this.props.model.getMovedTasks()) {
                if (!task.isDeleted()) {
                    this.paintTaskBar(ctx, task, task.getDisplayData().getColor(), task.getDisplayData().getBorderColor());
                }
            }

            let ids = this.props.model.getSelectedItemIDs();
            for (let task of this.props.model.getMovedTasks()) {
                this.paintTaskBarLabel(ctx, task);
                //Selektierte Vorgänge zeichnen
                if (ids.indexOf(task.getID() >= 0)) {
                    this.paintTaskSelection(ctx, task);
                }
            }
        }
    }

    prePaintResources(ctx) {
        if (this.props.model && this.props.resourcePaintCallback) {
            ctx.save();
            const resHeaderHeight = this.props.headerType === 'overlay'
                ? this.cfg.OVERLAYHEADERWIDTH : this.resourceHeaderHeight;
            let resModel = this.props.model.getResourceModel();

            resModel.recomputeDisplayData();
            this._alignWorkResOffset();

            for (let n = 0; n < resModel.size(); n++) {
                let res = resModel.getItemAt(n);
                let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                let resStartY = this.timelineHeaderHeight + relResStartY
                    + this.workResOffset;
                let resHeight = this.getModel().getResourceModel().getHeight(res.getID());

                    this.props.resourcePaintCallback(ctx, this, res,
                        resHeaderHeight, resStartY, resHeight);
            }
            ctx.restore();
        }
    }

    //Die Ressourcen zeichnen
    paintResources(ctx) {
        if (this.props.model) {

            const resHeaderHeight = this.props.headerType === 'overlay' ? this.cfg.OVERLAYHEADERWIDTH : this.props.headerType === 'inline' ? this.virtualCanvasWidth: this.resourceHeaderHeight;

            let resModel = this.props.model.getResourceModel();

            //ctx.font = this.cfg.resourceMainFont;
            ctx.strokeStyle = "#BBBBBB";

            resModel.recomputeDisplayData();
            this._alignWorkResOffset();

            this.positionCollector = new Map();
            for (let n = 0; n < resModel.size(); n++) {
                let res = resModel.getItemAt(n);
                let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                let resStartY = this.timelineHeaderHeight + relResStartY + this.workResOffset;
                let resHeight = this.getModel().getResourceModel().getHeight(res.getID());

                //nur, wenn noch kein Ereignis eingegeben wurde
                const taskCnt = this.props.model.getItemCntByResourceID(res.getID());

                if (taskCnt === 0 && res.isAdmin && this.props.texts && this.props.texts.presshere) {
                    ctx.font = this.cfg.timelineMainFont;
                    ctx.fillStyle = "#999999";
                    ctx.fillText(this.props.texts.presshere, resHeaderHeight + 10, resStartY + resHeight / 2 + 4);
                }
                ctx.save();

                let icon = resModel.getIcon(res);

                if (this.props.headerType === 'default') {
                    ctx.beginPath();
                    ctx.rect(0, resStartY, this.resourceHeaderHeight, resHeight);
                    ctx.clip();
                }

                if(this.props.resourcePainter) {
                    this.props.resourcePainter(ctx, this.timelineHeaderHeight, res, resHeaderHeight, resHeight,
                        resStartY, icon, this.props.headerType, this.props.printLayout, this.positionCollector, this.cfg)
                } else {
                    paintResource(ctx, this.timelineHeaderHeight, res, resHeaderHeight, resHeight,
                        resStartY, icon, this.props.headerType, this.props.printLayout, this.positionCollector, this.cfg);
                }

                ctx.restore();
            }

            //Trennstrich zwischen den Ressourcen
            ctx.beginPath();
            if (this.props.headerType === 'default') {
                ctx.moveTo(resHeaderHeight, this.timelineHeaderHeight);
                ctx.lineTo(resHeaderHeight, this.virtualCanvasHeight);
            }
            let resStartY = 0;
            let resHeight = 0;
            ctx.lineWidth = 2;
            for (let n = 0; n < resModel.size(); n++) {
                let res = resModel.getItemAt(n);
                let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                resStartY = this.timelineHeaderHeight + relResStartY + this.workResOffset;
                resHeight = this.getModel().getResourceModel().getHeight(res.getID());

                ctx.moveTo(0, resStartY);
                ctx.lineTo(this.virtualCanvasWidth, resStartY);
            }


            ctx.moveTo(0, resStartY + resHeight);
            ctx.lineTo(this.virtualCanvasWidth, resStartY + resHeight);

            ctx.stroke();
        }
    }

    paintScrollBar(ctx) {
        if (this.props.model) {
            let resModel = this.props.model.getResourceModel();

            ctx.fillStyle = "rgba(200, 200, 200, 0.5)";

            let totalScrollbarHeight = this.virtualCanvasHeight - this.timelineHeaderHeight;
            let totalResHeight = resModel.getTotalResourceHeight();
            let factor = totalScrollbarHeight / totalResHeight;
            let barSize = totalScrollbarHeight * factor;

            if (barSize < totalScrollbarHeight) {
                ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
                ctx.fillRect(this.virtualCanvasWidth - 10, this.timelineHeaderHeight, 10, this.virtualCanvasHeight - this.timelineHeaderHeight);

                ctx.fillStyle = "rgba(50, 50, 50, 0.7)";
                ctx.fillRect(this.virtualCanvasWidth - 10, -this.workResOffset * factor + this.timelineHeaderHeight, 10, barSize);
            }
        }
    }
}

export default Timeline;
