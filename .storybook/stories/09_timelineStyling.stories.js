import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};


export const _9Styling = () => {
  const testData = buildTestData();
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);



  const waitStyle = (width, height) => {
    return {
      position: "absolute",
      top: this.props.height / 2 - 60,
      left: this.props.width / 2 - 80,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }
  };



  return <div>
    Styling
    <br/>
    <br/>
    <div>
      <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        waitOverlay = {(width, height)=><div style={waitStyle(width, height)}>Loading...</div>}
        paintShadows = {true}
      />

    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

