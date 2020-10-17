/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 *
 */
class TaskBarBounds {
    constructor(barStart, barEnd, labelStart, labelEnd, labelArr) {
        this.barStartX = barStart;
        this.barEndX = barEnd;
        this.lableStartX = labelStart;
        this.labelEndX = labelEnd;
        this.labelArray = labelArr;
    }

    /**
     * Falls das Label länger ist als der Balken
     */
    hasLongLabel() {
        return this.labelEndX > this.barEndX;
    }

    getMaxEndX() {
        return Math.max(this.barEndX, this.labelEndX);
    }

    getMinStartX() {
        return Math.min(this.barStartX, this.lableStartX);
    }
}

export default TaskBarBounds
