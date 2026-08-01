import React from 'react';
import Timeline from './timeline';
import Slider from '../slider/slider';
import SliderValue from '../slider/slidervalue';
import NowButton from '../nowbutton/nowbutton.js';
import LCal from '../calendar/lcal.js';
import LCalHelper from '../calendar/lcalhelper.js';
import Helper from '../helper/helper';
import getMinStartMaxEnd from "./utils/minmaxcomputation";


class InstrumentedTimeline extends React.Component {
    constructor(props) {
        super(props);

        this.onTimelinePress = this.onTimelinePress.bind(this);
        this.onTimelineLongPress = this.onTimelineLongPress.bind(this);
        this.onTimelineClick = this.onTimelineClick.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onZoomChange = this.onZoomChange.bind(this);
        this.onSliderChange = this.onSliderChange.bind(this);
        this.onOffsetChange = this.onOffsetChange.bind(this);

        this.state = {
            controllerValue: props.end.getJulianMinutes() - props.start.getJulianMinutes(),
            measureInterval: null,
            taskHighlight: null,
            slidersVisible: false,
            slidersMounted: false,
        }

        this.highlightTimeoutHandle = 0;
        this._showHighlightRafHandle = 0;
        this.showSlidersTimeoutHandle = 0;
        this.barSizeSliderValues = [
            new SliderValue(1, "sehr klein"),
            new SliderValue(30, "klein"),
            new SliderValue(50, "mittel"),
            new SliderValue(100, "groß"),
            new SliderValue(200, "sehr groß"),
        ];

        this.props.instrumentedTimelineCallback && this.props.instrumentedTimelineCallback(this);
        
        this.timelineRef = null;
        this.nowButtonRef = null;
        this.sliderRef = null;
        this.barSizeSliderRef = null;

        this._isMounted = true;
    }

    componentDidMount() {
        this._isMounted = true;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(!Helper.isEquivalent(prevState.initialMeasureInterval, nextProps.initialMeasureInterval)) {
            return {
                measureInterval: nextProps.initialMeasureInterval,
                slidersMounted: !!nextProps.initialMeasureInterval,
            };
        }
        return null;
    }

    componentDidUpdate(prevProps) {
        if(!Helper.isEquivalent(prevProps.initialMeasureInterval, this.props.initialMeasureInterval)) {
            this.turnButtonToNow();
        }
        this.props.model.barSize = prevProps.model.barSize;
        this.timelineRef && this.timelineRef._updateCanvas();
    }

    getModel() {
        return this.props.model;
    }

    componentWillUnmount() {
        clearTimeout(this.highlightTimeoutHandle);
        cancelAnimationFrame(this._showHighlightRafHandle);
        clearTimeout(this.showSlidersTimeoutHandle);
        this._isMounted = false;
    }

    goToNow() {
        let now = new LCal();
        now.setJulianMinutes(LCalHelper.getNowMinutes());
        this.goToDate(now);
    }

    shouldAnimate() {
        return this.props.model.size() <= 1000;
    }

    goToDate(d, cb) {
        if (d instanceof LCal) {
            d = d.clone();
            let timeline = this.timelineRef;
            let displMinutes = timeline.getDisplayedMinutes();
            d.addMinutes(-Math.abs(displMinutes / 3));
            timeline.animateTo(d, null, cb, this.shouldAnimate());
        } else {
            this.goToNow();
        }
    }

    goToResource(res) {
        let timeline = this.timelineRef;
        timeline.scrollToResource(res);
    }

    goToTaskY(task) {
        let timeline = this.timelineRef;
        timeline.scrollToTaskY(task);
    }

    _computeTargetResOffset(task, targetStart, targetEnd) {
        const timeline = this.timelineRef;

        // Temporarily set the view to the target time range so that recomputeDisplayData
        // stacks tasks as they will appear at the destination, not at the origin.
        const savedStartJulMin = timeline.workStartTime.getJulianMinutes();
        const savedEndJulMin = timeline.workEndTime.getJulianMinutes();
        timeline.workStartTime.setJulianMinutes(targetStart.getJulianMinutes());
        timeline.workEndTime.setJulianMinutes(targetEnd.getJulianMinutes());

        this.props.model.getResourceModel()._setDisplayDataDirty(true);
        this.props.model.getResourceModel().recomputeDisplayData && this.props.model.getResourceModel().recomputeDisplayData();
        this.props.model._setDisplayDataDirty(true);
        this.props.model.recomputeDisplayData(timeline.getTaskBarBounds);

        const relTaskStartY = this.props.model.getRelativeYStart(task.getID());
        let heightOverlap = this.props.model.getHeight(task.getID()) + timeline.timelineHeaderHeight - timeline.virtualCanvasHeight;
        if (heightOverlap < 0) heightOverlap = 0;
        const targetResOffset = -relTaskStartY - heightOverlap + timeline.virtualCanvasHeight / 2;

        // Restore the original view so the animation can start from the correct state.
        timeline.workStartTime.setJulianMinutes(savedStartJulMin);
        timeline.workEndTime.setJulianMinutes(savedEndJulMin);
        this.props.model._setDisplayDataDirty(true);

        return targetResOffset;
    }

