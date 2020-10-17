/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import AbstractModel from './abstractmodel.js';
import ResourceModel from './resourcemodel.js'
import LCal from '../calendar/lcal.js';
import LCalHelper from '../calendar/lcalhelper.js';
import Helper from '../helper/helper';
/**
 * Die Datenquelle für RessourcenIntervalle
 */
class TaskModel extends AbstractModel {
    constructor() {
        super();
        this.movedTasksChangeCallbacks = [];
        this.resourceModel = new ResourceModel(this);
        this.movedTasks = [];
        this.verticalPadding = 0;
        this.minimumGroupWidth = 25;
        this.barSize = 40;
        this.expandBars = false; //Wenn true, dann können sich die Balken ausdehnen, so dass nicht alle Balken die selbe Höhe haben
        this.resID2TaskCnt = new Map();
        this.taskID2RelativeYStart = new Map();
        this.taskID2Height = new Map();
        this.taskID2Level = new Map();
        this.resourceGroup2LowestLevel = new Map();
        this.resourceGroup2HighestLevel = new Map();
        this.collapsedGroups = new Set();
    }

    getLevel(task) {
        return this.taskID2Level.get(task.getID());
    }

    getLowestGroupLevel(task) {
        return this.resourceGroup2LowestLevel.get(this.getGroupWithResource(task));
    }

