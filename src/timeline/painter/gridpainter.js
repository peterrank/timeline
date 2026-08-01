import Helper from "../../helper/helper";

const MIN_MAIN_PADDING = 10;

const _parseRgb = (colorStr) => {
  if (!colorStr) return null;
  const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr);
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  const rgb = colorStr.match(/[\d.]+/g);
  if (rgb) return [+rgb[0], +rgb[1], +rgb[2]];
  return null;
};

const _isHeaderDark = (colorStr) => {
  const rgb = _parseRgb(colorStr);
  if (!rgb) return false;
  const [r, g, b] = rgb.map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
};

const paintGrid = (ctx, start, end,
    cfg,
    resourceHeaderHeight,
    timelineHeaderHeight,
    canvasWidth,
    canvasHeight,
    getXPosForTime,
    initFunc, addMainTimeFunc, addSubTimeFunc, displMainDateFunc, displSubDateFunc, getBlockColorFunc, languageCode) => {
  let starttime = initFunc(start);

  const _dark = _isHeaderDark(cfg.timelineHeaderColor);
  const _mainFontColor = cfg.timelineMainFontColor ?? (_dark ? 'rgba(220,235,250,0.95)' : '#2D3748');
  const _subFontColor = cfg.timelineSubFontColor ?? (_dark ? 'rgba(120,170,230,0.75)' : 'rgba(130,145,165,0.85)');
  const _mainTickColor = cfg.timelineHeaderMainTickColor ?? (_dark ? 'rgba(255,255,255,0.22)' : 'rgba(74,85,104,0.3)');

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

  ctx.strokeStyle = cfg.timelineSubTickColor;
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

  ctx.lineWidth = cfg.timelineMainTickWidth ?? 1;
  ctx.strokeStyle = cfg.timelineMainTickColor;
  ctx.stroke();




  /////////////////////////////////
  //Die Hauptbeschriftung zeichnen
  /////////////////////////////////
  ctx.fillStyle = _mainFontColor;
  time = starttime.clone();
  lastX = getXPosForTime(time.getJulianMinutes());
  if (lastX < resourceHeaderHeight) {
    lastX = resourceHeaderHeight;
  }

  ctx.beginPath();
  do {
    ctx.font = cfg.timelineMainFont;

    let str = displMainDateFunc(time, false, languageCode);

    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());
    if (x > canvasWidth) {
      x = canvasWidth;
    }

    //ctx.fillStyle = "#000000";
    var mid = lastX + (x - lastX) / 2;

    ctx.moveTo(lastX, 0);
    ctx.lineTo(lastX, timelineHeaderHeight);

    let txtWidth = Helper.textWidthFromCache(str, ctx);

    let txtPos = Math.round(mid - txtWidth / 2);

    if (txtPos < lastX + MIN_MAIN_PADDING && x === canvasWidth) {
      txtPos = lastX + MIN_MAIN_PADDING;
    } else if (txtPos + txtWidth > x - MIN_MAIN_PADDING && lastX === resourceHeaderHeight) {
      txtPos = x - txtWidth - MIN_MAIN_PADDING;
    } else if(txtWidth + 10> x - lastX) {
      //suche einen kürzeren Text
      str = displMainDateFunc(time, true, languageCode);
      txtWidth = Helper.textWidthFromCache(str, ctx);
      txtPos = Math.round(mid - txtWidth / 2);
      //kürzerer Text immer noch zu lang?
      if(txtWidth> x - lastX) {
        str = (str.length > 8) ? str.substr(0, 5)+"..." : '-';
        txtWidth = Helper.textWidthFromCache(str, ctx);
        txtPos = Math.round(mid - txtWidth / 2);
        if(txtWidth> x - lastX) {
          str = '-';
          txtWidth = Helper.textWidthFromCache(str, ctx);
          txtPos = Math.round(mid - txtWidth / 2);
        }
      }
    }

    ctx.fillText(str, txtPos, timelineHeaderHeight - 30);

    lastX = x;
  } while (time.before(end));

  ctx.strokeStyle = _mainTickColor;
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
  ctx.fillStyle = _subFontColor;

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
        let str = displSubDateFunc(lastSubTime, lastSubIndex, languageCode);
        if(str.length > 0) {
          let txtWidth = Helper.textWidthFromCache(str, ctx);//ctx.measureText(str).width;

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