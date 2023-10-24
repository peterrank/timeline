import paintGrid from "./gridpainter";
import LCal from "../../calendar/lcal";
import LCalFormatter from "../../calendar/lcalformatter";
import LCalHelper from "../../calendar/lcalhelper";
import i18n from "../../i18n/i18n";

const initHour = (timeZone) => (time) => (
    new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), time.getHour(), 0, timeZone)
)

const initDay = (timeZone) => (time) => (
    new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), 0, 0, timeZone)
)

const initMonth = (timeZone) => (time) => (
   new LCal().initYMDHM(time.getYear(), time.getMonth(), 1, 0, 0, timeZone)
)

const initYear = (timeZone) => (time) => (
  new LCal().initYMDHM(time.getYear(), 1, 1, 0, 0, timeZone)
)

const initCentury = (timeZone, yearStepWidth) => (time) => {
    var startYear = time.getYear();
    startYear = startYear - (startYear % yearStepWidth) - (startYear <= 0 ? yearStepWidth : 0);
    if (startYear === 0) {
      startYear = 1;
    }
    return new LCal().initYMDHM(startYear, 1, 1, 0, 0, timeZone)
}

const addHour = (time)  => (
  time.addHour(1)
)

const addTenMinutes = (time) => (
    time.addMinutes(10)
)

const addDay = (time)  => (
    time.addDay(1)
)

const addMonth = (time)  => (
    time.addMonth(1)
)

const addYear = (time)  => (
    time.addYear(1)
)

const addCenturyMainTime = (yearStepWidth) => (time) => {
    if (time.getYear() === 1) {
      time.addYear(yearStepWidth - 1);
    } else {
      time.addYear(yearStepWidth);
    }
    return time;
}

const addCenturySubTime = (yearStepWidth) => (time) => {
    if (time.getYear() === 1) {
      time.addYear(yearStepWidth / 10 - 1 === 0 ? 1 : yearStepWidth / 10 - 1);
    } else {
      time.addYear(yearStepWidth / 10);
    }
    return time;
}

const displMainDateHourScale = (time, short, languageCode) => (
  short ?
    LCalFormatter.formatDate(time, true, languageCode) + " " + time.getHour() + " " +i18n("oClock", languageCode)
  : LCalFormatter.formatDayName(time, languageCode) + ", " +  LCalFormatter.formatDate(time, false, languageCode) + " " + time.getHour() + " " +i18n("oClock", languageCode)
)

const displSubDateHourScale = (time, index) => (
  ""+time.getMinute()
)

const displMainDateDayScale = (time, short, languageCode) => (
    short ?
        LCalFormatter.formatDate(time, true, languageCode)
  : LCalFormatter.formatDayName(time, languageCode) + ", " + LCalFormatter.formatDate(time, false, languageCode)
)

const displSubDateDayScale = (minutesPerPixel) => (time, index) => {
  if (minutesPerPixel < 4 || ((index) % 5 === 0)) {
    return ""+time.getHour();
  } else {
    return "";
  }
}

const displMainDateMonthScale = (time, short, languageCode) => (
    short ?
        LCalFormatter.formatMonthName(time, languageCode) + " " + LCalFormatter.formatYear(time, languageCode)
   : LCalFormatter.formatMonthNameL(time, languageCode) + " " + LCalFormatter.formatYear(time, languageCode)
)

const displSubDateMonthScale = (minutesPerPixel) => (time, index) => {
    if (minutesPerPixel < 120 || ((index + 1) % 5 === 0)) {
      return ""+time.getDay();
    } else {
      return "";
    }
}

const displMainDateYearScale = (time, short, languageCode = "") => (
   LCalFormatter.formatYear(time, languageCode)
)

const displSubDateYearScale = (minutesPerPixel) => (time, index, languageCode) => {
    if (minutesPerPixel > 5000) {
      if (index % 2 === 0) {
        return LCalFormatter.formatMonthNameS(time, languageCode);
      } else {
        return "";
      }
    } else if (minutesPerPixel > 1700) {
      return LCalFormatter.formatMonthNameS(time, languageCode);
    } else {
      return LCalFormatter.formatMonthName(time, languageCode);
    }
}

const displMainCenturyScale = (time, short, languageCode) => (
   LCalFormatter.formatYear(time, languageCode)
)

const displSubCenturyScale = (minutesPerPixel, yearStepWidth) => (time, index, languageCode) => {
  let mDivY = Math.floor(minutesPerPixel / yearStepWidth);
  if (mDivY > 550) {
    if (mDivY > 1500) {
      if (index % 5 === 0) {
        return LCalFormatter.formatYear(time, languageCode);
      } else {
        return "";
      }
    } else {
      if (index % 2 === 0) {
        return LCalFormatter.formatYear(time, languageCode);
      } else {
        return "";
      }
    }
  } else {
    return LCalFormatter.formatYear(time, languageCode);
  }
}

