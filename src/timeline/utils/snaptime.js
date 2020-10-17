import LCal from "../../calendar/lcal";
import LCalHelper from "../../calendar/lcalhelper";

const getNextSnapTime = (x, julMin, model, timeForXPosProvider) => {
    //Suche Ereignisse, die den Start oder das Ende nicht weiter als x Minuten entfernt haben. Schnappe zum nächstliegenden ein
    let rangeStartX = x - 20;
    let rangeStartTime = timeForXPosProvider.getTimeForXPos(rangeStartX);
    let rangeEndX = x + 20;
    let rangeEndTime = timeForXPosProvider.getTimeForXPos(rangeEndX);
    let foundLCal = null;

    let check = (lcal) => {
        let foundLCal = null;
        if (lcal.getJulianMinutes() >= rangeStartTime && lcal.getJulianMinutes() <= rangeEndTime) {
            if (!foundLCal || Math.abs(lcal.getJulianMinutes() - julMin) < Math.abs(foundLCal.getJulianMinutes() - julMin)) {
                foundLCal = lcal;
            }
        }
        return foundLCal;
    }

    for (let task of model.getAll()) {
        foundLCal = check(model.getDisplayedStart(task));
        if (!foundLCal) {
            foundLCal = check(model.getDisplayedEnd(task));
        }
        if (!foundLCal) {
            foundLCal = check(model.getDisplayedEnd(task));
        }
        if (!foundLCal && task.innerEvents) {
            for (let interval of task.innerEvents) {
                if (interval.getStart()) {
                    foundLCal = check(interval.getStart());
                    if (foundLCal) {
                        break;
                    }
                }
                if (!foundLCal && interval.getEnd()) {
                    foundLCal = check(interval.getEnd());
                    if (foundLCal) {
                        break;
                    }
                }
            }

        }
        if (foundLCal) {
            break;
        }
    }

    //Auch noch jetzt überprüfen
    if (!foundLCal) {
        foundLCal = check(new LCal().setJulianMinutes(LCalHelper.getNowMinutes()));
    }

    return foundLCal ? foundLCal.clone().setPrecision(13) : null;
}

export default getNextSnapTime;