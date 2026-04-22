import React from 'react';

/**
 * Gesture component — replaces the former hammerjs-based wrapper.
 * Provides the same event props interface (onTap, onSwipe, onPan, onPinch,
 * onPress, onPressUp, onDoubleTap) using native Pointer Events.
 *
 * Event shapes mirror the previous HammerJS events:
 *   onSwipe:      { velocityX, velocityY }   (px/ms)
 *   onPan:        { deltaX, deltaY, isFinal }
 *   onPinch:      { scale }
 *   onPinchStart: { center: {x,y}, clientX, clientY }
 *   onTap / onPress / onPressUp / onDoubleTap: native PointerEvent
 */

const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms
const TAP_MAX_DISTANCE = 10;          // px
const TAP_MAX_DURATION = 300;         // ms
const DOUBLE_TAP_MAX_INTERVAL = 300;  // ms

const PRIVATE_PROPS = new Set([
    'children', 'direction', 'options', 'recognizeWith', 'vertical',
    'onTap', 'onDoubleTap', 'onSwipe', 'onPan', 'onPanCancel', 'onPanEnd',
    'onPanStart', 'onPinch', 'onPinchCancel', 'onPinchEnd', 'onPinchIn',
    'onPinchOut', 'onPinchStart', 'onPress', 'onPressUp',
    'onRotate', 'onRotateCancel', 'onRotateEnd', 'onRotateMove', 'onRotateStart',
    'action',
]);

class HammerComponent extends React.Component {
    constructor(props) {
        super(props);
        this.gestureRef = React.createRef();

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp   = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);

