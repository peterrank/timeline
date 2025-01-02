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
            markingCenterX: -1,
            markingCenterY: -1,
            slidersVisible: false,
            slidersMounted: false,
        }

        this.highlightTimeoutHandle = 0;
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

    goToStartAndHighlight(task) {
        if(task) {
            //Ist die Task in einer Gruppe und muss die Gruppe noch geöffnet werden?
            //Oder wurde ein Filter gesetzt und die Task muss aus dem Filter raus?
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

                this.goToDate(task.start, () => {
                    this.goToTaskY(task);
                    let xy = this.timelineRef.getTaskStartPosition(task);
                    // Transform to display coordinates

                    let x = xy.x;
                    let y = xy.y;

                    this.setState({markingCenterX: x, markingCenterY: y});
                });

                clearTimeout(this.highlightTimeoutHandle);
                this.highlightTimeoutHandle = setTimeout(() => {
                    this.highlightTimeoutHandle = 0;
                    this.setState({markingCenterX: -1, markingCenterY: -1});
                }, 2300);
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
        this.setState({controllerValue: endLCal.getJulianMinutes() - startLCal.getJulianMinutes()});
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
                    { this.highlightTimeoutHandle !== 0 && <div style={{
                        transitionDuration: '1000ms',
                        position: "absolute",
                        top: this.state.markingCenterY - 95,
                        left: this.state.markingCenterX - 115,
                    }}>{this.props.highlightArrow || <div style={{width: 115, height: 95, background: "red"}}/>}</div>}

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
                                <Slider width={20}
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
