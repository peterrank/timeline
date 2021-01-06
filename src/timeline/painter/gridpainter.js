import Helper from "../../helper/helper";

const MIN_MAIN_PADDING = 10;

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

  /////////////////////////
  //Das Untergrid zeichnen
  /////////////////////////

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

  /////////////////////////
  //Das Hauptgrid zeichnen
  /////////////////////////

  time = starttime.clone();
  ctx.beginPath();
  do {
    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());

    ctx.moveTo(x, timelineHeaderHeight);
    ctx.lineTo(x, canvasHeight);
  } while (time.before(end));

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(200,200,200,0.8)";
  ctx.stroke();




  /////////////////////////////////
  //Die Hauptbeschriftung zeichnen
  /////////////////////////////////
  ctx.fillStyle = cfg.timelineMainFontColor;
  time = starttime.clone();
  lastX = getXPosForTime(time.getJulianMinutes());
  if (lastX < resourceHeaderHeight) {
    lastX = resourceHeaderHeight;
  }

  ctx.beginPath();
  do {
    ctx.font = cfg.timelineMainFont;

    let str = displMainDateFunc(time);

    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());
    if (x > canvasWidth) {
      x = canvasWidth;
    }

    //ctx.fillStyle = "#000000";
    var mid = lastX + (x - lastX) / 2;

    ctx.moveTo(lastX, 0);
    ctx.lineTo(lastX, timelineHeaderHeight);

    let txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);

    let txtPos = Math.round(mid - txtWidth / 2);

    if (txtPos < lastX + MIN_MAIN_PADDING && x === canvasWidth) {
      txtPos = lastX + MIN_MAIN_PADDING;
    } else if (txtPos + txtWidth > x - MIN_MAIN_PADDING && lastX === resourceHeaderHeight) {
      txtPos = x - txtWidth - MIN_MAIN_PADDING;
    } else if(txtWidth + 10> x - lastX) {
      //suche einen kürzeren Text
      str = displMainDateFunc(time, true);
      txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);
      txtPos = Math.round(mid - txtWidth / 2);
      //kürzerer Text immer noch zu lang?
      if(txtWidth> x - lastX) {
        str = (str.length > 8) ? str.substr(0, 5)+"..." : '-';
        txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);
        txtPos = Math.round(mid - txtWidth / 2);
        if(txtWidth> x - lastX) {
          str = '-';
          txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);
          txtPos = Math.round(mid - txtWidth / 2);
        }
      }
    }

    ctx.fillText(str, txtPos, timelineHeaderHeight - 30);

    lastX = x;
  } while (time.before(end));

  ctx.strokeStyle = "rgba(50,50,50,0.5)";
  ctx.stroke();

  /*ctx.moveTo(resourceHeaderHeight,timelineHeaderHeight);
  ctx.lineTo(canvasWidth, timelineHeaderHeight);
  ctx.strokeStyle = "#888";
  ctx.stroke();*/

  ///////////////////////////////////////////
  //Lücke für die Unterbeschriftung zeichnen
  ///////////////////////////////////////////

  ctx.fillStyle = cfg.timelineHeaderColor;
  ctx.fillRect(0, 30, canvasWidth, 20);
  ctx.fillStyle = cfg.timelineSubFontColor;

  ////////////////////////////////
  //Die Unterbeschriftung zeichnen
  ////////////////////////////////

  ctx.font = cfg.timelineSubFont;
  time = starttime.clone();
  lastX = null;
  let lastSubTime;
  let lastSubIndex = 0;
  let lastPaintedX = 0;
  do {
    let subTime = time.clone();
    time = addMainTimeFunc(time);
    let subIndex = 0;
    do {
      let x = getXPosForTime(subTime.getJulianMinutes());
      if (lastX) {
        let str = displSubDateFunc(lastSubTime, lastSubIndex);
        if(str.length > 0) {
          let txtWidth = Helper.textWidthFromCache(str, headerFontSize, ctx);//ctx.measureText(str).width;

          let txtPos = Math.round(lastX + (x - lastX) / 2 - txtWidth / 2);

          if (txtPos > lastPaintedX) {
            ctx.fillText(str, txtPos, timelineHeaderHeight - 10);
            lastPaintedX = txtPos + txtWidth;
          }
        }
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