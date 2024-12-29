import React from 'react';
import PropTypes from 'prop-types';
import Hammer from 'hammerjs'


/**
 * This code ist adapted from hammer-js to meet the needs for React 16.0
 */


var privateProps = {
    children: true,
    direction: true,
    options: true,
    recognizeWith: true,
    vertical: true,
};

/**
 * Hammer Component
 * ================
 */

var handlerToEvent = {
    action: 'tap press',
    onDoubleTap: 'doubletap',
    onPan: 'pan',
    onPanCancel: 'pancancel',
    onPanEnd: 'panend',
    onPanStart: 'panstart',
    onPinch: 'pinch',
    onPinchCancel: 'pinchcancel',
    onPinchEnd: 'pinchend',
    onPinchIn: 'pinchin',
    onPinchOut: 'pinchout',
    onPinchStart: 'pinchstart',
    onPress: 'press',
    onPressUp: 'pressup',
    onRotate: 'rotate',
    onRotateCancel: 'rotatecancel',
    onRotateEnd: 'rotateend',
    onRotateMove: 'rotatemove',
    onRotateStart: 'rotatestart',
    onSwipe: 'swipe',
    onTap: 'tap',
    onMouseMove: 'mousemove',
};

Object.keys(handlerToEvent).forEach(function (i) {
    privateProps[i] = true;
});

function updateHammer(hammer, props) {
    if (props.hasOwnProperty('vertical')) {
        console.warn('vertical is deprecated, please use `direction` instead');
    }

    var directionProp = props.direction;
    if (directionProp || props.hasOwnProperty('vertical')) {
        let direction = directionProp ? directionProp : (props.vertical ? 'DIRECTION_ALL' : 'DIRECTION_HORIZONTAL');
        hammer.get('pan').set({direction: Hammer[direction]});
        hammer.get('swipe').set({direction: Hammer[direction]});
    }

    if (props.options) {
        Object.keys(props.options).forEach(function (option) {
            if (option === 'recognizers') {
                Object.keys(props.options.recognizers).forEach(function (gesture) {
                    var recognizer = hammer.get(gesture);
                    recognizer.set(props.options.recognizers[gesture]);
                }, this);
            } else {
                var key = option;
                var optionObj = {};
                optionObj[key] = props.options[option];
                hammer.set(optionObj);
            }
        }, this);
    }

    if (props.recognizeWith) {
        Object.keys(props.recognizeWith).forEach(function (gesture) {
            var recognizer = hammer.get(gesture);
            recognizer.recognizeWith(props.recognizeWith[gesture]);
        }, this);
    }

    Object.keys(props).forEach(function (p) {
        var e = handlerToEvent[p];
        if (e) {
            hammer.off(e);
            hammer.on(e, props[p]);
        }
    });
}

class HammerComponent extends React.Component {
    constructor(props) {
        super(props);
        this.elementRef = React.createRef();
    }
    componentDidMount() {
        this.hammer = new Hammer(this.elementRef.current);
        updateHammer(this.hammer, this.props);
    }

    componentDidUpdate() {
        if (this.hammer) {
            updateHammer(this.hammer, this.props);
        }
    }

    componentWillUnmount() {
        if (this.hammer) {
            this.hammer.stop();
            this.hammer.destroy();
        }
        this.hammer = null;
    }

    render() {
        var props = {};

        Object.keys(this.props).forEach(function (i) {
            if (!privateProps[i]) {
                props[i] = this.props[i];
            }
        }, this);

        // Reuse the child provided
        // This makes it flexible to use whatever element is wanted (div, ul, etc)
        const child = React.Children.only(this.props.children);
        const childRef = child.ref;
        const ref = (node) => {
            this.elementRef.current = node;
            if (typeof childRef === 'function') {
                childRef(node);
            } else if (childRef) {
                childRef.current = node;
            }
        };

        return React.cloneElement(child, {
            ...props,
            ref: ref,
        });
    }
}

HammerComponent.propTypes = {
    searchText: PropTypes.string,
};

export default HammerComponent;
