/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import React from 'react';
import Hammer from '../hammer/hammer';
import {findDOMNode} from 'react-dom';

class NowButton extends React.Component {
    constructor(props) {
        super(props);
        this._press = this._press.bind(this);
        this._tap = this._tap.bind(this);
        this.pressTimeoutHandle = 0;
        this._updateCanvas = this._updateCanvas.bind(this);
        this._clearPressTimeout = this._clearPressTimeout.bind(this);
        this.ctx = undefined;
        this.domNode = null;
        this.controllerCanvasRef = null;
    }

    componentDidMount() {
        this.ctx = this.getCanvas().getContext('2d');
        this.ctx.fillStyle = "#FFFFFF";
        this.domNode = findDOMNode(this.getCanvas());
        this._updateCanvas();
    }


    componentDidUpdate() {
        this._updateCanvas();
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


    _press(evt) {
        this.pressTimeoutHandle = setTimeout(() => this.props.onLongPress && this.props.onLongPress(evt), 500);
    }


    _tap(evt) {
        this._clearPressTimeout();
        this.props.onJump && this.props.onJump();
    }

    _clearPressTimeout() {
        if (this.pressTimeoutHandle !== 0) {
            clearTimeout(this.pressTimeoutHandle);
            this.pressTimeoutHandle = 0;
        }
    }

    setAngle(angle) {
        this.setState({angle});
    }

    paint() {
        this.ctx.save();
        this.ctx.strokeStyle = "#000000";

        this.ctx.fillStyle = "#FF3D00";

        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        let midX = Math.round(this.ctx.canvas.width / 2);
        let midY = Math.round(this.ctx.canvas.height / 2);
        this.ctx.arc(midX, midY, midY - 1, 0, 2 * Math.PI);

        this.ctx.translate(midX, midY);
        this.ctx.rotate(this.state.angle);

        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = 'white';
        this.ctx.moveTo(-6, 6);
        this.ctx.lineTo(0, -6);
        this.ctx.lineTo(6, 6);
        this.ctx.stroke();

        this.ctx.restore();
    }


    getCanvas() {
        return this.controllerCanvasRef;
    }

    render() {
        const divStyle = {
            position: "relative",
            cursor: "pointer"
        };


        const controllerCanvasStyle = {
            position: "absolute",
            top: 0,
            left: 0
        };

        const options = {
            recognizers: {
                press: {
                    time: 0
                }
            }
        }

        return (
            <div style={divStyle}>
                <Hammer direction={'DIRECTION_ALL'} options={options} onPress={this._press}
                        onPressUp={this._clearPressTimeout} onTap={(evt) => this._tap(evt)}
                        style={controllerCanvasStyle}>
                    <canvas ref={ref => {if(ref != null) {this.controllerCanvasRef = ref}}}
                            width={this.props.width} height={this.props.height}>
                    </canvas>
                </Hammer>
            </div>
        )
    }
}

export default NowButton
