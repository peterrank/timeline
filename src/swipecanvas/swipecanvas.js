/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import React from 'react';
import Hammer from '../hammer/hammer';

class SwipeCanvas extends React.Component {
    constructor(props) {
        super(props);

        //this.state = {horizontalOrientation: true};

        this._tap = this._tap.bind(this);
        this._swipe = this._swipe.bind(this);
        this._pan = this._pan.bind(this);
        this._panEnd = this._panEnd.bind(this);
        this._press = this._press.bind(this);
        this._pressUp = this._pressUp.bind(this);
        this.onLongPress = this.onLongPress.bind(this);
        this._pinchStart = this._pinchStart.bind(this);
        this._pinchEnd = this._pinchEnd.bind(this);
        this._pinch = this._pinch.bind(this);
        this._wheel = this._wheel.bind(this);
        this._updateCanvas = this._updateCanvas.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._mouseOut = this._mouseOut.bind(this);
        this.paint = this.paint.bind(this);

        this.ctx = undefined;

        this.wasSwipeBeforePress = false; //Vor einem Press wurde ein Swipe ausgeführt -> Nur wenn vorher kein Swipe war muss auf einen Longklick gewartet werden

        this.pressTimeoutHandle = 0;
        this.slideTimeoutHandle = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.isPanning = false;
        this.isSwiping = false;
        this.horizontalPanning = true;
        this.verticalPanning = true;
    }

    componentDidMount() {
        this.ctx = this.refs.canvas.getContext('2d');
        this.ctx2 = this.refs.canvas2.getContext('2d');
        this._updateCanvas();
        this.refs.canvas2.addEventListener('wheel', this._wheel);
    }

    componentWillUnmount() {
        this.refs.canvas2.removeEventListener('wheel', this._wheel);
    }

    componentDidUpdate() {
        this._updateCanvas();
    }

    _wheel(evt) {
        if(evt.ctrlKey) {
            this.isPanning = false;
            this.isSwiping = false;
            var deltaY = evt.deltaY;
            //Je nach Delta-Mode muss umgerechnet werden
            if (evt.deltaMode === 0) { //Angabe in Pixeln?
                deltaY = evt.deltaY / 20;
            }

            this.zoom(deltaY, evt.offsetX);
            //Wenn gescrolled wird, dann darf nicht der ganze Bildschirm mitgescrolled werden
            evt.stopImmediatePropagation();
            evt.preventDefault();
            evt.returnValue = false;
            return false;
        } else {
            let dy = evt.deltaY; //TODO: erkennen, ob das System natural scrolling nutzt (apple). Dann hier ein Minus voransetzen
            this.offsetY += -dy;

            this.offsetChanged();
            this.offsetY = 0;
            this.offsetResetted();

            this._updateCanvas();

            //Wenn gescrolled wird, dann darf nicht der ganze Bildschirm mitgescrolled werden
            if (!((dy < 0 && this.workRowOffset === 0) || (dy > 0 && this.workRowOffset <= 0))) {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                evt.returnValue = false;
                return false;
            }
        }
    }