    _flyToTask(task, callback) {
        const timeline = this.timelineRef;
        if (!timeline) { callback && callback(); return; }

        const currentStartJulMin = timeline.workStartTime.getJulianMinutes();
        const currentEndJulMin = timeline.workEndTime.getJulianMinutes();
        const currentDuration = currentEndJulMin - currentStartJulMin;
        const currentResOffset = timeline.workResOffset;
        const currentBarSize = this.props.model.barSize;

        // Target horizontal: same duration, task start shifted left by 1/3
        const targetStartJulMin = task.start.getJulianMinutes() - Math.abs(currentDuration / 3);
        const targetStart = task.start.clone();
        targetStart.setJulianMinutes(targetStartJulMin);
        const targetEnd = targetStart.clone();
        targetEnd.addMinutes(currentDuration);

        // Target vertical — computed at the destination time range for correct task stacking
        const targetResOffset = this._computeTargetResOffset(task, targetStart, targetEnd);

        // Zoom-out range: covers both views
        const overallMinJulMin = Math.min(currentStartJulMin, targetStartJulMin);
        const overallMaxJulMin = Math.max(currentEndJulMin, targetStartJulMin + currentDuration);
        const spanDuration = overallMaxJulMin - overallMinJulMin;

        // How much the target lies outside the current view
        const extraSpan = Math.max(0, spanDuration - currentDuration);
        const extraResOffset = Math.abs(targetResOffset - currentResOffset);

        // Target already at current position: skip animation, just show highlight
        if (extraSpan < currentDuration * 0.01 && extraResOffset < currentBarSize) {
            callback && callback();
            return;
        }

        // Zoom-out scales proportionally with distance — no fixed minimum multiplier
        const zoomOutDuration = currentDuration + extraSpan * 1.2;
        const zoomOutCenter = (overallMinJulMin + overallMaxJulMin) / 2;

        const zoomOutStart = task.start.clone();
        zoomOutStart.setJulianMinutes(zoomOutCenter - zoomOutDuration / 2);
        const zoomOutEnd = task.start.clone();
        zoomOutEnd.setJulianMinutes(zoomOutCenter + zoomOutDuration / 2);

        const midResOffset = (currentResOffset + targetResOffset) / 2;
        const zoomOutBarSize = currentBarSize * (currentDuration / zoomOutDuration);

        // Steps scale logarithmically with distance (min 5, max 15)
        const normalizedDistance = extraSpan / currentDuration;
        const steps = Math.min(15, Math.max(5, Math.round(15 * Math.log(1 + normalizedDistance) / Math.log(2))));

        timeline.animateToWithResOffsetAndBarSize(zoomOutStart, zoomOutEnd, midResOffset, zoomOutBarSize, steps, () => {
            timeline.animateToWithResOffsetAndBarSize(targetStart, targetEnd, targetResOffset, currentBarSize, steps, callback);
        });
    }

    goToStartAndHighlight(task) {
        if(task) {
            //Ist die Task in einer Gruppe und muss die Gruppe noch geöffnet werden?
            if (task.getDisplayData().getBarGroup()
                && this.props.model.isCollapsed(
                    this.props.model.getGroupWithResource(task))) {
                this.props.model.toggleBarGroupCollapse(
                    this.props.model.getGroupWithResource(task),
                    this.timelineRef.getTaskBarBounds);
            }
            //Ist das Ereignis sichtbar?
            if (!this.props.model.getFilteredIDs
                || !this.props.model.getFilteredIDs().contains(task.id)) {

                clearTimeout(this.highlightTimeoutHandle);
                this.highlightTimeoutHandle = 0;
                cancelAnimationFrame(this._showHighlightRafHandle);
                this._showHighlightRafHandle = 0;
                this.setState({taskHighlight: null});

                const showHighlight = () => {
                    // Defer until after the paint() queued by the animation's final step has
                    // fired.  That paint runs recomputeDisplayData (dirty=true set in the else
                    // branch), so taskID2RelativeYStart is fresh when we read it.
                    this._showHighlightRafHandle = requestAnimationFrame(() => {
                        this._showHighlightRafHandle = 0;
                        if (!this._isMounted || !this.timelineRef) return;
                        this.props.model._setDisplayDataDirty(true);
                        this.props.model.recomputeDisplayData(this.timelineRef.getTaskBarBounds);
                        const bounds = this.timelineRef.getTaskBounds(task);
                        this.setState({taskHighlight: bounds});
                        this.highlightTimeoutHandle = setTimeout(() => {
                            this.highlightTimeoutHandle = 0;
                            this.setState({taskHighlight: null});
                        }, 2300);
                    });
                };

                if (this.shouldAnimate()) {
                    this._flyToTask(task, showHighlight);
                } else {
                    this.goToDate(task.start, () => {
                        this.goToTaskY(task);
                        showHighlight();
                    });
                }
            }
        }
    }

