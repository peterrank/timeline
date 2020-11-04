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
import paintDocument from "./painter/tasks/documentpainter";
import paintArrow from "./painter/tasks/arrowpainter";
import paintCross from "./painter/tasks/crosspainter";
import paintCircle from "./painter/tasks/circlepainter";
import paintPin from "./painter/tasks/pinpainter";
import roundedRect from "./painter/roundrectpainter";
import paintCloud from "./painter/tasks/cloudpainter";
import paintSpeechBubble from "./painter/tasks/speechbubblepainter";
import paintCircleMiddleText from "./painter/tasks/circleMiddleTextPainter";
import paintOnlyBaseline from "./painter/tasks/baselinepainter";
import {paintResource} from "./painter/resourcepainter";
import {
    paintChart,
    paintChartMouseOverLabel
} from "./painter/tasks/chartpainter";
import getNextSnapTime from "./utils/snaptime";
import config from "./timelineconfig";
import paintTimelineHeader from "./painter/timelineheaderpainter";
import {minimumGroupWidth} from "../model/taskmodel";


export const PIN_INTERVAL = 0;
export const SMALL_PIN_INTERVAL = 1;
export const CURLYBRACE = 2;
export const TRANSPARENTBACK = 3;

export const STAR = 4;
export const SMALL_STAR = 104;

export const CIRCLE = 5;
export const SMALL_CIRCLE = 105;

export const CLOUD = 6;
export const SPEECHBUBBLE = 7;

export const DOCUMENT = 8;
export const SMALL_DOCUMENT = 108;

export const SUN = 9;
export const SMALL_SUN = 109;

export const CROSS = 10;
export const SMALL_CROSS = 110;

export const ARROW_LEFT = 11;
export const SMALL_ARROW_LEFT = 111;

export const ARROW_RIGHT = 12;
export const SMALL_ARROW_RIGHT = 112;

export const CIRCLE_MIDDLETEXT = 13;

export const BASELINE = 14;

/**
 * Hier wird die konkrete Timeline gezeichnet
 **/
class Timeline extends BasicTimeline {
    constructor(props) {
        super(props);

        //Überschreiben der Werte aus der Config
        this.cfg = {...config, ...this.props.config}

        this.previousBarSize = -1;

        this.movedTasksChangeCallback = () => this._updateCanvas();

        this.resOffset = 0; //Offset für die Ressourcen
        this.workResOffset = 0;

        this.beforeMovementJulMin = 0;
        this.beforeMovementY = 0;

        this.animationTimeoutHandle = 0;
        this.fullPaintHandle = null;

        this.lastPaintDuration = 0;

        this.centerPinchTime = null;
        this.pinchWorkResOffset = null;
        this.pinchBarSize = null;
        this.centerPinchY = null;

        this.oldWidth = null;
        this.oldHeight = null;

        this.getTaskBarBounds = this.getTaskBarBounds.bind(this);

        this.lockDuration = 0;

        this.initMeasureSliders(this.props);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', {willReadFrequently: true});
        this.offscreenImage = null;

        this.mouseLCal = null;

        this.maxDateOnMousePositionWidth = 0;

        this.mouseOverTimeHeader = false;

        this.lastTimelineEvent = null;

        this.virtualCanvasWidth = this.props.width;
        this.virtualCanvasHeight = this.props.height;

        this.markedBarGroup = null;

        this.props.model.setInlineResourceHeaderHeight(this.props.headerType === 'inline' ? this.cfg.INLINE_RES_HEIGHT : 0);
        this.props.model.setHideResourceHeaderIfOnlyOneRes(this.cfg.hideResourceHeaderIfOnlyOneRes);

        this.positionCollector = new Map();
    }


    //Größe der Haupt-Balkenbeschriftung
    getTimelineBarHeaderFontSize(taskID) {
        let task = this.props.model.getItemByID(taskID);
        let fontSizeFactor = 1;
        if(task) {
            fontSizeFactor = task.getDisplayData().getFontSizeFactor();
        }
        return this.props.model.barSize / 2 * fontSizeFactor;   //  font size basierend auf der Balkenbreite (Standard = 100)
    }

