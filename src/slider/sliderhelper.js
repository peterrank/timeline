/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2017
 */

import SliderValue from './slidervalue';
import LCal from '../calendar/lcal.js';
import LCalHelper from '../calendar/lcalhelper.js';

const sliderValues = [
    new SliderValue(26280000000000000, "50 Mrd"),
    new SliderValue(5256000000000000, "10 Mrd"),
    new SliderValue(2628000000000000, "5 Mrd"),
    new SliderValue(525600000000000, "1 Mrd"),
    new SliderValue(262800000000000, "500 Mio"),
    new SliderValue(52560000000000, "100 Mio"),
    new SliderValue(26280000000000, "50 Mio"),
    new SliderValue(5256000000000, "10 Mio"),
    new SliderValue(2628000000000, "5 Mio"),
    new SliderValue(525600000000, "1 Mio"),
    new SliderValue(262800000000, "500 Tsd"),
    new SliderValue(52560000000, "100 Tsd"),
    new SliderValue(26280000000, "50 Tsd"),
    new SliderValue(5256000000, "10 Tsd"),
    new SliderValue(2628000000, "5 Tsd"),
    new SliderValue(525600000, "1 Tsd"),
    new SliderValue(262800000, "500 J"),
    new SliderValue(52560000, "100 J"),
    new SliderValue(26280000, "50 J"),
    new SliderValue(5256000, "10 J"),
    new SliderValue(2628000, "5 J"),
    new SliderValue(525600, "1 J"),
    new SliderValue(44640, "31 T"),
    new SliderValue(10080, "7 T"),
    new SliderValue(1440, "1 T"),
    new SliderValue(60, "1 h"),
]

class SliderHelper {
    /**
     * Liefert die passenden Sliderwerte
     * @param intervals
     */
    static getSliderValues(intervals) {
        let minStart = null;
        let maxEnd = null;
        let minimumIntervalDuration = null;
        let now = new LCal().setJulianMinutes(LCalHelper.getNowMinutes());

        for (let i of intervals) {
            let start = i.getStart() ? i.getStart() : now;
            let end = i.getEnd() ? i.getEnd() : now;

            if (minStart === null || start.before(minStart)) {
                minStart = start;
            }
            if (maxEnd === null || end.after(maxEnd)) {
                maxEnd = end;
            }
            let duration = start.getDistanceInMinutes(end);
            if (minimumIntervalDuration === null || (duration > 0 && duration < minimumIntervalDuration)) {
                minimumIntervalDuration = duration;
            }
        }

        if (minStart && maxEnd && minimumIntervalDuration) {
            let maximumIntervalduration = minStart.getDistanceInMinutes(maxEnd);
            let vals = [];
            //Bestimme die Dauer des größten und des kleinsten Intervalls
            //Nimm vom kleinen den nächstkleineren und vom größten das nächstgrößern Slidervalue
            let startIndex = null;
            let endIndex = null;
            for (let i = 0; i < sliderValues.length; i++) {
                let sv = sliderValues[i];
                if (sv.value >= maximumIntervalduration) {
                    startIndex = i;
                }

                if (sv.value >= minimumIntervalDuration) {
                    endIndex = i;
                }
            }

            if (startIndex === null) {
                startIndex = 0;
            }

            if (endIndex === null) {
                endIndex = sliderValues.length;
            }


            if (endIndex < sliderValues.length - 1) {
                endIndex += 1;
            }

            for (let n = startIndex; n <= endIndex; n++) {
                vals.push(sliderValues[n]);
            }

            if(vals.length>2) {
                return vals;
            } else {
                return sliderValues;
            }
        } else {
            return sliderValues;
        }
    }
}

export default SliderHelper
