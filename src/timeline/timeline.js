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
import {paintChart, paintChartMouseOverLabel} from "./painter/tasks/chartpainter";
import getNextSnapTime from "./utils/snaptime";
import cfg from "./timelineconfig";


const PIN_INTERVAL = 0;
const SMALL_PIN_INTERVAL = 1;
const CURLYBRACE = 2;
const TRANSPARENTBACK = 3;
const STAR = 4;
const CIRCLE = 5;
const CLOUD = 6;
const SPEECHBUBBLE = 7;

/**
 * Hier wird die konkrete Timeline gezeichnet
 **/
class Timeline extends BasicTimeline {
    constructor(props) {
        super(props);

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

        this.oldOrientation = null;
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

        this.virtualCanvasWidth = this.props.horizontalOrientation ? this.props.width : this.props.height;
        this.virtualCanvasHeight = this.props.horizontalOrientation ? this.props.height : this.props.width;

        this.markedBarGroup = null;
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
            || this.props.horizontalOrientation !== this.oldOrientation
            || this.props.measureDurationLock !== this.oldMeasureDurationLock
        ) {
            this.oldOrientation = this.props.horizontalOrientation;
            this.oldWidth = this.props.width;
            this.oldHeight = this.props.height;
            this.oldMeasureDurationLock = this.props.measureDurationLock;

            this.offscreenCanvas.width = this.ctx.canvas.width;
            this.offscreenCanvas.height = this.ctx.canvas.height;

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx2 && this.ctx2.setTransform(1, 0, 0, 1, 0, 0);
            this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);

            if (!this.props.horizontalOrientation) {
                this.ctx.rotate(Math.PI / 2);
                this.ctx.translate(0, -this.ctx.canvas.width);
                this.ctx2 && this.ctx2.rotate(Math.PI / 2);
                this.ctx2 && this.ctx2.translate(0, -this.ctx2.canvas.width);
                this.offscreenCtx.rotate(Math.PI / 2);
                this.offscreenCtx.translate(0, -this.ctx.canvas.width);
            }

            this.virtualCanvasWidth = this.props.horizontalOrientation ? this.props.width : this.props.height;
            this.virtualCanvasHeight = this.props.horizontalOrientation ? this.props.height : this.props.width;

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
        if (!this.props.horizontalOrientation) {
            //Transformation der Mousekoordinaten
            let tmpX = x;
            x = y;
            y = this.refs.canvas.width - tmpX;
        }

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