    getTimelineBarHeaderFont(taskID) {
        let task = this.props.model.getItemByID(taskID);
        let fontTemplate = "";
        if(task) {
            if(task.getDisplayData().getBold()) {
                fontTemplate += "bold ";
            }
            if(task.getDisplayData().getItalic()) {
                fontTemplate += "italic ";
            }
        }
        return fontTemplate + (this.getTimelineBarHeaderFontSize(taskID)) + 'px sans-serif'; // set font
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
        this.dataChangeCallback = () => {
            if(this.previousBarSize >= 0 && this.previousBarSize !== this.props.model.barSize) {
                const oldTotalResHeight = this.props.model.getResourceModel().getTotalResourceHeight();
                const oldWorkResOffset = this.workResOffset;
                const oldDistanceToBaseline = -oldWorkResOffset + this.virtualCanvasHeight;
                const baselineFactor = oldDistanceToBaseline / oldTotalResHeight;

                this.props.model._setDisplayDataDirty(true);
                this.props.model.recomputeDisplayData(this.getTaskBarBounds);

                //Welche Stelle soll die unterste sein?
                this.workResOffset = -((this.props.model.getResourceModel().getTotalResourceHeight() * baselineFactor) - this.virtualCanvasHeight);
            }
            this.previousBarSize = this.props.model.barSize;

            this.offsetResetted();
            this._updateCanvas();
        }
        this.props.model.addDataChangeCallback(this.dataChangeCallback);
        this.props.model.addMovedTasksChangeCallback(this.movedTasksChangeCallback); //TODO: Wenn auf separates Canvas gezeichnet wird, dann auch hier das Update entsprechend ändern

        this.timelineHeaderHeight = this.props.headerHeight || 55;
        if(this.getModel().getResourceModel().getAll().length > 0) {
            let res = this.getModel().getResourceModel().getAll().slice(-1)[0];
            if (res) {
                this.scrollToResource(res);
            }
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        return null; // State wird in componentDidUpdate aktualisiert
    }

    componentDidUpdate(prevProps) {
        if(prevProps.model !== this.props.model) {
            this.props.model.removeDataChangeCallback(this.dataChangeCallback);
            this.props.model.removeMovedTasksChangeCallback(this.movedTasksChangeCallback);
            this.props.model.addDataChangeCallback(this.dataChangeCallback);
            this.props.model.addMovedTasksChangeCallback(this.movedTasksChangeCallback);
            this.props.model._setDisplayDataDirty(true);
        }
        if(prevProps.headerType !== this.props.headerType) {
            this.props.model.setInlineResourceHeaderHeight(this.props.headerType === 'inline' ? this.cfg.INLINE_RES_HEIGHT : 0);
            this.props.model._setDisplayDataDirty(true);
        }
        if(prevProps.model.hideResourceHeaderIfOnlyOneRes !== this.cfg.hideResourceHeaderIfOnlyOneRes) {
            this.props.model.setHideResourceHeaderIfOnlyOneRes(
                this.cfg.hideResourceHeaderIfOnlyOneRes);
            this.props.model._setDisplayDataDirty(true);
        }

        if(prevProps.headerHeight !== this.props.headerHeight) {
            this.timelineHeaderHeight = this.props.headerHeight || 55;
            this.props.model._setDisplayDataDirty(true);
        }
        this.initMeasureSliders(this.props);

        this.props.model.recomputeDisplayData(this.getTaskBarBounds);
        this._updateCanvas();
    }

    componentWillUnmount() {
        clearTimeout(this.animationTimeoutHandle);
        this.props.model.removeDataChangeCallback(this.dataChangeCallback);
        this.props.model.removeMovedTasksChangeCallback(this.movedTasksChangeCallback);
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
        let mousePos = Helper.getCursorPosition(this.getCanvasRef(), evt);
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
        const mousePos = Helper.getCursorPosition(this.getCanvasRef(), evt);
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
            if (!this.activeMeasureSlider) {
                this.setWorkResOffset(this.resOffset + this.offsetY);
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

    setWorkResOffset(offset) {
        this.workResOffset = offset;
        this.props.model._setDisplayDataDirty(true);
        this.props.model.recomputeDisplayData(this.getTaskBarBounds);
        this._updateCanvas();
    }

    swipeEnded() {
        this.props.model._setDisplayDataDirty(true);
        this.props.model.recomputeDisplayData(this.getTaskBarBounds);
        this._updateCanvas();
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
            this.setWorkResOffset(this.virtualCanvasHeight - refHeight);
        } else if (this.workResOffset > 0) {
            this.setWorkResOffset(0);
        }
    }

    getDisplayedMinutes() {
        return this.workStartTime.getDistanceInMinutes(this.workEndTime);
    }

    animateTo(startLCal, endLCal, animationCompletedCB, doAnimation) {
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

        if(doAnimation) {
            this._animateTo(startLCal, endLCal, 0, 10,
                animationCompletedCB);
        } else {
            this._animateTo(startLCal, endLCal, 0, 1, animationCompletedCB);
        }
    }

    saveOffscreenImage() {
        this.beforeMovementJulMin = this.workStartTime.getJulianMinutes();
        this.beforeMovementY = this.workResOffset;
        if(this.props.workWithOffscreenImage) {
            this.paint(true);
            this.offscreenCtx.save();
            this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
            try {
                this.offscreenImage = this.offscreenCtx.getImageData(
                    this.resourceHeaderHeight, this.timelineHeaderHeight,
                    this.props.width - this.resourceHeaderHeight,
                    this.props.height - this.timelineHeaderHeight);
            } catch(err) {
                //Maybe there is a cors problem when using localhost
            }
            this.offscreenCtx.restore();
        }
    }

    paintFromOffscreen() {
        try {
            if (this.offscreenImage) {
                this.ctx.save();
                //Zunächst wird wie beim normalen paint der Timelineheader gezeichnet.
                //Es werden aber keine Ereignisse gezeichnet
                this.ctx.clearRect(0, 0, this.virtualCanvasWidth,
                    this.virtualCanvasHeight);
                paintTimelineHeader(this.ctx,
                    this.cfg,
                    this.timeZone,
                    this.getMinutesPerPixel(),
                    this.workStartTime,
                    this.workEndTime,
                    this.resourceHeaderHeight,
                    this.timelineHeaderHeight,
                    this.virtualCanvasWidth,
                    this.virtualCanvasHeight,
                    this.getXPosForTime,
                    this.props.languageCode);
                this.ctx.restore();

                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                let distX = this.getXPosForTime(this.beforeMovementJulMin)
                    - this.getXPosForTime(
                        this.workStartTime.getJulianMinutes());
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

                this.ctx.putImageData(this.offscreenImage, x, y, dirtyX, dirtyY,
                    dirtyWidth, dirtyHeight);
                this.ctx.restore();

                this.ctx.save();
                //Zeichnen der Messlineale
                //this.paintMeasureSliders(this.ctx);

                //aktuelle Zeit zeichnen
                let now = LCalHelper.getNowMinutes();
                let nowX = this.getXPosForTime(now);
                if (nowX > this.resourceHeaderHeight) {
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
                this.ctx.rect(0, this.timelineHeaderHeight,
                    this.virtualCanvasWidth,
                    this.virtualCanvasHeight - this.timelineHeaderHeight);
                this.ctx.clip();
                this.paintResources(this.ctx);
                this.ctx.restore();
            }
        } catch(ex) {
            console.log(ex);
        }
    }


    _updateCanvas() {
        //this.props.model._setDisplayDataDirty(true);
        //this.props.model.getResourceModel()._setDisplayDataDirty(true);
        if (!this.isInMovement()) {
            super._updateCanvas();
        } else {
            if (!this.props.workWithOffscreenImage || this.lastPaintDuration < 10) {
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
            this.overlayMessage = "Verwende Strg+Mausrad zum Zoomen der Timeline";
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

                    this.paintTaskSelection(this.ctx2, this.lastTimelineEvent.getTask(), 2);

                    if (this.lastTimelineEvent.getTask().dataset && this.lastTimelineEvent.getTask().dataset.length > 0) {
                        //Es handelt sich um ein Diagramm
                        const resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(this.lastTimelineEvent.getTask().getID()) + this.workResOffset;
                        paintChartMouseOverLabel(this.ctx2, this.getTimelineBarHeaderFontSize(this.lastTimelineEvent.getTask().id), this.props.model, this.lastTimelineEvent.getTask(), this.mouseLCal, resStartY, this.getXPosForTime, this, this.cfg);
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

            if(totalSteps === 1) {
                SELF._animateTo(targetStartLCal, targetEndLCal, 1, 1, animationCompletedCB);
            } else {
                this.animationTimeoutHandle = setTimeout(function () {
                    step++;
                    SELF._animateTo(targetStartLCal, targetEndLCal, step,
                        totalSteps, animationCompletedCB);
                }, 17);
            }
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

    zoom(deltaY, offsetFromStartX) {
        var timeForPixel = this.getTimeForXPos(offsetFromStartX);

        let scale = 1 - Math.min(9, Math.abs(deltaY)) * 0.01;
        if (deltaY < 0) {
            scale = 1 / scale;
        }

        let zoomTotalTime = Math.round((this.workEndTime.getJulianMinutes() - this.workStartTime.getJulianMinutes()) / scale);

        if (zoomTotalTime > 1 && zoomTotalTime < 30000000000000000) {
            this.props.model.barSize *= scale;

            //TODO: Auf welcher Ressurce steht der Mauscursor und wie viel Prozent dieser Ressource ist er vom Start der Ressource entfernt?
            //Oder steht der Cursor vielleicht auf einer Task? Dann ist diese relevant

            const oldTotalResHeight = this.getModel().getResourceModel().getTotalResourceHeight();
            let oldCursorOffsetY = this.lastTimelineEvent._y  - this.workResOffset - this.timelineHeaderHeight;
            let oldOffsetPercentage = oldCursorOffsetY / oldTotalResHeight;

            super.zoom(deltaY, offsetFromStartX);

            var origDurationToCenter = timeForPixel - this.workStartTime.getJulianMinutes();
            var newStart = this.workStartTime.getJulianMinutes() - origDurationToCenter / scale + origDurationToCenter;

            this.workStartTime.setJulianMinutes(newStart);
            this.workEndTime.setJulianMinutes(newStart + zoomTotalTime);


            this.getModel()._setDisplayDataDirty(true);
            this.getModel().recomputeDisplayData(this.getTaskBarBounds);


            let totalResHeight = this.getModel().getResourceModel().getTotalResourceHeight();
            let newCursorOffsetY = totalResHeight * oldOffsetPercentage + this.timelineHeaderHeight;
            this.setWorkResOffset(- (newCursorOffsetY - this.lastTimelineEvent._y));

            this.offsetResetted();

            this._updateCanvas();

            this._fireZoomChanged();
            this._fireOffsetChanged();
        }
    }

    startPinch(centerX, centerY) {
        super.startPinch(centerX, centerY);
        this.centerPinchTime = this.getTimeForXPos(centerX);
        this.centerPinchY = centerY;
        this.pinchWorkResOffset = this.workResOffset;
        this.pinchBarSize = this.props.model.barSize;

        this.pinchResourceHeight = this.getModel().getResourceModel().getTotalResourceHeight();
        let oldCursorOffsetY = this.centerPinchY  - this.pinchWorkResOffset - this.timelineHeaderHeight;
        this.pinchOffsetPercentage = oldCursorOffsetY / this.pinchResourceHeight;

    }

    pinch(scale) {
        let zoomTotalTime = Math.round((this.canvasEndTime.getJulianMinutes() - this.canvasStartTime.getJulianMinutes()) / scale);

        let timeToCenter = this.centerPinchTime - this.canvasStartTime.getJulianMinutes();
        let newStart = this.canvasStartTime.getJulianMinutes() - timeToCenter / scale + timeToCenter;
        let newEnd = newStart + zoomTotalTime;

        if (zoomTotalTime > 1 && zoomTotalTime < 30000000000000000) {
            this.workStartTime.setJulianMinutes(newStart);
            this.workEndTime.setJulianMinutes(newEnd);

            const oldBarSize = this.props.model.barSize;
            this.props.model.barSize = Math.min(1000, Math.max(1, this.pinchBarSize * scale));

            if(oldBarSize !== this.props.model.barSize) {
                let totalResHeight = this.pinchResourceHeight * scale;
                let newCursorOffsetY = totalResHeight * this.pinchOffsetPercentage + this.timelineHeaderHeight;
                this.setWorkResOffset(-(newCursorOffsetY - this.centerPinchY));
            }
            this._fireZoomChanged();
            this._updateCanvas();
        }
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

            const barWidth = this.maxDateOnMousePositionWidth + 10;
            const halfBarWidth = barWidth / 2;
            //const halfArrowWidth = 10;
            const offset = -14;
            const height = 32;

            //Nur, wenn die Maus schon mal bewegt wurde (also nicht, wenn das Gerät nur touch kann)
            if (!isTouchDevice()) {
                this.ctx2.fillStyle = "#FFF";
                if (!this.mouseOverTimeHeader) {
                    this.ctx2.beginPath();

                    paintSpeechBubble(this.ctx2, mouseX - halfBarWidth, this.timelineHeaderHeight - 25, barWidth, height, this.cfg.currentDateOnMousePositionColor, this.cfg.currentDateOnMousePositionBorderColor);

                    this.ctx2.fillText(dateTxt, mouseX -halfBarWidth + 5, this.timelineHeaderHeight - 10);
                    this.ctx2.fillText(durationTxt, mouseX + halfBarWidth - durationWidth - 5, this.timelineHeaderHeight - 10);
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

                    if(groupInfo.xEnd - groupInfo.xStart < minimumGroupWidth) {
                        groupInfo.xEnd = groupInfo.xStart + minimumGroupWidth;
                    }
                }
            }
        }
        return group2GroupInfo;
    }

    paintBarGroups(ctx, group2GroupInfo) {
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

            ctx.fillStyle = "#FFF";
            ctx.font = this.getGroupFont();

            const txt = (this.props.printLayout ? "" : (this.props.model.isCollapsed(group) ? '\u25BC' : '\u25B2')) + gi.name;

            let txtStart = Math.max(this.resourceHeaderHeight, gi.xStart + 5);

            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowColor="black";
            ctx.shadowBlur=3;
            ctx.fillText(txt, txtStart, gi.yStart + 2 + this.getGroupFontSize());
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowColor="black";
            ctx.shadowBlur=0;

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
        try {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            let paintStart = Date.now();
            let ctx = forOffscreenUse ? this.offscreenCtx : this.ctx;

            ctx.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);

            if (this.props.brightBackground) {
                ctx.fillStyle = "#FFF";
                ctx.fillRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);
            }
            ctx.lineWidth = 1;
            paintTimelineHeader(ctx,this.cfg,
                this.timeZone,
                this.getMinutesPerPixel(),
                this.workStartTime,
                this.workEndTime,
                this.resourceHeaderHeight,
                this.timelineHeaderHeight,
                this.virtualCanvasWidth,
                this.virtualCanvasHeight,
                this.getXPosForTime,
                this.props.languageCode);

            //Ereignisse Zeichnen
            ctx.save();
            ctx.rect(this.resourceHeaderHeight, this.timelineHeaderHeight, this.virtualCanvasWidth - this.resourceHeaderHeight, this.virtualCanvasHeight - this.timelineHeaderHeight);
            ctx.clip();

            ctx.lineWidth = 3;

            this.prePaintResources(ctx);

            const group2GroupInfo = this.getGroup2GroupInfo();

            const sortedPosition2HighestYMap = this.getSortedPosition2HighestYMap();
            this.paintDecorationBackground(ctx, sortedPosition2HighestYMap);
            this.paintTransparentShapedTasks(ctx, group2GroupInfo);
            this.paintBarGroups(ctx, group2GroupInfo);
            this.paintConnections(ctx);
            this.paintTasks(ctx, group2GroupInfo);
            this.paintMovedTasks(ctx, group2GroupInfo);
            this.paintDecorationForeground(ctx, sortedPosition2HighestYMap);

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
        } catch(ex) {
            console.log(ex);
        }
    }

    getTaskBarInset(task) {
        return this.cfg.getTaskBarInset(this.props.model, task);
    }

    isSmallShape(shape) {
        return shape === SMALL_PIN_INTERVAL || shape === SMALL_STAR || shape
            === SMALL_ARROW_LEFT || shape === SMALL_ARROW_RIGHT || shape
            === SMALL_CIRCLE || shape === SMALL_CROSS || shape
            === SMALL_DOCUMENT || shape === SMALL_SUN;
    }

    isPointInTimeShape(task) {
        const shape = this.getShape(task);
        const isPointInTime = task.isPointInTime() || (shape !== BASELINE && shape !== PIN_INTERVAL && shape !== SMALL_PIN_INTERVAL && shape !== TRANSPARENTBACK && shape !== CURLYBRACE) ;
        return isPointInTime;
    }

    /**
     * Liefert die TaskBarBounds, die zum Anzeigen benötigt werden. Hier wird der alignedStart berücksichtigt
     * @param task
     */
    getTaskBarBounds(task) {
        const shape = this.getShape(task);
        const isPointInTime = this.isPointInTimeShape(task) ;

        const expansionFactor = isPointInTime && this.isSmallShape(shape) ? 1 : task.getDisplayData().getExpansionFactor();
        const lineheight = this.props.model.barSize * expansionFactor;

        let labelArr;
        let maxLabelWidth = 0;
        let imgWidth = 0;
        let imgHeight = 0;
        if(!this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
            const icon = this.props.model.getIcon(task);
            if(icon && icon.height>0) {
                imgHeight = (this.props.model.barSize * (shape === CURLYBRACE ? 1 : task.getDisplayData().getExpansionFactor()));
                let widthFactor =  icon.width / icon.height;

                if(this.isSmallShape(shape) && isPointInTime) {
                    imgHeight = imgHeight / 2;
                } else if(shape === SPEECHBUBBLE) {
                    imgHeight = Math.max(imgHeight /2, 0);
                } else if(shape === CIRCLE_MIDDLETEXT) {
                    imgHeight = Math.max(imgHeight * 2/ 3 - 5, 0);
                } else if(shape === BASELINE) {
                    imgHeight = Math.max(imgHeight - 10, 0);
                } else if (shape === PIN_INTERVAL && !isPointInTime) {
                    imgHeight = imgHeight * 2 / 3;
                }

                imgWidth = imgHeight * widthFactor;

            }

            this.ctx.font = this.getTimelineBarHeaderFont(task.id);
            let taskLabel = task.getName() && task.getName().length > 0
                ? task.getName() : (task.secname ? task.secname : "");

            //this.props.longlabels: Wenn das Label nicht komplett einzeilig in den Balken passt, dann darf es maximal bis zum Ende des Bildschirms gehen
            labelArr = taskLabel ? Helper.textToArrayFromCache(taskLabel)
                : [];

            //Der längste Text im Array bestimmt die Länge des Labels im horizontalen Fall
            for (let a of labelArr) {
                let w = Helper.textWidthFromCache(a, this.ctx);
                if (w > maxLabelWidth) {
                    maxLabelWidth = w;
                }
            }
        }

        let barStartX = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
        let barEndX = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());

        if (!isPointInTime) {
            if (!task.getStart()) {  //Falls kein Start vorhanden, dann noch mal für den Pfeil etwas abziehen.
                barStartX -= this.cfg.ARROWHEADLENGTH;
            } else if (!task.getEnd()) {//Falls kein Ende vorhanden, dann noch mal für den Pfeil etwas draufschlagen.
                barEndX += this.cfg.ARROWHEADLENGTH;
            }
        }
        //Curly-Braces, Background-Task or Cloud?->Center label
        if(shape===CURLYBRACE || shape===TRANSPARENTBACK || shape ===CLOUD) {
            //Im labelStartX ist schon das Image enthalten, d.h. ein Label startet mit dem Image
            let labelIncludingIconWidth = maxLabelWidth + imgWidth;

            const barWidth = barEndX - barStartX;
            const labelIncludingIconStartX = barStartX - (labelIncludingIconWidth - barWidth) / 2
            const labelEndX = labelIncludingIconStartX + labelIncludingIconWidth;

            return new TaskBarBounds(barStartX, barEndX, labelIncludingIconStartX + imgWidth + 5,
                labelEndX + 5, labelIncludingIconStartX, imgWidth, imgHeight, labelArr);
        } else {
            let labelXoffset, baselineMidX, totalWidth;
            let imgOffset = imgHeight / 6;
            let centerOffset;
            if(isPointInTime) {
                switch(shape) {
                    case SPEECHBUBBLE:
                        imgOffset = imgHeight / 6;
                        baselineMidX = (barStartX + barEndX) / 2;
                        totalWidth = 4 * imgOffset + imgWidth + maxLabelWidth;

                        if(baselineMidX - totalWidth/2 < barStartX) {
                            barStartX = baselineMidX - totalWidth/2;
                        }
                        if(baselineMidX + totalWidth/2 > barEndX) {
                            barEndX = baselineMidX + totalWidth/2;
                        }
                        labelXoffset = 2* imgOffset + imgWidth ;
                        break;
                    case CIRCLE_MIDDLETEXT:
                        baselineMidX = (barStartX + barEndX) / 2;
                        totalWidth = imgOffset + imgWidth + maxLabelWidth;

                        if(baselineMidX - totalWidth/2 < barStartX) {
                            barStartX = baselineMidX - totalWidth/2;
                        }
                        if(baselineMidX + totalWidth/2 > barEndX) {
                            barEndX = baselineMidX + totalWidth/2;
                        }
                        centerOffset = (barEndX-barStartX)/2;
                        imgOffset = centerOffset - totalWidth / 2;
                        labelXoffset = imgOffset + imgWidth + 10;
                        break;
                    case BASELINE:
                        //Das Image wird mittig vom Termin angezeigt
                        baselineMidX = (barStartX + barEndX) / 2;
                        if(baselineMidX - lineheight/2 < barStartX) {
                            barStartX = baselineMidX - lineheight/2;
                        }
                        if(baselineMidX + lineheight/2 > barEndX) {
                            barEndX = baselineMidX + lineheight/2;
                        }
                        centerOffset = (barEndX-barStartX)/2;
                        imgOffset = centerOffset - imgWidth / 2;
                        labelXoffset = 5 + imgOffset + imgWidth ;
                        break;
                    default:
                        //Das Image muss hier nicht berücksichtigt werden, da es durch die Figur geclipped wird
                        baselineMidX = (barStartX + barEndX) / 2;
                        if(baselineMidX - lineheight/2 < barStartX) {
                            barStartX = baselineMidX - lineheight/2;
                        }
                        if(baselineMidX + lineheight/2 > barEndX) {
                            barEndX = baselineMidX + lineheight/2;
                        }
                        centerOffset = (barEndX-barStartX)/2;
                        labelXoffset = 5 + centerOffset + lineheight / 2;
                        imgOffset = centerOffset - imgWidth / 2;

                }
            } else {
                labelXoffset = shape === PIN_INTERVAL ? Math.min(imgWidth, barEndX - barStartX) : imgWidth;
                if(imgWidth>0) {
                    labelXoffset += 2 * imgOffset;
                } else {
                    labelXoffset += lineheight / 5;
                }
            }
            let labelStart = barStartX + labelXoffset;
            if(!isPointInTime && labelStart < this.resourceHeaderHeight && barEndX > this.resourceHeaderHeight) {
                labelStart = this.resourceHeaderHeight;
            }
            if(this.isPaintShortLabels(task) && labelStart + maxLabelWidth > barEndX) {
                maxLabelWidth = barEndX - labelStart;
            }

            return new TaskBarBounds(barStartX, barEndX, labelStart,
                labelStart + maxLabelWidth, barStartX + imgOffset, imgWidth, imgHeight, labelArr);
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
            let resHeight = this.getModel().getResourceModel().getHeight(res.getID());
            let hightOverlap = resHeight + this.timelineHeaderHeight - this.virtualCanvasHeight;
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

    paintTaskBar(ctx, task, col, borderCol, group2GroupInfo) {
        const tbb = this.getTaskBarBounds(task);

        if (tbb.getMinStartX() <= this.virtualCanvasWidth) {
            //TODO
            //if (xEnd > this.resourceHeaderHeight && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
            if (tbb.getMaxEndX() > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset;
                let shape = this.getShape(task);
                if (shape === TRANSPARENTBACK || (resStartY + this.props.model.getHeight(task.getID()) - this.getTaskBarInset(task) > this.timelineHeaderHeight && resStartY < this.virtualCanvasHeight)) {
                    let mode = 0;
                    if (task.getStart() && !task.getEnd()) {
                        mode = -1;
                    } else if (task.getEnd() && !task.getStart()) {
                        mode = 1;
                    } else if ((this.isPointInTimeShape(task))) {
                        mode = 2;
                    }
                    const xStart = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
                    const xEnd = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());

                    this.paintBar(ctx, col, xStart, xEnd,
                        resStartY + this.getTaskBarInset(task),
                        this.props.model.getHeight(task.getID())
                        - this.getTaskBarInset(task) * 2, mode, false, shape, task, borderCol, group2GroupInfo, tbb.lableStartX, tbb.labelEndX);

                    this.paintIcon(ctx, task, resStartY);

                    if(task.innerEvents) {
                        const borderCol = Helper.isDarkBackground(col) ? "#000" : "#FFF";
                        this.paintInnerTasks(ctx,
                            resStartY + this.props.model.getHeight(task.getID())
                            / 2, this.props.model.getHeight(task.getID()) / 2
                            - this.getTaskBarInset(task), task.innerEvents,
                            xStart, xEnd,
                            shape, borderCol, group2GroupInfo);
                    }
                }
            }
        }
    }


    paintInnerTasks(ctx, resStartY, height, innerEvents, minStart, maxEnd, shape, borderColor, group2GroupInfo) {
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
                        this.paintBar(ctx, innerT.color || "rgba(200,200,200,0.9)", Math.max(xStart, minStart), Math.min(xEnd, maxEnd), resStartY, height, mode, true, shape, innerT, borderColor, group2GroupInfo);
                    }
                }
            }
        }
    }

