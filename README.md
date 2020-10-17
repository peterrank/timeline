# react-canvas-timeline
a timeline based on canvas and react


![histomania](./geschichte.gif)

## Install
npm  
```npm install --save react-canvas-timeline```

yarn  
```yarn add react-canvas-timeline```

## Github

https://github.com/peterrank/timeline

## Examples

run storybook to see some examples.
  
```yarn storybook```

### see usages in projects

https://histomania.com/  
https://www.pixipoint.com/  

### Quick run

build some test data (testdatabuilder.js)

```
import {Resource, Task, LCal, Helper} from 'react-canvas-timeline';

var seed = 1;
const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const buildTestData = () => {
  seed = 1;
  const COLORS = ['FF005D', '0085B6', '0BB4C1', '00D49D', 'FEDF03', '233D4D', 'FE7F2D', 'FCCA46', 'A1C181', '579C87']
  let color = -1
  const nextColor = () => {
    color = (color + 1) % COLORS.length
    return COLORS[color]
  }

  let resources = [];
  for(let n=0; n<100; n++) {
    let res = new Resource(n, "Res "+String(n).padStart(3, '0'), "Techniker", false);
    resources.push(res);
  }

  let tasks = [];
  for(let n=0; n<1000; n++) {
    let now = new LCal().initNow();

    let start = now.clone().addDay(Math.round(n/10));
    let end = now.clone().addDay(Math.round(n/10) + 1 + random()*20);

    let task = new Task(n, start, end, Math.round(random()*100), "Task "+n, "Ein Vorgang", null);
    let barColor = "#"+nextColor();
    task.getDisplayData().setColor(barColor);
    task.getDisplayData().setLabelColor(Helper.isDarkBackground(barColor) ? "#FFF" : "#000"); //Default Label color is white

    let innerEvents = [];
    let innerStart = start.clone();
    let innerEnd = start.clone().addHour(5);
    let innerEvent = new Task(0, innerStart, innerEnd, 0, "", "", null);
    innerEvents.push(innerEvent);

    innerEnd = end.clone();
    innerStart = end.clone().addHour(-15);
    innerEvent = new Task(0, innerStart, innerEnd, 0, "", "", null);

    innerEvents.push(innerEvent);

    task.innerEvents = innerEvents;

    tasks.push(task);
  }
  return {
    resources,
    tasks
  }
}
```

and use it

```
import {ReactCanvasTimeline} from 'react-canvas-timeline';
import buildTestData from './testdatabuilder';

...

let testData = buildTestData();

...

<ReactCanvasTimeline
  resources={testData.resources}
  tasks={testData.tasks}
  width={1000}
  height={500}
/>
```