    getHighestGroupLevel(task) {
        return this.resourceGroup2HighestLevel.get(this.getGroupWithResource(task));
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


    getMaxExpansionLevel(taskID2TBB, resID2levelOccupiedUntil, task, data, i) {
        if(!task.getResID) {
            return 0;
        }
        let levelOccupiedUntil = resID2levelOccupiedUntil.get(task.getResID());
        const tbbTask = taskID2TBB.get(task.id);
        //TODO: Für den obersten Level wissen wir schon, dass der nur 1/levelanzahl hoch werden kann.

        //Beim Rest müssen wir nach links und nach rechts schauen, bis keine Überschneidungen mehr möglich sind
        //TODO: am besten vorher nach Level ordnen, dann müssen nur die darüberliegenden betrachtet werden
        let maxExpansionLevel = levelOccupiedUntil.length - 1; //Bis zu diesem Level darf sich der Task nach oben strecken
        if (maxExpansionLevel > this.getLevel(task)) {
            //TODO: folgendes dauert zu lange!
            // für alle darüberliegenden Level die Vorgänge rechts vom betrachteten Vorgang betrachten
            for (let l = i - 1; l >= 0; l--) {
                let leftTask = data[l];
                if (leftTask.getResID() === task.getResID() && this.getLevel(leftTask) > this.getLevel(task)) { //Gibt es einen Vorgang mit einem größeren Level, der diesen Vorgang schneidet, und ist das Level-1 kleiner als das maxExpansionLevel, dann ist das neue ExpansionLevel dieses Level - 1
                    const tbbLeft = taskID2TBB.get(leftTask.id);
                    if (tbbLeft.getMaxEndX() > tbbTask.getMinStartX()) {
                        if (this.getLevel(leftTask) - 1 < maxExpansionLevel) {
                            maxExpansionLevel = this.getLevel(leftTask) - 1;
                            if (maxExpansionLevel === this.getLevel(task)) {
                                break;
                            }
                        }
                    } //hier im else-Fall keinen Break, da nicht nach Endzeit geordnet
                }
            }

            for (let l = i + 1; l < data.length; l++) {
                let rightTask = data[l];
                if (rightTask.getResID() === task.getResID() && this.getLevel(rightTask) > this.getLevel(task)) { //Gibt es einen Vorgang mit einem größeren Level, der diesen Vorgang schneidet, und ist das Level-1 kleiner als das maxExpansionLevel, dann ist das neue ExpansionLevel dieses Level - 1
                    const tbbRight = taskID2TBB.get(rightTask.id);
                    if (tbbRight.getMinStartX() < tbbTask.getMaxEndX()) {
                        if (this.getLevel(rightTask) - 1 < maxExpansionLevel) {
                            maxExpansionLevel = this.getLevel(rightTask) - 1;
                            if (maxExpansionLevel === this.getLevel(task)) {
                                break;
                            }
                        }
                    } else {
                        break;
                    }

                }
            }
        }
        return maxExpansionLevel;
    }

    /**
     * Besetzt levelOccupiedUntil und liefert das Level zurück, ab dem besetzt wurde
     * @param minStart
     * @param maxEnd
     * @param expansionFactor
     * @param levelOccupiedUntil
     * @returns {number}
     */

    occupyLevels(minStart, maxEnd, expansionFactor, levelOccupiedUntil) {
        //Can insert?
        let canInsert = false;
        for (let i = 0; i < levelOccupiedUntil.length; i++) {
            canInsert = true;
            for(let expansionOffset=0; expansionOffset < expansionFactor; expansionOffset++) {
                let index = i + expansionOffset;
                if(index > levelOccupiedUntil.length-1) {
                    break;
                }
                let occupiedUntil = levelOccupiedUntil[index];
                if (occupiedUntil > minStart) {
                    canInsert = false;
                    break;
                }
            }
            if (canInsert) {
                for(let expansionOffset=0; expansionOffset < expansionFactor; expansionOffset++) {
                    let index = i + expansionOffset;
                    if(index > levelOccupiedUntil.length-1) {
                        levelOccupiedUntil.push(maxEnd);
                    } else {
                        levelOccupiedUntil[index] = maxEnd;
                    }
                }
                return i;
            }
        }
        if(!canInsert) {
            for(let expansionOffset=0; expansionOffset < expansionFactor; expansionOffset++) {
                levelOccupiedUntil.push(maxEnd);
            }
        }

        return levelOccupiedUntil.length - expansionFactor;
    }

    /**
     * Bestimmung des Levels, auf dem jeder Vorgang liegt, ggf. auch der darüberliegenden Level, falls Ausdehnung größer ist (z.B. bei Diagrammen).
     * Schreibt das unterste Level an den Vorgang
     * levelOccupiedUntil wird bestimmt, d.h. Array von Datumswerten, bis zu dem das Level geblockt ist, wobei der Index des Arrays das Level beschreibt.
     */
    determineTaskLevels(levelOccupiedUntil, data, taskID2TBB, barGroup2EarliestStart, barGroup2LatestEnd, barGroup2HighestPosition, isGroupDetermination) {
        let currentPosition;
        let currentGroup;
        let currentGroupLevel = 0;
        let currentGroupExpansion = 0;
        for (let i=0; i<data.length; i++) {
            let task = data[i];

            let barGroup1 = task.getDisplayData().getBarGroup();
            if(!barGroup1) {
                barGroup1 = "";
            }
            let position = barGroup1.trim().length > 0 ? barGroup2HighestPosition.get(barGroup1) : task.getDisplayData().getPosition();
            //Wenn sich die Position ändert
            if (position !== currentPosition) {
                currentPosition = position;
                //Alle darunterliegenden levelOccupiedUntil müssen den Maximalwert erhalten, damit sie nicht mehr belegt werden können.
                for (let i = 0; i < levelOccupiedUntil.length; i++) {
                    levelOccupiedUntil[i] = Number.MAX_VALUE;
                }
            }

            //Wenn sich die Gruppe ändert
            if (task.getDisplayData().getBarGroup() !== currentGroup && !isGroupDetermination) {
                //Für die alte Gruppe gilt: Alle Levels, die die currentGroup besetzt müssen bis zum lastEnd der barGroup besetzt werden
                if(currentGroup && currentGroup.trim().length > 0) {
                    let oldGroupMax = Number.NEGATIVE_INFINITY;
                    for (let l = 0; l < currentGroupExpansion + 1; l++) {
                        if (oldGroupMax < levelOccupiedUntil[currentGroupLevel + l]) {
                            oldGroupMax = levelOccupiedUntil[currentGroupLevel + l];
                        }
                    }
                    for (let l = 0; l < currentGroupExpansion + 1; l++) {
                        levelOccupiedUntil[currentGroupLevel + l] = oldGroupMax;
                    }
                }


                if(task.getDisplayData().getBarGroup() && task.getDisplayData().getBarGroup().trim().length > 0) {
                    //6 ist der Mindest-x-Abstand, den Bargroups benötigen
                    const groupXInset = 6;
                    let minStart = barGroup2EarliestStart.get(task.getDisplayData().getBarGroup());
                    let maxEnd = barGroup2LatestEnd.get(task.getDisplayData().getBarGroup());
                    if(maxEnd - minStart < this.minimumGroupWidth) {
                        maxEnd = minStart + this.minimumGroupWidth;
                    }
                    minStart -= groupXInset;
                    maxEnd += groupXInset;

                    //Für die neue Gruppe gilt: die levelOccupiedUntil müssen für Vorgänge dieser Gruppe bestimmt werden. Die Länge entspricht dann dem ExpansionFactor, der benötigt wird
                    let groupTasks = [];
                    for (let n = i; n < data.length; n++) {
                        let groupTask = data[n];
                        if (groupTask.getDisplayData().getBarGroup() !== task.getDisplayData().getBarGroup()) {
                            break;
                        }
                        groupTasks.push(groupTask);
                    }
                    let levelOccupiedUntilForGroupTasks = [];
                    this.determineTaskLevels(levelOccupiedUntilForGroupTasks, groupTasks, taskID2TBB, barGroup2EarliestStart, barGroup2LatestEnd, barGroup2HighestPosition, true);

                    let expansion = levelOccupiedUntilForGroupTasks.length;

                    if(this.isCollapsed(this.getGroupWithResource(task))) {
                        expansion = 1;
                    }

                    let levelOffset = this.occupyLevels(minStart, maxEnd, expansion + 1, levelOccupiedUntil);
                    for(let t of groupTasks) {
                        const level = this.getLevel(t) + levelOffset;
                        this.taskID2Level.set(t.getID(), level);
                        const lowestLevel = this.resourceGroup2LowestLevel.get(this.getGroupWithResource(t));
                        if((lowestLevel!==0 && !lowestLevel) || level < lowestLevel) {
                            this.resourceGroup2LowestLevel.set(this.getGroupWithResource(t), level);
                        }
                        const highestLevel = this.resourceGroup2HighestLevel.get(this.getGroupWithResource(t));
                        if(!highestLevel || level > highestLevel) {
                            this.resourceGroup2HighestLevel.set(this.getGroupWithResource(t), level);
                        }
                    }
                    currentGroupLevel = levelOffset;
                    currentGroupExpansion = expansion;

                    i += groupTasks.length - 1;

                    currentGroup = task.getDisplayData().getBarGroup();
                    continue;
                }

                currentGroup = task.getDisplayData().getBarGroup();
            }

            const tbb = taskID2TBB.get(task.id);
            let level = this.occupyLevels(tbb.getMinStartX(), tbb.getMaxEndX(), task.getDisplayData().getExpansionFactor(), levelOccupiedUntil);

            this.taskID2Level.set(task.getID(), level);
        }
    }

    getGroupWithResource(task) {
        return task.getResID && task.getDisplayData().getBarGroup() && task.getDisplayData().getBarGroup()!==''? task.getResID() + "@" + task.getDisplayData().getBarGroup() : "";
    }

    recomputeDisplayData(getTaskBarBoundsForLevelComputation) {
        if (this.isDisplayDataDirty()) {
            this.taskID2Height.clear();
            this.taskID2RelativeYStart.clear();
            this.taskID2Level.clear();
            this.resourceGroup2LowestLevel.clear();
            this.resourceGroup2HighestLevel.clear();
            this.getResourceModel().clearResID2Height();
            this.getResourceModel().clearResID2RelativeYStart();
            let data = this.data.concat(this.movedTasks);
            this.resID2TaskCnt = new Map();
            let taskID2TBB = new Map();
            for(let task of data) {
                const tbb = getTaskBarBoundsForLevelComputation(task);
                taskID2TBB.set(task.id, tbb);
            }

            let resID2levelOccupiedUntil = new Map();

            //Gruppen: das Start-X (das ist die kleinste Startzeit eines Ereignisses) merken (groupStart). Damit kann dann danach sortiert werden.
            //Korrektur der Positionen:  Innerhalb von Gruppen zählt nur die größte Position
            let barGroup2EarliestStart = new Map();
            let barGroup2LatestEnd = new Map();
            let barGroup2HighestPosition = new Map();
            for (let task of data) {
                const barGroup = task.getDisplayData().getBarGroup();
                if (barGroup && barGroup.trim().length > 0) {
                    if (!barGroup2EarliestStart.get(barGroup)) {
                        barGroup2EarliestStart.set(barGroup, taskID2TBB.get(task.id).getMinStartX());
                    }
                    const currentEnd = barGroup2LatestEnd.get(barGroup);
                    const tbbEnd = taskID2TBB.get(task.id).getMaxEndX();
                    if (!currentEnd || currentEnd < tbbEnd) {
                        barGroup2LatestEnd.set(barGroup, tbbEnd);
                    }

                    const position = task.getDisplayData().getPosition();
                    const highestPos = barGroup2HighestPosition.get(barGroup);
                    if (!highestPos || highestPos < position) {
                        barGroup2HighestPosition.set(barGroup, position);
                    }
                }
            }

            //sortieren
            this.sortForDisplay(data, taskID2TBB, barGroup2EarliestStart, barGroup2HighestPosition);

            //je nach maximalem Besetzungsgrad der Ressource muss diese von der Höhe her variieren
            // if (this.getResourceModel().isDisplayDataDirty()) {
            for (let res of this.getResourceModel().getAll()) {
                let levelOccupiedUntil = resID2levelOccupiedUntil.get(res.getID());
                if(!levelOccupiedUntil) {
                    levelOccupiedUntil = [];
                    resID2levelOccupiedUntil.set(res.getID(), levelOccupiedUntil);
                }

                //Nur die Ereignisse dieser Story
                let filteredData = data.filter(t => t.getResID && t.getResID()===res.id);
                this.determineTaskLevels(levelOccupiedUntil, filteredData, taskID2TBB, barGroup2EarliestStart, barGroup2LatestEnd, barGroup2HighestPosition);
                if (levelOccupiedUntil && levelOccupiedUntil.length > 0) {
                    this.getResourceModel().setHeight(res.getID(), this.verticalPadding * 2 + (levelOccupiedUntil.length) * this.barSize);
                } else {
                    this.getResourceModel().setHeight(res.getID(), this.verticalPadding * 2 + this.barSize);
                }
            }

            //Neuberechnung der Ressourcen
            this.getResourceModel().recomputeDisplayData();

            //Das oberste Level kann immmer 1/levelanzahl vom Gesamtplatz einnehmen.
            //Vorgänge können immer so hoch werden wie das minimale Level eines darüberliegenden Vorgangs es erlaubt

            //Nimm der Reihe nach jeden Vorgang und schaue nach Überschneidungen der darüberliegenden Level.

            //Neuberechnung der relativen y-Startposition der Vorgänge
            //Dazu muss bestimmt werden, wie hoch sich ein Vorgang nach oben ausdehnen darf
            for (let i = 0; i < data.length; i++) {
                let task = data[i];
                let res = task.getResID && this.getResourceModel().getItemByID(task.getResID());
                if (res) {
                    let effectiveResourceHeight = this.getResourceModel().getHeight(res.getID()) - 2 * this.verticalPadding;
                    let effectiveRelativeYStart = this.getResourceModel().getRelativeYStart(res.getID()) + this.verticalPadding;
                    let levelOccupiedUntil = resID2levelOccupiedUntil.get(task.getResID());
                    let totalResourceLevelCnt = levelOccupiedUntil.length;
                    let levelHeight = effectiveResourceHeight / totalResourceLevelCnt;

                    if(this.isCollapsed(this.getGroupWithResource(task))) {
                        const lowestGroupLevel = this.getLowestGroupLevel(task);
                        const highestGroupLevel = this.getHighestGroupLevel(task);
                        const totalGroupLevels = highestGroupLevel - lowestGroupLevel + 1;
                        this.taskID2Height.set(task.getID(), this.barSize / totalGroupLevels);
                    } else {
                        if (this.expandBars) {
                            let maxExpansionLevel = this.getMaxExpansionLevel(
                                taskID2TBB, resID2levelOccupiedUntil, task,
                                data, i);
                            let expansionLevelCnt = maxExpansionLevel
                                - this.taskID2Level.get(task.getID()) + 1;
                            this.taskID2Height.set(task.getID(),
                                expansionLevelCnt * levelHeight);
                        } else {
                            this.taskID2Height.set(task.getID(), levelHeight
                                * task.getDisplayData().getExpansionFactor());
                        }
                    }
                    if(this.isCollapsed(this.getGroupWithResource(task))) {
                        const lowestGroupLevel = this.getLowestGroupLevel(task);
                        const highestGroupLevel = this.getHighestGroupLevel(task);
                        const totalGroupLevels = highestGroupLevel - lowestGroupLevel + 1;
                        this.taskID2RelativeYStart.set(task.getID(),
                            effectiveRelativeYStart + effectiveResourceHeight
                            - lowestGroupLevel * levelHeight
                            - (this.getLevel(task) - lowestGroupLevel) / totalGroupLevels * this.barSize
                            - this.getHeight(task.getID()));
                    } else {
                        this.taskID2RelativeYStart.set(task.getID(),
                            effectiveRelativeYStart + effectiveResourceHeight
                            - this.getLevel(task) * levelHeight
                            - this.getHeight(task.getID()));
                    }
                    resID2levelOccupiedUntil = resID2levelOccupiedUntil.set(res.getID(), levelOccupiedUntil);
                }
            }

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
                let position1 = barGroup1.trim().length > 0 ? barGroup2HighestPosition.get(barGroup1) : i1.getDisplayData().getPosition();
                let position2 = barGroup2.trim().length > 0 ? barGroup2HighestPosition.get(barGroup2) : i2.getDisplayData().getPosition();

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
     * Sortierung ist aufsteigend nach Startzeit, da der Algorithmus zum übereinanderlegen das so braucht
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
