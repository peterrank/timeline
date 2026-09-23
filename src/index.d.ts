import * as React from 'react';

/**
 * Calendar system storing time as Julian minutes.
 * See LCal.js header comment for the precision levels (0 = Gigayear ... 13 = minute).
 */
export class LCal {
    isDirty: boolean;
    julianminutes: number;
    timezone: string;
    year: number | undefined;
    month: number | undefined;
    day: number | undefined;
    hour: number | undefined;
    minute: number | undefined;
    precision: number;
    type: number;

    constructor();

    clone(): LCal;
    isEndType(): boolean;
    initYMDHM(year: number, month?: number, day?: number, hour?: number, minute?: number, timezone?: string, precision?: number, type?: number): this;
    initNow(): this;
    getJulianMinutes(): number;
    setTimeZone(timezone: string): this;
    setPrecision(precision: number): this;
    setType(type: number): this;
    setJulianMinutes(julianMinutes: number): this;
    before(other: LCal): boolean;
    after(other: LCal): boolean;
    equals(other: LCal | null | undefined): boolean;
    addYear(count: number): this;
    addMonth(count: number): this;
    addDay(count: number): this;
    addHour(count: number): this;
    addMinutes(count: number): this;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getDayInWeek(): number;
    getTimeZone(): string;
    getPrecision(): number;
    getType(): number;
    getJSDate(): Date;
    getDistanceInMinutes(other: LCal | null | undefined): number | null;
    getAbsDistanceInMinutesConsiderPrecision(other: LCal | null | undefined): number | null;
    getAbsDistanceInWeeksConsiderPrecision(other: LCal | null | undefined): number;
    getEarliestLCal(): LCal;
    getLatestLCal(): LCal;
    subtractPrecision(): void;
    getDistanceInYMDHM(other: LCal, timezone: string): [number, number, number, number, number];
    toString(): string;
}

export class LCalHelper {
    static getStandardTimeZoneOffset(timezone: string): number;
    static getTimeInMinutes(year: number, month: number, day: number, hour: number, minute: number, timezone: string): number;
    static getYMDHM(julianMinutes: number, timezone: string): [number, number, number, number, number];
    static isDaylightSavingTime(year: number, month: number, day: number, hour: number, minute: number, timezone: string): boolean;
    static getLCal(date: Date): LCal;
    static getJSDate(lcal: LCal): Date;
    static julianToUnix(julianMinutes: number): number;
    static unixToJulian(unixMillis: number): number;
    static isLeapYear(year: number): boolean;
    static getDayInWeek(time: LCal): number;
    static getNowMinutes(): number;
    static isBigDay(years: number, isBirthday: boolean): boolean;
    static adaptPrecisionByDistance(mouseLCal: LCal, now: LCal): number;
}

export class LCalFormatter {
    static formatDate(lcal: LCal, isShortFormat?: boolean, languageCode?: string): string;
    static formatTime(lcal: LCal, languageCode?: string): string;
    static formatDateTime(lcal: LCal, languageCode?: string): string;
    static formatDayName(lcal: LCal, languageCode?: string): string;
    static formatDayNameL(lcal: LCal, languageCode?: string): string;
    static formatYear(lcal: LCal, languageCode?: string, formatAsDecade?: boolean): string;
    static formatCentury(lcal: LCal, languageCode?: string): string;
    static formatMillenium(lcal: LCal, languageCode?: string): string;
    static formatYearFromNumber(year: number | LCal, precision?: number, languageCode?: string, formatAsDecade?: boolean): string;
    static formatMonthName(lcal: LCal, languageCode?: string): string;
    static formatMonthNameS(lcal: LCal, languageCode?: string): string;
    static formatMonthNameL(lcal: LCal, languageCode?: string): string;
    static formatDuration(interval: LCalInterval, languageCode?: string): string;
    static formatStartEnd(o: Record<string, any>, isPerson?: boolean, languageCode?: string): string | null;
    static formatDay(lcal: LCal): number;
    static formatType(lcal: LCal, languageCode?: string): string | null;
}

/**
 * A start/end LCal pair. Base class for Task.
 */
export class LCalInterval {
    start: LCal | null;
    end: LCal | null;

    constructor(start?: LCal | null, end?: LCal | null);

