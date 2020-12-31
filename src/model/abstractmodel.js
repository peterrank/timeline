/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 *
 * Die Datenquelle
 */

const icons = [];

const defaultIconProvider = function(obj, onLoad) {
    if(obj !== null) {
        let imgSrc = obj.imageurl;

        if (imgSrc && imgSrc !== "") {
            if (icons[imgSrc]) {
                return icons[imgSrc];
            } else {
                let img = new Image();
                img.src = imgSrc;
                if (onLoad) {
                    img.onload = onLoad;
                }
                icons[imgSrc] = img;
                return img;
            }
        }
    }
    return null;
}

class AbstractModel {
    constructor() {
        this.dataChangeCallbacks = [];
        this.data = [];
        this.id2Item = new Map();
        this.selectedItemIDs = [];
        this.displDataDirty = true;
        this.iconProvider = defaultIconProvider;
        this.imageLoadingTimeoutHandle = null;
    }

    addDataChangeCallback(listener) {
        this.dataChangeCallbacks.push(listener);
    }

    getSelectedItemIDs() {
        return this.selectedItemIDs;
    }

    setSelectedItemIDs(selItemIDs) {
        this.selectedItemIDs = selItemIDs;
        this._fireDataChanged("SELECTION");
    }

    _fireDataChanged(type) {
        for (let o of this.dataChangeCallbacks) {
            o(type);
        }
    }

    _setDisplayDataDirty(dirty) {
        this.displDataDirty = dirty;
    }

    /**
     * Austausch einer ID gegen eine andere (wenn gespeichert wurde)
     */
    exchangeID(oldID, newID) {
        let item = this.getItemByID(oldID);
        if (item) {
            item.setID(newID);
            this.id2Item.remove(oldID);
            this.id2Item.put(newID, item);
            this._fireDataChanged();
        } else {
            console.log("ID " + oldID + " wurde nicht ausgetauscht gegen " + newID);
            return false;
        }
    }

    put(d, isAligning) {
        if (d.isDeleted()) {
            this.remove(d, isAligning);
            return;
        }
        let isReplaced = false;
        //Gibt es das Element bereits?
        if (this.id2Item.get(d.getID())) {
            //Falls ja, bei welchem Index?
            let i = -1;
            for (let n = 0; n < this.data.length; n++) {
                if (this.data[n].getID() === d.getID()) {
                    i = n;
                    break;
                }
            }
            if (i >= 0) {
                this.data[i] = d;
                isReplaced = true;
            }
        }
        if (!isReplaced) {
            this.data.push(d);
        }
        this.id2Item.set(d.getID(), d);

        this._setDisplayDataDirty(true);

        if (!isAligning) {
            this.sort();
            this._fireDataChanged();
        }
    }

    add(d, isAligning) {
        this.data.push(d);
        this.id2Item.set(d.getID(), d);
        if (!isAligning) {
            this._setDisplayDataDirty(true);
            this._fireDataChanged();
        }
    }

    removeByID(id, isAligning) {
        let item = this.id2Item.get(id);
        let i = this.data.indexOf(item);
        if (i !== -1) {
            this.data.splice(i, 1);
            this.id2Item.delete(id);
            this._setDisplayDataDirty(true);
            if (!isAligning) {
                //this.sort();
                this._fireDataChanged();
            }
        }
    }

    remove(d, isAligning) {
        this.removeByID(d.getID(), isAligning);
    }

    setAll(dList) {
        this.id2Item.clear();
        this.data = dList;
        for (let d of dList) {
            this.id2Item.set(d.getID(), d);
        }
        this._setDisplayDataDirty(true);
        this.sort();
        this._fireDataChanged();
    }

    putAll(dList) {
        for (let d of dList) {
            this.put(d, true);
        }

        this.sort();
        this._fireDataChanged();
    }

    /*
    * Standardsortierung ist nach der Bezeichnung
     */
    sort() {
        this.data.sort((i1, i2) => {
            let retVal = i1.getName().localeCompare(i2.getName());
            if (retVal === 0) {
                return i1.getID() - i2.getID();
            }
            return retVal;
        });
    }

    getAll() {
        return this.data;
    }

    size() {
        return this.data.length;
    }

    getItemByID(id) {
        return this.id2Item.get(id);
    }

    getItemAt(index) {
        return this.data[index];
    }

    isDisplayDataDirty() {
        return this.displDataDirty;
    }

    clear() {
        this.data.length = 0;
        this.id2Item.clear();
        this._setDisplayDataDirty(true);
        this._fireDataChanged();
    }

    setIconProvider(f) {
        this.iconProvider = f;
    }

    getIcon(object) {
        if (this.iconProvider) {
            return this.iconProvider(object, () => {
                if(this.imageLoadingTimeoutHandle) {
                    clearTimeout(this.imageLoadingTimeoutHandle);
                }
                this.imageLoadingTimeoutHandle = setTimeout(()=>this._fireDataChanged(), 500);
            });
        }
        return null;
    }

    toString() {
        return "data: " + this.data;
    }
}

export default AbstractModel
