import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const panEnd = (timeline) => {
  if(timeline.getLastTimelineEvent().getResource() && timeline.getLastTimelineEvent().getTime()) {
    const grabOffset = timeline.getDragGrabOffsetMinutes();
    for (let t of timeline.getModel().getMovedTasks()) {
      let task = timeline.getModel().getItemByID(t.id);
      if (task) {
        if (task.getStart() && task.getEnd()) {
          const newStart = timeline.getLastTimelineEvent().getTime().clone().addMinutes(-grabOffset);
          const movedMinutes = task.getStart().getDistanceInMinutes(newStart);
          let duration = task.getStart().getDistanceInMinutes(task.getEnd());

          task.setStart(newStart);
          task.setEnd(newStart.clone().addMinutes(duration));
          task.setResID(timeline.getLastTimelineEvent().getResource().id);

          //Innerevents auch verschieben (die Dauer muss gleich bleiben und darf sich nicht nach Arbeitszeitreglen anpassen)
          if(task.innerEvents) {
            for (let tInner of task.innerEvents) {
              tInner.setStart(tInner.getStart().clone().addMinutes(movedMinutes));
              tInner.setEnd(tInner.getEnd().clone().addMinutes(movedMinutes));
            }
          }
        }
      }
    }
  }
}

const onDrop = (timeline,obj, x, y) => {
  console.log(obj);
  console.log(x);
  console.log(y);

  const startTimeJulMin = timeline.getTimeForXPos(x);
  const res = timeline.getResource(y);
  console.log("create new Task");
  console.log(startTimeJulMin);
  console.log(res);
}

export const _6DragNDropTimeline = () => {
  let testData = buildTestData();
  return <div>
    Drag'n'Drop
    <br/>
    <br/>
    <div draggable={true} onDragStart={(evt)=>{console.log("dragStart"); evt.dataTransfer.setData("text", "Beschreibung des Auftrags"); console.log(evt.dataTransfer.items)}}>Drag me</div>
    <br/>
    <br/>
    <ReactCanvasTimeline
      resources = {testData.resources}
      tasks = {testData.tasks}
      onPanEnd = {(timeline) => panEnd(timeline)}
      onDrop = {(timeline,obj, x, y) => onDrop(timeline, obj, x, y)}
      paintShadows = {true}
      dragEnabled = {true}
    />
  </div>;
}