    clone(): LCalInterval;
    setStart(start: LCal | null): this;
    setEnd(end: LCal | null): this;
    getStart(): LCal | null;
    getEnd(): LCal | null;
    isPointInTime(): boolean;
    getAbsDurationMinutesConsiderPrecision(): number | null;
}

export class TaskDisplayData {
    color: string;
    borderColor: string | null;
    labelColor?: string;
    isShadow: boolean;
    shape: number;
    position: number | string;
    expansionFactor: number;
    bargroup: string;
    bold: boolean;
    italic: boolean;
    fontSizeFactor: number;
    transparency: number;
    showGuideLine: boolean;
    guideLineFillOpacity: number;
    emphasizeFirstLine: boolean;
    height?: number;
    relYStart?: number;

    constructor();

    clone(): TaskDisplayData;
    getColor(): string;
    setColor(color: string): void;
    getBorderColor(): string | null;
    setBorderColor(color: string | null): void;
    getShape(): number;
    setShape(shape: number): void;
    setIsShadowTask(isShadow: boolean): void;
    isShadowTask(): boolean;
    setPosition(position: number | string): void;
    getPosition(): number | string;
    setExpansionFactor(factor: number | null | undefined): void;
    getExpansionFactor(): number;
    setBarGroup(bargroup: string | null | undefined): void;
    getBarGroup(): string;
    getBold(): boolean;
    getItalic(): boolean;
    getFontSizeFactor(): number;
    setBold(bold: boolean): void;
    setItalic(italic: boolean): void;
    setFontSizeFactor(fontSizeFactor: number): void;
    getTransparency(): number;
    setTransparency(value: number): void;
    getShowGuideLine(): boolean;
    setShowGuideLine(value: boolean): void;
    getGuideLineFillOpacity(): number;
    setGuideLineFillOpacity(value: number): void;
    getEmphasizeFirstLine(): boolean;
    setEmphasizeFirstLine(value: boolean): void;
}

export class ResourceDisplayData {
    [key: string]: any;
}

/**
 * A time interval bound to a resource. Consumers commonly attach ad-hoc
 * properties (jobIndex, quantities, tooltipText, ...) directly on instances,
 * so an index signature keeps that pattern type-safe.
 */
export class Task extends LCalInterval {
    id: string | number;
    resID: string | number;
    name: string;
    secname?: string;
    displData: TaskDisplayData;
    deleted: boolean;
    innerEvents?: any[];
    [key: string]: any;

    constructor(id: string | number, start: LCal | null, end: LCal | null, resID: string | number, name?: string, secname?: string, innerEvents?: any[]);

    clone(): Task;
    setResID(resID: string | number): void;
    getResID(): string | number;
    setID(id: string | number): void;
    getID(): string | number;
    setName(name: string): void;
    getName(): string;
    setSecName(secname: string): void;
    getSecName(): string | undefined;
    getDisplayData(): TaskDisplayData;
    setDisplayData(data: TaskDisplayData): void;
    getInnerEvents(): any[] | undefined;
    isDeleted(): boolean;
    setDeleted(deleted: boolean): void;
    toString(): string;
}

/**
 * A resource that tasks are scheduled onto. Consumers commonly attach ad-hoc
 * properties (resourceIndex, backgroundIntervals, jobCount, ...) directly on
 * instances, so an index signature keeps that pattern type-safe.
 */
export class Resource {
    id: string | number;
    name: string;
    secname: string;
    displData: ResourceDisplayData;
    deleted: boolean | undefined;
    [key: string]: any;

    constructor(id: string | number, name?: string, secname?: string, deleted?: boolean);

    clone(): Resource;
    setID(id: string | number): void;
    getID(): string | number;
    setName(name: string): void;
    getName(): string;
    getDisplayData(): ResourceDisplayData;
    getMarkingColor(): string | null;
    setDeleted(deleted: boolean): void;
    isDeleted(): boolean | undefined;
    toString(): string;
}

export class AbstractModel<T extends { getID(): string | number; getName?(): string }> {
    dataChangeCallbacks: Array<(type?: string) => void>;
    data: T[];
    id2Item: Map<string | number, T>;
    selectedItemIDs: Array<string | number>;
    displDataDirty: boolean;

    constructor();