    paintTransparentBackground(ctx, task, alignedStart, alignedEnd, resStartY, height, col, group2GroupInfo, labelStartX, labelEndX) {
        let res = this.props.model.getResourceModel().getItemByID(task.getResID());
        if (res) {
            let yStart;
            let h;
            if(task.getDisplayData().getBarGroup() && task.getDisplayData().getBarGroup().length > 0 && group2GroupInfo) {
                const barGroup = task.getResID()+"@"+task.getDisplayData().getBarGroup();
                const groupInfo = group2GroupInfo.get(barGroup);
                yStart = groupInfo.yStart;
                h = groupInfo.yEnd - yStart;
            } else {
                yStart = this.timelineHeaderHeight + this.getModel().getResourceModel().getRelativeYStart(res.getID()) + this.workResOffset;
                h = this.getModel().getResourceModel().getHeight(res.getID());
            }
            ctx.beginPath();
            ctx.rect(alignedStart, yStart, alignedEnd - alignedStart, h);

            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowColor = undefined;
            ctx.shadowBlur = 0;

            ctx.fillStyle = Helper.toTransparent(col, 0.3);

            ctx.fill();

            ctx.beginPath();
            let arrowWidth = Math.min(10, height/2);
            ctx.strokeStyle = Helper.isDarkBackground(col) ? "#FFF" : "#000";

            if(typeof labelStartX !== 'undefined' &&  typeof labelEndX !== 'undefined') {
                const labelStartX2 = labelStartX - 5;
                const labelEndX2 = labelEndX + 5;
                if(labelStartX2 > alignedStart) {
                    ctx.moveTo(alignedStart, resStartY + height - arrowWidth);
                    ctx.lineTo(labelStartX2, resStartY + height - arrowWidth);
                }
                if(labelEndX2 < alignedEnd) {
                    ctx.moveTo(labelEndX2, resStartY + height - arrowWidth);
                    ctx.lineTo(alignedEnd, resStartY + height - arrowWidth);
                }
                if (alignedEnd - alignedStart > 10) {
                    ctx.moveTo(alignedStart + arrowWidth,
                        resStartY + height - 2 * arrowWidth);
                    ctx.lineTo(alignedStart, resStartY + height - arrowWidth);
                    ctx.lineTo(alignedStart + arrowWidth, resStartY + height);

                    ctx.moveTo(alignedEnd - arrowWidth,
                        resStartY + height - 2 * arrowWidth);
                    ctx.lineTo(alignedEnd, resStartY + height - arrowWidth);
                    ctx.lineTo(alignedEnd - arrowWidth, resStartY + height);
                }
                ctx.stroke();
            }

            ctx.rect(alignedStart, resStartY, alignedEnd - alignedStart, height);
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
                    try {
                        let dataset = JSON.parse(task.dataset); //TODO: Cache
                        paintChart(ctx, this.cfg.getTaskBarInset(this.props.model, task), this.getTimelineBarHeaderFontSize(task.id), alignedStart, alignedEnd, resStartY, this.props.model.getHeight(task.getID()), dataset, this.getXPosForTime, this.cfg);
                    } catch(ex) {
                        console.log(ex);
                    }
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

    paintBar(ctx, col, xStart, xEnd, resStartY, height, mode, isInnerEvent, shape, task, borderColor, group2GroupInfo, labelStartX, labelEndX) {
        height = Math.max(height, 0.1);
        const paintShadows = this.props.paintShadows && height > 5 && !isInnerEvent && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task));
        if(paintShadows) {
            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 6;
        }

        ctx.beginPath();

        //Bei Zeitpunkten mit kleiner Darstellung gilt: Bei einfacher expansion wird die Hälfte angezeigt. Bei mehr als einfacher expansion wird die singleHeight angezeigt
        const singleHeight = this.props.model.barSize - 2 * this.getTaskBarInset(task);
        let smallHeight = Math.min(singleHeight, height);
        //Vorher prüfen, ob es getDisplayData als Funktion gibt (innerTasks haben das nicht)
        if(task.getDisplayData && task.getDisplayData().getExpansionFactor()===1) {
            smallHeight = Math.round(Math.min(height, singleHeight/2));
        }
        if (shape === SMALL_PIN_INTERVAL && !task.isPointInTime()) { //Schmaler Balken
            let barHeight = Math.min(height/2, 5);
            resStartY = resStartY + height - barHeight;
            height = barHeight;
        } else if (shape === CURLYBRACE) {
            height = Math.round(Math.min(height, singleHeight/2));
        }


        let alignedStart = xStart < -this.virtualCanvasWidth ? -this.virtualCanvasWidth : xStart;
        let alignedEnd = xEnd > this.virtualCanvasWidth *2 ? this.virtualCanvasWidth *2 : xEnd;
        let halfHeight = Math.round(height / 2);

        // Radius als Prozentsatz der kleineren Seite berechnen
        let rad = Math.min(height, xEnd - xStart) * 0.2; // z.B. 20% der kleineren Seite

        // Sicherstellen, dass der Radius nicht zu groß wird
        rad = Math.min(rad, Math.min(height, xEnd - xStart)/2);

        let tbb2;
        switch (shape) {
            case CURLYBRACE: //geschweifte Klammer
                if (col) {
                    paintCurlyBrace(ctx, xStart, xEnd, resStartY, height, col)
                }
                break;
            case TRANSPARENTBACK: //Transparenter Hintergrund
                if (col) {
                    this.paintTransparentBackground(ctx, task, alignedStart, alignedEnd, resStartY, height, col, group2GroupInfo, labelStartX, labelEndX);
                }
                break;
            case STAR: //Stern zeichnen
                paintStar(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col, 6);
                break;
            case CIRCLE: //Kreis zeichnen
                paintCircle(ctx, xStart, xEnd, resStartY, resStartY + height, halfHeight, height, col);
                break;
            case CLOUD: //Wolke zeichnen
                paintCloud(ctx, alignedStart, resStartY,alignedEnd - alignedStart, height, col);
                break;
            case SPEECHBUBBLE: //Sprechblase zeichnen
                let tbb = this.getTaskBarBounds(task);
                paintSpeechBubble(ctx, tbb.barStartX, resStartY,tbb.barEndX - tbb.barStartX, height, col, null, xStart, xEnd);
                break;
            case CIRCLE_MIDDLETEXT: //Sprechblase zeichnen
                tbb2 = this.getTaskBarBounds(task);
                paintCircleMiddleText(ctx, tbb2.barStartX, resStartY,tbb2.barEndX - tbb2.barStartX, height, col, null, xStart, xEnd);
                break;
            case DOCUMENT: //Dokument zeichnen
                paintDocument(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col);
                break;
            case SUN: //Sonne zeichnen
                paintStar(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col, 16);
                break;
            case CROSS: //Kreuz zeichnen
                paintCross(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col);
                break;
            case ARROW_LEFT: //Pfeil zeichnen
                paintArrow(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col, 'left');
                break;
            case ARROW_RIGHT: //Pfeil zeichnen
                paintArrow(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col, 'right');
                break;
            case BASELINE: //nur Baseline zeichnen
                tbb2 = this.getTaskBarBounds(task);
                paintOnlyBaseline(ctx, tbb2.barStartX, resStartY,tbb2.barEndX - tbb2.barStartX, height, col, null, xStart, xEnd);
                break;

            case SMALL_STAR: //kleinen Stern zeichnen
                paintStar(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col, 6);
                break;
            case SMALL_CIRCLE: //kleinen Kreis zeichnen
                paintCircle(ctx, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, Math.round(smallHeight / 2), smallHeight, col);
                break;
            case SMALL_DOCUMENT: //kleines Dokument zeichnen
                paintDocument(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col);
                break;
            case SMALL_SUN: //kleine Sonne zeichnen
                paintStar(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col, 16);
                break;
            case SMALL_CROSS: //kleines Kreuz zeichnen
                paintCross(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col);
                break;
            case SMALL_ARROW_LEFT: //kleinen Pfeil links zeichnen
                paintArrow(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col, 'left');
                break;
            case SMALL_ARROW_RIGHT: //kleinen Pfeil rechts zeichnen
                paintArrow(ctx, task, xStart, xEnd, resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col, 'right');
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
                        if(shape === SMALL_PIN_INTERVAL) {
                            paintPin(ctx, task, xStart, xEnd,resStartY + Math.round(smallHeight / 2), resStartY + height, smallHeight, col, !this.props.model.getIcon(task));
                        } else {
                            paintPin(ctx, task, xStart, xEnd, resStartY, resStartY + height, height, col, !this.props.model.getIcon(task));
                        }
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

    clipToRoundedCorners(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        // Clipping-Pfad setzen
        ctx.clip();
    }

    paintIcon(ctx, task, resStartY) {
        const icon = this.props.model.getIcon(task);
        if (icon) {
            ctx.save();
            if(!(task.getDisplayData().getShape() === SMALL_PIN_INTERVAL && !task.isPointInTime()) && task.getDisplayData().getShape() !== CURLYBRACE) { //Bei der geschweiften Klammer kein clip, beim schmalen Balken auch nicht
                ctx.clip();
            }
            try {
                const tbb = this.getTaskBarBounds(task);
                const height = this.props.model.getHeight(task.getID());
                const shape = task.getDisplayData().getShape();
                // Radius als Prozentsatz der kleineren Seite berechnen
                let rad1 = tbb.imgHeight * 0.2; // z.B. 20% der kleineren Seite
                // Sicherstellen, dass der Radius nicht zu groß wird
                rad1 = Math.min(rad1,  tbb.imgWidth/2);

                if (this.isPointInTimeShape(task)) {
                    if(shape === SPEECHBUBBLE) {
                        const iconStartY = resStartY + tbb.imgHeight / 4;
                        this.clipToRoundedCorners(ctx, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight, rad1);

                        ctx.drawImage(icon, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight);
                    } else if(shape === SMALL_PIN_INTERVAL || shape === SMALL_STAR || shape === SMALL_CIRCLE || shape === SMALL_CROSS || shape === SMALL_SUN || shape === SMALL_DOCUMENT || shape === SMALL_ARROW_LEFT || shape === SMALL_ARROW_RIGHT) {
                        ctx.drawImage(icon, tbb.iconStartX, resStartY + tbb.imgHeight /2, tbb.imgWidth, tbb.imgHeight);
                    } else {
                        if(shape == CIRCLE_MIDDLETEXT) {
                            const iconStartY = resStartY + this.getTaskBarInset(task);
                            this.clipToRoundedCorners(ctx, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight, rad1);
                        }
                        ctx.drawImage(icon, tbb.iconStartX, resStartY + this.getTaskBarInset(task), tbb.imgWidth, tbb.imgHeight);
                    }
                } else {
                    if(shape === SMALL_PIN_INTERVAL) {
                        const iconStartY = resStartY + height - tbb.imgHeight - 3;
                        this.clipToRoundedCorners(ctx, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight, rad1);
                        ctx.drawImage(icon, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight - 5);
                    } else if(shape === CURLYBRACE) {
                        const iconStartY = resStartY + height - tbb.imgHeight;
                        this.clipToRoundedCorners(ctx, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight, rad1);
                        ctx.drawImage(icon, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight);
                    } else {
                        const iconStartY = resStartY + tbb.imgHeight / 4;
                        this.clipToRoundedCorners(ctx, tbb.iconStartX, iconStartY, tbb.imgWidth, tbb.imgHeight, rad1);
                        ctx.drawImage(icon, tbb.iconStartX + 1, iconStartY, tbb.imgWidth, tbb.imgHeight);
                    }
                }

                //ctx.globalAlpha = 1;
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
        return LCalFormatter.formatDate(d, true, this.props.languageCode);
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

                //const lEnd = task.getEnd();

                let shape = task.getDisplayData().getShape();

                const LABEL_LINE_HEIGHT = this.getTimelineBarHeaderFontSize(task.id);
                //const SECLABEL_LINE_HEIGHT = this.getTimelineBarSubHeaderFontSize(task.id);

                //Falls das Label über den Balken hinausgeht, dann einen grauen Hintergrund zeichnen
                let maxLabelLines = 1;
                if(shape === SPEECHBUBBLE || shape == CIRCLE_MIDDLETEXT || shape == BASELINE) {
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
                        txtYOffset = barHeight - 2 * inset -  0.5 * this.cfg.CHART_INSET;
                    } else if(shape === SPEECHBUBBLE || shape === CIRCLE_MIDDLETEXT || shape === BASELINE) {
                        txtYOffset = LABEL_LINE_HEIGHT + 3;
                        txtYOffset = (barHeight * 2/3 - inset - totalLabelHeight) / 2 + LABEL_LINE_HEIGHT + 3;
                    } else if(shape === CURLYBRACE) {
                        txtYOffset = LABEL_LINE_HEIGHT + this.props.model.barSize / 2 - 3;
                    } else {
                        //Text in der Mitte des Balkens platzieren
                        txtYOffset = (barHeight - 2*inset - totalLabelHeight) / 2 + LABEL_LINE_HEIGHT + 3;
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
                    if (tbb.hasLongLabel() && labelArr && !task.isPointInTime() && shape!==SMALL_PIN_INTERVAL && shape !== CURLYBRACE && (this.props.brightBackground ?  Helper.isDarkBackground(task.getDisplayData().getColor()) : !Helper.isDarkBackground(task.getDisplayData().getColor()))) {
                        ctx.fillStyle = this.props.brightBackground ? "rgba(255,255,255,0.4)" : "rgba(50,50,50,0.4)";
                        ctx.beginPath();
                        ctx.fillRect(txtXStart, resStartY + txtYOffset - LABEL_LINE_HEIGHT * 0.9, tbb.labelEndX - txtXStart,  LABEL_LINE_HEIGHT * maxLabelLines);
                    }

                    if (labelArr) {
                        ctx.fillStyle = tbb.hasLongLabel() || shape === SMALL_PIN_INTERVAL || shape === CURLYBRACE || (task.isPointInTime() && shape !== SPEECHBUBBLE) ?
                            (this.props.brightBackground ? "rgba(0,0,0,"+task.getDisplayData().getTransparency()+")": "rgba(255,255,255,"+task.getDisplayData().getTransparency()+")")
                            : (Helper.isDarkBackground(task.getDisplayData().getColor()) ? "rgba(255,255,255,"+task.getDisplayData().getTransparency()+")" : "rgba(0,0,0,"+task.getDisplayData().getTransparency()+")");

                        for (let i = 0; i < maxLabelLines; ++i) {
                            ctx.fillText(labelArr[i], txtXStart , resStartY + i * LABEL_LINE_HEIGHT + txtYOffset);
                        }
                    }
                }

                ctx.restore();
            }
        }
    }

    paintTaskSelection(ctx, task, lineWidth) {
        let tbb = this.getTaskBarBounds(task);
        let xStart = tbb.getMinStartX();
        if (xStart <= this.virtualCanvasWidth) {
            let xEnd = tbb.getMaxEndX();

            if (xEnd > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID()) + this.workResOffset;

                ctx.save();

                ctx.setLineDash([13, 13]);
                ctx.lineWidth = lineWidth || 4;
                ctx.strokeStyle = "#E00";
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
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowColor="black";
        ctx.shadowBlur=3;
        let x = this.getXPosForTime(lcal.getJulianMinutes());
        ctx.fillStyle = 'rgba(60,60,60, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        //Nicht relevante Zeiten links und rechts grau hinterlegen
        if (direction === 1) {
            if (x > this.resourceHeaderHeight) {
                ctx.rect(this.resourceHeaderHeight, this.timelineHeaderHeight + 2, x - this.resourceHeaderHeight, this.virtualCanvasHeight - this.timelineHeaderHeight -2);
            }
        } else {
            if (x < this.virtualCanvasWidth) {
                ctx.rect(x, this.timelineHeaderHeight + 2, this.virtualCanvasWidth - x, this.virtualCanvasHeight - this.timelineHeaderHeight -2);
            }
        }
        ctx.fill();

        //ctx.strokeStyle = 'rgb(0, 0, 0, 0.5)';

        //Den angezeigten Zeitstring und dessen Breite bestimmen
        ctx.font = "bold 14px Helvetica, sans-serif";
        var str = LCalFormatter.formatDate(lcal, true, this.props.languageCode) + " " + LCalFormatter.formatTime(lcal, this.props.languageCode);
        var strWidth = Helper.textWidthFromCache(str, ctx);//.measureText(str).width;

        if (this.props.measureDurationLock) {
            ctx.fillStyle = '#F50057';
        } else {
            ctx.fillStyle = 'rgb(255, 255, 255, 0.5)';
        }

        const lineThickness = 2;
        const startY = this.timelineHeaderHeight + 3;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, this.virtualCanvasHeight);
        ctx.lineTo(x - (direction * lineThickness), this.virtualCanvasHeight);
        ctx.lineTo(x - (direction * lineThickness), startY + 120 + strWidth);
        ctx.lineTo(x - (direction * 40), startY + 100 + strWidth);
        ctx.lineTo(x - (direction * 40), startY + 20);
        ctx.lineTo(x - (direction * lineThickness), startY);
        ctx.closePath();
        ctx.fill();
        //ctx.stroke();

        //Der Pfeil auf dem Slider
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(x - (direction * 15), startY + 40 - 10);
        ctx.lineTo(x - (direction * 25), startY + 40);
        ctx.lineTo(x - (direction * 15), startY + 40 + 10);
        ctx.closePath();
        ctx.fill();
        //ctx.stroke();

        ctx.save();
        ctx.translate(x + (direction === 1 ? -15 : 26), startY + strWidth + 80);
        ctx.rotate(-Math.PI / 2);

        /*ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(-5, -17, strWidth + 10, 23);
        ctx.fill();
        ctx.stroke();*/

        ctx.fillStyle = 'white';


        ctx.fillText(str, 0, 0);
        ctx.restore();
    }

    //Die RessourcenZeitintervalle zeichnen (Tasks, Events, Moments, whatever..)
    paintTransparentShapedTasks(ctx, group2GroupInfo) {
        if (this.props.model) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const shadowFillCol = 'rgba(150, 150, 150, 0.1)';

            //Farbige Balken zeichnen
            this.props.model.getAll().filter(task => !task.isDeleted() && task.getDisplayData().getShape(task) === 3).forEach(task => {
                this.paintTaskBar(ctx, task, task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getColor(), null, group2GroupInfo);
            });
        }
    }

    getSortedPosition2HighestYMap() {
        let position2HighestY = new Map();
        if (this.props.model) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            this.props.model.getAll().forEach(task => {
                let highestY = position2HighestY.get(task.getResID() + "_" + task.getDisplayData().getPosition());
                let height = this.props.model.getHeight(task.getID());
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID()) + this.workResOffset;

                if (!highestY || highestY < resStartY + height + 5) {
                    position2HighestY.set(task.getResID() + "_" + task.getDisplayData().getPosition(), resStartY + height + 5);
                }
            });
        }
        let sortedPosition2HighestYMap = new Map([...position2HighestY.entries()].sort((a, b) => {
            return a[1] - b[1];
        }));

