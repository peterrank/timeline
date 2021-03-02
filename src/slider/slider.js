/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import React from 'react';
import Hammer from '../hammer/hammer';
import Helper from '../helper/helper.js'


class Slider extends React.Component {
    constructor(props) {
        super(props);

        this.XPADDING = 35;

        this._pan = this._pan.bind(this);
        this._press = this._press.bind(this);
        this._mouseUp = this._mouseUp.bind(this);
        this._updateCanvas = this._updateCanvas.bind(this);
        this._updateControllerCanvas = this._updateControllerCanvas.bind(this);
        this.paint = this.paint.bind(this);

        this.ctx = undefined;
        this.ctrctx = undefined;

        this.sliderVal2Percentage = null;

        this.buildSliderValue2Percentage(props.sliderValues);

        this.state = {controllerX: 0}
    }

    componentDidMount() {
        this.ctx = this.refs.slidercanvas.getContext('2d');
        this.ctx.fillStyle = "#FFFFFF";

        this.ctrctx = this.refs.controllercanvas.getContext('2d');
        this.setControllerValue(this.props.controllerValue);
        this._updateCanvas();
    }

    componentWillUpdate(nextProps, nextState) {
        if(this.props.verticalOrientation) {
            if (this.props.height !== nextProps.height) {
                this.setState({controllerX: Math.round(this.state.controllerX * nextProps.height / this.props.height)});
            }
        } else if (this.props.width !== nextProps.width) {
            this.setState({controllerX: Math.round(this.state.controllerX * nextProps.width / this.props.width)});
        }
    }

    componentDidUpdate() {
        this._updateCanvas();
    }

    componentWillReceiveProps(nextProps) {
        this.buildSliderValue2Percentage(nextProps.sliderValues);
        if(this.props.controllerValue !== nextProps.controllerValue) {
            this.setControllerValue(nextProps.controllerValue);
        }
    }

    buildSliderValue2Percentage(sliderValues) {
        this.sliderVal2Percentage = new Map();
        if(sliderValues) {
            let stepWidth = 100 / (sliderValues.length - 1);
            for (let i = 0; i < sliderValues.length; i++) {
                let sv = sliderValues[i];
                this.sliderVal2Percentage.set(sv.value,
                    Math.round(stepWidth * i));
            }
        }
    }

