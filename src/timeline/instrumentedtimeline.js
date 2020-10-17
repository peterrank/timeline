import React from 'react';
import Timeline from './timeline';
import Slider from '../slider/slider';
import SliderValue from '../slider/slidervalue';
import NowButton from '../nowbutton/nowbutton.js';
import LCal from '../calendar/lcal.js';
import LCalHelper from '../calendar/lcalhelper.js';
import Helper from '../helper/helper';


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
            controllerValue: 0,
            measureInterval: null,
            markingCenterX: -1,
            markingCenterY: -1,
            slidersVisible: false
        }

        this.props.model.barSize = this.props.initialBarSize || 20;

        this.highlightTimeoutHandle = 0;
        this.showSlidersTimeoutHandle = 0;
        this.barSizeSliderValues = [
            new SliderValue(20, "sehr klein"),
            new SliderValue(30, "klein"),
            new SliderValue(50, "mittel"),
            new SliderValue(100, "groß"),
            new SliderValue(200, "sehr groß"),
        ];

        this.props.instrumentedTimelineCallback && this.props.instrumentedTimelineCallback(this);
    }

    componentDidMount() {
        this.goToNow();
    }

    componentWillReceiveProps(nextProps) {
        if(!Helper.isEquivalent(this.props.initialMeasureInterval, nextProps.initialMeasureInterval)) {
            this.setState({measureInterval: nextProps.initialMeasureInterval});
        }
        nextProps.model.barSize = this.props.model.barSize;
    }

    getModel() {
        return this.props.model;
    }

    componentWillUnmount() {
        clearTimeout(this.highlightTimeoutHandle);
        clearTimeout(this.showSlidersTimeoutHandle);
    }

    goToNow() {
        let now = new LCal();
        now.setJulianMinutes(LCalHelper.getNowMinutes());
        this.goToDate(now);
    }

    goToDate(d, cb) {
        if (d instanceof LCal) {
            d = d.clone();
            let timeline = this.refs.timeline;
            let displMinutes = timeline.getDisplayedMinutes();
            d.addMinutes(-Math.abs(displMinutes / 3));
            timeline.animateTo(d, null, cb);
        } else {
            this.goToNow();
        }
    }

    goToResource(res) {
        let timeline = this.refs.timeline;
        timeline.scrollToResource(res);
    }

    goToTaskY(task) {
        let timeline = this.refs.timeline;
        timeline.scrollToTaskY(task);
    }

    goToStartAndHighlight(task) {
        //Ist das Ereignis sichtbar?
        if(!this.props.model.getFilteredIDs || !this.props.model.getFilteredIDs().contains(task.id)) {

            this.goToDate(task.start, () => {
                this.goToTaskY(task);
                let xy = this.refs.timeline.getTaskStartPosition(task);
                // Transform to display coordinates
                let x, y;
                if (this.props.horizontalOrientation) {
                    x = xy.x;
                    y = xy.y;
                } else {
                    y = xy.x;
                    x = this.refs.timeline.refs.canvas.width - xy.y;
                }
                this.setState({markingCenterX: x, markingCenterY: y});
            });

            clearTimeout(this.highlightTimeoutHandle);
            this.highlightTimeoutHandle = setTimeout(() => {
                this.highlightTimeoutHandle = 0;
                this.setState({markingCenterX: -1, markingCenterY: -1});
            }, 2300);
        }
    }

    getCanvas() {
        return this.refs.timeline.refs.canvas;
    }

    animateTo(startLCal, endLCal, animationCompletedCB) {
        this.refs.timeline.animateTo(startLCal, endLCal, animationCompletedCB);
    }

    getStartTime() {
        return this.refs.timeline.canvasStartTime;
    }

    getEndTime() {
        return this.refs.timeline.canvasEndTime;
    }

    turnButtonToNow() {
        let timeline = this.refs.timeline;
        if(timeline) {
            let nowbutton = this.refs.nowbutton;

            let now = LCalHelper.getNowMinutes();
            let nowX = timeline.getXPosForTime(now);
            //Hier muss der Winkel bestimmt werden, um den der Button gedreht werden muss
            let timelineX = timeline.getCanvas().getBoundingClientRect().left;
            let timelineY = timeline.getCanvas().getBoundingClientRect().top;
            let buttonX = nowbutton.getCanvas().getBoundingClientRect().left + Math.abs(nowbutton.getCanvas().width / 2);
            let buttonY = nowbutton.getCanvas().getBoundingClientRect().top + Math.abs(nowbutton.getCanvas().height / 2);

            let angle = 0;

            if (this.props.horizontalOrientation) {
                angle = Math.atan((timelineX + nowX - buttonX) / Math.abs(timelineY - buttonY));
            } else {
                let timelineRight = timeline.getCanvas().getBoundingClientRect().right;
                angle = Math.atan((timelineY + nowX - buttonY) / Math.abs(timelineRight - buttonX)) + Math.PI / 2;
            }

            this.refs.nowbutton.setAngle(angle);
        }
    }

    onZoomChange(startLCal, endLCal) {
        // this.refs.slider.setControllerValue(endLCal.getJulianMinutes() - startLCal.getJulianMinutes());
        this.setState({controllerValue: endLCal.getJulianMinutes() - startLCal.getJulianMinutes()});
        this.refreshSliderTimeout();
    }

    onSliderChange(displayedMinutes) {
        //Die Timeline muss auf Veränderungen der Zoomstufe im Slider reagieren
        this.refs.timeline.zoomToDisplayMinutes(displayedMinutes);
        this.setState({controllerValue: displayedMinutes});
        this.props.model._setDisplayDataDirty(true);
        this.refreshSliderTimeout();
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
        if (!this.state.slidersVisible) {
            this.setState({slidersVisible: true});
        }
        clearTimeout(this.showSlidersTimeoutHandle);
        this.showSlidersTimeoutHandle = setTimeout(() => {
            this.showSlidersTimeoutHandle = 0;
            this.setState({slidersVisible: false});
        }, 1000);
    }

    mouseIsOverSlider() {
        clearTimeout(this.showSlidersTimeoutHandle);
    }

    onTimelineLongPress(timelineevent) {
        if (this.props.onLongPress) {
            this.props.onLongPress(timelineevent);
        }
        this.refs.nowbutton.closeJumpTo();
    }

    onTimelineClick(timelineevent) {
        if (timelineevent.isTimeHeaderPressed()) {
            let time = timelineevent.getTime();
            this.setState({menuIsVisible: false});

            const curDisplStartJulMin = this.refs.timeline.workStartTime.getJulianMinutes();
            const curDisplEndJulMin = this.refs.timeline.workEndTime.getJulianMinutes();

            //Nächsten Sliderwert bestimmen
            const curDuration = curDisplEndJulMin - curDisplStartJulMin;
            let nextDuration = 0;
            for (let v of this.props.sliderValues) {
                nextDuration = v.value;
                if (v.value < curDuration) {
                    break;
                }
            }

            //let sliderValue = this.refs.slider.getNeighbourControllerValues()[1];
            //if (sliderValue !== null) {
            let newStart = time.clone();
            let newStartJulMin = newStart.getJulianMinutes();

            let clickPercentage = (newStartJulMin - curDisplStartJulMin) / (curDisplEndJulMin - curDisplStartJulMin);

            newStart.addMinutes(-Math.abs(nextDuration * clickPercentage));
            let newEnd = time.clone();
            newEnd.addMinutes(Math.abs(nextDuration * (1 - clickPercentage)));
            this.refs.timeline.animateTo(newStart, newEnd);


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
        }
    }

    render() {
        let buttonStyle;
        let measureBoxStyle;
        //let isHorizontal = window.innerWidth >= window.innerHeight;
        if (this.props.horizontalOrientation) {
            buttonStyle = {
                position: "absolute",
                bottom: "20px",
                right: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                pointerEvents: "none"
            }
            measureBoxStyle = {
                position: "absolute",
                top: 5,
                right: 10
            }
        } else {
            buttonStyle = {
                pointerEvents: "none",
                position: "absolute",
                bottom: "20px",
                left: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
            }
            measureBoxStyle = {
                position: "absolute",
                top: 5,
                left: 5
            }
        }

        const fadeIn = {
            opacity: 0,
             transition: "opacity 2s ease-in"
        }

        const fadeOut = {
            opacity: 1,
            transition: "opacity 500ms ease-out"
        }
        //#F50057 = 245 00 87
        return (
            <div style={{width: this.props.width, height: this.props.height}}>
            <div style={{position: "absolute"}}>
                <Timeline ref="timeline"
                          {...this.props}
                          onClick={(evt) => this.onTimelineClick(evt)}
                          onPress={(evt) => this.onTimelinePress(evt)}
                          onLongPress={(evt) => this.onTimelineLongPress(evt)}
                          onZoomChange={(startLCal, endLCal) => this.onZoomChange(startLCal, endLCal)}
                          onMouseMove={(evt) => this.onMouseMove(evt)}
                          onOffsetChange={this.onOffsetChange}
                          measureDurationLock={this.props.measureDurationLock}
                          onMeasureIntervalChanged={(interval, isAligning) => {
                              isAligning ? this.setState({measureInterval: interval}) : this.props.onMeasureIntervalChanged && this.props.onMeasureIntervalChanged(interval)
                          }}
                />
                { this.highlightTimeoutHandle !== 0 && <div style={{
                    transitionDuration: '1000ms',
                    position: "absolute",
                    top: this.state.markingCenterY - 95,
                    left: this.state.markingCenterX - 115,
                }}>{this.props.highlightArrow || <div style={{width: 115, height: 95, background: "red"}}/>}</div>}

                {this.state.measureInterval && <div style={measureBoxStyle}>
                    {this.props.measureResult && this.props.measureResult(this.state.measureInterval)}
                </div>}
                <div style={this.state.slidersVisible || this.state.measureInterval ? fadeOut : fadeIn}>
                    <div style={buttonStyle}>
                        <div style={{pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end"}}>
                            {this.props.verticalAdditionalControl}
                            {<Slider width={20}
                                     height={this.props.height / 2}
                                     onChange={(val) => this.barSizeChanged(val)}
                                     sliderValues={this.barSizeSliderValues}
                                     controllerValue={this.props.model.barSize}
                                     verticalOrientation={true}
                                     onSliderEvent={()=>this.mouseIsOverSlider()}
                                     //onPressUp={()=>this.saveAndCloseSettings()}
                            />}
                            {!this.props.horizontalOrientation && <Slider ref='slider'
                                                                          width={20}
                                                                          height={Math.min(Math.max((this.props.height) / 2, 150), 400)}
                                                                          onChange={this.onSliderChange}
                                                                          sliderValues={this.props.sliderValues}
                                                                          controllerValue={this.state.controllerValue}
                                                                          verticalOrientation={true}
                                                                          labelUnderSlider={true}
                                                                          onSliderEvent={()=>this.mouseIsOverSlider()}
                            />}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: this.props.horizontalOrientation ? 'flex-end' : 'flex-start',
                            flexDirection: this.props.horizontalOrientation ? 'row-reverse' : 'row',
                            alignItems: 'flex-end'
                        }}>

                            <div style={{width: 40, height: 40, pointerEvents: "auto",}}>
                                <NowButton ref="nowbutton"
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

                            {(!this.state.measureInterval || this.props.width > 600) && <div style={{pointerEvents: "auto", width: Math.min(Math.max(this.props.width / 3, 200), 600)}}>
                                {this.props.horizontalOrientation && <Slider ref='slider'
                                                                             width={Math.min(Math.max(this.props.width / 3, 200), 600)}
                                                                             height={20}
                                                                             onChange={this.onSliderChange}
                                                                             sliderValues={this.props.sliderValues}
                                                                             controllerValue={this.state.controllerValue}
                                                                             onSliderEvent={() => this.mouseIsOverSlider()}
                                />
                                }
                            </div>
                            }

                            <div style={{pointerEvents: "auto"}}>
                                {this.props.horizontalAdditionalControl}
                            </div>
                        </div>
                    </div>
                </div>
                {this.props.showWaitOverlay && this.props.waitOverlay((this.props.width, this.props.height))}
            </div>
            </div>
        )
    }


}

export default InstrumentedTimeline;
