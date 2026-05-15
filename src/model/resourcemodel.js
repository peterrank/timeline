/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import AbstractModel from './abstractmodel.js';

/**
 * Die Datenquelle für Ressourcen
 */
class ResourceModel extends AbstractModel {
    constructor(taskModel) {
        super();
        this.totalResHeight = 0;
        this.taskModel = taskModel;
        this.resID2RelativeYStart = new Map();
        this.resID2Height = new Map();
    }

    getTotalResourceHeight() {
        return this.totalResHeight;
    }

    _setDisplayDataDirty(dirty) {
        this.displDataDirty = dirty;
        //super._setDisplayDataDirty(dirty);
        //Immer, wenn die Ressourcen neu berechnet werden müssen, dann müssen auch die Tasks neu berechnet werden
        if (dirty) {
            this.taskModel._setDisplayDataDirty(dirty);
        }
    }

    recomputeDisplayData() {
            this.sort();
            //Neuberechnung der relativen Startposition der Ressourcen
            let curY = 0;
            for (let res of this.data) {
                this.setRelativeYStart(res.getID(), curY);
                curY += this.getHeight(res.getID());
            }
            this._setDisplayDataDirty(false);
            this.totalResHeight = curY;
    }

    getAdminResources() {
        let adminRes  = [];
        //Suchen der Ressourcen, die Admin-Rechte haben
        for (let res of this.getAll()) {
            if (res.isAdmin) {
                adminRes.push(res);
            }
        }
        return adminRes;
    }

    /*
     * Sortierung ist aufsteigend nach Name, dann Zweitname, dann ID
     */
    sort() {
        this.data.sort((i1, i2) => {
            let retVal = i1.getName().localeCompare(i2.getName());
            if (retVal === 0) {
                retVal = i1.secname.localeCompare(i2.secname);
                if (retVal === 0) {
                    retVal = i1.getID() - i2.getID();
                }
            }
            return retVal;
        });
    }

    getHeight(resID) {
        return this.resID2Height.get(resID) || 50;
    }

    setHeight(resID, height) {
        this.resID2Height.set(resID, height);
    }

    getRelativeYStart(taskID) {
        return this.resID2RelativeYStart.get(taskID);
    }

    setRelativeYStart(resID, relYStart) {
        this.resID2RelativeYStart.set(resID, relYStart);
    }

    clearResID2Height() {
        this.resID2Height.clear();
    }

    clearResID2RelativeYStart() {
        this.resID2RelativeYStart.clear();
    }
}

export default ResourceModel;
