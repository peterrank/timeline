import Resource from "../../src/data/resource";
import LCal from "../../src/calendar/lcal";
import Task from "../../src/data/task";
import Helper from "../../src/helper/helper";

var seed = 1;
const random = () => {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const buildTestData = (withIcons) => {
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
    if(withIcons) {
      res.imageurl = "./test.jpg";
    }
    resources.push(res);
  }

  let tasks = [];
  for(let n=0; n<1000; n++) {
    let now = new LCal().initNow();

    let start = now.clone().addDay(Math.round(n/10));
    let end = now.clone().addDay(Math.round(n/10 + 1 + random()*20));

    let resID = Math.round(random()*100);
    let task = new Task(n, start, end, resID, "Task "+n, "Ein Vorgang", null);
    if(resID === 1) {
      task.getDisplayData().setBarGroup("Gruppe");
    }
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

    if(withIcons) {
      task.imageurl = "./test.jpg";
    }
    tasks.push(task);
  }

  return {
    resources,
    tasks
  }
}

export default buildTestData;