    _updateCanvas() {
        var SELF = this;
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function () {
                SELF.paint();
            });
        } else {
            SELF.paint();
        }
    }

    _updateControllerCanvas() {
        var SELF = this;
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function () {
                // SELF.paintController();
                SELF.paint(); //Komplettzeichnen notwendig, damit auch die Beschriftung geändert wird
            });
        } else {
            SELF.paint();
        }
    }

    _pan(evt) {
        let cursorPos = Helper.getCursorPosition(this.refs.slidercanvas, evt);
        if(this.props.verticalOrientation) {
            this._setControllerX(this.props.height - cursorPos[1] - this.XPADDING);
        } else {
            this._setControllerX(cursorPos[0] - this.XPADDING);
        }
        //this._updateControllerCanvas();
        this.fireZoomCallback();
        this.props.onSliderEvent && this.props.onSliderEvent(evt);
    }

    _press(evt) {
        let cursorPos = Helper.getCursorPosition(this.refs.slidercanvas, evt);
        if(this.props.verticalOrientation) {
            this._setControllerX(this.props.height - cursorPos[1] - this.XPADDING);
        } else {
            this._setControllerX(cursorPos[0] - this.XPADDING);
        }
        //this._updateControllerCanvas();
        this.fireZoomCallback();
        this.props.onSliderEvent && this.props.onSliderEvent(evt);
    }

    _mouseUp(evt) {
        this.props.onPressUp && this.props.onPressUp(evt);
    }

    _setControllerX(x) {
        if (x < 0) {
            this.setState({controllerX: 0});
        } else if (x > ((this.props.verticalOrientation ? this.ctx.canvas.height : this.ctx.canvas.width) - 2 * this.XPADDING)) {
            this.setState({controllerX: (this.props.verticalOrientation ? this.ctx.canvas.height : this.ctx.canvas.width) - 2 * this.XPADDING});
        } else {
            this.setState({controllerX: x});
        }
    }

    fireZoomCallback() {
        this.props.onChange && this.props.onChange(this.getControllerValue());
    }


    getControllerValue() {
        //Zwischen welchen beiden Slidervalues befindet sich der Controller? -> Dazwischen linear rechnen
        let minVal = undefined;
        let maxVal = undefined;
        let minValX = undefined;
        let maxValX = undefined;
        let absMinVal = undefined;
        let absMaxVal = undefined;
        for (let val of this.props.sliderValues) {
            let xpos = this.getXPosForSliderValue(val);
            if (this.state.controllerX >= xpos && (minValX === undefined || minValX < xpos)) {
                minVal = val;
                minValX = xpos;
            } else if (this.state.controllerX <= xpos && (maxValX === undefined || maxValX > xpos)) {
                maxVal = val;
                maxValX = xpos;
            }
            if (!absMinVal || absMinVal > val) {
                absMinVal = val;
            }
            if (!absMaxVal || absMaxVal < val) {
                absMaxVal = val;
            }
        }
        if (!minVal) {
            minVal = absMinVal;
            minValX = this.getXPosForSliderValue(minVal);
        }
        if (!maxVal) {
            maxVal = absMaxVal;
            maxValX = this.getXPosForSliderValue(maxVal);
        }

        if (minVal !== undefined && maxVal !== undefined) {
            let retVal = minVal.value + ((this.state.controllerX - minValX) / (maxValX - minValX)) * (maxVal.value - minVal.value);
            return retVal;
        } else {
            return undefined;
        }
    }

    setControllerValue(minutes) {
        if(this.props.sliderValues) {
            //Zwischen welchen beiden Slidervalues befindet sich der Wert, den der Controller annehmen soll? -> Dazwischen linear rechnen
            let minVal = undefined;
            let maxVal = undefined;
            for (let val of this.props.sliderValues) {
                if (minutes >= val.value && (minVal === undefined || val.value
                    >= minVal.value)) {
                    minVal = val;
                }
                if (minutes < val.value && (maxVal === undefined || val.value
                    < maxVal.value)) {
                    maxVal = val;
                }
            }
            if (minVal !== undefined && maxVal !== undefined) {
                let minValX = this.getXPosForSliderValue(minVal);
                let maxValX = this.getXPosForSliderValue(maxVal);

                this.setState({
                    controllerX: minValX + (minutes - minVal.value)
                        / (maxVal.value - minVal.value) * (maxValX - minValX)
                });
            } else if (minVal !== undefined) {
                this.setState(
                    {controllerX: this.getXPosForSliderValue(minVal)});
            } else if (maxVal !== undefined) {
                this.setState(
                    {controllerX: this.getXPosForSliderValue(maxVal)});
            }
            this._updateControllerCanvas();
        }
    }

    getXPosForSliderValue(val) {
        return this.sliderVal2Percentage.get(val.value) * ((this.props.verticalOrientation? this.ctx.canvas.height : this.ctx.canvas.width) - 2 * this.XPADDING) / 100;
    }

    paint() {
        this.ctx.font = "12px Roboto, sans-serif";

        this.ctx.clearRect(0, 0, this.ctx.canvas.width,  this.ctx.canvas.height);

        this.ctx.save();

        if(this.props.verticalOrientation) {
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.translate(-this.props.height, 0);
        }


        this.ctx.strokeStyle = "#000";

        //Die Länge des Sliders zeichnen
        this.ctx.beginPath();
        this.ctx.lineWidth = 10;
        this.ctx.lineCap= "round";

        if(this.props.verticalOrientation) {
            this.ctx.moveTo(this.XPADDING, this.props.labelUnderSlider ? 10 : this.props.width - 10);
            this.ctx.lineTo(this.props.height -  this.XPADDING, this.props.labelUnderSlider ? 10 : this.props.width - 10);
        } else {
            this.ctx.moveTo(this.XPADDING, this.props.labelUnderSlider ? 10 : this.props.height - 10);
            this.ctx.lineTo(this.props.width - this.XPADDING, this.props.labelUnderSlider ? 10 : this.props.height - 10);
        }
        this.ctx.stroke();

        let lastTextEndLow = -1000;
        let lastTextEndHigh = -1000;
        if(this.props.verticalOrientation) {
            let w = 10;
            for (let val of this.props.sliderValues) {
                let xpos = this.XPADDING + this.sliderVal2Percentage.get(val.value) * (this.ctx.canvas.height - 2 * this.XPADDING) / 100;
                let low = Math.abs(this.state.controllerX - xpos + this.XPADDING) > 20;
                const txtWidth = this.ctx.measureText(val.name).width;
                let ypos = low ? (this.props.labelUnderSlider ? 25 : this.props.width-30 -txtWidth) : (this.props.labelUnderSlider ? 27 : this.props.width-33 -txtWidth);
                let txtStart = Math.round(xpos - w / 2);
                if (txtStart > lastTextEndLow + 5) {
                    if (low) {
                        this.ctx.fillStyle = "#555";
                            this.ctx.save();
                            this.ctx.translate(txtStart, ypos);
                            this.ctx.rotate(Math.PI / 2);
                            this.ctx.fillText(val.name, 0, 0);
                            this.ctx.restore();
                    }
                    lastTextEndLow = txtStart + w;
                }
                if (!low && txtStart > lastTextEndHigh + 5) {
                    //Je weiter die aktuelle x-Position des Sliders entfernt ist, desto weiter nach unten rückt die Beschriftung
                    this.ctx.fillStyle = "#000";
                        this.ctx.save();
                        this.ctx.translate(txtStart, ypos);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.fillText(val.name, 0, 0);
                        this.ctx.restore();
                    lastTextEndHigh = txtStart + w;
                }
            }
        } else {
            for (let val of this.props.sliderValues) {
                let xpos = this.XPADDING + this.sliderVal2Percentage.get(val.value) * (this.ctx.canvas.width - 2 * this.XPADDING) / 100;
                let low = Math.abs(this.state.controllerX - xpos + this.XPADDING) > 20;
                let ypos = low ? this.props.height - 25 : this.props.labelUnderSlider ? 80 : this.props.height - 40;
                let w = Helper.textWidthFromCache(val.name, 12, this.ctx);//this.ctx.measureText(val.name).width;
                let txtStart = Math.round(xpos - w / 2);
                if (txtStart > lastTextEndLow + 5) {
                    if (low) {
                        this.ctx.fillStyle = "#555";
                            this.ctx.fillText(val.name, txtStart, ypos);
                    }
                    lastTextEndLow = txtStart + w;
                }
                if (!low && txtStart > lastTextEndHigh + 5) {
                    //Je weiter die aktuelle x-Position des Sliders entfernt ist, desto weiter nach unten rückt die Beschriftung
                    this.ctx.fillStyle = "#000";
                    this.ctx.fillText(val.name, txtStart, ypos);
                    lastTextEndHigh = txtStart + w;
                }
            }
        }
        this.paintController();
        this.ctx.restore();
    }

    //Zeichnet nur den beweglichen Slider
    paintController() {
        this.ctrctx.save();

        this.ctrctx.clearRect(0, 0, this.ctrctx.canvas.width, this.ctrctx.canvas.height);

        if(this.props.verticalOrientation) {
            this.ctrctx.rotate(-Math.PI / 2);
            this.ctrctx.translate(-this.props.height, 0);
        }
        this.ctrctx.strokeStyle = "#000000";
        this.ctrctx.fillStyle = "#FF3D00";

        this.ctrctx.beginPath();

        this.ctrctx.arc(this.XPADDING + this.state.controllerX, this.props.verticalOrientation ?  (this.props.labelUnderSlider ? 10 :  this.props.width - 10) : this.props.height - 10, 9, 0, 2 * Math.PI);

        this.ctrctx.fill();
        this.ctrctx.stroke();
        this.ctrctx.restore();
    }

    mouseOverController(evt) {
        this.props.onSliderEvent && this.props.onSliderEvent(evt);
    }

    mouseOutOfController(evt) {
        this.props.onSliderExit && this.props.onSliderExit(evt);
    }

    render() {
        var divStyle = {
            position: "relative",
            cursor: "pointer"

        };

        var controllerCanvasStyle = {
            position: "absolute",
            top: 0,
            left: 0
        };

        var options = {
            recognizers: {
                press: {
                    time: 0
                }
            }
        }

        return <div style={divStyle}>
            <canvas ref="slidercanvas"
                    width={this.props.width}
                    height={this.props.height}
            >

            </canvas>

            <Hammer direction={'DIRECTION_ALL'}
                    options={options}
                    onPan={this._pan}
                    onPress={this._press}
                    style={controllerCanvasStyle}>
                <canvas ref="controllercanvas"
                        width={this.props.width}
                        height={this.props.height}
                        style={{cursor: "pointer"}}
                        onMouseOut={(evt) => this.mouseOutOfController(evt)}
                        onMouseMove={(evt) => this.mouseOverController(evt)}
                        onMouseUp={(evt)=>this._mouseUp(evt)}
                >

                </canvas>
            </Hammer>

        </div>
    }
}

export default Slider
