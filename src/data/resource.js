/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import ResourceDisplayData from './resourcedisplaydata.js'

/**
 * Eine Ressource für Zeitintervalle
 */
class Resource {
    constructor(id, name, secname, deleted) {
        this.id = id;
        this.name = name || "";
        this.secname = secname || "";
        this.displData = new ResourceDisplayData();
        this.deleted = deleted;
    }

    clone() {
        return new Resource(this.id, this.name, this.secname, this.deleted);
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

    getDisplayData() {
        return this.displData;
    }

    getMarkingColor() {
        return null;
    }

    setDeleted(d) {
        this.deleted = d;
    }

    isDeleted() {
        return this.deleted;
    }

    toString() {
        return this.getID() + " " + this.getName();
    }
}

export default Resource
