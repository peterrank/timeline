/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 *
 */
class TaskBarBounds {
    constructor(barStart, barEnd, labelStart, labelEnd, iconStartX, imgWidth, imgHeight, labelArr) {
        this.barStartX = barStart;
        this.barEndX = barEnd;
        this.lableStartX = labelStart;
        this.labelEndX = labelEnd;
        this.iconStartX = iconStartX;
        this.labelArray = labelArr;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
    }

    /**
     * Falls das Label länger ist als der Balken
     */
    hasLongLabel() {
        return this.labelEndX > this.barEndX;
    }

    getMaxEndX() {
        return Math.max(this.iconStartX + this.imgWidth, Math.max(this.barEndX, this.labelEndX));
    }

    getMinStartX() {
        return Math.min(this.lableStartX, Math.min(this.barStartX, this.iconStartX));
    }
}

export default TaskBarBounds
