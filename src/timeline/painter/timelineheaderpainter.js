import paintGrid from "./gridpainter";
import LCal from "../../calendar/lcal";
import LCalFormatter from "../../calendar/lcalformatter";
import LCalHelper from "../../calendar/lcalhelper";

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

const displMainDateHourScale = (time, short) => (
  short ?
    time.getDay() + ". " + LCalFormatter.formatMonthName(time) + " " + LCalFormatter.formatYear(time) + " " + time.getHour() + " Uhr"
  : LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthName(time) + " " + LCalFormatter.formatYear(time) + " " + time.getHour() + " Uhr"
)

const displSubDateHourScale = (time, index) => (
  ""+time.getMinute()
)

const displMainDateDayScale = (time, short) => (
    short ?
   time.getDay() + ". " + LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time)
  : LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time)
)

const displSubDateDayScale = (minutesPerPixel) => (time, index) => {
  if (minutesPerPixel < 4 || ((index) % 5 === 0)) {
    return ""+time.getHour();
  } else {
    return "";
  }
}

const displMainDateMonthScale = (time, short) => (
    short ?
        LCalFormatter.formatMonthName(time) + " " + LCalFormatter.formatYear(time)
   : LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time)
)

const displSubDateMonthScale = (minutesPerPixel) => (time, index) => {
    if (minutesPerPixel < 120 || ((index + 1) % 5 === 0)) {
      return ""+time.getDay();
    } else {
      return "";
    }
}

const displMainDateYearScale = (time, short) => (
   LCalFormatter.formatYear(time)
)

const displSubDateYearScale = (minutesPerPixel) => (time, index) => {
    if (minutesPerPixel > 5000) {
      if (index % 2 === 0) {
        return LCalFormatter.formatMonthNameS(time);
      } else {
        return "";
      }
    } else if (minutesPerPixel > 1700) {
      return LCalFormatter.formatMonthNameS(time);
    } else {
      return LCalFormatter.formatMonthName(time);
    }
}

const displMainCenturyScale = (time, short) => (
   LCalFormatter.formatYear(time)
)

const displSubCenturyScale = (minutesPerPixel, yearStepWidth) => (time, index) => {
  let mDivY = Math.floor(minutesPerPixel / yearStepWidth);
  if (mDivY > 550) {
    if (mDivY > 1500) {
      if (index % 5 === 0) {
        return LCalFormatter.formatYear(time);
      } else {
        return "";
      }
    } else {
      if (index % 2 === 0) {
        return LCalFormatter.formatYear(time);
      } else {
        return "";
      }
    }
  } else {
    return LCalFormatter.formatYear(time);
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
    headerFontSize) => (init, addMain, addSub, displMain, displSub, blockColor) => {
      paintGrid(ctx,
          workStartTime,
          workEndTime,
          cfg,
          resourceHeaderHeight,
          timelineHeaderHeight,
          canvasWidth,
          canvasHeight,
          getXPosForTime,
          headerFontSize,
          init,
          addMain,
          addSub,
          displMain,
          displSub,
          blockColor);
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
    headerFontSize,
    getXPosForTime) => {

  ctx.save();

  //Header für die Timeline zeichnen
  ctx.fillStyle = cfg.timelineHeaderColor;
  ctx.fillRect(resourceHeaderHeight, 0, canvasWidth - resourceHeaderHeight, timelineHeaderHeight);
  ctx.fillRect(0, 0, resourceHeaderHeight, canvasHeight);

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
      headerFontSize);

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