    zoom(factor, offsetFromStart) {
        //wird in der subklasse ggf. überschrieben
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }
    }

    _updateCanvas() {
        //Bei meinen Tests war es performanter das ganze ohne requestAnimationFrame zu machen -> im IE
        if (window.requestAnimationFrame && !this.props.printLayout) {
            window.requestAnimationFrame(function () {
                this.paint();
            }.bind(this));
        } else {
            this.paint();
        }
    }

    _tap(evt) {
        let tmpIsSwiping = this.wasSwipeBeforePress;

        this._clearPressTimeout();
        this.isPanning = false;
        this.isSwiping = false;
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }

        this._updateCanvas();


        if (!tmpIsSwiping) {
            this.onTap(evt);
        }

        evt.preventDefault();
        evt.returnValue = false;
        return false;
    }

    _clearPressTimeout() {
        if (this.pressTimeoutHandle !== 0) {
            clearTimeout(this.pressTimeoutHandle);
            this.pressTimeoutHandle = 0;
        }
    }

    _basicPinch(evt) {
        this._clearPressTimeout();
        this.isPanning = false;
        this.isSwiping = false;
    }

    _pinchStart(evt) {
        this._basicPinch(evt);
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }
        this.startPinch(evt.center.x);
    }

    _pinchEnd(evt) {
        this._basicPinch(evt);
        this.endPinch();
        this.startPinchPos = undefined;
    }

    _pinch(evt) {
        this._basicPinch(evt);
        this.pinch(evt.scale);
    }

    _mouseMove(evt) {
        this.onMouseMove(evt);
    }

    onMouseMove(evt) {

    }

    _mouseOut(evt) {
        this.onMouseOut(evt);
    }

    onMouseOut(evt) {

    }

    startPinch(center) {

    }

    pinch(scale) {

    }

    endPinch() {

    }

    drop(obj, x, y) {

    }


    _swipe(evt) {
        this._clearPressTimeout();
        if (!this.isInMovement()) {
            //Das hier nur zur Sicherheit. Eigentlich sollte das immer von pan vorher aufgerufen werden.
            this.beforeMovement();
        }
        this.isSwiping = true;
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }
        this._swipeInternal(this.horizontalPanning ? evt.velocityX : 0, this.verticalPanning ? evt.velocityY : 0);
    }

    _press(evt) {
        this.wasSwipeBeforePress = this.isSwiping;
        this.isPanning = false;
        this.isSwiping = false;
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }

        this.offsetX = 0;
        this.offsetY = 0;

        this.offsetResetted();

        if (!this.wasSwipeBeforePress) {
            this.pressTimeoutHandle = setTimeout(() => this.onLongPress(evt), 500);
        }
    }

    _pressUp(evt) {
        this._clearPressTimeout();
    }

    onTap(evt) {

    }

    onLongPress(evt) {

    }

    _swipeInternal(velocityX, velocityY) {
        var SELF = this;
        if (Math.abs(velocityX) > 0.01 || Math.abs(velocityY) > 0.01) {
            this.offsetX += Math.round(velocityX * 20); //Das runden ist wegen der Performance des Canvas. Bei Kommawerten muss der Canvas an Antialiasing machen
            this.offsetY += Math.round(velocityY * 20);
            this.offsetChanged();
            this.slideTimeoutHandle = setTimeout(function () {
                SELF._swipeInternal(velocityX * 0.95, velocityY * 0.95);
            }, 17);
            //console.log("current TimeoutHandle: "+this.slideTimeoutHandle);
        } else {
            this.isSwiping = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.offsetResetted();
        }
        this._updateCanvas();
    }

    _panInternal(evt) {
        if (!evt.isFinal && this.isSwiping) {
            //Press-Event wurde verschluckt. Deshalb rufen wir es explizit auf
            this._press(evt);
        }

        this._clearPressTimeout();

        if (!this.isInMovement()) {
            this.beforeMovement();
        }

        if (!this.isPanning) {
            let ratio;
            if (evt.deltaY === 0) {
                ratio = 100;
            } else {
                ratio = Math.abs(evt.deltaX / evt.deltaY);
            }
            if (ratio > 2) {
                this.horizontalPanning = true;
                this.verticalPanning = false;
            } else if (ratio < 0.5) {
                this.horizontalPanning = false;
                this.verticalPanning = true;
            }
        }

        this.isPanning = true;
        if (!evt.isFinal) {
            if (this.slideTimeoutHandle !== 0) {
                clearTimeout(this.slideTimeoutHandle);
            }
        }

        if (evt.isFinal) {
            this.isPanning = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.horizontalPanning = true;
            this.verticalPanning = true;
            this.offsetResetted();
        } else {
            if (this.horizontalPanning) {
                this.offsetX = evt.deltaX;
            }
            if (this.verticalPanning) {
                this.offsetY = evt.deltaY;
            }
            this.offsetChanged();
        }


    }

    _pan(evt) {
        this._panInternal(evt);
        this._updateCanvas();
    }

    _panEnd(evt) {

    }

    //Das hier muss von der Subklasse überschrieben werden, damit diese weiss, die Komponente gleich bewegt wird
    //Damit kann dann z.B. der aktuelle Canvas-Stand in ein Offscreen-Canvas geschrieben werden.
    beforeMovement() {

    }

    //true, wenn die Komponente bewegt wird (durch pan oder swipe)
    isInMovement() {
        //if(this.resOffset !== this.workResOffset || this.canvasStartTime.getJulianMinutes() !== this.workStartTime.getJulianMinutes() || this.canvasEndTime.getJulianMinutes() !== this.workEndTime.getJulianMinutes()) {
        if (this.isPanning || this.isSwiping) {
            return true;
        } else {
            return false;
        }
    }

    //Das hier muss von der Subklasse überschrieben werden, damit diese weiss, dass der Offset zurückgesetzt wird
    offsetResetted() {

    }

    //Das hier muss von der Subklasse überschrieben werden, damit diese weiss, dass der Offset geändert wurde
    offsetChanged() {

    }

    //Wird von der Subklasse überschrieben
    paint() {
        this.ctx.clearRect(0, 0,  this.ctx.canvas.width , this.ctx.canvas.height);
        //Nur zum Test, paint() wird dann von einer Subklasse überschrieben
        this.ctx.fillStyle = "#FFAAAA";
        this.ctx.fillRect(this.props.width / 2 + this.offsetX, this.props.height / 2 + this.offsetY, 10, 10);
    }

    getCanvas() {
        return this.refs.canvas;
    }

    render() {
        var options = {
            recognizers: {
                press: {
                    time: 0
                },
                pinch: {
                    enable: true
                }
            }
        }


        return (
            <Hammer direction={'DIRECTION_ALL'}
                    options={options}
                    onSwipe={this._swipe}
                    onTap={this._tap}
                    onPan={this._pan}
                    onPanEnd={this._panEnd}
                    onPress={this._press}
                    onPinch={this._pinch}
                    onPinchStart={this._pinchStart}
                    onPinchEnd={this._pinchEnd}
                    onPressUp={this._pressUp}>
                <div
                    style={{
                        position: "relative",
                        width: this.props.width,
                        height: this.props.height
                    }}>

                    <div style={{width: this.props.width, height: this.props.height, position: "absolute", backgroundColor: this.props.brightBackground ? "rgb(255,255, 255)" : "rgb(44,60, 80)"}}/>

                    <div style={{backgroundImage: this.props.backgroundImage ? "url('" + this.props.backgroundImage + "')" : null,
                        backgroundSize: "cover",
                        backgroundPosition: "15% 15%",
                        width: this.props.width,
                        height: this.props.height,
                        position: "absolute"}}
                        className={this.props.backgroundClassName}
                    />

                    {this.props.backgroundImage && <div style={{width: this.props.width, height: this.props.height, position: "absolute", backgroundColor: "rgba(44,60, 80, 0.3)"}} className={this.props.backgroundClassName}/>}

                    <canvas ref="canvas"
                            width={this.props.width}
                            height={this.props.height}
                            style={{position: "absolute", cursor: "pointer"}}
                            className={this.props.canvasClassName}
                    >
                    </canvas>
                    <canvas ref="canvas2"
                            width={this.props.width}
                            height={this.props.height}
                            style={{position: "absolute", cursor: "pointer", boxShadow: "inset 0px 5px 5px 0px rgba(0,0,0,0.5)"}}
                            onMouseMove={(evt) => this._mouseMove(evt)}
                            onMouseOut={(evt) => this._mouseOut(evt)}
                            className={this.props.canvasClassName}
                            onDragOver={(evt)=>evt.preventDefault()}
                            onDrop={(evt)=>this.drop(evt.dataTransfer.getData("text"), evt.clientX - evt.target.getBoundingClientRect().left,evt.clientY - evt.target.getBoundingClientRect().top)}
                    >
                    </canvas>

                    </div>
            </Hammer>
        )
    }
}

export default SwipeCanvas;
