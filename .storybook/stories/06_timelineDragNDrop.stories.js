import React from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

const panEnd = (timeline) => {
  if(timeline.getLastTimelineEvent().getResource() && timeline.getLastTimelineEvent().getTime()) {
    for (let t of timeline.getModel().getMovedTasks()) {
      //TODO: korrektes Ende ausrechnen und ein Event feuern
      let task = timeline.getModel().getItemByID(t.id);
      if (task) {
        if (task.getStart() && task.getEnd()) {
          const movedMinutes = task.getStart().getDistanceInMinutes(timeline.getLastTimelineEvent().getTime());


          let duration = task.getStart().getDistanceInMinutes(task.getEnd());

          task.setStart(timeline.getLastTimelineEvent().getTime().clone());
          let end = timeline.getLastTimelineEvent().getTime().clone().addMinutes(duration);
          task.setEnd(end);
          task.setResID(timeline.getLastTimelineEvent().getResource().id);

          //Innerevents auch verschieben (die Dauer muss gleich bleiben und darf sich nicht nach Arbeitszeitreglen anpassen)
          if(task.innerEvents) {


            for (let tInner of task.innerEvents) {
              const tInner1Start = tInner.getStart().clone().addMinutes(movedMinutes);
              const tInner1End = tInner.getEnd().clone().addMinutes(movedMinutes);
              tInner.setStart(tInner1Start);
              tInner.setEnd(tInner1End);
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

export const _6DragNDropTimeline = {render: () => {
    let testData = buildTestData();
    return <div>
      Drag'n'Drop
      <br/>
      <br/>
      <div draggable={true} onDragStart={(evt) => {
        console.log("dragStart");
        evt.dataTransfer.setData("text", "Beschreibung des Auftrags");
        console.log(evt.dataTransfer.items)
      }}>Drag me
      </div>
      <br/>
      <br/>
      <ReactCanvasTimeline
          resources={testData.resources}
          tasks={testData.tasks}
          onPanEnd={(timeline) => panEnd(timeline)}
          onDrop={(timeline, obj, x, y) => onDrop(timeline, obj, x, y)}
          paintShadows={true}
          dragEnabled={true}
      />
    </div>;
  }
}


