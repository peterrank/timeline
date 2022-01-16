/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import AbstractModel from './abstractmodel.js';
import ResourceModel from './resourcemodel.js'
import LCal from '../calendar/lcal.js';
import LCalHelper from '../calendar/lcalhelper.js';
import Helper from '../helper/helper';
import stack from "../stacker/stacker";
import toLeafStackElement from "../stacker/stackElementBuilder";
/**
 * Die Datenquelle für RessourcenIntervalle
 */

export const minimumGroupWidth = 25;
export const minimumResourceHeight = 75;
export const verticalPadding = 20;

class TaskModel extends AbstractModel {
    constructor() {
        super();
        this.movedTasksChangeCallbacks = [];
        this.resourceModel = new ResourceModel(this);
        this.movedTasks = [];
        this.inlineResourceHeight = 0;
        this.hideResourceHeaderIfOnlyOneRes = false;
        this.barSize = 40; //Basis Balkengröße
        this.expandBars = false; //Wenn true, dann können sich die Balken ausdehnen, so dass nicht alle Balken die selbe Höhe haben
        this.resID2TaskCnt = new Map();
        this.taskID2RelativeYStart = new Map();
        this.taskID2Height = new Map();
        this.taskID2Level = new Map();
        this.collapsedGroups = new Set();
    }

    setInlineResourceHeaderHeight(inlineResourceHeight) {
        this.inlineResourceHeight = inlineResourceHeight;
    }

    setHideResourceHeaderIfOnlyOneRes(b) {
        this.hideResourceHeaderIfOnlyOneRes = b;
    }

    getEffectiveInlineResourceHeaderHeight() {
        return (!this.hideResourceHeaderIfOnlyOneRes || this.size() > 1) ? this.inlineResourceHeight : 0;
    }

    _setDisplayDataDirty(dirty) {
        this.displDataDirty = dirty;
    }

    clearCollapsedGroups() {
        this.collapsedGroups.clear();
        this._setDisplayDataDirty(true);
        this._fireDataChanged();
    }

    collapseAllGroups() {
        for (let task of this.data) {
            const group = this.getGroupWithResource(task);
            if(group && group !== "") {
                this.collapsedGroups.add(group);
            }
        }
        this._setDisplayDataDirty(true);
        this._fireDataChanged();
    }

    addCollapsedGroup(group) {
        this.collapsedGroups.add(group);
        this._setDisplayDataDirty(true);
        this._fireDataChanged();
    }

    removeCollapsedGroup(group) {
        this.collapsedGroups.delete(group);
        this._setDisplayDataDirty(true);
        this._fireDataChanged();
    }

    isCollapsed(group) {
        return this.collapsedGroups.has(group);
    }

    getCollapsedGroups() {
        return this.collapsedGroups;
    }
    
    toggleBarGroupCollapse(group, getTaskBarBounds) {
        if(this.isCollapsed(group)) {
            this.removeCollapsedGroup(group);
        } else {
            this.addCollapsedGroup(group);
        }
        this.recomputeDisplayData(getTaskBarBounds);
    }

    addMovedTasksChangeCallback(listener) {
        this.movedTasksChangeCallbacks.push(listener);
    }

    addDataChangeCallback(listener) {
        super.addDataChangeCallback(listener);
        this.getResourceModel().addDataChangeCallback(listener);
    }

    _fireMovedTasksChanged() {
        for (let o of this.movedTasksChangeCallbacks) {
            o();
        }
    }

    getResourceModel() {
        return this.resourceModel;
    }

    getDisplayedStart(task) {
        if (task.getStart()) {
            return task.getStart().getEarliestLCal();
        } else {
            //Gibt es ein innerEvent mit einer Startzeit?
            if (task.innerEvents) {
                //Suchen des Events mit der frühsten Startzeit
                let earliestStart = null;
                for (let evt of task.innerEvents) {
                    if (evt.startYear) {
                        let start = new LCal().initYMDHM(evt.startYear, evt.startMonth, evt.startDay, evt.startHour, evt.startMinute, evt.startPrecision, evt.startType).getEarliestLCal();
                        if (earliestStart === null || start.before(earliestStart)) {
                            earliestStart = start;
                        }
                    }
                }
                if (earliestStart) {
                    return earliestStart;
                }
            }


            let now = LCalHelper.getNowMinutes();
            if (task.getEnd() === null || task.getEnd().getEarliestLCal().getJulianMinutes() > now) {
                return new LCal().setJulianMinutes(LCalHelper.getNowMinutes()).setTimeZone("Europe/Berlin"); //TODO: Irgendwoher eine Standardzeitzone holen
            } else {
                return task.getEnd().getEarliestLCal();
            }
        }
    }