        const getResEnd = (resId) => {
            let relResStartY = this.getModel().getResourceModel().getRelativeYStart(resId);
            let resStartY = this.timelineHeaderHeight + relResStartY
                + this.workResOffset;
            let resHeight = this.getModel().getResourceModel().getHeight(resId);
            return resStartY + resHeight;
        }

        let lastKey = null;
        let lastResId = null;
        for (let [key] of sortedPosition2HighestYMap) {
            let currentResId = key.split('_')[0];
            if (lastKey !== null) {
                lastResId = lastKey.split('_')[0];
                if (lastResId !== currentResId) {
                    sortedPosition2HighestYMap.set(lastKey, getResEnd(lastResId*1));
                }
            }
            lastKey = key;
        }

        if (lastKey !== null) {
            sortedPosition2HighestYMap.set(lastKey, getResEnd(lastResId*1));
        }

        return sortedPosition2HighestYMap;
    }

    paintDecorationBackground(ctx, sortedPosition2HighestYMap) {
        if (this.props.model) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#FFFFFF";
            let lowestY = 0;
            for(let [key, highestY] of sortedPosition2HighestYMap.entries()) {
                    const [resID, position] = key.split("_");
                    if (resID) {
                        const res = this.props.model.getResourceModel().getItemByID(resID * 1);
                        if (res && res.decorationdescriptor) {
                            const descriptor = Helper.getObjectFromCache(res.decorationdescriptor);
                            if (descriptor && descriptor.positions) {
                                const posDesc = descriptor.positions[position];
                                if (posDesc && posDesc['bgColor']) {
                                    ctx.beginPath();
                                    ctx.fillStyle = posDesc['bgColor'];
                                    ctx.fillRect(0, lowestY, this.virtualCanvasWidth, (highestY - lowestY));

                                    ctx.moveTo(0, lowestY);
                                    ctx.lineTo(this.virtualCanvasWidth, lowestY);

                                    ctx.moveTo(0, highestY);
                                    ctx.lineTo(this.virtualCanvasWidth, highestY);
                                    ctx.stroke();
                                }
                            }
                        }
                    }
                    lowestY = highestY;
            }
        }
    }

    paintDecorationForeground(ctx, sortedPosition2HighestYMap) {
        if (this.props.model) {
            const decorationWidth = Math.max(Math.min(this.props.model.barSize * 1.5, 60), 20);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#FFFFFF";
            let lowestY = 0;
            for(let [key, highestY] of sortedPosition2HighestYMap.entries()) {
                const [resID, position] = key.split("_");
                if (resID) {
                    const res = this.props.model.getResourceModel().getItemByID(resID * 1);
                    if (res && res.decorationdescriptor) {
                        const descriptor = Helper.getObjectFromCache(res.decorationdescriptor);
                        if (descriptor && descriptor.positions) {
                            const posDesc = descriptor.positions[position];
                            if (posDesc && posDesc['headerColor'] && posDesc['text']) {
                                ctx.beginPath();
                                ctx.fillStyle = posDesc['headerColor'];

                                const resHeaderHeight = this.props.headerType === 'overlay'
                                    ? 0 : this.resourceHeaderHeight;
                                const decorationHeight = highestY - lowestY;

                                ctx.fillRect(resHeaderHeight, lowestY, decorationWidth, decorationHeight);

                                ctx.moveTo(0, highestY);
                                ctx.lineTo(this.virtualCanvasWidth, highestY);

                                ctx.moveTo(0, lowestY);
                                ctx.lineTo(this.virtualCanvasWidth, lowestY);

                                ctx.stroke();

                                ctx.save();
                                ctx.rect(resHeaderHeight, lowestY, decorationWidth, decorationHeight);
                                ctx.clip();

                                ctx.fillStyle = "#FFFFFF";
                                const fontHeight = Math.max(2, Math.round(decorationWidth / 2));
                                ctx.font = fontHeight + "px "+this.cfg.positionDecorationFont;

                                const str = posDesc['text'];

                                const textWidth = Helper.textWidthFromCache(str, ctx);
                                const textHeight = Helper.textHeightFromCache(ctx);
                                let textStartX = (decorationHeight - textWidth) / 2;
                                textStartX = Math.max(textStartX, 0);
                                let textStartY = (decorationWidth - textHeight) / 2;
                                textStartY = Math.max(textStartY, 0);
                                ctx.translate(resHeaderHeight + decorationWidth, highestY);
                                ctx.rotate(-Math.PI / 2);
                                ctx.fillText(str, textStartX, -textStartY);
                                ctx.restore();
                            }
                        }
                    }
                }
                lowestY = highestY;
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
    paintTasks(ctx, group2GroupInfo) {
        if (this.props.model !== undefined) {

            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            const shadowFillCol = 'rgba(150, 150, 150, 0.1)';

            if(this.props.taskBackgroundPainter) {
                for (let n = 0; n < this.props.model.size(); n++) {
                    let task = this.props.model.getItemAt(n);
                    if (!task.isDeleted()) {
                        this.props.taskBackgroundPainter(ctx, this, task);
                    }
                }
            }

            //Farbige Balken zeichnen
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (!task.isDeleted() && task.getDisplayData().getShape(task) !== 3) { //Ausser die Tasks für den transparenten Hintergrund, die werden vorher gezeichnet
                    this.paintTaskBar(ctx, task, task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getColor(), task.getDisplayData().isShadowTask() ? shadowFillCol : task.getDisplayData().getBorderColor(), group2GroupInfo);
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
                    this.paintTaskSelection(ctx, task, 4);
                }
            }
        }
    }

    paintConnectionText(ctx, startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY, posPercent, fontSize, fillStyle, text) {
        if(text && text.length > 0) {
            let t = posPercent / 100;
            let x = (1 - t) * (1 - t) * (1 - t) * startX + 3 * (1 - t) * (1 - t) * t * cp1X + 3 * (1 - t) * t * t * cp2X + t * t * t * endX;
            let y = (1 - t) * (1 - t) * (1 - t) * startY + 3 * (1 - t) * (1 - t) * t * cp1Y + 3 * (1 - t) * t * t * cp2Y + t * t * t * endY;

            // Berechnen Sie die Tangente an diesem Punkt.
            let dx = 3 * (1 - t) * (1 - t) * (cp1X - startX) + 6 * (1 - t) * t * (cp2X - cp1X) + 3 * t * t * (endX - cp2X);
            let dy = 3 * (1 - t) * (1 - t) * (cp1Y - startY) + 6 * (1 - t) * t * (cp2Y - cp1Y) + 3 * t * t * (endY - cp2Y);

            // Drehen Sie den Kontext entsprechend der Tangente.
            let winkel = Math.atan2(dy, dx);

            // Konvertiere Winkel von Radiant in Grad
            let winkelGrad = (winkel * (180 / Math.PI) + 360) % 360;

            // Prüfe ob Text auf dem Kopf stehen würde (Winkel zwischen 90° und 270°)
            let textUpsideDown = winkelGrad > 90 && winkelGrad < 270;

            ctx.save();
            ctx.translate(x, y);

            if (textUpsideDown) {
                // Drehe Text um 180° wenn er auf dem Kopf stehen würde
                ctx.rotate(winkel + Math.PI);
            } else {
                ctx.rotate(winkel);
            }

            // Zeichne den Text
            let myFontSize = Math.round(fontSize + ctx.lineWidth - 5);
            ctx.font = myFontSize + "px " + this.cfg.connectionFont;
            ctx.fillStyle = fillStyle;
            ctx.fillText(text, -ctx.measureText(text).width / 2, -myFontSize);

            ctx.restore();
        }
    }

    drawArrowhead(ctx, bar1StartX, startTaskY, control1X, control1Y, control2X, control2Y, bar2StartX, endTaskY, fillStyle, size) {
        // Berechnen Sie den Winkel der Tangente an den Endpunkt der Kurve
        let t = 1;
        let dx = 3*(1-t)*(1-t)*control1X + 6*(1-t)*t*control2X + 3*t*t*bar2StartX - (3*(1-t)*(1-t)*bar1StartX + 6*(1-t)*t*control1X + 3*t*t*control2X);
        let dy = 3*(1-t)*(1-t)*control1Y + 6*(1-t)*t*control2Y + 3*t*t*endTaskY - (3*(1-t)*(1-t)*startTaskY + 6*(1-t)*t*control1Y + 3*t*t*control2Y);
        let angle = Math.atan2(dy, dx);

        // Zeichnen Sie die Pfeilspitze
        ctx.save();
        ctx.fillStyle = fillStyle
        ctx.translate(bar2StartX, endTaskY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(0, -size/2);
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    paintConnections(ctx) {
        if (this.props.model !== undefined) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);
            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if(task.connections) {
                    task.connections.forEach(conn => {
                        conn.id = conn.id * 1;
                        let secTask = this.props.model.getItemByID(conn.id);
                        if(secTask) {
                            ctx.strokeStyle = conn.fillStyle;

                            let tbbStart = this.getTaskBarBounds(task);
                            let tbbEnd = this.getTaskBarBounds(secTask);

                            //Wo beginnt die Linie und wo endet sie?
                            const bar1Width = tbbStart.barEndX - tbbStart.barStartX;
                            let startTaskX = tbbStart.barStartX + conn.startLinePosPercent * bar1Width  / 100;

                            const bar2Width = tbbEnd.barEndX - tbbEnd.barStartX;
                            let endTaskX = tbbEnd.barStartX + conn.endLinePosPercent * bar2Width  / 100;

                            let startTaskY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset;// + this.props.model.getHeight(task.getID())/2;
                            let endTaskY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(secTask.getID())  + this.workResOffset;//  + this.props.model.getHeight(secTask.getID())/2;

                            const arrowHeadSize = this.props.model.barSize / 2;

                            let beziercontrolStartX = 0;
                            let beziercontrolEndX = 0;
                            let beziercontrolStartY = 0;
                            let beziercontrolEndY = 0;

                            conn.startLinePosPercent = conn.startLinePosPercent * 1;
                            conn.endLinePosPercent = conn.endLinePosPercent * 1;
                            conn.lineWidth = conn.lineWidth * 1;

                            const bezierControlWidth = Math.min(300, Math.abs(endTaskX - startTaskX));
                            const bezierControlHeight = Math.min(300, Math.abs(endTaskY - startTaskY));

                            if(conn.startLinePosPercent === 0 || conn.startLinePosPercent === 100) {
                                if(conn.startLinePosPercent === 0) {
                                    beziercontrolStartX = -bezierControlWidth;
                                } else {
                                    beziercontrolStartX = bezierControlWidth;
                                }
                                startTaskY += this.props.model.getHeight(task.getID())/2;
                            } else {
                                if(startTaskY < endTaskY) {
                                    startTaskY += this.props.model.getHeight(task.getID());
                                    beziercontrolStartY = bezierControlHeight;
                                } else {
                                    beziercontrolStartY = - bezierControlHeight;
                                }
                            }
                            if(conn.endLinePosPercent === 0 || conn.endLinePosPercent === 100) {
                                if(conn.endLinePosPercent === 0) {
                                    beziercontrolEndX = -bezierControlWidth;
                                    endTaskX -= arrowHeadSize;
                                } else {
                                    beziercontrolEndX = bezierControlWidth;
                                    endTaskX += arrowHeadSize;
                                }
                                endTaskY += this.props.model.getHeight(secTask.getID())/2;
                            } else {
                                if(endTaskY < startTaskY) {
                                    beziercontrolEndY = bezierControlHeight;
                                    endTaskY += this.props.model.getHeight(secTask.getID()) + arrowHeadSize;
                                } else {
                                    beziercontrolEndY = -bezierControlHeight;
                                    endTaskY -= arrowHeadSize;
                                }
                            }

                            ctx.beginPath();
                            ctx.lineWidth = (conn.lineWidth || 2) * this.props.model.barSize / 23;

                            ctx.moveTo(startTaskX, startTaskY);
                            let control1X = startTaskX + beziercontrolStartX;
                            let control1Y = startTaskY + beziercontrolStartY;
                            let control2X = endTaskX + beziercontrolEndX;
                            let control2Y = endTaskY + beziercontrolEndY;

                            ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, endTaskX, endTaskY);
                            ctx.stroke();
                            this.drawArrowhead(ctx, startTaskX, startTaskY, control1X, control1Y, control2X, control2Y, endTaskX, endTaskY, conn.fillStyle, arrowHeadSize);


                            //ctx, startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY, posPercent, text
                            this.paintConnectionText(ctx, startTaskX, startTaskY, control1X, control1Y, control2X, control2Y, endTaskX, endTaskY, conn.textPosPercent || 50, conn.fontSize || this.props.model.barSize, conn.fillStyle || "#CCC", conn.name);
                        }
                    })
                }
            }
        }
    }

    getShape(task) {
        return task.getDisplayData().getShape();
    }

    paintMovedTasks(ctx, group2GroupInfo) {
        if (this.props.model) {
            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            //Farbige Balken zeichnen
            for (let task of this.props.model.getMovedTasks()) {
                if (!task.isDeleted()) {
                    this.paintTaskBar(ctx, task, task.getDisplayData().getColor(), task.getDisplayData().getBorderColor(), group2GroupInfo);
                }
            }

            let ids = this.props.model.getSelectedItemIDs();
            for (let task of this.props.model.getMovedTasks()) {
                this.paintTaskBarLabel(ctx, task);
                //Selektierte Vorgänge zeichnen
                if (ids.indexOf(task.getID() >= 0)) {
                    this.paintTaskSelection(ctx, task, 3);
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

            if(!this.cfg.hideResourceHeaderIfOnlyOneRes || resModel.size()>1) {
                for (let n = 0; n < resModel.size(); n++) {
                    let res = resModel.getItemAt(n);
                    let relResStartY = this.getModel().getResourceModel().getRelativeYStart(
                        res.getID());

                    let resStartY = this.timelineHeaderHeight + relResStartY
                        + this.workResOffset;
                    let resHeight = this.getModel().getResourceModel().getHeight(
                        res.getID());

                    //nur, wenn noch kein Ereignis eingegeben wurde
                    const taskCnt = this.props.model.getItemCntByResourceID(
                        res.getID());

                    if (taskCnt === 0 && res.isAdmin && this.props.texts
                        && this.props.texts.presshere) {
                        ctx.font = this.cfg.timelineMainFont;
                        ctx.fillStyle = "#999999";
                        ctx.fillText(this.props.texts.presshere,
                            resHeaderHeight + 10,
                            resStartY + resHeight / 2 + 4);
                    }
                    ctx.save();

                    let icon = resModel.getIcon(res);

                    if (this.props.headerType === 'default') {
                        ctx.beginPath();
                        ctx.rect(0, resStartY, this.resourceHeaderHeight,
                            resHeight);
                        ctx.clip();
                    }

                    if (this.props.resourcePainter) {
                        this.props.resourcePainter(ctx,
                            this.timelineHeaderHeight, res, resHeaderHeight,
                            resHeight,
                            resStartY, icon, this.props.headerType,
                            this.props.printLayout, this.positionCollector,
                            this.cfg)
                    } else {
                        paintResource(ctx, this.timelineHeaderHeight, res,
                            resHeaderHeight, resHeight,
                            resStartY, icon, this.props.headerType,
                            this.props.printLayout, this.positionCollector,
                            this.cfg);
                    }

                    ctx.restore();
                }
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

            let height = this.virtualCanvasHeight - resStartY - resHeight;
            if(height > 0) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(0, resStartY + resHeight, this.virtualCanvasWidth, height);
            }
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