    getCanvas() {
        return this.timelineRef && this.timelineRef.getCanvasRef();
    }

    animateTo(startLCal, endLCal, animationCompletedCB, doAnimate) {
        this.timelineRef && this.timelineRef.animateTo(startLCal, endLCal, animationCompletedCB, doAnimate);
    }

    getStartTime() {
        return this.timelineRef && this.timelineRef.canvasStartTime;
    }

    getEndTime() {
        return this.timelineRef && this.timelineRef.canvasEndTime;
    }

    turnButtonToNow() {
        if(this.getCanvas() && this.nowButtonRef) {
            let nowbutton = this.nowButtonRef;

            let now = LCalHelper.getNowMinutes();
            let nowX = this.timelineRef.getXPosForTime(now);
            //Hier muss der Winkel bestimmt werden, um den der Button gedreht werden muss
            let timelineX = this.getCanvas().getBoundingClientRect().left;
            let timelineY = this.getCanvas().getBoundingClientRect().top;
            let buttonX = nowbutton.getCanvas().getBoundingClientRect().left + Math.abs(nowbutton.getCanvas().width / 2);
            let buttonY = nowbutton.getCanvas().getBoundingClientRect().top + Math.abs(nowbutton.getCanvas().height / 2);

            let angle = Math.atan((timelineX + nowX - buttonX) / Math.abs(timelineY - buttonY));

            this.nowButtonRef.setAngle(angle);
        }
    }

    onZoomChange(startLCal, endLCal) {
        const minutes = endLCal.getJulianMinutes() - startLCal.getJulianMinutes();
        this.setState({controllerValue: minutes});
        this.sliderRef && this.sliderRef.setControllerValue(minutes);
        this.barSizeSliderRef && this.barSizeSliderRef.setControllerValue(this.props.model.barSize);
        this.props.onZoomChange && this.props.onZoomChange(startLCal, endLCal);
    }

    adjustHeight(iterations, currentBarSize, minBarHeight= 0, maxBarHeight= 1000, callback) {
        this.props.model.getResourceModel()._setDisplayDataDirty(
            true);
        this.props.model.recomputeDisplayData(
            this.timelineRef.getTaskBarBounds);

        const totalResHeight = this.props.model.getResourceModel().getTotalResourceHeight();
        if (!isNaN(totalResHeight) && totalResHeight > 0) {
            const factor = (this.props.height - this.timelineRef.timelineHeaderHeight) / totalResHeight;
            if (factor !== 0) {
                let barSize = Math.min(Math.max(this.props.model.barSize * factor, minBarHeight), maxBarHeight);

                this.props.model.barSize = barSize;
                this.props.model.getResourceModel()._setDisplayDataDirty(
                    true);
                this.props.model.recomputeDisplayData(
                    this.timelineRef.getTaskBarBounds);
                this.props.model._setDisplayDataDirty(true);
                this.props.model._fireDataChanged();
            }
        }
        if(iterations > 0 && currentBarSize !== this.props.model.barSize) {
            this.adjustHeight(iterations - 1, currentBarSize, minBarHeight, maxBarHeight, callback);
        } else {
            callback && callback();
        }

    }

    fitToScreen(minBarHeight, maxBarHeight, callback) {
        this.zoomAll(false, ()=>this.adjustHeight(20, this.props.model.barSize, minBarHeight, maxBarHeight, callback));
    }

    zoomAll(doAnimate, animationCompletedCB) {
        let m = getMinStartMaxEnd(this.props.model);
        this.animateTo(m.minStart, m.maxEnd, animationCompletedCB, doAnimate);
    }