    getDisplayedEnd(task) {
        if (task.getEnd()) {
            return task.getEnd().getLatestLCal();
        } else {
            //Gibt es ein innerEvent mit einer Startzeit?
            if (task.innerEvents) {
                //Suchen des Events mit der frühsten Startzeit
                let latestEnd = null;
                for (let evt of task.innerEvents) {
                    if (evt.startYear) {
                        let end = new LCal().initYMDHM(evt.startYear, evt.endMonth, evt.endDay, evt.endHour, evt.endMinute, evt.endPrecision, evt.endType).getLatestLCal();
                        if (latestEnd === null || end.after(latestEnd)) {
                            latestEnd = end;
                        }
                    }
                }

                if (latestEnd) {
                    return latestEnd;
                }
            }

            let now = LCalHelper.getNowMinutes();
            if (task.getStart() === null || task.getStart().getLatestLCal().getJulianMinutes() < now) {
                return new LCal().setJulianMinutes(now).setTimeZone("Europe/Berlin"); //TODO: Irgendwoher eine Standardzeitzone holen
            } else {
                return task.getStart().getLatestLCal();
            }
        }
    }

    getGroupWithResource(task) {
        return task.getResID && task.getDisplayData().getBarGroup() && task.getDisplayData().getBarGroup()!==''? task.getResID() + "@" + task.getDisplayData().getBarGroup() : "";
    }



    stackNode(stackElementTreeNode) {
        if(Array.isArray(stackElementTreeNode)) {
            stack(stackElementTreeNode);
            stackElementTreeNode.height = stackElementTreeNode.height;
            stackElementTreeNode.start = stackElementTreeNode.start;
            stackElementTreeNode.end = stackElementTreeNode.end;
        } else {
            stackElementTreeNode.height = 0;
            stackElementTreeNode.start = Number.MAX_SAFE_INTEGER;
            stackElementTreeNode.end = Number.MIN_SAFE_INTEGER;


            const sortedStackElementTreeNode = new Map([...stackElementTreeNode.entries()].sort((a, b) => a[0] - b[0]));
            for(let val of sortedStackElementTreeNode.values()) {
                this.stackNode(val);

                if(val.type !== 'storyposition') {
                    val.level = stackElementTreeNode.height;
                    stackElementTreeNode.start = Math.min(stackElementTreeNode.start, val.start);
                    stackElementTreeNode.end = Math.max(stackElementTreeNode.end, val.end);
                    stackElementTreeNode.height += val.height;

                } else {
                    // Die Positionen stacken, unter denen Gruppen hängen
                    const stackEntries = Array.from(val.values());

                    stack(stackEntries);

                    val.start = stackEntries.start;
                    val.end = stackEntries.end;
                    val.height = stackEntries.height;
                    val.level = stackElementTreeNode.height;

                    stackElementTreeNode.start = Math.min(stackElementTreeNode.start, val.start);
                    stackElementTreeNode.end = Math.max(stackElementTreeNode.end, val.end);
                    stackElementTreeNode.height += val.height;
                }
            }

            if(stackElementTreeNode.type === 'bargroup' && !stackElementTreeNode.isDummyBarGroup) {
                if(stackElementTreeNode.collapsed) {
                    stackElementTreeNode.uncollapsedLevelCnt = stackElementTreeNode.height;
                    stackElementTreeNode.height = 2;
                } else {
                    stackElementTreeNode.height += 1; //Bargroups sind 1 Level höher um die Titlebar einblenden zu können
                }
                stackElementTreeNode.start -= 20;
                stackElementTreeNode.end += 20;
            }
        }
    }

