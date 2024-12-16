import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Hammer from 'hammerjs'

const privateProps = {
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

const handlerToEvent = {
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

const HammerComponent = (props) => {
    const hammerRef = useRef(null);
    const elementRef = useRef(null);

    useEffect(() => {
        // Component Did Mount
        if (elementRef.current) {
            hammerRef.current = new Hammer(elementRef.current);
            updateHammer(hammerRef.current, props);
        }

        // Component Will Unmount
        return () => {
            if (hammerRef.current) {
                hammerRef.current.stop();
                hammerRef.current.destroy();
                hammerRef.current = null;
            }
        };
    }, []); // Empty dependency array means this effect runs once on mount

    useEffect(() => {
        // Component Did Update
        if (hammerRef.current) {
            updateHammer(hammerRef.current, props);
        }
    }); // No dependency array means this effect runs after every render

    const filteredProps = {};
    Object.keys(props).forEach(key => {
        if (!privateProps[key]) {
            filteredProps[key] = props[key];
        }
    });

    // Add ref to the filtered props
    filteredProps.ref = elementRef;

    return React.cloneElement(React.Children.only(props.children), filteredProps);
};

HammerComponent.propTypes = {
    searchText: PropTypes.string,
};

export default HammerComponent;
