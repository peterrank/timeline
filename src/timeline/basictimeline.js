/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import SwipeCanvas from '../swipecanvas/swipecanvas.js';
import LCal from '../calendar/lcal.js';
import LCalFormatter from '../calendar/lcalformatter.js';

/**
 * Die BasicTimeline handlet alle Eingabeevents ab und wandelt diese in konkrete Zeiten für die Timeline um
 **/
class BasicTimeline extends SwipeCanvas {
    constructor(props) {
        super(props);

        this.timelineHeaderHeight = 55;
        this.resourceHeaderHeight = 0;

        this.timeZone = this.props.timeZone || "UTC";
        this.canvasStartTime = this.props.start || new LCal().initYMDHM(2000, 1, 1, 0, 0, this.timeZone);
        this.canvasEndTime = this.props.end || new LCal().initYMDHM(2017, 1, 1, 0, 0, this.timeZone);
        this.workStartTime = this.canvasStartTime.clone();
        this.workEndTime = this.canvasEndTime.clone();

        this.virtualCanvasWidth = undefined;
        this.virtualCanvasHeight = undefined;

        this.resourceHeaderHeightChanged();
    }

    componentDidMount() {
        super.componentDidMount();
    }

    setTimeZone(tz) {
        this.timeZone = tz;
        this._updateCanvas();
    }

    resourceHeaderHeightChanged() {
        this.resourceHeaderHeight = (this.props.headerType && this.props.headerType !== 'default') ? 0 : this.props.horizontalOrientation ? 200: 45 ;
    }

    offsetResetted() {
        this.canvasStartTime = this.workStartTime.clone();
        this.canvasEndTime = this.workEndTime.clone();
    }

    offsetChanged() {
        //Die Pixel, um die der Canvas verschoben werden soll, müssen in eine Zeitspanne übersetzt werden, die abhängig von der Canvasbreite und dem aktuellen Zoom ist
        let totalDuration = this.canvasEndTime.getDistanceInMinutes(this.canvasStartTime);
        let timeChange;
        if (this.props.horizontalOrientation) {
            timeChange = totalDuration * this.offsetX / (this.ctx.canvas.width - this.resourceHeaderHeight);
        } else {
            timeChange = totalDuration * this.offsetY / (this.ctx.canvas.height - this.resourceHeaderHeight);
        }
        this.workStartTime.setJulianMinutes(Math.round(this.canvasStartTime.getJulianMinutes() + timeChange));
        this.workEndTime.setJulianMinutes(Math.round(this.canvasEndTime.getJulianMinutes() + timeChange));
    }

    //Von der Mitte der bisher angezeigten Dauer auf die neue Dauer zoomen
    zoomToDisplayMinutes(newDuration) {
        if (newDuration !== undefined && newDuration > 0) {
            let oldDuration = this.workEndTime.getJulianMinutes() - this.workStartTime.getJulianMinutes();
            let halfdist = Math.round((oldDuration - newDuration) / 2);
            this.workStartTime.addMinutes(halfdist);
            this.workEndTime.addMinutes(-halfdist);
            this.offsetResetted();
            this._updateCanvas();
        }
    }

    getMinutesPerPixel() {
        return (this.workEndTime.getJulianMinutes() - this.workStartTime.getJulianMinutes()) / (this.virtualCanvasWidth - (this.props.widthOverlap ? this.props.widthOverlap  : 0) - this.resourceHeaderHeight);
    }

    getXPosForTime(julianMinutes) {
        //return julianMinutes * totalX / totalTime
        return Math.round(this.resourceHeaderHeight + (julianMinutes - this.workStartTime.getJulianMinutes()) * (this.virtualCanvasWidth - (this.props.widthOverlap ? this.props.widthOverlap  : 0) - this.resourceHeaderHeight) / this.workStartTime.getDistanceInMinutes(this.workEndTime));
    }

    getTimeForXPos(x) {
        return this.workStartTime.getJulianMinutes() + ((x - this.resourceHeaderHeight) * this.workStartTime.getDistanceInMinutes(this.workEndTime) / (this.virtualCanvasWidth - (this.props.widthOverlap ? this.props.widthOverlap  : 0) - this.resourceHeaderHeight));
    }

    paint() {
        //Nur zum Test super aufrufen
        //super.paint();

        this.ctx.clearRect(0, 0, this.virtualCanvasWidth, this.virtualCanvasHeight);

        //Zum Testen erzeugen wir hier gaaaanz viele Formen
        for (var n = 0; n < 10000; n++) {
            this.ctx.fillStyle = "#FF0000";
            this.ctx.fillRect(Math.random() * 500, Math.random() * 500, Math.random() * 150, Math.random() * 150);
        }

        this.ctx.fillStyle = "#000000";
        this.ctx.fillText("workStartTime: " + LCalFormatter.formatDate(this.workStartTime), 10, 10);
        this.ctx.fillText("offsetX: " + this.offsetX, 10, 30);
        this.ctx.fillText("canvasStartTime: " + LCalFormatter.formatDate(this.canvasStartTime), 10, 50);
    }

}

export default BasicTimeline
