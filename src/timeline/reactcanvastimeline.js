import React, { useMemo } from 'react';
import InstrumentedTimeline from './instrumentedtimeline';
import TaskModel from '../model/taskmodel';
import SliderHelper from '../slider/sliderhelper';
import LCal from '../calendar/lcal';



const ReactCanvasTimeline = (props) => {
  const model = useMemo(() => {
    const m = new TaskModel();
    m.getResourceModel().setAll(props.resources);
    m.setAll(props.tasks);
    m.barSize = props.barSize || 40;
    m.setStackDirection(props.stackDirection);
    return m;
  }, [props.resources, props.tasks, props.barSize]);

  let sliderValues = SliderHelper.getSliderValues(model.getAll());

  let now = new LCal().initNow();
  let displStart = now.clone().addDay(-10);
  let displEnd = now.clone().addDay(10);

  return <InstrumentedTimeline
      {...props}
      width={props.width || window.innerWidth * 0.9}
      height={props.height || window.innerHeight * 0.9}
      showWaitOverlay={false}
      model={model}
      start={displStart}
      end={displEnd}
      timeZone={"Europe/Berlin"}
      sliderValues={sliderValues}
      yearPositions={12}
      backgroundImage={null}
      headerType={props.headerType}
      texts={{
        presshere: "Drücke hier 2 Sekunden, um ein neues Ereignis zu erstellen"
      }}
  />
}

export default ReactCanvasTimeline;