    determineResourceHeights(stackElementTree) {
        const baseResSize =  this.getEffectiveInlineResourceHeaderHeight() + verticalPadding * 2 + this.barSize;
        for(let res of this.getResourceModel().getAll()) {
            this.getResourceModel().setHeight(res.id, baseResSize);
        }
       for(const elt of stackElementTree.entries()) {
            const resID = elt[0];
            const maxLevelHeight = elt[1].height; //Höhe in Levels

            //setzen der Höhe der Ressourcen
            const resHeight = this.getEffectiveInlineResourceHeaderHeight() + verticalPadding * 2 + maxLevelHeight * this.barSize;
            this.getResourceModel().setHeight(resID, resHeight);
        }
    }

    determineAbsolutePositions(stackElementTree) {
        for(const elt of stackElementTree.entries()) {
            const resID = elt[0];
            const resLevelCnt = elt[1].height;

            let effectiveResourceHeight = this.getResourceModel().getHeight(resID) - 2 * verticalPadding - this.getEffectiveInlineResourceHeaderHeight();
            let effectiveRelativeYStart = this.getResourceModel().getRelativeYStart(resID) + verticalPadding + this.getEffectiveInlineResourceHeaderHeight();
            let levelHeight = effectiveResourceHeight / resLevelCnt;

            this.determineAbsolutePositionsOfNode(elt[1], resLevelCnt, resID, 0, false, 0, false, 0, effectiveResourceHeight, effectiveRelativeYStart, levelHeight);
        }
    }

    determineAbsolutePositionsOfNode(stackElementTreeNode, resLevelCnt, resID, baseLevel, isUnderBarGroup, levelUnderBarGroup, collapsed, barGroupUncollapsedLevelCount, effectiveResourceHeight, effectiveRelativeYStart, levelHeight) {
        for(const elt of stackElementTreeNode.entries()) {
            //Für die unterste Ebene dann die absolute Position bestimmen
            let level = baseLevel;
            let subBargroupLevel = levelUnderBarGroup;
            let isUnderBarGroupB = isUnderBarGroup;
            if(elt[1].level) {
                if (!isUnderBarGroupB) {
                    level += elt[1].level;
                } else {
                    subBargroupLevel += elt[1].level;
                }
            }
            if(Array.isArray(stackElementTreeNode)) {
                this.determineAbsolutePosition(elt[1], resLevelCnt, resID, level, subBargroupLevel, stackElementTreeNode.collapsed || collapsed, barGroupUncollapsedLevelCount, effectiveResourceHeight, effectiveRelativeYStart, levelHeight);
            } else {
                if(elt[1].type === 'bargroup') {
                    isUnderBarGroupB = true;
                    barGroupUncollapsedLevelCount = elt[1].uncollapsedLevelCnt;
                }
                this.determineAbsolutePositionsOfNode(elt[1], resLevelCnt, resID, level, isUnderBarGroupB, subBargroupLevel, stackElementTreeNode.collapsed || collapsed, barGroupUncollapsedLevelCount, effectiveResourceHeight, effectiveRelativeYStart, levelHeight);
            }
        }
    }

    determineAbsolutePosition(element, resLevelCnt, resID, baseLevel, levelUnderBarGroup, collapsed, barGroupUncollapsedLevelCount, effectiveResourceHeight, effectiveRelativeYStart, levelHeight) {
        let res = this.getResourceModel().getItemByID(resID);
        if (res) {
            if(collapsed) {
                this.taskID2Height.set(element.userObject.id, this.barSize / barGroupUncollapsedLevelCount);
                this.taskID2RelativeYStart.set(element.id,
                    effectiveRelativeYStart + effectiveResourceHeight
                    - baseLevel * levelHeight
                    - levelUnderBarGroup * this.barSize / barGroupUncollapsedLevelCount
                    - this.getHeight(element.id));
            } else {
                this.taskID2Height.set(element.id, levelHeight * element.userObject.getDisplayData().getExpansionFactor());
                this.taskID2RelativeYStart.set(element.id,
                    effectiveRelativeYStart + effectiveResourceHeight
                    - (baseLevel + levelUnderBarGroup) * levelHeight
                    - this.getHeight(element.id));
            }
        }
    }

    buildStackElementTreePart(treePart, id, type) {
        let subTreePart = treePart.get(id);
        if(!subTreePart) {
            subTreePart = new Map();
            subTreePart.type = type;
            treePart.set(id, subTreePart);
        }
        return subTreePart;
    }

