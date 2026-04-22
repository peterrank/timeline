/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import React from 'react';
import Helper from "../helper/helper";

const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms
const TAP_MAX_DISTANCE = 10; // px
const TAP_MAX_DURATION = 300; // ms

class SwipeCanvas extends React.Component {
    constructor(props) {
        super(props);

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
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);

        this.ctx = undefined;

        this.wasSwipeBeforePress = false;

        this.pressTimeoutHandle = 0;
        this.slideTimeoutHandle = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.isPanning = false;
        this.isSwiping = false;
        this.horizontalPanning = true;
        this.verticalPanning = true;

        this.canvasRef = null;
        this.canvas2Ref = null;
        this.gestureRef = null;

        // Pointer tracking
        this.activePointers = new Map();
        this.panStartX = 0;
        this.panStartY = 0;
        this.prevMoveX = 0;
        this.prevMoveY = 0;
        this.lastMoveTime = 0;
        this.lastVelocityX = 0;
        this.lastVelocityY = 0;
        this.tapStartTime = 0;
        this.pinchStartDist = 0;
    }

    componentDidMount() {
        this.ctx = this.canvasRef.getContext('2d');
        this.ctx2 = this.canvas2Ref.getContext('2d');
        this._updateCanvas();
        this.canvas2Ref.addEventListener('wheel', this._wheel, { passive: false });

        const el = this.gestureRef;
        el.addEventListener('pointerdown', this._onPointerDown, { passive: false });
        el.addEventListener('pointermove', this._onPointerMove, { passive: false });
        el.addEventListener('pointerup', this._onPointerUp, { passive: false });
        el.addEventListener('pointercancel', this._onPointerCancel, { passive: false });
    }

    componentWillUnmount() {
        this.canvas2Ref.removeEventListener('wheel', this._wheel);

        const el = this.gestureRef;
        if (el) {
            el.removeEventListener('pointerdown', this._onPointerDown);
            el.removeEventListener('pointermove', this._onPointerMove);
            el.removeEventListener('pointerup', this._onPointerUp);
            el.removeEventListener('pointercancel', this._onPointerCancel);
        }
    }

    componentDidUpdate() {
        this._updateCanvas();
    }

    _getPinchDistance() {
        const pts = [...this.activePointers.values()];
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    _getPinchMidpoint() {
        const pts = [...this.activePointers.values()];
        return {
            x: (pts[0].x + pts[1].x) / 2,
            y: (pts[0].y + pts[1].y) / 2,
        };
    }

    _onPointerDown(evt) {
        evt.preventDefault();
        this.gestureRef.setPointerCapture(evt.pointerId);
        this.activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });

        if (this.activePointers.size === 1) {
            this.panStartX = evt.clientX;
            this.panStartY = evt.clientY;
            this.prevMoveX = evt.clientX;
            this.prevMoveY = evt.clientY;
            this.lastMoveTime = Date.now();
            this.lastVelocityX = 0;
            this.lastVelocityY = 0;
            this.tapStartTime = Date.now();
            this._press(evt);
        } else if (this.activePointers.size === 2) {
            this.pinchStartDist = this._getPinchDistance();
            const mid = this._getPinchMidpoint();
            // Provide center and clientX/Y so Helper.getCursorPosition works
            this._pinchStart({ center: mid, clientX: mid.x, clientY: mid.y });
        }
    }

    _onPointerMove(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;
        this.activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });

        if (this.activePointers.size === 1) {
            const now = Date.now();
            const dt = now - this.lastMoveTime;
            if (dt > 0) {
                this.lastVelocityX = (evt.clientX - this.prevMoveX) / dt;
                this.lastVelocityY = (evt.clientY - this.prevMoveY) / dt;
            }
            this.prevMoveX = evt.clientX;
            this.prevMoveY = evt.clientY;
            this.lastMoveTime = now;

            const deltaX = evt.clientX - this.panStartX;
            const deltaY = evt.clientY - this.panStartY;
            const center = { x: evt.clientX, y: evt.clientY };
            this._pan({ deltaX, deltaY, isFinal: false, clientX: evt.clientX, clientY: evt.clientY, center });
        } else if (this.activePointers.size === 2) {
            const dist = this._getPinchDistance();
            const scale = this.pinchStartDist > 0 ? dist / this.pinchStartDist : 1;
            this._pinch({ scale });
        }
    }

    _onPointerUp(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;

        if (this.activePointers.size === 2) {
            this._pinchEnd(evt);
        } else if (this.activePointers.size === 1) {
            const deltaX = evt.clientX - this.panStartX;
            const deltaY = evt.clientY - this.panStartY;
            const totalDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const speed = Math.sqrt(this.lastVelocityX ** 2 + this.lastVelocityY ** 2);
            const duration = Date.now() - this.tapStartTime;

            const center = { x: evt.clientX, y: evt.clientY };
            if (totalDist < TAP_MAX_DISTANCE && duration < TAP_MAX_DURATION) {
                this._pan({ deltaX: 0, deltaY: 0, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center });
                this._panEnd(evt);
                this._tap(evt);
            } else if (speed > SWIPE_VELOCITY_THRESHOLD) {
                // velocityX/Y in px/ms — matches existing _swipeInternal expectations
                this._swipe({ velocityX: this.lastVelocityX, velocityY: this.lastVelocityY });
                this._pan({ deltaX, deltaY, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center });
                this._panEnd(evt);
            } else {
                this._pan({ deltaX, deltaY, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center });
                this._panEnd(evt);
            }

            this._pressUp(evt);
        }

        this.activePointers.delete(evt.pointerId);
    }

    _onPointerCancel(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;
        this.activePointers.delete(evt.pointerId);
        this._pan({ deltaX: 0, deltaY: 0, isFinal: true });
        this._panEnd(evt);
        this._pressUp(evt);
    }

    _wheel(evt) {
        if(evt.ctrlKey) {
            this.isPanning = false;
            this.isSwiping = false;
            var deltaY = evt.deltaY;
            if (evt.deltaMode === 0) {
                deltaY = evt.deltaY / 20;
            }

            this.zoom(deltaY, evt.offsetX);
            evt.stopImmediatePropagation();
            evt.preventDefault();
            evt.returnValue = false;
            return false;
        } else {
            let dy = evt.deltaY;
            this.offsetY += -dy;

            this.offsetChanged();
            this.offsetY = 0;
            this.offsetResetted();

            this._updateCanvas();

            if (!((dy < 0 && this.workRowOffset === 0) || (dy > 0 && this.workRowOffset <= 0))) {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                evt.returnValue = false;
                return false;
            }
        }
    }

    zoom(factor, offsetFromStart) {
        if (this.slideTimeoutHandle !== 0) {
            clearTimeout(this.slideTimeoutHandle);
        }
    }

    _updateCanvas() {
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

        let mousePos = Helper.getCursorPosition(this.canvasRef, evt);
        this.startPinch(mousePos[0], mousePos[1]);
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
            this.offsetX += Math.round(velocityX * 20);
            this.offsetY += Math.round(velocityY * 20);
            this.offsetChanged();
            this.slideTimeoutHandle = setTimeout(function () {
                SELF._swipeInternal(velocityX * 0.95, velocityY * 0.95);
            }, 17);
        } else {
            this.isSwiping = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.offsetResetted();
            this.swipeEnded();
        }
        this._updateCanvas();
    }

    swipeEnded() {

    }

    _panInternal(evt) {
        if (!evt.isFinal && this.isSwiping) {
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

    beforeMovement() {

    }

    isInMovement() {
        if (this.isPanning || this.isSwiping) {
            return true;
        } else {
            return false;
        }
    }

    offsetResetted() {

    }

    offsetChanged() {

    }

    paint() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = "#FFAAAA";
        this.ctx.fillRect(this.props.width / 2 + this.offsetX, this.props.height / 2 + this.offsetY, 10, 10);
    }

    getCanvasRef() {
        return this.canvasRef;
    }

    render() {
        return (
            <div
                ref={ref => this.gestureRef = ref}
                style={{
                    position: "relative",
                    width: this.props.width,
                    height: this.props.height,
                    touchAction: "none",
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

                <canvas ref={ref => this.canvasRef = ref}
                        width={this.props.width}
                        height={this.props.height}
                        style={{position: "absolute", cursor: "pointer"}}
                        className={this.props.canvasClassName}
                >
                    {this.props.children}
                </canvas>
                <canvas ref={ref => this.canvas2Ref = ref}
                        width={this.props.width}
                        height={this.props.height}
                        style={{position: "absolute", cursor: "pointer", boxShadow: "inset 0px 5px 5px 0px rgba(0,0,0,0.5)"}}
                        onMouseMove={(evt) => this._mouseMove(evt)}
                        onMouseOut={(evt) => this._mouseOut(evt)}
                        className={this.props.canvasClassName}
                        onDragOver={(evt) => evt.preventDefault()}
                        onDrop={(evt) => this.drop(evt.dataTransfer.getData("text"), evt.clientX - evt.target.getBoundingClientRect().left, evt.clientY - evt.target.getBoundingClientRect().top)}
                >
                </canvas>
            </div>
        )
    }
}

export default SwipeCanvas;
