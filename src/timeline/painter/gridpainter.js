import Helper from "../../helper/helper";

const paintGrid = (ctx, start, end,
    cfg,
    resourceHeaderHeight,
    timelineHeaderHeight,
    canvasWidth,
    canvasHeight,
    getXPosForTime,
    headerFontSize,
    initFunc, addMainTimeFunc, addSubTimeFunc, displMainDateFunc, displSubDateFunc, getBlockColorFunc) => {
  let starttime = initFunc(start);

  ctx.font = cfg.timelineMainFont;

  //Das Untergrid zeichnen
  let time = starttime.clone();

  ctx.beginPath();
  let lastX = getXPosForTime(time.getJulianMinutes());
  if (lastX < resourceHeaderHeight) {
    lastX = resourceHeaderHeight;
  }
  do {
    let subTime = time.clone();
    //Falls es sich um ein Wochenendtag handelt, dann entsprechend farblich markieren
    let blockColor = getBlockColorFunc && getBlockColorFunc(time, true);

    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());
    if (x > canvasWidth) {
      x = canvasWidth;
    }

    if (blockColor) {
      ctx.fillStyle = blockColor;
      ctx.fillRect(lastX, timelineHeaderHeight, x - lastX, canvasHeight - timelineHeaderHeight);
    }

    let lastSubX = lastX;
    do {
      blockColor = getBlockColorFunc && getBlockColorFunc(subTime, false);
      subTime = addSubTimeFunc(subTime);
      let subX = getXPosForTime(subTime.getJulianMinutes());

      if (blockColor) {
        ctx.fillStyle = blockColor;
        ctx.fillRect(lastSubX, timelineHeaderHeight, subX - lastSubX, canvasHeight - timelineHeaderHeight);
      }

      if (subX > resourceHeaderHeight) {
        ctx.moveTo(subX, timelineHeaderHeight);
        ctx.lineTo(subX, canvasHeight);
      }

      lastSubX = subX;
    } while (subTime.before(time));
    lastX = x;
  } while (time.before(end));

  ctx.strokeStyle = "rgba(200,200,200,0.5)";
  ctx.stroke();

  //Das Hauptgrid zeichnen
  time = starttime.clone();
  ctx.beginPath();
  do {
    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());

    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);

  } while (time.before(end));

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.stroke();

  //Lücke für die Unterbeschriftung zeichnen
  ctx.fillStyle = cfg.timelineHeaderColor;
  ctx.fillRect(0, 25, canvasWidth, timelineHeaderHeight - 30);

  ctx.fillStyle = "#000000";

  //Die Hauptbeschriftung zeichnen
  time = starttime.clone();
  lastX = getXPosForTime(time.getJulianMinutes());
  if (lastX < resourceHeaderHeight) {
    lastX = resourceHeaderHeight;
  }

  do {
    ctx.font = cfg.timelineMainFont;

    let str = displMainDateFunc(time);

    time = addMainTimeFunc(time);
    var x = getXPosForTime(time.getJulianMinutes());
    if (x > canvasWidth) {
      x = canvasWidth;
    }

    //ctx.fillStyle = "#000000";
    var mid = lastX + (x - lastX) / 2;

    /*let txtWidth = Helper.textWidthFromCache(str, this.getTimelineBarHeaderFontSize(task.id), ctx);//ctx.measureText(str).width;
    if (txtWidth > x - lastX) {
        ctx.font = cfg.timelineMainFontMini;
    }*/
    let txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);//ctx.measureText(str).width;

    var txtPos = Math.round(mid - txtWidth / 2);

    if (txtPos < lastX + 2 && x === ctx.canvas.width) {
      txtPos = lastX + 2;
    } else if (txtPos + txtWidth > x - 2 && lastX === resourceHeaderHeight) {
      txtPos = x - txtWidth - 2;
    }
    ctx.fillText(str, txtPos, timelineHeaderHeight - 30);

    lastX = x;
  } while (time.before(end));

  //Die Unterbeschriftung zeichnen
  ctx.font = cfg.timelineSubFont;
  time = starttime.clone();
  lastX = null;
  let lastSubTime;
  let lastSubIndex = 0;
  do {
    let subTime = time.clone();
    time = addMainTimeFunc(time);
    let subIndex = 0;
    do {
      let x = getXPosForTime(subTime.getJulianMinutes());
      if (lastX) {
        let str = displSubDateFunc(lastSubTime, lastSubIndex);
        let txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);//ctx.measureText(str).width;
        //var txtPos = Math.round(x - txtWidth / 2);
        let txtPos = Math.round(lastX + (x - lastX) / 2 - txtWidth / 2);

        ctx.fillText(str, txtPos, timelineHeaderHeight - 10);
      }
      lastSubTime = subTime.clone();
      lastX = x;

      subTime = addSubTimeFunc(subTime);
      lastSubIndex = subIndex;
      subIndex++;
    } while (subTime.before(time));

  } while (time.before(end));
}

export default paintGrid;