    insertTaskToStackElementTree(stackElementTree, taskElement, group2GroupPosition) {
        let stackElementTreePart = this.buildStackElementTreePart(stackElementTree, taskElement.userObject.resID, "story");

        let barGroup = this.getGroupWithResource(taskElement.userObject);
        let isDummyBarGroup = false;
        if(barGroup.length === 0) {
            barGroup = taskElement.userObject.id;
            isDummyBarGroup = true;
        }

        let firstLevelPos = group2GroupPosition.get(barGroup);
        if(!Number.isInteger(firstLevelPos)){
            firstLevelPos = parseInt(taskElement.userObject.getDisplayData().getPosition())
        }

        stackElementTreePart = this.buildStackElementTreePart(stackElementTreePart, firstLevelPos, "storyposition");

        stackElementTreePart = this.buildStackElementTreePart(stackElementTreePart, barGroup, "bargroup");

        if(isDummyBarGroup) {
            stackElementTreePart.isDummyBarGroup = true;
        } else if(this.isCollapsed(barGroup)) {
            stackElementTreePart.collapsed = true;
        }

        //Ein neues Positionselement für die Position unter der Story
        let elementList = stackElementTreePart.get(parseInt(taskElement.userObject.getDisplayData().getPosition()));

        //Am Ende das taskElement in eine Liste einfügen
        if(!elementList) {
            elementList = [];
            elementList.type = 'groupposition';
            stackElementTreePart.set(parseInt(taskElement.userObject.getDisplayData().getPosition()), elementList);
        }
        elementList.push(taskElement);
    }

    determineStackElementTree(taskElements, group2GroupPosition) {
        let stackElementTree = new Map();
        taskElements.forEach(taskElement => {
            this.insertTaskToStackElementTree(stackElementTree, taskElement, group2GroupPosition);
        });
        return stackElementTree;
    }

    recomputeDisplayData(getTaskBarBoundsForLevelComputation) {
        if (this.isDisplayDataDirty()) {
            this.taskID2RelativeYStart.clear();
            this.taskID2Height.clear();

            const data = this.data.concat(this.movedTasks);

            //Die Position der Gruppe richtet sich nach der Position des höchsten Elements in dieser Gruppe
            const group2GroupPosition = new Map();
            data.forEach(task => {
                const bg = this.getGroupWithResource(task);
                if(bg && bg.length > 0) {
                    let groupPos = group2GroupPosition.get(bg);
                    if(!groupPos) {
                       groupPos = -100;
                    }
                    groupPos = Math.max(groupPos, parseInt(task.getDisplayData().getPosition()));
                    group2GroupPosition.set(bg, groupPos);
                }
            });

            const elements = data.map(task => toLeafStackElement(task, getTaskBarBoundsForLevelComputation));

            // Aufbau eines Baums resID -> Group -> Position -> Event, wobei die einzelnen Knoten immer vom Typ Element sind und Group nicht unbedingt vhd. sein muss
            const stackElementTree = this.determineStackElementTree(elements, group2GroupPosition);

            this.stackNode(stackElementTree);

            this.determineResourceHeights(stackElementTree);

            this.getResourceModel().recomputeDisplayData();

            this.determineAbsolutePositions(stackElementTree);

            console.log(stackElementTree);

            this._setDisplayDataDirty(false);
        }
    }


    getHeight(taskID) {
        let height = this.taskID2Height.get(taskID);
        return height ? height : this.barSize;
    }

    getRelativeYStart(taskID) {
        return this.taskID2RelativeYStart.get(taskID);
    }

    getItemByID(id) {
        let item = super.getItemByID(id);
        if (!item) {
            //Falls mit dieser ID nichts gefunden wird, dann ist es möglich, dass das Item nur bei den movedTasks vorhanden ist
            for (let mt of this.movedTasks) {
                if (mt.getID() === id) {
                    return mt;
                }
            }
        }
        return item;
    }


    getItemCntByResourceID(resID) {
        let result = this.resID2TaskCnt.get(resID);
        if ( typeof(result) === "undefined" || result === null ) {
            result = 0;
            for (let t of this.data) {
                if (t.getResID && t.getResID() === resID) {
                    result ++;
                }
            }
            this.resID2TaskCnt.set(resID, result);
        }
        return result;
    }

    getItemsByResourceID(resID) {
        let result = [];
        for (let t of this.data) {
            if (t.getResID && t.getResID() === resID) {
                result.push(t);
            }
        }
        return result;
    }