        if (pressed && this.props.overlayheader) {
            if (x <= cfg.OVERLAYHEADERWIDTH) {
                if (this.props.horizontalOrientation) {
                    //Rückwärts durchlaufen
                    for (let n = this.props.model.getResourceModel().size() - 1; n >= 0; n--) {
                        let res = this.props.model.getResourceModel().getItemAt(n);
                        let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                        let resStartY = Math.max(this.timelineHeaderHeight, this.timelineHeaderHeight + relResStartY + this.workResOffset);

                        if (resStartY + cfg.OVERLAY_CHECKBOX_Y <= y && resStartY + cfg.OVERLAY_CHECKBOX_Y + 20 >= y
                            && cfg.OVERLAY_CHECKBOX_X <= x && cfg.OVERLAY_CHECKBOX_X + 20 >= x
                        ) {
                            retVal.setResourceCheckboxPressed(true);
                            retVal.setTask(null);
                        } else if (resStartY <= y && resStartY + cfg.OVERLAYHEADERHEIGHT >= y) {
                            retVal.setResourceHeaderPressed(true);
                            retVal.setTask(null);
                        }
                    }
                } else {
                    //Vorwärts durchlaufen
                    for (let n = 0; n < this.props.model.getResourceModel().size(); n++) {
                        let res = this.props.model.getResourceModel().getItemAt(n);
                        let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                        let resEndY = Math.min(this.props.width, this.timelineHeaderHeight + relResStartY + this.workResOffset + this.getModel().getResourceModel().getHeight(res.getID()));

                        if (resEndY - cfg.OVERLAY_CHECKBOX_X >= y && resEndY - cfg.OVERLAY_CHECKBOX_X - 20 <= y
                            && cfg.OVERLAY_CHECKBOX_Y <= x && cfg.OVERLAY_CHECKBOX_Y + 20 >= x
                        ) {
                            retVal.setResourceCheckboxPressed(true);
                            retVal.setTask(null);
                        } else if (resEndY >= y && resEndY - cfg.OVERLAYHEADERWIDTH <= y) {
                            retVal.setResourceHeaderPressed(true);
                            retVal.setTask(null);
                        }
                    }
                }
            }
        } else {
            if (x <= this.resourceHeaderHeight) {
                retVal.setResourceHeaderPressed(true);
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
            if ((this.props.horizontalOrientation && mousePos[0] >= sliderStartX - 40 && mousePos[0] <= sliderStartX)
                || (!this.props.horizontalOrientation && mousePos[1] >= sliderStartX - 40 && mousePos[1] <= sliderStartX)) {
                this.activeMeasureSlider = 1;
            } else if ((this.props.horizontalOrientation && mousePos[0] >= sliderEndX && mousePos[0] <= sliderEndX + 40)
                || (!this.props.horizontalOrientation && mousePos[1] >= sliderEndX && mousePos[1] <= sliderEndX + 40)) {
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
                if (this.props.horizontalOrientation) {
                    this.workResOffset = this.resOffset + this.offsetY;
                } else {
                    this.workResOffset = this.resOffset - this.offsetX;
                }
                this._alignWorkResOffset();
                super.offsetChanged();
                this._fireOffsetChanged();
            } else {
                this.measureSliderOffset = this.props.horizontalOrientation
                    ? this.offsetX : this.offsetY;
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
        if (this.props.horizontalOrientation) {
            this.offscreenImage = this.offscreenCtx.getImageData(this.resourceHeaderHeight, this.timelineHeaderHeight, this.props.width - this.resourceHeaderHeight, this.props.height - this.timelineHeaderHeight);
        } else {
            this.offscreenImage = this.offscreenCtx.getImageData(0, this.resourceHeaderHeight, this.props.width - this.timelineHeaderHeight, this.props.height - this.resourceHeaderHeight);
        }
        this.offscreenCtx.restore();
    }

    paintFromOffscreen() {
        if (this.offscreenImage) {
            this.ctx.save();
            //Zunächst wird wie beim normalen paint der Timelineheader gezeichnet.
            //Es werden aber keine Ereignisse gezeichnet
            this.ctx.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);
            this.paintTimelineHeader(this.ctx);
            this.ctx.restore();

            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            let distX = this.getXPosForTime(this.beforeMovementJulMin) - this.getXPosForTime(this.workStartTime.getJulianMinutes());
            let distY = this.workResOffset - this.beforeMovementY;
            if (!this.props.horizontalOrientation) {
                const tmp = -distY;
                distY = distX;
                distX = tmp;
            }
            const x = Math.max((this.props.horizontalOrientation ? this.resourceHeaderHeight : 0) + distX);
            const y = Math.max((this.props.horizontalOrientation ? this.timelineHeaderHeight : this.resourceHeaderHeight) + distY);

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
            if (!this.props.horizontalOrientation) {
                dirtyWidth -= distX + this.timelineHeaderHeight;
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
                this.ctx.lineTo(nowX,
                    this.props.horizontalOrientation ? this.ctx.canvas.height
                        : this.ctx.canvas.width);
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
                        paintChartMouseOverLabel(this.ctx2, this.getTimelineBarHeaderFontSize(this.lastTimelineEvent.getTask().id), this.props.model, this.lastTimelineEvent.getTask(), this.mouseLCal, resStartY, this, this);
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
            ctx.font = cfg.overlayMessageFont;
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

    paintTimelineHeader(ctx) {
        let SELF = this;

        ctx.save();

        //Header für die Timeline zeichnen
        ctx.fillStyle = cfg.timelineHeaderColor;
        ctx.fillRect(this.resourceHeaderHeight, 0, this.virtualCanvasWidth - this.resourceHeaderHeight, this.timelineHeaderHeight);
        ctx.fillRect(0, 0, this.resourceHeaderHeight, this.virtualCanvasHeight);

        ctx.beginPath();
        ctx.rect(this.resourceHeaderHeight, 0, this.virtualCanvasWidth - this.resourceHeaderHeight, this.virtualCanvasHeight);
        ctx.clip();

        //Bestimmen der Skala, die gezeichnet werden soll
        var minutesPerPixel = this.getMinutesPerPixel();

        if (minutesPerPixel < 0.2) {
            //Stundenskala
            this.paintGrid(ctx, this.workStartTime, this.workEndTime, function (time) {
                return new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), time.getHour(), 0, SELF.timeZone)
            }, function (time) {
                return time.addHour(1)
            }, function (time) {
                return time.addMinutes(10)
            }, function (time) {
                //return LCalFormatter.formatMonthNameL(time) + " " + time.getYear();
                return LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthName(time) + " " + LCalFormatter.formatYear(time) + " " + time.getHour() + " Uhr";
            }, function (time, index) {
                return time.getMinute();
            }, function (time, isMainScale) {
                if (isMainScale) {
                    let dayInWeek = LCalHelper.getDayInWeek(time);
                    if (dayInWeek === 5) {
                        return cfg.saturdayColor;
                    } else if (dayInWeek === 6) {
                        return cfg.sundayColor;
                    }
                }
                return undefined;
            });
        } else if (minutesPerPixel < 10) {
            //Tagesskala
            this.paintGrid(ctx, this.workStartTime, this.workEndTime, function (time) {
                return new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), 0, 0, SELF.timeZone)
            }, function (time) {
                return time.addDay(1)
            }, function (time) {
                return time.addHour(1)
            }, function (time) {
                return LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time);
                //return time.getDay();
            }, function (time, index) {
                if (minutesPerPixel < 4 || ((index) % 5 === 0)) {
                    return time.getHour();
                } else {
                    return "";
                }
            }, function (time, isMainScale) {
                if (!isMainScale) {
                    let dayInWeek = LCalHelper.getDayInWeek(time);
                    if (dayInWeek === 5) {
                        return cfg.saturdayColor;
                    } else if (dayInWeek === 6) {
                        return cfg.sundayColor;
                    }
                }
                return undefined;
            });
        } else if (minutesPerPixel < 300) {
            //Monatsskala
            this.paintGrid(ctx, this.workStartTime, this.workEndTime, function (time) {
                return new LCal().initYMDHM(time.getYear(), time.getMonth(), 1, 0, 0, SELF.timeZone)
            }, function (time) {
                return time.addMonth(1);
            }, function (time) {
                return time.addDay(1)
            }, function (time) {
                return LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time);
            }, function (time, index) {
                if (minutesPerPixel < 120 || ((index + 1) % 5 === 0)) {
                    return time.getDay();
                } else {
                    return "";
                }
            }, function (time, isMainScale) {
                if (!isMainScale) {
                    let dayInWeek = LCalHelper.getDayInWeek(time);
                    if (dayInWeek === 5) {
                        return cfg.saturdayColor;
                    } else if (dayInWeek === 6) {
                        return cfg.sundayColor;
                    }
                }
                return undefined;
            });
        } else if (minutesPerPixel < 10000) {
            //Jahresskala
            this.paintGrid(ctx, this.workStartTime, this.workEndTime, function (time) {
                return new LCal().initYMDHM(time.getYear(), 1, 1, 0, 0, SELF.timeZone)
            }, function (time) {
                return time.addYear(1)
            }, function (time) {
                return time.addMonth(1)
            }, function (time) {
                return LCalFormatter.formatYear(time);
            }, function (time, index) {
                if (minutesPerPixel > 5000) {
                    if (index % 2 === 0) {
                        return LCalFormatter.formatMonthNameS(time);
                    } else {
                        return "";
                    }
                } else if (minutesPerPixel > 1700) {
                    return LCalFormatter.formatMonthNameS(time);
                } else {
                    return LCalFormatter.formatMonthName(time);
                }
            }, function (time) {
                return undefined;
            });
        } else {

            var yearStepWidth = Math.pow(10, (Math.floor(minutesPerPixel / 400) + "").length - 1);
            this.paintGrid(ctx, this.workStartTime, this.workEndTime, function (time) {
                var startYear = time.getYear();
                startYear = startYear - (startYear % yearStepWidth) - (startYear <= 0 ? yearStepWidth : 0);
                if (startYear === 0) {
                    startYear = 1;
                }
                return new LCal().initYMDHM(startYear, 1, 1, 0, 0, SELF.timeZone)
            }, function (time) {
                if (time.getYear() === 1) {
                    time.addYear(yearStepWidth - 1);
                } else {
                    time.addYear(yearStepWidth);
                }
                return time;
            }, function (time) {
                if (time.getYear() === 1) {
                    time.addYear(yearStepWidth / 10 - 1 === 0 ? 1 : yearStepWidth / 10 - 1);
                } else {
                    time.addYear(yearStepWidth / 10);
                }
                return time;
            }, function (time) {
                return LCalFormatter.formatYear(time);
            }, function (time, index) {
                let mDivY = Math.floor(minutesPerPixel / yearStepWidth);
                if (mDivY > 550) {
                    if (mDivY > 1500) {
                        if (index % 5 === 0) {
                            return LCalFormatter.formatYear(time);
                        } else {
                            return "";
                        }
                    } else {
                        if (index % 2 === 0) {
                            return LCalFormatter.formatYear(time);
                        } else {
                            return "";
                        }
                    }
                } else {
                    return LCalFormatter.formatYear(time);
                }
            }, function (time) {
                return undefined;
            });
        }

        ctx.restore();
    }

    paintCurrentDateOnMousePosition() {
        if (this.mouseLCal && this.ctx2) {
            this.ctx2.save();

            this.ctx2.font = cfg.currentDateOnMousePositionFont;
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
                this.ctx2.lineTo(mouseX, this.props.horizontalOrientation ? this.ctx.canvas.height : this.ctx.canvas.width);
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
            const inset = cfg.getTaskBarInsetByCollapseState(this.props.model.isCollapsed(group));
            roundedRect(ctx, gi.xStart - inset, gi.yStart, gi.xEnd - gi.xStart + 2 * inset, gi.yEnd - gi.yStart +3, 5);
            ctx.fill();
            ctx.clip();

            ctx.fillRect(gi.xStart - inset, gi.yStart, gi.xEnd - gi.xStart + 2 * inset, this.props.model.barSize * 4/5);

            ctx.fillStyle = this.props.brightBackground ? "#000" : "#FFF";
            ctx.font = this.getGroupFont();
            if(this.props.printLayout) {
                ctx.fillText(
                    gi.name, gi.xStart + 5,
                    gi.yStart + 2 + this.getGroupFontSize());
            } else {
                ctx.fillText(
                    (this.props.model.isCollapsed(group) ? '\u25BC' : '\u25B2')
                    + gi.name, gi.xStart + 5,
                    gi.yStart + 2 + this.getGroupFontSize());
            }
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
        this.paintTimelineHeader(ctx);

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
            ctx.lineTo(x, this.props.horizontalOrientation ? ctx.canvas.height : ctx.canvas.width);
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
        return cfg.getTaskBarInset(this.props.model, task);
    }
    /**
     * Liefert die TaskBarBounds, die zum Anzeigen benötigt werden. Hier wird der alignedStart berücksichtigt
     * @param task
     */
    getTaskBarBounds(task) {
        let startX = this.getXPosForTime(this.props.model.getDisplayedStart(task).getJulianMinutes());
        let endX = this.getXPosForTime(this.props.model.getDisplayedEnd(task).getJulianMinutes());
        const lineheight = this.props.model.getHeight(task.getID());

        const isPointInTime = task.isPointInTime();
        const shape = this.getShape(task);

        if (isPointInTime && shape!==SPEECHBUBBLE) {
            startX -= this.props.model.getHeight(task.getID()) / 2;
            endX += this.props.model.getHeight(task.getID()) / 2;
        } else {
            if (!task.getStart()) {  //Falls kein Start vorhanden, dann noch mal für den Pfeil etwas abziehen.
                startX -= cfg.ARROWHEADLENGTH;
            } else if (!task.getEnd()) {//Falls kein Ende vorhanden, dann noch mal für den Pfeil etwas draufschlagen.
                endX += cfg.ARROWHEADLENGTH;
            }
        }

        let labelArr;
        let maxLabelWidth = 0;
        let imgWidth = 0;
        let imgHeight = 0;
        if(!this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
            const icon = this.props.model.getIcon(task);
            if(icon) {
                if (this.props.horizontalOrientation) {
                    imgHeight = lineheight - 2 * this.getTaskBarInset(task);
                    imgWidth = icon.width * imgHeight / icon.height;
                } else {
                    imgWidth = lineheight - 2 * this.getTaskBarInset(task);
                    imgHeight = icon.height * imgWidth / icon.width;
                }
            }

            this.ctx.font = this.getTimelineBarHeaderFont(task.id);
            let taskLabel = task.getName() && task.getName().length > 0
                ? task.getName() : (task.secname ? task.secname : "");

            if (task.mapDescriptor && task.mapDescriptor.length > 0
                && !this.props.printLayout) {
                taskLabel = "\u25B6 " + taskLabel;
            }

            if (this.props.horizontalOrientation) {
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
            } else {
                const maxLabelHeight = this.props.model.getHeight(task.getID()) - 5
                    - 2 * this.getTaskBarInset(task);

                labelArr = taskLabel ? Helper.textToArrayByMaxWidthFromCache(
                    taskLabel, maxLabelHeight,
                    this.getTimelineBarHeaderFontSize(task.id), this.ctx) : [];

                //Die Anzahl der Zeilen bestimmt die Länge des Labels im vertikalen Fall
                maxLabelWidth = 6 + this.getTimelineBarHeaderFontSize(task.id)
                    * labelArr.length;
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

            return new TaskBarBounds(startX, endX, labelIncludingIconStartX + imgWidth,
                labelEndX, labelIncludingIconStartX, imgWidth, imgHeight, labelArr);
        } else if (shape === SPEECHBUBBLE) {
            //Speechbubble
            if(labelIncludingIconWidth<40) {
                labelIncludingIconWidth = 40;
            }
            const labelIncludingIconStartX = startX - labelIncludingIconWidth / 2
            const labelEndX = labelIncludingIconStartX + labelIncludingIconWidth;
            return new TaskBarBounds(labelIncludingIconStartX, labelEndX, labelIncludingIconStartX + imgWidth,
                labelEndX, labelIncludingIconStartX, imgWidth, imgHeight, labelArr);
        } else {
            let offset = 0;
            if(isPointInTime) {
                if(shape === SMALL_PIN_INTERVAL) {
                    imgWidth = imgWidth/2;
                    imgHeight = imgHeight/2;
                    offset = lineheight/2 + 5;
                } else {
                    offset = lineheight + 5;
                }
            } else {
                offset = Math.min(imgWidth, endX-startX) + 5;
            }
            return new TaskBarBounds(startX, endX, startX + offset,
                startX + maxLabelWidth + offset, startX + (lineheight - imgWidth)/2, imgWidth, imgHeight, labelArr);
        }
    }

    //Liefert ein ResourceInerval, falls sich an dieser Position eines befindet
    getTask(x, y) {
        if (x > this.resourceHeaderHeight && y > this.timelineHeaderHeight) {

            this.props.model.recomputeDisplayData(this.getTaskBarBounds);

            for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);

                let tbb = this.getTaskBarBounds(task);
                let xStart = tbb.barStartX;
                if (xStart <= this.virtualCanvasWidth) {
                    let xEnd = Math.max(tbb.labelEndX, tbb.barEndX);
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

            if (this.props.horizontalOrientation) {
                //Immer auf die untere Basis der Timeline scrollen, falls diese höher ist als die verfügbare Höhe
                let hightOverlap = this.getModel().getResourceModel().getHeight(res.getID()) + this.timelineHeaderHeight - this.virtualCanvasHeight;
                if (hightOverlap < 0) {
                    hightOverlap = 0;
                }
                this.offsetY = -relResStartY - this.resOffset - hightOverlap;
                this.offsetChanged();
                this.offsetY = 0;
                this.offsetResetted();
            } else {
                let val = relResStartY + this.getModel().getResourceModel().getHeight(res.getID()) - this.virtualCanvasHeight + this.resOffset + this.timelineHeaderHeight;
                this.offsetX = val;
                this.offsetChanged();
                this.offsetX = 0;
                this.offsetResetted();
            }

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

            if (this.props.horizontalOrientation) {
                //Immer auf die untere Basis der Timeline scrollen, falls diese höher ist als die verfügbare Höhe
                let hightOverlap = this.props.model.getHeight(task.getID()) + this.timelineHeaderHeight - this.virtualCanvasHeight;
                if (hightOverlap < 0) {
                    hightOverlap = 0;
                }
                this.offsetY = -relTaskStartY - this.resOffset - hightOverlap;
                this.offsetChanged();
                this.offsetY = 0;
                this.offsetResetted();
            } else {
                let val = relTaskStartY + this.props.model.getHeight(task.getID()) - this.virtualCanvasHeight + this.resOffset + this.timelineHeaderHeight;
                this.offsetX = val;
                this.offsetChanged();
                this.offsetX = 0;
                this.offsetResetted();
            }
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
                    paintChart(ctx, this.props.model, task, this.getTimelineBarHeaderFontSize(task.id), alignedStart, alignedEnd, resStartY, this.props.model.getHeight(task.getID()), dataset, this);
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

        if (shape === 1 && !task.isPointInTime()) { //Schmaler Balken
            let barHeight = Math.min(height/2, 5);
            resStartY = resStartY + height - barHeight;
            height = barHeight;
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
                            ctx.lineTo(alignedEnd + cfg.ARROWHEADLENGTH, resStartY);
                            ctx.lineTo(alignedEnd, resStartY + height);
                            ctx.lineTo(alignedStart, resStartY + height);
                            ctx.lineTo(alignedStart, resStartY);
                        } else {
                            ctx.moveTo(alignedStart + rad , resStartY);
                            ctx.lineTo(alignedEnd, resStartY);
                            ctx.lineTo(alignedEnd + cfg.ARROWHEADLENGTH, resStartY + halfHeight);
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
                            ctx.lineTo(alignedStart - cfg.ARROWHEADLENGTH, resStartY);
                            ctx.lineTo(alignedStart, resStartY + height);
                            ctx.lineTo(alignedEnd, resStartY + height);
                            ctx.lineTo(alignedEnd, resStartY);
                        } else {
                            ctx.moveTo(alignedEnd - rad, resStartY);
                            ctx.lineTo(alignedStart, resStartY);
                            ctx.lineTo(alignedStart - cfg.ARROWHEADLENGTH, resStartY + halfHeight);
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
                        paintPin(ctx, task, alignedStart, alignedEnd, resStartY, shape === SMALL_PIN_INTERVAL ? height / 2 : height, col, !this.props.model.getIcon(task));
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
                if (this.props.horizontalOrientation) {
                    if (task.isPointInTime()) {
                        ctx.drawImage(icon, tbb.iconStartX, resStartY + this.getTaskBarInset(task), tbb.imgWidth, tbb.imgHeight);
                    } else {
                        if(task.getDisplayData().getShape() === 1) {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + this.props.model.getHeight(task.getID()) - tbb.imgHeight - 5, tbb.imgWidth, tbb.imgHeight - 5);
                        } else if(task.getDisplayData().getShape() === 2) {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + this.props.model.getHeight(task.getID()) - tbb.imgHeight, tbb.imgWidth, tbb.imgHeight);
                        } else {
                            ctx.drawImage(icon, tbb.iconStartX, resStartY + this.getTaskBarInset(task), tbb.imgWidth, tbb.imgHeight);
                        }
                    }
                } else {

                    ctx.translate(alignedStart + tbb.imgWidth, resStartY + tbb.imgWidth + this.getTaskBarInset(task));
                    ctx.rotate(-Math.PI / 2);

                    if (task.isPointInTime()) {
                        ctx.drawImage(icon, 0, -tbb.imgWidth - 20, tbb.imgWidth, tbb.imgHeight);
                    } else {
                        ctx.drawImage(icon, 0, -tbb.imgWidth, tbb.imgWidth, tbb.imgHeight);
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

        if (tbb.getMinStartX() <= this.virtualCanvasWidth && tbb.getMaxEndX() > this.resourceHeaderHeight) {
                let resStartY = this.timelineHeaderHeight + this.props.model.getRelativeYStart(task.getID())  + this.workResOffset + this.getTaskBarInset(task);
                const barHeight = this.props.model.getHeight(task.getID());

                if (resStartY + barHeight + this.getTaskBarInset(task) > this.timelineHeaderHeight
                    && resStartY < this.virtualCanvasHeight
                    && !this.props.model.isCollapsed(this.props.model.getGroupWithResource(task))) {
                    ctx.save();

                    ctx.font = this.getTimelineBarHeaderFont(task.id);
                    let labelArr = tbb.labelArray;

                    const lEnd = task.getEnd();

                    let shape = task.getDisplayData().getShape();

                    const LABEL_LINE_HEIGHT = this.getTimelineBarHeaderFontSize(task.id);
                    const SECLABEL_LINE_HEIGHT = this.getTimelineBarSubHeaderFontSize(task.id);

                    if (this.props.horizontalOrientation) {
                        //Falls das Label über den Balken hinausgeht, dann einen grauen Hintergrund zeichnen
                        let maxLabelLines = Math.min(labelArr.length, Math.floor((barHeight - 2* this.getTaskBarInset(task)) / LABEL_LINE_HEIGHT)); // Zunächst mal maximal zwei Zeilen
                        let textYPosOffset = LABEL_LINE_HEIGHT;

                        if (maxLabelLines > 0) {
                            textYPosOffset = LABEL_LINE_HEIGHT * maxLabelLines;
                            let txtYOffset = 0;
                            if(task.dataset && task.dataset.length > 0) {
                                txtYOffset = barHeight - 2 * this.getTaskBarInset(task) - this.getTimelineBarHeaderFontSize(task.id) - 0.5 * cfg.CHART_INSET;
                            } else if(shape === SPEECHBUBBLE) {
                                txtYOffset = this.getTimelineBarHeaderFontSize(task.id) + 2;//(this.props.model.getHeight(task.getID())- this.getTaskBarInset(task));
                            } else {
                                txtYOffset = this.getTimelineBarHeaderFontSize(task.id) - 2 + (barHeight - 2 * this.getTaskBarInset(task) - this.getTimelineBarHeaderFontSize()) / 2;
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
                            if (tbb.hasLongLabel() && labelArr && !task.isPointInTime() && shape!==PIN_INTERVAL && shape !== CURLYBRACE && (this.props.brightBackground ?  task.getDisplayData().getLabelColor() !== "#000" : task.getDisplayData().getLabelColor() !== "#FFF")) {
                                ctx.fillStyle = this.props.brightBackground ? "rgba(255,255,255,0.4)" : "rgba(50,50,50,0.4)";
                                ctx.beginPath();
                                ctx.fillRect(txtXStart, resStartY + txtYOffset - this.getTimelineBarHeaderFontSize(task.id), tbb.labelEndX - txtXStart, textYPosOffset);
                            }

                            if (labelArr) {
                                    ctx.fillStyle = tbb.hasLongLabel() || shape
                                    === SMALL_PIN_INTERVAL || shape === CURLYBRACE ?  (this.props.brightBackground ? "#000": "#FFF"): task.getDisplayData().getLabelColor();

                                    //Bei Speechbubble die Schrift leicht höher zeichnen, weil Platz für die Ecke benötigt wird
                                    if(shape === SPEECHBUBBLE) {
                                        resStartY -= 5;
                                    }
                                for (let i = 0; i < maxLabelLines; ++i) {
                                    if(shape === CURLYBRACE) {
                                        ctx.fillText(labelArr[i], txtXStart, resStartY - this.getTaskBarInset(task) + barHeight); //+ (i + 1) * LABEL_LINE_HEIGHT + task.getDisplayData().getHeight() / 2
                                    } else {
                                        //ctx.fillText(labelArr[i], txtXStart, resStartY + (i + 1) * LABEL_LINE_HEIGHT + txtYOffset - 2);
                                        ctx.fillText(labelArr[i], txtXStart, resStartY + i * LABEL_LINE_HEIGHT + txtYOffset);
                                    }
                                }
                            }
                        }

                    } else {
                        ctx.translate(tbb.barStartX, resStartY - 2 * this.getTaskBarInset(task));
                        ctx.rotate(-Math.PI / 2);
                        let txtYOffset = tbb.lableStartX - tbb.barStartX;


                        if (tbb.hasLongLabel() || shape === 2) {
                            ctx.fillStyle = this.props.brightBackground ? "rgba(255,255,255,0.4)" : "rgba(50,50,50,0.4)";
                            let tWidth = barHeight - 2 * this.getTaskBarInset(task);
                            ctx.fillRect(-barHeight, txtYOffset, tWidth, tbb.labelEndX - tbb.lableStartX + 6);
                        } else {
                            //clip, damit der darüberstehende Text nicht darüber gezeichnet wird
                            const clipStartOffset = task.getStart() ? 0 : cfg.ARROWHEADLENGTH;
                            const clipEndOffset = task.getEnd() ? 0 : -cfg.ARROWHEADLENGTH;
                            ctx.beginPath();
                            ctx.rect(-barHeight, clipStartOffset, barHeight, tbb.barEndX - tbb.barStartX + clipEndOffset);
                            ctx.clip();
                        }

                        txtYOffset += LABEL_LINE_HEIGHT;

                        ctx.font = this.getTimelineBarHeaderFont(task.id);
                        ctx.fillStyle = tbb.hasLongLabel() ? "#FFF" : task.getDisplayData().getLabelColor();
                        for (let i = 0; i < labelArr.length; ++i) {
                            ctx.fillText(labelArr[i], 3 - barHeight, txtYOffset);
                            txtYOffset += LABEL_LINE_HEIGHT;
                        }

                        if (!tbb.hasLongLabel() && shape !== 2) {
                            ctx.font = this.getTimelineBarSubHeaderFont(task.id);
                            ctx.fillStyle = task.getDisplayData().getSecLabelColor();
                            let secLabelArr = task.secname === null || !(task.getName() && task.getName().length > 0) ? "" : Helper.textToArrayFromCache(task.secname);
                            for (let i = 0; i < secLabelArr.length; ++i) {
                                ctx.fillText(secLabelArr[i], 5 - barHeight, txtYOffset);
                                txtYOffset += SECLABEL_LINE_HEIGHT;
                            }

                            if (txtYOffset < (tbb.barEndX - tbb.barStartX) - 5 && task.getEnd()) {
                                let endTime = this.formatBarDate(lEnd);
                                let endTimeWidth = Helper.textWidthFromCache(endTime, this.getTimelineBarHeaderFontSize(task.id), ctx);//ctx.measureText(endTime).width;
                                ctx.fillText(endTime, -endTimeWidth - 7 * this.getTaskBarInset(task), tbb.barEndX - tbb.barStartX - 5);
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

            //ungenaues Start-Ende zeichnen (darübergelegter Verlauf)
            /*for (let n = 0; n < this.props.model.size(); n++) {
                let task = this.props.model.getItemAt(n);
                if (task && !task.isDeleted() && !task.getDisplayData().isShadowTask()) {
                    this.paintFuzzyTaskBarTimes(ctx, task);
                }
            }*/

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
        let shape = task.getDisplayData().getShape();
        if (!this.props.horizontalOrientation && shape === 1) { //einen schmalen Balken gibt es nur in der horizontalen Darstellung
            shape = 0;
        }
        return shape;
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
            const resHeaderHeight = this.props.overlayheader
                ? cfg.OVERLAYHEADERWIDTH : this.resourceHeaderHeight;
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
            const resHeaderHeight = this.props.overlayheader ? cfg.OVERLAYHEADERWIDTH : this.resourceHeaderHeight;
            let resModel = this.props.model.getResourceModel();

            ctx.font = cfg.resourceMainFont;
            ctx.strokeStyle = "#BBBBBB";

            resModel.recomputeDisplayData();
            this._alignWorkResOffset();

            for (let n = 0; n < resModel.size(); n++) {
                let res = resModel.getItemAt(n);
                let relResStartY = this.getModel().getResourceModel().getRelativeYStart(res.getID());

                let resStartY = this.timelineHeaderHeight + relResStartY + this.workResOffset;
                let resHeight = this.getModel().getResourceModel().getHeight(res.getID());

                //nur, wenn noch kein Ereignis eingegeben wurde
                const taskCnt = this.props.model.getItemCntByResourceID(res.getID());

                if (taskCnt === 0 && res.isAdmin && this.props.texts && this.props.texts.presshere) {
                    ctx.font = cfg.timelineMainFont;
                    ctx.fillStyle = "#999999";
                    ctx.fillText(this.props.texts.presshere, resHeaderHeight + 10, resStartY + resHeight / 2 + 4);
                }
                ctx.save();

                let icon = resModel.getIcon(res);

                if (!this.props.overlayheader) {
                    ctx.beginPath();
                    ctx.rect(0, resStartY, this.resourceHeaderHeight, resHeight);
                    ctx.clip();
                }

                const paintOverlayRes = (startX, endX, startY, endY) => {
                    ctx.fillStyle = "rgba(120, 120, 120, 0.8)";
                    ctx.shadowColor = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();

                    const curveRadius = 10;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, startY);
                    ctx.lineTo(endX, Math.max(endY - curveRadius, startY));
                    ctx.quadraticCurveTo(endX, endY, Math.max(endX - curveRadius, startX), endY);
                    ctx.lineTo(startX, endY);
                    ctx.fill();
                }

                if(this.props.resourcePainter) {
                    this.props.resourcePainter(ctx, this, res, resHeaderHeight, resHeight,
                        resStartY, icon, paintOverlayRes)
                } else {
                    paintResource(ctx, this, res, resHeaderHeight, resHeight,
                        resStartY, icon, paintOverlayRes);
                }

                ctx.restore();
            }

            //Trennstrich zwischen den Ressourcen
            ctx.beginPath();
            if (!this.props.overlayheader) {
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


    paintGrid(ctx, start, end, initFunc, addMainTimeFunc, addSubTimeFunc, displMainDateFunc, displSubDateFunc, getBlockColorFunc) {
        let starttime = initFunc(start);

        ctx.font = cfg.timelineMainFont;

        //Das Untergrid zeichnen
        let time = starttime.clone();

        ctx.beginPath();
        let lastX = this.getXPosForTime(time.getJulianMinutes());
        if (lastX < this.resourceHeaderHeight) {
            lastX = this.resourceHeaderHeight;
        }
        do {
            let subTime = time.clone();
            //Falls es sich um ein Wochenendtag handelt, dann entsprechend farblich markieren
            let blockColor = getBlockColorFunc(time, true);

            time = addMainTimeFunc(time);
            let x = this.getXPosForTime(time.getJulianMinutes());
            if (x > this.virtualCanvasWidth) {
                x = this.virtualCanvasWidth;
            }

            if (blockColor) {
                ctx.fillStyle = blockColor;
                ctx.fillRect(lastX, this.timelineHeaderHeight, x - lastX, this.virtualCanvasHeight - this.timelineHeaderHeight);
            }

            let lastSubX = lastX;
            do {
                blockColor = getBlockColorFunc(subTime, false);
                subTime = addSubTimeFunc(subTime);
                let subX = this.getXPosForTime(subTime.getJulianMinutes());

                if (blockColor) {
                    ctx.fillStyle = blockColor;
                    ctx.fillRect(lastSubX, this.timelineHeaderHeight, subX - lastSubX, this.virtualCanvasHeight - this.timelineHeaderHeight);
                }

                if (subX > this.resourceHeaderHeight) {
                    ctx.moveTo(subX, this.timelineHeaderHeight);
                    ctx.lineTo(subX, this.virtualCanvasHeight);
                }

                lastSubX = subX;
            } while (subTime.before(time));
            lastX = x;
        } while (time.before(end));

        ctx.strokeStyle = "rgba(200,200,200,0.5)";
        ctx.stroke();

        //Das Hauptgrid zeichnen
        time = starttime.clone();
        ctx.beginPath();
        do {
            time = addMainTimeFunc(time);
            let x = this.getXPosForTime(time.getJulianMinutes());

            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.virtualCanvasHeight);

        } while (time.before(end));

        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.stroke();

        //Lücke für die Unterbeschriftung zeichnen
        ctx.fillStyle = cfg.timelineHeaderColor;
        ctx.fillRect(0, 25, this.virtualCanvasWidth, this.timelineHeaderHeight - 30);

        ctx.fillStyle = "#000000";

        //Die Hauptbeschriftung zeichnen
        time = starttime.clone();
        lastX = this.getXPosForTime(time.getJulianMinutes());
        if (lastX < this.resourceHeaderHeight) {
            lastX = this.resourceHeaderHeight;
        }

        do {
            ctx.font = cfg.timelineMainFont;

            let str = displMainDateFunc(time);

            time = addMainTimeFunc(time);
            var x = this.getXPosForTime(time.getJulianMinutes());
            if (x > this.virtualCanvasWidth) {
                x = this.virtualCanvasWidth;
            }

            //ctx.fillStyle = "#000000";
            var mid = lastX + (x - lastX) / 2;

            /*let txtWidth = Helper.textWidthFromCache(str, this.getTimelineBarHeaderFontSize(task.id), ctx);//ctx.measureText(str).width;
            if (txtWidth > x - lastX) {
                ctx.font = cfg.timelineMainFontMini;
            }*/
            let txtWidth = Helper.textWidthFromCache(str, this.getTimelineBarHeaderFontSize(), ctx);//ctx.measureText(str).width;

            var txtPos = Math.round(mid - txtWidth / 2);

            if (txtPos < lastX + 2 && x === ctx.canvas.width) {
                txtPos = lastX + 2;
            } else if (txtPos + txtWidth > x - 2 && lastX === this.resourceHeaderHeight) {
                txtPos = x - txtWidth - 2;
            }
            ctx.fillText(str, txtPos, this.timelineHeaderHeight - 30);

            lastX = x;
        } while (time.before(end));

        //Die Unterbeschriftung zeichnen
        ctx.font = cfg.timelineSubFont;
        time = starttime.clone();
        lastX = null;
        let lastSubTime;
        let lastSubIndex = 0;
        do {
            let subTime = time.clone();
            time = addMainTimeFunc(time);
            let subIndex = 0;
            do {
                let x = this.getXPosForTime(subTime.getJulianMinutes());
                if (lastX) {
                    let str = displSubDateFunc(lastSubTime, lastSubIndex);
                    let txtWidth = Helper.textWidthFromCache(str, this.getTimelineBarHeaderFontSize(), ctx);//ctx.measureText(str).width;
                    //var txtPos = Math.round(x - txtWidth / 2);
                    let txtPos = Math.round(lastX + (x - lastX) / 2 - txtWidth / 2);

                    if (this.props.horizontalOrientation || txtWidth > 25) {
                        ctx.fillText(str, txtPos, this.timelineHeaderHeight - 10);
                    } else {
                        ctx.save();
                        ctx.translate(txtPos, 40);
                        ctx.rotate(-Math.PI / 2);
                        ctx.fillText(str, 0, 0);
                        ctx.restore();
                    }
                }
                lastSubTime = subTime.clone();
                lastX = x;

                subTime = addSubTimeFunc(subTime);
                lastSubIndex = subIndex;
                subIndex++;
            } while (subTime.before(time));

        } while (time.before(end));
    }
}

export default Timeline;
