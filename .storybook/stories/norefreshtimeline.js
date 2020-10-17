/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'

class NoRefreshTimeline extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.model !== this.props.model;
    }

    render() {
        return <ReactCanvasTimeline {...this.props}/>
    }
}

export default NoRefreshTimeline
