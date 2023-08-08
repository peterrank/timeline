/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 * --------------------------------------------------------
 * Die Daten, die für die Anzeige der Ressource gebraucht werden
 * Diese Daten werden nicht mit den Ressourcendaten gespeichert, sondern allenfalls profilabhängig
*/

class TaskDisplayData {
    constructor() {
        this.color = "#DDD";
        this.borderColor = null;
        this.isShadow = false;
        this.shape = 0;
        this.position = 0;
        this.expansionFactor = 1; //Die Ausdehnung gegenüber der normalen Höhe
        this.bargroup = ""; //Elemente dieser Gruppe werden in der Timeline in einem Block angezeigt
        this.fontTemplate = "";
        this.fontSizeFactor = 1;
        this.transparency = 1;
    }

    clone() {
        let t = new TaskDisplayData();
        t.height = this.height;
        t.relYStart = this.relYStart;
        t.color = this.color;
        t.borderColor = this.borderColor;
        t.labelColor = this.labelColor;
        t.isShadow = this.isShadow;
        t.shape = this.shape;
        t.position = this.position;
        t.expansionFactor = this.expansionFactor;
        t.bargroup = this.bargroup;
        t.fontTemplate = this.fontTemplate;
        t.fontSizeFactor = this.fontSizeFactor;
        t.transparency = this.transparency;
        return t;
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        this.color = color;
    }

    getBorderColor() {
        return this.borderColor;
    }

    setBorderColor(color) {
        this.borderColor = color;
    }

    getShape() {
        return this.shape;
    }

    setShape(shape) {
        this.shape = shape;
    }

    setIsShadowTask(b) {
        this.isShadow = b;
    }

    isShadowTask() {
        return this.isShadow;
    }

    setPosition(position) {
        this.position = position;
    }

    getPosition() {
        return this.position;
    }

    setExpansionFactor(factor) {
        if(factor) {
            this.expansionFactor = factor;
        } else {
            this.expansionFactor = 1;
        }
    }

    getExpansionFactor() {
        return this.expansionFactor;
    }

    setBarGroup(bargroup) {
        if(bargroup) {
            this.bargroup = bargroup;
        } else {
            this.bargroup = "";
        }
    }

    getBarGroup() {
        return this.bargroup;
    }

    getFontTemplate() {
        return this.fontTemplate;
    }

    getFontSizeFactor() {
        return this.fontSizeFactor;
    }

    setFontTemplate(fontTemplate) {
        this.fontTemplate = fontTemplate;
    }

    setFontSizeFactor(fontSizeFactor) {
        this.fontSizeFactor = fontSizeFactor;
    }

    getTransparency() {
        return this.transparency;
    }

    setTransparency(value) {
        this.transparency = value;
    }
}

export default TaskDisplayData
