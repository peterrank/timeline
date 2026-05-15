/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import LCalInterval from '../calendar/lcalinterval.js';
import TaskDisplayData from './taskdisplaydata.js'

/**
 * Ein Zeitintervall mit Ressourcenbezug
 */
class Task extends LCalInterval {
    constructor(id, start, end, resID, name, secname, innerEvents) {
        super(start, end);
        this.id = id;
        this.resID = resID;
        this.name = name;
        this.secname = secname;
        this.displData = new TaskDisplayData();
        this.deleted = false;
        this.innerEvents = innerEvents;
    }

    clone() {
        let t = new Task(this.id, this.start.clone(), this.end.clone(), this.resID, this.name, this.secname, this.innerEvents);
        t.deleted = this.deleted;
        return t;
    }

    setResID(resID) {
        this.resID = resID;
    }

    getResID() {
        return this.resID;
    }

    setID(id) {
        this.id = id;
    }

    getID() {
        return this.id;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    setSecName(secname) {
        this.secname = secname;
    }

    getSecName() {
        return this.secname;
    }

    getDisplayData() {
        return this.displData;
    }

    setDisplayData(data) {
        this.displData = data;
    }

    getInnerEvents() {
        return this.innerEvents;
    }

    isDeleted() {
        return this.deleted;
    }

    setDeleted(del) {
        this.deleted = del;
    }

    toString() {
        return this.getID() + " " + this.getName() + " Start: " + this.getStart();
    }
}

export default Task
