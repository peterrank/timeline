import paintGrid from "./gridpainter";
import LCal from "../../calendar/lcal";
import LCalFormatter from "../../calendar/lcalformatter";
import LCalHelper from "../../calendar/lcalhelper";

const paintTimelineHeader = (ctx,
    cfg,
    timeZone,
    minutesPerPixel,
    workStartTime, 
    workEndTime,
    resourceHeaderHeight,
    timelineHeaderHeight,
    virtualCanvasWidth,
    virtualCanvasHeight,
    headerFontSize,
    getXPosForTime) => {
  ctx.save();

  //Header für die Timeline zeichnen
  ctx.fillStyle = cfg.timelineHeaderColor;
  ctx.fillRect(resourceHeaderHeight, 0, virtualCanvasWidth - resourceHeaderHeight, timelineHeaderHeight);
  ctx.fillRect(0, 0, resourceHeaderHeight, virtualCanvasHeight);

  ctx.beginPath();
  ctx.rect(resourceHeaderHeight, 0, virtualCanvasWidth - resourceHeaderHeight, virtualCanvasHeight);
  ctx.clip();

  //Bestimmen der Skala, die gezeichnet werden soll
  //var minutesPerPixel = this.getMinutesPerPixel();

  if (minutesPerPixel < 0.2) {
    //Stundenskala
    paintGrid(ctx, workStartTime, workEndTime, cfg,
        resourceHeaderHeight,
        timelineHeaderHeight,
        virtualCanvasWidth,
        virtualCanvasHeight,
        getXPosForTime,
        headerFontSize,function (time) {
          return new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), time.getHour(), 0, timeZone)
        }, function (time) {
          return time.addHour(1)
        }, function (time) {
          return time.addMinutes(10)
        }, function (time) {
          //return LCalFormatter.formatMonthNameL(time) + " " + time.getYear();
          return LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthName(time) + " " + LCalFormatter.formatYear(time) + " " + time.getHour() + " Uhr";
        }, function (time, index) {
          return time.getMinute();
        }, function (time, isMainScale) {
          if (isMainScale) {
            let dayInWeek = LCalHelper.getDayInWeek(time);
            if (dayInWeek === 5) {
              return cfg.saturdayColor;
            } else if (dayInWeek === 6) {
              return cfg.sundayColor;
            }
          }
          return undefined;
        });
  } else if (minutesPerPixel < 10) {
    //Tagesskala
    paintGrid(ctx, workStartTime, workEndTime, cfg,
        resourceHeaderHeight,
        timelineHeaderHeight,
        virtualCanvasWidth,
        virtualCanvasHeight,
        getXPosForTime,
        headerFontSize,function (time) {
          return new LCal().initYMDHM(time.getYear(), time.getMonth(), time.getDay(), 0, 0, timeZone)
        }, function (time) {
          return time.addDay(1)
        }, function (time) {
          return time.addHour(1)
        }, function (time) {
          return LCalFormatter.formatDayName(time) + ", " + time.getDay() + ". " + LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time);
          //return time.getDay();
        }, function (time, index) {
          if (minutesPerPixel < 4 || ((index) % 5 === 0)) {
            return time.getHour();
          } else {
            return "";
          }
        }, function (time, isMainScale) {
          if (!isMainScale) {
            let dayInWeek = LCalHelper.getDayInWeek(time);
            if (dayInWeek === 5) {
              return cfg.saturdayColor;
            } else if (dayInWeek === 6) {
              return cfg.sundayColor;
            }
          }
          return undefined;
        });
  } else if (minutesPerPixel < 300) {
    //Monatsskala
    paintGrid(ctx, workStartTime, workEndTime, cfg,
        resourceHeaderHeight,
        timelineHeaderHeight,
        virtualCanvasWidth,
        virtualCanvasHeight,
        getXPosForTime,
        headerFontSize,function (time) {
          return new LCal().initYMDHM(time.getYear(), time.getMonth(), 1, 0, 0, timeZone)
        }, function (time) {
          return time.addMonth(1);
        }, function (time) {
          return time.addDay(1)
        }, function (time) {
          return LCalFormatter.formatMonthNameL(time) + " " + LCalFormatter.formatYear(time);
        }, function (time, index) {
          if (minutesPerPixel < 120 || ((index + 1) % 5 === 0)) {
            return time.getDay();
          } else {
            return "";
          }
        }, function (time, isMainScale) {
          if (!isMainScale) {
            let dayInWeek = LCalHelper.getDayInWeek(time);
            if (dayInWeek === 5) {
              return cfg.saturdayColor;
            } else if (dayInWeek === 6) {
              return cfg.sundayColor;
            }
          }
          return undefined;
        });
  } else if (minutesPerPixel < 10000) {
    //Jahresskala
    paintGrid(ctx, workStartTime, workEndTime, cfg,
        resourceHeaderHeight,
        timelineHeaderHeight,
        virtualCanvasWidth,
        virtualCanvasHeight,
        getXPosForTime,
        headerFontSize,function (time) {
          return new LCal().initYMDHM(time.getYear(), 1, 1, 0, 0, timeZone)
        }, function (time) {
          return time.addYear(1)
        }, function (time) {
          return time.addMonth(1)
        }, function (time) {
          return LCalFormatter.formatYear(time);
        }, function (time, index) {
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
        }, function (time) {
          return undefined;
        });
  } else {
    var yearStepWidth = Math.pow(10, (Math.floor(minutesPerPixel / 400) + "").length - 1);
    paintGrid(ctx, workStartTime, workEndTime, cfg,
        resourceHeaderHeight,
        timelineHeaderHeight,
        virtualCanvasWidth,
        virtualCanvasHeight,
        getXPosForTime,
        headerFontSize,function (time) {
          var startYear = time.getYear();
          startYear = startYear - (startYear % yearStepWidth) - (startYear <= 0 ? yearStepWidth : 0);
          if (startYear === 0) {
            startYear = 1;
          }
          return new LCal().initYMDHM(startYear, 1, 1, 0, 0, timeZone)
        }, function (time) {
          if (time.getYear() === 1) {
            time.addYear(yearStepWidth - 1);
          } else {
            time.addYear(yearStepWidth);
          }
          return time;
        }, function (time) {
          if (time.getYear() === 1) {
            time.addYear(yearStepWidth / 10 - 1 === 0 ? 1 : yearStepWidth / 10 - 1);
          } else {
            time.addYear(yearStepWidth / 10);
          }
          return time;
        }, function (time) {
          return LCalFormatter.formatYear(time);
        }, function (time, index) {
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
        }, function (time) {
          return undefined;
        });
  }

  ctx.restore();
}

export default paintTimelineHeader;