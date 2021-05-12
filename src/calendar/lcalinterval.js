/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */

/**
 * Ein Zeitintervall mit zwei LCal-Werten
 */
class LCalInterval {
    constructor(start, end) {
        if(start && end && start.getEarliestLCal().after(end.getLatestLCal())) {
            this.start = end;
            this.end = start;
        } else {
            this.start = start;
            this.end = end;
        }
    }

    clone() {
        return new LCalInterval(this.start ? this.start.clone() : null, this.end ? this.end.clone() : null);
    }

    setStart(start) {
        this.start = start;
        return this;
    }

    setEnd(end) {
        this.end = end;
        return this;
    }

    getStart() {
        return this.start;
    }

    getEnd() {
        return this.end;
    }

    isPointInTime() {
        return this.start && this.end && this.start.precision === this.end.precision && this.start.type === this.end.type && this.start.getJulianMinutes() === this.end.getJulianMinutes();
    }

    getAbsDurationMinutesConsiderPrecision() {
        return this.start ? this.start.getAbsDistanceInMinutesConsiderPrecision(this.end) : null;
    }
}

export default LCalInterval