    addDataChangeCallback(listener: (type?: string) => void): void;
    removeDataChangeCallback(listener: (type?: string) => void): void;
    getSelectedItemIDs(): Array<string | number>;
    setSelectedItemIDs(selectedItemIDs: Array<string | number>): void;
    exchangeID(oldID: string | number, newID: string | number): void | false;
    put(item: T, isAligning?: boolean): void;
    add(item: T, isAligning?: boolean): void;
    removeByID(id: string | number, isAligning?: boolean): void;
    remove(item: T, isAligning?: boolean): void;
    setAll(items: T[]): void;
    putAll(items: T[]): void;
    sort(): void;
    getAll(): T[];
    size(): number;
    getItemByID(id: string | number): T | undefined;
    getItemAt(index: number): T;
    isDisplayDataDirty(): boolean;
    clear(): void;
    setIconProvider(provider: (obj: any, onLoad?: () => void) => any): void;
    getIcon(object: any): any;
    toString(): string;
}

export class ResourceModel extends AbstractModel<Resource> {
    constructor(taskModel: TaskModel);

    getTotalResourceHeight(): number;
    recomputeDisplayData(): void;
    getAdminResources(): Resource[];
    getHeight(resID: string | number): number;
    setHeight(resID: string | number, height: number): void;
    getRelativeYStart(resID: string | number): number | undefined;
    setRelativeYStart(resID: string | number, relYStart: number): void;
    clearResID2Height(): void;
    clearResID2RelativeYStart(): void;
}

export class TaskModel extends AbstractModel<Task> {
    resourceModel: ResourceModel;
    movedTasks: Task[];
    inlineResourceHeight: number;
    hideResourceHeaderIfOnlyOneRes: boolean;
    barSize: number;
    stackDirection: 'topDown' | 'bottomUp';

    constructor();

    setInlineResourceHeaderHeight(height: number): void;
    setHideResourceHeaderIfOnlyOneRes(hide: boolean): void;
    setStackDirection(direction: 'topDown' | 'bottomUp' | null | undefined): void;
    getStackDirection(): 'topDown' | 'bottomUp';
    getEffectiveInlineResourceHeaderHeight(): number;
    clearCollapsedGroups(): void;
    collapseAllGroups(): void;
    addCollapsedGroup(group: string): void;
    removeCollapsedGroup(group: string): void;
    isCollapsed(group: string): boolean;
    getCollapsedGroups(): Set<string>;
    toggleBarGroupCollapse(group: string, getTaskBarBounds: (task: Task) => any): void;
    addMovedTasksChangeCallback(listener: () => void): void;
    removeMovedTasksChangeCallback(listener: () => void): void;
    getResourceModel(): ResourceModel;
    getDisplayedStart(task: Task): LCal;
    getDisplayedEnd(task: Task): LCal;
    getGroupWithResource(task: Task): string;
    recomputeDisplayData(getTaskBarBoundsForLevelComputation: (task: Task) => any): void;
    getHeight(taskID: string | number): number;
    getRelativeYStart(taskID: string | number): number | undefined;
    getItemCntByResourceID(resID: string | number): number;
    getItemsByResourceID(resID: string | number): Task[];
    setMovedTasks(movedTasks: Task[]): void;
    getMovedTasks(): Task[];
    removeResource(res: Resource): void;
    sortForDisplay(data: Task[], taskID2TBB: Map<any, any>, barGroup2FirstStart?: Map<string, number>, barGroup2HighestPosition?: Map<string, number>): void;
}

export class SliderValue {
    value: number;
    name: string;

    constructor(value: number, name: string);

    toString(): string;
}

export class SliderHelper {
    static getSliderValues(intervals: LCalInterval[]): SliderValue[];
}

export interface SliderProps {
    width: number;
    height: number;
    sliderValues: SliderValue[];
    controllerValue?: number;
    verticalOrientation?: boolean;
    labelUnderSlider?: boolean;
    onChange?: (value: SliderValue) => void;
    onSliderEvent?: (evt: any) => void;
    onPressUp?: (evt: any) => void;
    [key: string]: any;
}

export class Slider extends React.Component<SliderProps> {
    setControllerValue(value: number): void;
    getControllerValue(): SliderValue;
}

export interface NowButtonProps {
    width: number;
    height: number;
    onJump?: () => void;
    onLongPress?: (evt: any) => void;
    [key: string]: any;
}

export class NowButton extends React.Component<NowButtonProps> {}

export class Hammer extends React.Component<Record<string, any>> {}