    onSliderChange(displayedMinutes) {
        if(this.timelineRef) {
            //Die Timeline muss auf Veränderungen der Zoomstufe im Slider reagieren
            this.timelineRef.zoomToDisplayMinutes(displayedMinutes);
            this.setState({controllerValue: displayedMinutes});
            this.props.model._setDisplayDataDirty(true);
            this.refreshSliderTimeout();
        }
    }

    onTimelinePress(timelineevent) {
        if (this.props.onPress) {
            this.props.onPress(timelineevent);
        }
        this.refreshSliderTimeout();
    }

    onMouseMove(timelineevent) {
        this.props.onMouseMove && this.props.onMouseMove(timelineevent);
        this.refreshSliderTimeout();
    }

    refreshSliderTimeout() {
        this.mouseOverSlider = false;

        if(this.props.sliderValues) {
            if (!this.state.slidersVisible) {
                this.setState({slidersVisible: true, slidersMounted: true}, () => this.turnButtonToNow());
            }
            clearTimeout(this.showSlidersTimeoutHandle);
            this.showSlidersTimeoutHandle = setTimeout(() => {
                this.showSlidersTimeoutHandle = 0;
                this.setState({slidersVisible: false});
            }, 1000);
        }
    }

    mouseIsOverSlider() {
        clearTimeout(this.showSlidersTimeoutHandle);
    }

    onTimelineLongPress(timelineevent) {
        if (this.props.onLongPress) {
            this.props.onLongPress(timelineevent);
        }
    }

    onTimelineClick(timelineevent) {
        if (this.timelineRef && timelineevent.isTimeHeaderPressed()) {
            let time = timelineevent.getTime();
            this.setState({menuIsVisible: false});

            const curDisplStartJulMin = this.timelineRef.workStartTime.getJulianMinutes();
            const curDisplEndJulMin = this.timelineRef.workEndTime.getJulianMinutes();

            //Nächsten Sliderwert bestimmen
            const curDuration = curDisplEndJulMin - curDisplStartJulMin;
            let nextDuration = 0;
            for (let v of this.props.sliderValues) {
                nextDuration = v.value;
                if (v.value < curDuration) {
                    break;
                }
            }

            let newStart = time.clone();
            let newStartJulMin = newStart.getJulianMinutes();

            let clickPercentage = (newStartJulMin - curDisplStartJulMin) / (curDisplEndJulMin - curDisplStartJulMin);

            newStart.addMinutes(-Math.abs(nextDuration * clickPercentage));
            let newEnd = time.clone();
            newEnd.addMinutes(Math.abs(nextDuration * (1 - clickPercentage)));
            this.timelineRef.animateTo(newStart, newEnd, null, this.shouldAnimate());


            //Header drücken bedeutet immer die Details zu schließen, falls dieses noch offen ist
            //SELF.setState({menuIsVisible: false});

        } else if (this.props.onClick) {
            this.props.onClick(timelineevent);
        }
    }

    onOffsetChange() {
        //Der Button muss auf die Jetzt-Zeit zeigen
        this.turnButtonToNow();
        this.props.onOffsetChange && this.props.onOffsetChange(this.workStartTime, this.workEndTime, this.workResOffset);
    }

    barSizeChanged(val) {
        if (val && !isNaN(val)) {
            this.props.model.barSize = val;
            this.props.model._setDisplayDataDirty(true);
            this.props.model._fireDataChanged();
            this.timelineRef._updateCanvas();
            this.forceUpdate();
        }
    }

