/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 * --------------------------------------------------------
 * Die Daten, die für die Anzeige der Ressource gebraucht werden
 * Diese Daten werden nicht mit den Ressourcendaten gespeichert, sondern allenfalls profilabhängig
*/

class TaskDisplayData {
    constructor() {
        this.color = "#DDD";
        this.labelColor = "#FFF";
        this.secLabelColor = "#CCC";
        this.isShadow = false;
        this.shape = 0;
        this.position = 0;
        this.expansionFactor = 1; //Die Ausdehnung gegenüber der normalen Höhe
        this.bargroup = ""; //Elemente dieser Gruppe werden in der Timeline in einem Block angezeigt
    }

    clone() {
        let t = new TaskDisplayData();
        t.height = this.height;
        t.relYStart = this.relYStart;
        t.color = this.color;
        t.labelColor = this.labelColor;
        t.secLabelColor = this.secLabelColor;
        t.isShadow = this.isShadow;
        t.shape = this.shape;
        t.position = this.position;
        t.expansionFactor = this.expansionFactor;
        t.bargroup = this.bargroup;
        return t;
    }

    getLabelColor() {
        return this.labelColor;
    }

    setLabelColor(value) {
        this.labelColor = value;
    }

    getSecLabelColor() {
        return this.secLabelColor;
    }

    setSecLabelColor(value) {
        this.secLabelColor = value;
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        this.color = color;
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
}

export default TaskDisplayData
