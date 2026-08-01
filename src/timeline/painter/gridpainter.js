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

export const paintMiniGrid = (ctx, start, end, cfg, resourceHeaderHeight, lineY, canvasWidth, height,
    getXPosForTime, initFunc, addMainTimeFunc, addSubTimeFunc, displMainDateFunc, displSubDateFunc, languageCode) => {
  const REF_HEIGHT = 80;
  const scale = height / REF_HEIGHT;

  const LINE_WIDTH = Math.max(2, Math.round(7 * scale));
  const MAIN_CIRCLE_RADIUS = Math.max(3, Math.round(8 * scale));
  const SUB_CIRCLE_RADIUS = Math.max(LINE_WIDTH / 2 + 1, 2);
  const SUB_LABEL_OFFSET = Math.round(SUB_CIRCLE_RADIUS + 3);

  const mainFontSize = Math.max(10, Math.min(28, Math.round(height * 0.25)));
  const subFontSize = Math.max(7, Math.min(14, Math.round(height * 0.15)));
  const mainFont = `bold ${mainFontSize}px sans-serif`;
  const subFontBold = (cfg.timelineSubFont || '').includes('bold') ? 'bold ' : '';
  const subFont = `${subFontBold}${subFontSize}px sans-serif`;

  const MAIN_LABEL_OFFSET = Math.round(LINE_WIDTH / 2 + MAIN_CIRCLE_RADIUS + 3 + mainFontSize * 0.85);

  const starttime = initFunc(start);
  const _dark = _isHeaderDark(cfg.timelineHeaderColor);
  const _mainFontColor = cfg.timelineMainFontColor ?? (_dark ? 'rgba(220,235,250,0.95)' : '#2D3748');
  const _subFontColor = cfg.timelineSubFontColor ?? (_dark ? 'rgba(180,200,225,0.9)' : 'rgba(130,145,165,0.85)');
  const _lineColor = cfg.timelineHeaderMainTickColor ?? (_dark ? 'rgba(255,255,255,0.85)' : 'rgba(100,110,125,0.85)');

  // Thick horizontal line with round caps
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(resourceHeaderHeight, lineY);
  ctx.lineTo(canvasWidth, lineY);
  ctx.strokeStyle = _lineColor;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Sub tick dots (small filled circles on the line) + sub labels above
  ctx.font = subFont;
  let time = starttime.clone();
  let lastX = null;
  let lastSubTime = null;
  let lastSubIndex = 0;
  let lastPaintedSubX = 0;

  do {
    let subTime = time.clone();
    time = addMainTimeFunc(time);
    let subIndex = 0;
    do {
      const x = getXPosForTime(subTime.getJulianMinutes());

      if (x >= resourceHeaderHeight && x <= canvasWidth) {
        ctx.beginPath();
        ctx.arc(x, lineY, SUB_CIRCLE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = _lineColor;
        ctx.fill();
      }

      if (lastX !== null && x > resourceHeaderHeight) {
        const str = displSubDateFunc(lastSubTime, lastSubIndex, languageCode);
        if (str && str.length > 0) {
          const txtWidth = Helper.textWidthFromCache(str, ctx);
          const txtPos = Math.round(lastX + (x - lastX) / 2 - txtWidth / 2);
          if (txtPos > lastPaintedSubX && txtPos >= resourceHeaderHeight) {
            ctx.fillStyle = _subFontColor;
            ctx.fillText(str, txtPos, lineY - SUB_LABEL_OFFSET);
            lastPaintedSubX = txtPos + txtWidth;
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

  // Main ticks (large circles on line) + main labels below
  time = starttime.clone();
  ctx.font = mainFont;
  let lastMainX = getXPosForTime(time.getJulianMinutes());
  if (lastMainX < resourceHeaderHeight) lastMainX = resourceHeaderHeight;
  let lastPaintedMainX = 0;

  do {
    const periodStart = time.clone();
    const str = displMainDateFunc(periodStart, false, languageCode);
    time = addMainTimeFunc(time);
    let x = getXPosForTime(time.getJulianMinutes());
    if (x > canvasWidth) x = canvasWidth;

    if (lastMainX >= resourceHeaderHeight && lastMainX <= canvasWidth) {
      ctx.beginPath();
      ctx.arc(lastMainX, lineY, MAIN_CIRCLE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = _lineColor;
      ctx.fill();
    }

    const txtWidth = Helper.textWidthFromCache(str, ctx);
    const mid = lastMainX + (x - lastMainX) / 2;
    let txtPos = Math.round(mid - txtWidth / 2);
    txtPos = Math.max(resourceHeaderHeight + 2, Math.min(txtPos, canvasWidth - txtWidth - 2));

    if (txtPos > lastPaintedMainX) {
      ctx.fillStyle = _mainFontColor;
      ctx.fillText(str, txtPos, lineY + MAIN_LABEL_OFFSET);
      lastPaintedMainX = txtPos + txtWidth + 4;
    }

    lastMainX = x;
  } while (time.before(end));
};