    render() {
        let buttonStyle = {
            position: "absolute",
            bottom: "20px",
            right: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            pointerEvents: "none"
        }
        let measureBoxStyle = {
            position: "absolute",
            top: 5,
            right: 10
        }


        const fadeIn = {
            opacity: 0,
             transition: "opacity 2s ease-in",
            pointerEvents: "none"
        }

        const fadeOut = {
            opacity: 1,
            transition: "opacity 500ms ease-out"
        }
        const showSliders = this.state.slidersVisible || this.state.measureInterval;

        return (
            <div style={{width: this.props.width, height: this.props.height}}>
                <div style={{position: "absolute"}}>
                    <Timeline ref={ref => this.timelineRef = ref}
                              {...this.props}
                              onClick={(evt) => this.onTimelineClick(evt)}
                              onPress={(evt) => this.onTimelinePress(evt)}
                              onLongPress={(evt) => this.onTimelineLongPress(evt)}
                              onZoomChange={(startLCal, endLCal) => this.onZoomChange(startLCal, endLCal)}
                              onMouseMove={(evt) => this.onMouseMove(evt)}
                              onOffsetChange={this.onOffsetChange}
                              measureDurationLock={this.props.measureDurationLock}
                              onMeasureIntervalChanged={(interval, isAligning) => {
                                  if(this._isMounted) {
                                      this.setState({measureInterval: interval});
                                      this.props.onMeasureIntervalChanged && this.props.onMeasureIntervalChanged(interval, isAligning);
                                  }
                              }}
                    >
                        {this.props.children}
                    </Timeline>
                    <style>{`
                        @keyframes taskGlowFade {
                            0%   { opacity: 0; box-shadow: 0 0 0 0 rgba(255,165,0,0); }
                            20%  { opacity: 1; box-shadow: 0 0 40px 18px rgba(255,165,0,1), 0 0 80px 30px rgba(255,165,0,0.5); }
                            65%  { opacity: 1; box-shadow: 0 0 30px 12px rgba(255,165,0,0.8), 0 0 60px 20px rgba(255,165,0,0.35); }
                            100% { opacity: 0; box-shadow: 0 0 0 0 rgba(255,165,0,0); }
                        }
                    `}</style>
                    {this.state.taskHighlight && <div style={{
                        position: 'absolute',
                        left: this.state.taskHighlight.x - 10,
                        top: this.state.taskHighlight.y - 3,
                        width: Math.max(this.state.taskHighlight.width, 20) + 20,
                        height: this.state.taskHighlight.height + 6,
                        boxSizing: 'border-box',
                        border: '4px solid orange',
                        borderRadius: `${Math.min(this.state.taskHighlight.height, Math.max(this.state.taskHighlight.width, 20)) * 0.2}px`,
                        pointerEvents: 'none',
                        animation: 'taskGlowFade 2.3s ease-out forwards',
                    }}/>}

                    {this.state.measureInterval && <div style={measureBoxStyle}>
                        {this.props.measureResult && this.props.measureResult(this.state.measureInterval)}
                    </div>}
                    {this.state.slidersMounted && <div
                        style={showSliders ? fadeOut : fadeIn}
                        onTransitionEnd={() => !showSliders && this.setState({slidersMounted: false})}>
                        <div style={buttonStyle}>
                            <div style={{
                                pointerEvents: "auto",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end"
                            }}>
                                {this.props.verticalAdditionalControl}
                                <Slider ref={ref => this.barSizeSliderRef = ref}
                                        width={20}
                                        height={this.props.height / 2}
                                        onChange={(val) => this.barSizeChanged(val)}
                                        sliderValues={this.barSizeSliderValues}
                                        controllerValue={this.props.model.barSize}
                                        verticalOrientation={true}
                                        onSliderEvent={() => this.mouseIsOverSlider()}
                                />
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                flexDirection: 'row-reverse',
                                alignItems: 'flex-end'
                            }}>

                                <div style={{
                                    width: 40,
                                    height: 40,
                                    pointerEvents: "auto",
                                }}>
                                    <NowButton ref={ref => this.nowButtonRef = ref}
                                               width={40}
                                               height={40}
                                               onJump={(d) => this.goToDate(d)}
                                               onLongPress={this.props.onNowButtonLongPress}
                                               yearPositions={this.props.yearPositions}
                                               onClose={this.props.onNowDialogClose}>
                                        <div>
                                            {this.props.nowbuttonChildren}
                                        </div>
                                    </NowButton>
                                </div>

                                {this.state.measureInterval &&
                                <div style={{pointerEvents: "auto"}}>
                                    {this.props.measureButtons}
                                </div>
                                }

                                {(!this.state.measureInterval
                                    || this.props.width > 600) && <div
                                    style={{display: "flex", pointerEvents: "auto", cursor: "pointer"}}>
                                    {this.props.horizontalAdditionalControl}
                                    <div style={{
                                        pointerEvents: "auto",
                                        width: Math.min(
                                            Math.max(this.props.width / 3, 200),
                                            600)
                                    }}>
                                        <Slider ref={ref => this.sliderRef = ref}
                                                width={Math.min(Math.max(
                                                    this.props.width / 3, 200),
                                                    600)}
                                                height={20}
                                                onChange={this.onSliderChange}
                                                sliderValues={this.props.sliderValues}
                                                controllerValue={this.state.controllerValue}
                                                onSliderEvent={() => this.mouseIsOverSlider()}
                                        />
                                    </div>
                                </div>
                                }
                            </div>
                        </div>
                    </div>
                    }
                    {this.props.showWaitOverlay && this.props.waitOverlay((this.props.width, this.props.height))}
                </div>
            </div>
        )
    }


}

export default InstrumentedTimeline;