export class Helper {
    static getCursorPosition(canvas: HTMLCanvasElement, evt: any): [number, number];
    static textToArrayByMaxWidth(text: string, maxWidth: number, fontSize: number, context: CanvasRenderingContext2D): string[];
    static textToArray(text: string): string[];
    static textToArrayFromCache(text: string): string[];
    static textToArrayByMaxWidthFromCache(text: string, maxWidth: number, fontSize: number, context: CanvasRenderingContext2D): string[];
    static textWidthFromCache(text: string, context: CanvasRenderingContext2D): number;
    static textHeightFromCache(context: CanvasRenderingContext2D): number;
    static getObjectFromCache(jsonString: string): any;
    static utf8_encode(argString: string): string;
    static sha1(str: string): string;
    static intColorToHexString(i: number): string;
    static toTransparent(rrggbb: string, transparency: number): string;
    static isDarkBackground(rrggbb: string): boolean;
    static getGrayValue(rrggbb: string): number;
    static hexColorStringToInt(rrggbb: string): number;
    static isEquivalent(a: any, b: any): boolean;
    static arraysEqual(a: any[], b: any[]): boolean;
}

export interface TimelineTexts {
    presshere?: string;
    [key: string]: string | undefined;
}

export interface TimelineConfig {
    hideResourceHeaderIfOnlyOneRes?: boolean;
    getTaskBarInset?: (model: TaskModel, task: Task) => number;
    [key: string]: any;
}

export interface TimelineEvent {
    [key: string]: any;
}

/** Common props shared by Timeline / InstrumentedTimeline / ReactCanvasTimeline. */
export interface BaseTimelineProps {
    width?: number;
    height?: number;
    model?: TaskModel;
    resources?: Resource[];
    tasks?: Task[];
    barSize?: number;
    stackDirection?: 'topDown' | 'bottomUp';
    start?: LCal;
    end?: LCal;
    timeZone?: string;
    sliderValues?: SliderValue[];
    yearPositions?: number;
    backgroundImage?: string | null;
    headerType?: string;
    texts?: TimelineTexts;
    config?: TimelineConfig;
    showWaitOverlay?: boolean;
    dragEnabled?: boolean;
    animationSteps?: number;
    initialMeasureInterval?: any;
    measureDurationLock?: boolean;
    measureResult?: (measureInterval: any) => React.ReactNode;
    instrumentedTimelineCallback?: (instrumentedTimeline: InstrumentedTimeline) => void;
    onZoomChange?: (startLCal: LCal, endLCal: LCal) => void;
    onOffsetChange?: (workStartTime: number, workEndTime: number, workResOffset: number) => void;
    onMeasureIntervalChanged?: (interval: any, isAligning: boolean) => void;
    onPress?: (evt: TimelineEvent) => void;
    onLongPress?: (evt: TimelineEvent) => void;
    onClick?: (evt: TimelineEvent) => void;
    onMouseMove?: (evt: TimelineEvent) => void;
    children?: React.ReactNode;
    [key: string]: any;
}

export class Timeline extends React.Component<BaseTimelineProps> {
    getTaskBarBounds(task: Task): any;
}

export class InstrumentedTimeline extends React.Component<BaseTimelineProps> {}

export interface ReactCanvasTimelineProps extends BaseTimelineProps {
    resources: Resource[];
    tasks: Task[];
}

export class ReactCanvasTimeline extends React.Component<ReactCanvasTimelineProps> {}

export function paintChart(ctx: CanvasRenderingContext2D, ...args: any[]): void;

export const PIN_INTERVAL: number;
export const SMALL_PIN_INTERVAL: number;
export const CURLYBRACE: number;
export const CURLYBRACE_DOWN: number;
export const TRANSPARENTBACK: number;
export const STAR: number;
export const SMALL_STAR: number;
export const CIRCLE: number;
export const SMALL_CIRCLE: number;
export const CLOUD: number;
export const SPEECHBUBBLE: number;
export const DOCUMENT: number;
export const SMALL_DOCUMENT: number;
export const SUN: number;
export const SMALL_SUN: number;
export const CROSS: number;
export const SMALL_CROSS: number;
export const ARROW_LEFT: number;
export const SMALL_ARROW_LEFT: number;
export const ARROW_RIGHT: number;
export const SMALL_ARROW_RIGHT: number;
export const CIRCLE_MIDDLETEXT: number;
export const BASELINE: number;
