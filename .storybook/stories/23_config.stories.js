import React, { useState } from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const defaultConfig = {
  timelineHeaderColor : "rgb(150,150,150)",
  resourceOverlayInlineColor: "rgba(40,40,40,0.8)",
  resMainFont : "18px Roboto, sans-serif",
  resMainFontColor: "#FFF",
  resSubFontColor: "#AAA",
  timelineMainFontColor: "#FFF",
  timelineSubFontColor: "#CCC",
  currentDateOnMousePositionColor: "rgba(60,60,60,0.7)",
  currentDateOnMousePositionBorderColor: "#FFF",
  timelineHeaderMainTickColor: "white",
  hideResourceHeaderIfOnlyOneRes: true
}

export const _23Config = () => {
  const [headerType, setHeaderType] = useState('default');
  const [resCnt, setResCnt] = useState(1);
  const [config, setConfig] = useState(defaultConfig);
  const [key, setKey] = useState("1");

  const testData = buildTestData(true, resCnt);

  return <div>
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ marginRight: '1rem' }}>
        <input
          type="radio"
          value="default"
          checked={headerType === 'default'}
          onChange={(e) => setHeaderType(e.target.value)}
        /> Default
      </label>
      <label style={{ marginRight: '1rem' }}>
        <input
          type="radio"
          value="inline"
          checked={headerType === 'inline'}
          onChange={(e) => setHeaderType(e.target.value)}
        /> Inline
      </label>
      <label>
        <input
          type="radio"
          value="overlay"
          checked={headerType === 'overlay'}
          onChange={(e) => setHeaderType(e.target.value)}
        /> Overlay
      </label>
      <button 
        onClick={() => {
          setResCnt(resCnt === 1 ? 100 : 1);
          setKey(""+Math.random());
        }
        }
        style={{ marginLeft: '2rem' }}
      >
        Toggle Resources ({resCnt})
      </button>
      <button 
        onClick={() => {
          setConfig({
            ...config,
            hideResourceHeaderIfOnlyOneRes: !config.hideResourceHeaderIfOnlyOneRes
          });
          setKey(""+Math.random());
        }}

        style={{ marginLeft: '1rem' }}
      >
        Toggle Hide Header ({config.hideResourceHeaderIfOnlyOneRes ? 'On' : 'Off'})
      </button>
    </div>
    <ReactCanvasTimeline
        key={key}
      resources={testData.resources}
      tasks={testData.tasks}
      paintShadows={false}
      headerType={headerType}
      onClick={(evt) => alert(JSON.stringify(evt, 0, 4))}
      config={config}
    />
  </div>;
}