        this.activePointers  = new Map();
        this.panStartX       = 0;
        this.panStartY       = 0;
        this.prevMoveX       = 0;
        this.prevMoveY       = 0;
        this.lastMoveTime    = 0;
        this.lastVelocityX   = 0;
        this.lastVelocityY   = 0;
        this.tapStartTime    = 0;
        this.lastTapTime     = 0;
        this.pinchStartDist  = 0;
        this.isPanning       = false;
        this.horizontalOnly  = false; // direction=DIRECTION_HORIZONTAL
    }

    componentDidMount() {
        const el = this.gestureRef.current;
        el.addEventListener('pointerdown',   this._onPointerDown,   { passive: false });
        el.addEventListener('pointermove',   this._onPointerMove,   { passive: false });
        el.addEventListener('pointerup',     this._onPointerUp,     { passive: false });
        el.addEventListener('pointercancel', this._onPointerCancel, { passive: false });
    }

    componentWillUnmount() {
        const el = this.gestureRef.current;
        if (el) {
            el.removeEventListener('pointerdown',   this._onPointerDown);
            el.removeEventListener('pointermove',   this._onPointerMove);
            el.removeEventListener('pointerup',     this._onPointerUp);
            el.removeEventListener('pointercancel', this._onPointerCancel);
        }
    }

    _isHorizontalOnly() {
        const dir = this.props.direction;
        return dir === 'DIRECTION_HORIZONTAL';
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
        this.gestureRef.current.setPointerCapture(evt.pointerId);
        this.activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });

        if (this.activePointers.size === 1) {
            this.panStartX    = evt.clientX;
            this.panStartY    = evt.clientY;
            this.prevMoveX    = evt.clientX;
            this.prevMoveY    = evt.clientY;
            this.lastMoveTime = Date.now();
            this.lastVelocityX = 0;
            this.lastVelocityY = 0;
            this.tapStartTime = Date.now();
            this.isPanning    = false;

            if (this.props.onPress) this.props.onPress(evt);
        } else if (this.activePointers.size === 2) {
            this.pinchStartDist = this._getPinchDistance();
            const mid = this._getPinchMidpoint();
            if (this.props.onPinchStart) {
                this.props.onPinchStart({ center: mid, clientX: mid.x, clientY: mid.y });
            }
        }
    }

    _onPointerMove(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;
        this.activePointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY });

        if (this.activePointers.size === 1) {
            const now = Date.now();
            const dt  = now - this.lastMoveTime;
            if (dt > 0) {
                this.lastVelocityX = (evt.clientX - this.prevMoveX) / dt;
                this.lastVelocityY = (evt.clientY - this.prevMoveY) / dt;
            }
            this.prevMoveX    = evt.clientX;
            this.prevMoveY    = evt.clientY;
            this.lastMoveTime = now;

            const deltaX = evt.clientX - this.panStartX;
            const deltaY = evt.clientY - this.panStartY;

            if (this.props.onPan) {
                const center = { x: evt.clientX, y: evt.clientY };
                const panEvt = this._isHorizontalOnly()
                    ? { deltaX, deltaY: 0, isFinal: false, clientX: evt.clientX, clientY: evt.clientY, center }
                    : { deltaX, deltaY, isFinal: false, clientX: evt.clientX, clientY: evt.clientY, center };
                this.props.onPan(panEvt);
                this.isPanning = true;
            }
        } else if (this.activePointers.size === 2) {
            const dist  = this._getPinchDistance();
            const scale = this.pinchStartDist > 0 ? dist / this.pinchStartDist : 1;
            if (this.props.onPinch) this.props.onPinch({ scale });
        }
    }

    _onPointerUp(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;

        if (this.activePointers.size === 2) {
            if (this.props.onPinchEnd) this.props.onPinchEnd(evt);
        } else if (this.activePointers.size === 1) {
            const deltaX  = evt.clientX - this.panStartX;
            const deltaY  = evt.clientY - this.panStartY;
            const dist    = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const speed   = Math.sqrt(this.lastVelocityX ** 2 + this.lastVelocityY ** 2);
            const duration = Date.now() - this.tapStartTime;

            if (this.props.onPressUp) this.props.onPressUp(evt);

            const center = { x: evt.clientX, y: evt.clientY };

            if (dist < TAP_MAX_DISTANCE && duration < TAP_MAX_DURATION) {
                // Tap or double tap
                if (this.props.onPan) {
                    this.props.onPan({ deltaX: 0, deltaY: 0, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center });
                }
                const now = Date.now();
                if (this.props.onDoubleTap && now - this.lastTapTime < DOUBLE_TAP_MAX_INTERVAL) {
                    this.props.onDoubleTap(evt);
                    this.lastTapTime = 0;
                } else {
                    this.lastTapTime = now;
                    if (this.props.onTap) this.props.onTap(evt);
                }
            } else if (speed > SWIPE_VELOCITY_THRESHOLD) {
                // Swipe
                if (this.props.onSwipe) {
                    this.props.onSwipe({ velocityX: this.lastVelocityX, velocityY: this.lastVelocityY });
                }
                if (this.props.onPan) {
                    const panEvt = this._isHorizontalOnly()
                        ? { deltaX, deltaY: 0, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center }
                        : { deltaX, deltaY, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center };
                    this.props.onPan(panEvt);
                }
            } else {
                // Pan end
                if (this.props.onPan) {
                    const panEvt = this._isHorizontalOnly()
                        ? { deltaX, deltaY: 0, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center }
                        : { deltaX, deltaY, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center };
                    this.props.onPan(panEvt);
                }
                if (this.props.onPanEnd) this.props.onPanEnd(evt);
            }
        }

        this.activePointers.delete(evt.pointerId);
    }

    _onPointerCancel(evt) {
        if (!this.activePointers.has(evt.pointerId)) return;
        this.activePointers.delete(evt.pointerId);
        if (this.props.onPan) this.props.onPan({ deltaX: 0, deltaY: 0, isFinal: true, clientX: evt.clientX, clientY: evt.clientY, center: { x: evt.clientX, y: evt.clientY } });
        if (this.props.onPressUp) this.props.onPressUp(evt);
    }

    render() {
        // Pass through all non-gesture props to the child element
        const passthroughProps = {};
        Object.keys(this.props).forEach(key => {
            if (!PRIVATE_PROPS.has(key)) {
                passthroughProps[key] = this.props[key];
            }
        });

        const child = React.Children.only(this.props.children);
        const childRef = child.ref;
        const ref = (node) => {
            this.gestureRef.current = node;
            if (typeof childRef === 'function') {
                childRef(node);
            } else if (childRef) {
                childRef.current = node;
            }
        };

        return React.cloneElement(child, {
            ...passthroughProps,
            ref,
            style: { ...(child.props.style || {}), touchAction: 'none', ...(passthroughProps.style || {}) },
        });
    }
}

export default HammerComponent;