const blockColorHourScale = (cfg) => (time, isMainScale) => {
    if (isMainScale) {
      let dayInWeek = LCalHelper.getDayInWeek(time);
      if (dayInWeek === 5) {
        return cfg.saturdayColor;
      } else if (dayInWeek === 6) {
        return cfg.sundayColor;
      }
    }
    return undefined;
}

const blockColorDayScale = (cfg) => (time, isMainScale) => {
  if (!isMainScale) {
    let dayInWeek = LCalHelper.getDayInWeek(time);
    if (dayInWeek === 5) {
      return cfg.saturdayColor;
    } else if (dayInWeek === 6) {
      return cfg.sundayColor;
    }
  }
  return undefined;
}

const blockColorMonthScale = (cfg) => (time, isMainScale) => {
  if (!isMainScale) {
    let dayInWeek = LCalHelper.getDayInWeek(time);
    if (dayInWeek === 5) {
      return cfg.saturdayColor;
    } else if (dayInWeek === 6) {
      return cfg.sundayColor;
    }
  }
  return undefined;
}

const paintGridBuilder = (ctx,
    workStartTime,
    workEndTime,
    cfg,
    resourceHeaderHeight,
    timelineHeaderHeight,
    canvasWidth,
    canvasHeight,
    getXPosForTime,
    languageCode) => (init, addMain, addSub, displMain, displSub, blockColor) => {
      paintGrid(ctx,
          workStartTime,
          workEndTime,
          cfg,
          resourceHeaderHeight,
          timelineHeaderHeight,
          canvasWidth,
          canvasHeight,
          getXPosForTime,
          init,
          addMain,
          addSub,
          displMain,
          displSub,
          blockColor,
          languageCode);
}

const paintTimelineHeader = (ctx,
    cfg,
    timeZone,
    minutesPerPixel,
    workStartTime, 
    workEndTime,
    resourceHeaderHeight,
    timelineHeaderHeight,
    canvasWidth,
    canvasHeight,
    getXPosForTime,
    languageCode) => {

  ctx.save();

  //Header für die Timeline zeichnen
  ctx.fillStyle = cfg.timelineHeaderColor;
  ctx.fillRect(resourceHeaderHeight, 0, canvasWidth - resourceHeaderHeight, timelineHeaderHeight);
  ctx.fillRect(0, 0, resourceHeaderHeight, canvasHeight);

  ctx.beginPath();
  ctx.moveTo(0, timelineHeaderHeight);
  ctx.lineTo(canvasWidth, timelineHeaderHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(resourceHeaderHeight, 0, canvasWidth - resourceHeaderHeight, canvasHeight);
  ctx.clip();



  const paintGrid = paintGridBuilder(ctx,
      workStartTime,
      workEndTime,
      cfg,
      resourceHeaderHeight,
      timelineHeaderHeight,
      canvasWidth,
      canvasHeight,
      getXPosForTime,
      languageCode);

  if (minutesPerPixel < 0.2) {
    //Stundenskala
    paintGrid(
        initHour(timeZone),
        addHour,
        addTenMinutes,
        displMainDateHourScale,
        displSubDateHourScale,
        blockColorHourScale(cfg));
  } else if (minutesPerPixel < 10) {
    //Tagesskala
    paintGrid(
        initDay(timeZone),
        addDay,
        addHour,
        displMainDateDayScale,
        displSubDateDayScale(minutesPerPixel),
        blockColorDayScale(cfg)
        );
  } else if (minutesPerPixel < 300) {
    //Monatsskala
    paintGrid(
        initMonth(timeZone),
        addMonth,
        addDay,
        displMainDateMonthScale,
        displSubDateMonthScale(minutesPerPixel),
        blockColorMonthScale(cfg));
  } else if (minutesPerPixel < 10000) {
    //Jahresskala
    paintGrid(
        initYear(timeZone),
        addYear,
        addMonth,
        displMainDateYearScale,
        displSubDateYearScale(minutesPerPixel));
  } else {
    const yearStepWidth = Math.pow(10, (Math.floor(minutesPerPixel / 400) + "").length - 1);
    paintGrid(
        initCentury(timeZone, yearStepWidth),
        addCenturyMainTime(yearStepWidth),
        addCenturySubTime(yearStepWidth),
        displMainCenturyScale,
        displSubCenturyScale(minutesPerPixel, yearStepWidth));
  }

  ctx.restore();
}

export default paintTimelineHeader;