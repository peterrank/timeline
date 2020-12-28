import React from 'react';
import InstrumentedTimeline from './instrumentedtimeline';
import TaskModel from '../model/taskmodel';
import SliderHelper from '../slider/sliderhelper';
import LCal from '../calendar/lcal';

const ReactCanvasTimeline = (props) => {
  let model = new TaskModel();
  model.getResourceModel().setAll(props.resources);
  model.setAll(props.tasks);

  let sliderValues = SliderHelper.getSliderValues(model.getAll());
  let now = new LCal().initNow();
  let displStart = now.clone().addDay(-10);
  let displEnd = now.clone().addDay(10);

  return <InstrumentedTimeline
      {...props}
      width={props.width || window.innerWidth / 1.5}
      height={props.height || window.innerHeight / 1.5}
      horizontalOrientation={typeof(props.horizontalOrientation) === "undefined" || props.horizontalOrientation}
      showWaitOverlay={false}
      model={model}
      start={displStart}
      end={displEnd}
      timeZone={"Europe/Berlin"}
      sliderValues={sliderValues}
      longlabels={true}
      yearPositions={12}
      backgroundImage={null}
      overlayheader={props.overlayheader}
      texts={{
        presshere: "Drücke hier 2 Sekunden, um ein neues Ereignis zu erstellen"
      }}
  />
}

export default ReactCanvasTimeline;