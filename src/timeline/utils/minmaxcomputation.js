import LCal from "../../calendar/lcal";
import LCalHelper from "../../calendar/lcalhelper";

const getMinStartMaxEnd = (model, overheadStartPercentage = 5, overheadEndPercentage = 30) => {
  let start = null;
  let end = null;
  for (let t of model.getAll()) {
    let displS = model.getDisplayedStart(t);
    let displE = model.getDisplayedEnd(t);

    if (displS !== null) {
      if (start === null || start.getJulianMinutes() > displS.getJulianMinutes()) {
        start = displS;
      }
    }
    if (displE !== null) {
      if (end === null || end.getJulianMinutes() < displE.getJulianMinutes()) {
        end = displE;
      }
    }
  }

  if (start && end) {
    let dist = Math.abs(start.getDistanceInMinutes(end));
    if (dist < 60) {
      dist = 60;
    }
    const overheadStart = Math.round(dist * overheadStartPercentage / 100);
    const overheadEnd = Math.round(dist * overheadEndPercentage / 100);

    start = new LCal().setJulianMinutes(start.getJulianMinutes() - overheadStart);

    end = new LCal().setJulianMinutes(end.getJulianMinutes() + overheadEnd);
    //end.initYMDHM(2080, 1 ,1, 0,0);
  } else {
    start = new LCal().setJulianMinutes(LCalHelper.getNowMinutes() - 80000);
    end = new LCal().setJulianMinutes(LCalHelper.getNowMinutes() + 80000);
  }
  return {minStart: start, maxEnd: end};
}

export default getMinStartMaxEnd;