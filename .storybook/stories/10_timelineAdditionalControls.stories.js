import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};


export const _10AdditionalControls = () => {
  const testData = buildTestData();
  const [dialogPosition, setDialogPosition] = useState(null);
  const [horizontalOrientation, setHorizontalOrientation] = useState(true);

  const nowButtonLongPress = (evt) => {
    console.log(evt);
    setDialogPosition({x: evt.center.x, y: evt.center.y});
  }

  return <div>
    Additional Controls
    <br/>
    <br/>
    <div style={{background: "red",color: "white", borderRadius: 5, width: 300, padding: 10, cursor: "pointer", margin: 10}} onClick={()=>{
      setHorizontalOrientation(!horizontalOrientation);
    }}>
      Toggle Orientation
    </div>
    <div>
      <ReactCanvasTimeline
        resources = {testData.resources}
        tasks = {testData.tasks}
        verticalAdditionalControl = {<div style={{background: "green"}}>vertical</div>}
        horizontalAdditionalControl = {<div style={{background: "green"}}>horizontal</div>}
        onNowButtonLongPress = {(evt)=>nowButtonLongPress(evt)}
        paintShadows = {true}
        horizontalOrientation = {horizontalOrientation}
      />
      {dialogPosition && <div style={{position: "absolute", top: dialogPosition.y - 400, left: dialogPosition.x - 400, width: 400, height: 400, background: "red"}} onClick={()=>setDialogPosition(false)}>
        Click to close
      </div>}
    </div>
  </div>;
}



//<div style={waitStyle}><CircularProgress size={80}/><Typography>Lade Daten...</Typography></div>

