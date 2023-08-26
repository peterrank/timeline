import React, {useState} from 'react';
import ReactCanvasTimeline from '../../src/timeline/reactcanvastimeline'
import buildTestData from './testdatabuilder';

export default {
  title: 'timeline',
  component: ReactCanvasTimeline,
};

export const _4AgreedTimesTimeline = {
  render: () => {
    let testData = buildTestData();
    const [selectedTaskIDs, setSelectedTaskIDs] = useState([]);

    const timelineClicked = (evt) => {
      if (evt.task) {

        let newArr = [...selectedTaskIDs];
        if (selectedTaskIDs.includes(evt.task.id)) {
          newArr.splice(newArr.indexOf(evt.task.id), 1);
        } else {
          newArr.push(evt.task.id);
        }
        setSelectedTaskIDs(newArr);
      }
    }

    const taskBackgroundPainter = (ctx, timeline, task) => {

      if (task && selectedTaskIDs.includes(task.id)) {
        let xStart = timeline.getXPosForTime(
            timeline.getModel().getDisplayedStart(task).getJulianMinutes());
        if (xStart <= timeline.virtualCanvasWidth) {
          let xEnd = timeline.getXPosForTime(
              timeline.getModel().getDisplayedEnd(task).getJulianMinutes());
          if (xEnd > timeline.resourceHeaderHeight) {
            let resStartY = timeline.timelineHeaderHeight
                + timeline.getModel().getRelativeYStart(task.getID())
                + timeline.workResOffset;
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";

            ctx.fillRect(xStart - 40, resStartY, xEnd - xStart + 80,
                timeline.getModel().getHeight(task.getID()));
          }
        }
      }
    }

    return <div>
      Click task to see colored area in the background (e.g. for agreed times or bankholidays)
      <br/>
      <br/>
      <ReactCanvasTimeline
          resources={testData.resources}
          tasks={testData.tasks}
          taskBackgroundPainter={taskBackgroundPainter}
          paintShadows={true}
          onClick={(evt) => timelineClicked(evt)}
      />
    </div>;
  }
}


