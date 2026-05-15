/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 *
 * Click, Press...
 */
class TimelineEvent {

    constructor() {
        this.time = undefined;
        this.timeheaderPressed = false;
        this.resourceheaderPressed = false;
        this.resourceCheckboxPressed = false;
        this.pressedBarGroupHeader = null;
        this._mouseOverStartMeasureSlider = false;
        this._mouseOverEndMeasureSlider = false;
        this.task = null;
        this.resource = null;
        this._x = 0;
        this._y = 0;
        this._absX = 0;
        this._absY = 0;
    }

    setTime(lcal) {
        this.time = lcal;
    }

    getTime() {
        return this.time;
    }

    setTimeHeaderPressed(b) {
        this.timeheaderPressed = b;
    }

    isTimeHeaderPressed() {
        return this.timeheaderPressed;
    }

    setPressedBarGroupHeader(b) {
        this.pressedBarGroupHeader = b;
    }

    getPressedBarGroupHeader() {
        return this.pressedBarGroupHeader;
    }

    setResourceHeaderPressed(b) {
        this.resourceheaderPressed = b;
    }

    isResourceHeaderPressed() {
        return this.resourceheaderPressed;
    }

    setResourceCheckboxPressed(b) {
        this.resourceCheckboxPressed = b;
    }

    isResourceCheckboxPressed() {
        return this.resourceCheckboxPressed;
    }

    setTask(task) {
        this.task = task;
    }

    getTask() {
        return this.task;
    }

    setResource(res) {
        this.resource = res;
    }

    getResource() {
        return this.resource;
    }

    getX() {
        return this._x;
    }

    setX(value) {
        this._x = value;
    }

    getY() {
        return this._y;
    }

    setY(value) {
        this._y = value;
    }

    getAbsX() {
        return this._absX;
    }

    setAbsX(value) {
        this._absX = value;
    }

    getAbsY() {
        return this._absY;
    }

    setAbsY(value) {
        this._absY = value;
    }

    get mouseOverStartMeasureSlider() {
        return this._mouseOverStartMeasureSlider;
    }

    set mouseOverStartMeasureSlider(value) {
        this._mouseOverStartMeasureSlider = value;
    }

    get mouseOverEndMeasureSlider() {
        return this._mouseOverEndMeasureSlider;
    }

    set mouseOverEndMeasureSlider(value) {
        this._mouseOverEndMeasureSlider = value;
    }
}

export default TimelineEvent