    setMovedTasks(movedTasks) {
        if(!Helper.isEquivalent(movedTasks, this.movedTasks)) {
            this.movedTasks = movedTasks;

            //Bei displayData ein Vermerk machen welche Vorgänge jetzt als Schattenvorgänge gezeichnet werden sollen
            for (let task of this.data) {
                task.getDisplayData().setIsShadowTask(false);
                for (let mt of this.movedTasks) {
                    if (mt.getID() === task.getID()) {
                        task.getDisplayData().setIsShadowTask(true);
                        break;
                    }
                }
            }

            this._fireDataChanged();
            this._fireMovedTasksChanged();
        }
    }

    getMovedTasks() {
        return this.movedTasks;
    }


    /**
     * Entfernen der Ressource und aller Vorgänge, die auf dieser Ressource liegen aus dem Model
     */
    removeResource(res) {
        this.displDataDirty = true;
        this.getResourceModel().remove(res);
        this.data = this.data.filter((t) => t.getResID && t.getResID() !== res.id);
    }


    //TODO: Kann später entfallen
    hashCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var character = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+character;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    sortForDisplay(data, taskID2TBB, barGroup2FirstStart, barGroup2HighestPosition) {
        data.sort((i1, i2) => {
            //Shape 3 (Hintergrund) muss immer ganz unten liegen
            let shape1 = i1.getDisplayData().getShape();
            let shape2 = i2.getDisplayData().getShape();
            let retVal = shape1 === 3 && shape2 !== 3 ? -1 : (shape1!==3 && shape2 === 3 ? 1 : 0);
            if(retVal === 0) {
                let barGroup1 = i1.getDisplayData().getBarGroup();
                if(!barGroup1) {
                    barGroup1 = "";
                }
                let barGroup2 = i2.getDisplayData().getBarGroup();
                if(!barGroup2) {
                    barGroup2 = "";
                }
                let position1 = barGroup1.trim().length > 0 ? barGroup2HighestPosition.get(barGroup1) : parseInt(i1.getDisplayData().getPosition());
                let position2 = barGroup2.trim().length > 0 ? barGroup2HighestPosition.get(barGroup2) : parseInt(i2.getDisplayData().getPosition());

                //Dann geht es nach den angegebenen Positionen
                retVal = position1 - position2;
                if (retVal === 0) {
                    let tbb1 = taskID2TBB.get(i1.id);
                    let tbb2 = taskID2TBB.get(i2.id);

                    //Bestimmt sich der MinStart durch den MinStart der TBB oder durch die Gruppe?
                    let minStart1 =  tbb1.getMinStartX();
                    let minStart2 =  tbb2.getMinStartX();

                    if(barGroup2FirstStart) {

                        if (barGroup1.trim().length > 0) {
                            minStart1 = barGroup2FirstStart.get(barGroup1);
                        }

                        if (barGroup2.trim().length > 0) {
                            minStart2 = barGroup2FirstStart.get(barGroup2);
                        }

                        retVal = minStart1 - minStart2;

                        //Falls die barGroups und/oder Balken den gleichen Startzeitpunkt haben, muss nach der barGroup sortiert werden
                        if(retVal=== 0) {
                            retVal = barGroup1.localeCompare(barGroup2);
                            //Innerhalb der Gruppe muss aber normal sortiert werden
                            if (retVal === 0) {
                                retVal = tbb1.getMinStartX() - tbb2.getMinStartX();
                            }
                        }
                    } else {
                        retVal = minStart1 - minStart2;
                    }

                    if (retVal === 0) {
                        let maxEnd1 =  tbb1.getMaxEndX();
                        let maxEnd2 =  tbb2.getMaxEndX();

                        retVal = maxEnd1 - maxEnd2;
                        if(retVal=== 0) {
                            retVal = i1.getID() - i2.getID();
                        }
                    }
                }
            }
            return retVal;
        });
    }
    /*
     * Sortierung ist aufsteigend nach Startzeit
     */
    sort() {
        this.data.sort((i1, i2) => {
            let retVal = this.getDisplayedStart(i1).getJulianMinutes() - this.getDisplayedStart(i2).getJulianMinutes();
            if (retVal === 0) {
                retVal = i1.getID() - i2.getID();
            }
            return retVal;
        });
    }
}

export default TaskModel
