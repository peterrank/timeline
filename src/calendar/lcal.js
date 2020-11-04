import LCalHelper from './lcalhelper.js';

/**
 * Ein Kalender für minutengenaue Zeiten vom Urknall bis zum Untergang der Sonne und noch weiter
 * Rechnet intern mit Julianischen Tagen (nicht zu verwechseln mit dem Julianischen Kalender!)
 * Vor dem 15.10.1582 wird mit dem Julianischen Kalender gerechnet, ab dann mit dem Gregorianischen Kalender
 *
 * Mögliche Werte für Precision sind:

 0: 1 Gigayear
 1: 100 Megayears
 2: 10 Megayears
 3: Megayear
 4: 100 Kiloyears
 5: 10 Kiloyears
 6: Kiloyear
 7: 100 years
 8: 10 years
 9: years
 10: months
 11: days
 12: hours
 13: minutes
 14: seconds (unused)
 Note that the precision should be read as an indicator of the significant parts of the date string, it does not directly specify an interval.
 That is, 1988-07-13T00:00:00 with precision 8 (decade) will be interpreted as 198?-??-?? and rendered as "1980s".
 1981-01-21T00:00:00 with precision 8 would have the exact same interpretation.
 Thus the two dates are equivalent, since year, month, and days are treated as insignificant.
 **/

class LCal {
    constructor() {
        this.isDirty = true;
        this.julianminutes = 0;
        this.timezone = "Europe/Berlin";

        this.year = undefined;
        this.month = undefined;
        this.day = undefined;
        this.hour = undefined;
        this.minute = undefined;

        this.earliestLCal = undefined;
        this.latestLCal = undefined;

        this.precision = 14; //Sekundengenau
        this.type = 0; //n.a.
    }

    clone() {
        return new LCal().setJulianMinutes(this.julianminutes).setTimeZone(this.timezone).setPrecision(this.precision).setType(this.type);
    }

    isEndType() {
        if (this.type === 570
            || this.type === 1326
            || this.type === 582
            || this.type === 730
            || this.type === 576
            || this.type === 746
            || this.type === 2032
            || this.type === 2669
            || this.type === 3999) {
            return true;
        }
        return false;
    }

    recomputeFields() {
        if (this.isDirty) {
            let ymdhm = LCalHelper.getYMDHM(this.julianminutes, this.timezone);

            this.year = ymdhm[0];
            this.month = ymdhm[1];
            this.day = ymdhm[2];
            this.hour = ymdhm[3];
            this.minute = ymdhm[4];

            this.earliestLCal = undefined;
            this.latestLCal = undefined;

            this.isDirty = false;
        }
    }

    initYMDHM(year, month = 1, day = 1, hour = 0, minute = 0, timezone = "Europe/Berlin", precision = 14, type = 0) {
        this.timezone = timezone;
        this.precision = precision * 1;
        this.type = type;
        //Umrechnung in julianische Minuten
        this.julianminutes = LCalHelper.getTimeInMinutes(year, month, day, hour, minute, timezone);
        this.isDirty = true;
        return this;
    }

    initNow() {
        this.setJulianMinutes(LCalHelper.getNowMinutes());
        return this;
    }

    getJulianMinutes() {
        return this.julianminutes;
    }

    setTimeZone(timezone) {
        this.timezone = timezone;
        this.isDirty = true;
        return this;
    }

    setPrecision(t) {
        this.precision = t * 1;
        this.isDirty = true;
        return this;
    }

    setType(t) {
        this.type = t;
        this.isDirty = true;
        return this;
    }

    setJulianMinutes(julmin) {
        if (julmin !== this.julianminutes) {
            this.isDirty = true;
        }
        this.julianminutes = Math.round(julmin);

        return this;
    }

    before(lcal2) {
        return lcal2.getJulianMinutes() > this.julianminutes;
    }

    after(lcal2) {
        return lcal2.getJulianMinutes() < this.julianminutes;
    }

    equals(lcal2) {
        return lcal2 && lcal2.getJulianMinutes() === this.julianminutes;
    }

    addYear(cnt) {
        if (cnt !== 0) {
            //Es gibt kein Jahr 0!
            if (this.getYear() < 0 && this.getYear() + cnt >= 0) {
                cnt = cnt + 1;
            }
            this.initYMDHM(this.getYear() + cnt, this.getMonth(), this.getDay(), this.getHour(), this.getMinute(), this.timezone, this.precision, this.type);
        }
        return this;
    }

    addMonth(cnt) {
        if (cnt !== 0) {
            this.initYMDHM(this.getYear(), this.getMonth() + cnt, this.getDay(), this.getHour(), this.getMinute(), this.timezone, this.precision, this.type);
        }
        return this;
    }

    addDay(cnt) {
        if (cnt !== 0) {
            return this.initYMDHM(this.getYear(), this.getMonth(), this.getDay() + cnt, this.getHour(), this.getMinute(), this.timezone, this.precision, this.type);
        }
        return this;
    }

    addHour(cnt) {
        this.julianminutes += Math.round(cnt * 60);
        if (cnt !== 0) {
            this.isDirty = true;
        }
        return this;
    }

    addMinutes(cnt) {
        this.julianminutes += Math.round(cnt);
        if (cnt !== 0) {
            this.isDirty = true;
        }
        return this;
    }

    getYear() {
        this.recomputeFields();
        return this.year;
    }

    getMonth() {
        this.recomputeFields();
        return this.month;
    }

    getDay() {
        this.recomputeFields();
        return this.day;
    }

    getHour() {
        this.recomputeFields();
        return this.hour;
    }

    getMinute() {
        this.recomputeFields();
        return this.minute;
    }

    getDayInWeek() {
        return LCalHelper.getDayInWeek(this);
    }

    getTimeZone() {
        return this.timezone;
    }

    getPrecision() {
        return this.precision;
    }

    getType() {
        return this.type;
    }

    /**
     * Liefert ein JavaScript-Date
     * TODO: falls möglich, ansonsten null
     */
    getJSDate() {
        return new Date(LCalHelper.julianToUnix(this.getJulianMinutes()));
    }

    getDistanceInMinutes(lcal2) {
        return lcal2 ? lcal2.getJulianMinutes() - this.julianminutes : null;
    }

    //Liefert die Distanz zwischen zwei LCals unter Berücksichtigung der Precision
    getAbsDistanceInMinutesConsiderPrecision(lcal2) {
        if(lcal2) {
            //Es wird immer das maximale Ende des größeren Werts genommen
            if(lcal2.getJulianMinutes() > this.julianminutes) {
                return lcal2.getLatestLCal().getJulianMinutes() - this.getEarliestLCal().getJulianMinutes();
            } else {
                return this.getLatestLCal().getJulianMinutes() - lcal2.getEarliestLCal().getJulianMinutes();
            }
        }
        return null;
    }

    getAbsDistanceInWeeksConsiderPrecision(lcal2) {
        var days = Math.round(this.getAbsDistanceInMinutesConsiderPrecision(lcal2) * 10 / 1440) / 10;
        return Math.floor(days * 10 / 7) / 10;
    }

    /**
     * Liefert den frühestmöglichen (je nach Genauigkeit) Zeitpunkt zurück
     * z.B. 05.10.2018 8:30 mit Precision 9 (Jahresgenau) -> ??.??.2018 ??:?? = 01.01.2018 00:00 Uhr
     */
    getEarliestLCal() {
        if (this.precision >= 13) {
            return this;
        }
        if (!this.isDirty && this.earliestLCal) {
            return this.earliestLCal;
        }
        //Bei Minutengenauigkeit bleibt alles, wie es ist

        let year = this.getYear();
        let month = this.getMonth();
        let day = this.getDay();
        let hour = this.getHour();
        let minute = this.getMinute();
        switch (this.precision) { // eslint-disable-line default-case
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7: //Jahrhundertgenau
            case 8:
                year = Math.floor(this.getYear() / Math.pow(10, 9 - this.precision)) * Math.pow(10, 9 - this.precision); //JahrX genau
                //Falls das Jahr nun 0 ist, dann wird das Jahr zu 1 gemacht
                if (year === 0) {
                    year = 1;
                }
            case 9: // eslint-disable-line no-fallthrough
                month = 1; //Jahresgenau
            case 10: // eslint-disable-line no-fallthrough
                day = 1; //Monatsgenau
            case 11: // eslint-disable-line no-fallthrough
                hour = 0; //Tagesgenau
            case 12: // eslint-disable-line no-fallthrough
                minute = 0; //Stundengenau
        }
        this.earliestLCal = new LCal().initYMDHM(year, month, day, hour, minute, this.getTimeZone(), 14, this.getType());
        return this.earliestLCal;
    }

    /**
     * Liefert den spätestmöglichen (je nach Genauigkeit) Zeitpunkt zurück
     */
    getLatestLCal() {
        if (this.precision >= 13) {
            return this;
        }
        if (!this.isDirty && this.latestLCal) {
            return this.latestLCal;
        }
        let start = this.getEarliestLCal().clone();
        switch (this.precision) {  // eslint-disable-line default-case
            case 0:
                start.addYear(1000000000);
                break;
            case 1:
                start.addYear(100000000);
                break;
            case 2:
                start.addYear(10000000);
                break;
            case 3:
                start.addYear(1000000);
                break;
            case 4:
                start.addYear(100000);
                break;
            case 5:
                start.addYear(10000);
                break;
            case 6:
                start.addYear(1000);
                break;
            case 7:
                start.addYear(100);
                break;
            case 8:
                start.addYear(10);
                break;
            case 9:
                start.addYear(1);
                break;
            case 10:
                start.addMonth(1);
                break;
            case 11:
                start.addDay(1);
                break;
            case 12:
                start.addHour(1);
                break;
            case 13:
                start.addMinutes(1);
                break;
        }
        start.setPrecision(14);
        this.latestLCal = start;
        return start;
    }

    /**
     * Zieht vom Zeitpunkt so viel ab, wie als Präzision angegeben wurde
     */
    subtractPrecision() {
        switch (this.precision) {  // eslint-disable-line default-case
            case 0:
                this.addYear(-1000000000);
                break;
            case 1:
                this.addYear(-100000000);
                break;
            case 2:
                this.addYear(-10000000);
                break;
            case 3:
                this.addYear(-1000000);
                break;
            case 4:
                this.addYear(-100000);
                break;
            case 5:
                this.addYear(-10000);
                break;
            case 6:
                this.addYear(-1000);
                break;
            case 7:
                this.addYear(-100);
                break;
            case 8:
                this.addYear(-10);
                break;
            case 9:
                this.addYear(-1);
                break;
            case 10:
                this.addMonth(-1);
                break;
            case 11:
                this.addDay(-1);
                break;
            case 12:
                this.addHour(-1);
                break;
            case 13:
                this.addMinutes(-1);
                break;
        }
    }

    //Liefert die Differenz zwischen zwei LCals in Jahren, Monaten, Tagen, Stunden, Minuten (wie bei der Berechnung per calc)
    //Die Zeitzonen beider LCals müssen gleich sein.
    getDistanceInYMDHM(lcal2, timezone) {
        let lcal1 = this;
        //Start immer vor dem Ende
        if (lcal1.after(lcal2)) {
            let lcalTmp = lcal2;
            lcal2 = lcal1;
            lcal1 = lcalTmp;
        }

        //Jahre + Rest an Monaten und Tagen errechnen
        let measureStartMinutes = lcal1.getJulianMinutes();
        let measureEndMinutes = lcal2.getJulianMinutes();

        let startJMDHM = LCalHelper.getYMDHM(measureStartMinutes, timezone);
        let endJMDHM = LCalHelper.getYMDHM(measureEndMinutes, timezone);

        //Wenn Monat/Tag/Stunde/Minute des Starts nach dem des Ende sind, dann entspricht die Jahresdifferenz keinem Volljahr -> es muss 1 subtrahiert werden
        //StartMonat > Endmonat
        //oder (StartMonat==EndMonat und StartTag>EndTag)
        //oder (StartMonat==EndMonat und StartTag==EndTag und StartStunde>EndStunde)
        //oder (StartMonat==EndMonat und StartTag==EndTag und StartStunde==EndStunde und StartMinute==EndMinute)
        let isMDHMStartAfterMDHMEnd = startJMDHM[1] > endJMDHM[1]
            || (startJMDHM[1] === endJMDHM[1] && startJMDHM[2] > endJMDHM[2])
            || (startJMDHM[1] === endJMDHM[1] && startJMDHM[2] === endJMDHM[2] && startJMDHM[3] > endJMDHM[3])
            || (startJMDHM[1] === endJMDHM[1] && startJMDHM[2] === endJMDHM[2] && startJMDHM[3] === endJMDHM[3] && startJMDHM[4] > endJMDHM[4]);

        let years = endJMDHM[0] - startJMDHM[0] - (isMDHMStartAfterMDHMEnd ? 1 : 0);

        //Wenn Tag/Stunde/Minute des Starts nach dem des Ende sind, dann entspricht die Monatsdifferenz keinem Vollmonat -> es muss 1 subtrahiert werden
        let isDHMStartAfterDHMEnd = startJMDHM[2] > endJMDHM[2]
            || (startJMDHM[2] === endJMDHM[2] && startJMDHM[3] > endJMDHM[3])
            || (startJMDHM[2] === endJMDHM[2] && startJMDHM[3] === endJMDHM[3] && startJMDHM[4] > endJMDHM[4]);

        let months = endJMDHM[1] - startJMDHM[1] - (isDHMStartAfterDHMEnd ? 1 : 0);
        if (months < 0) {
            months += 12;
        }

        //Wenn Stunde/Minute des Starts nach dem des Ende sind, dann entspricht die Tagesdifferenz keinem Volltag -> es muss 1 subtrahiert werden
        let isHMStartAfterHMEnd = startJMDHM[3] > endJMDHM[3]
            || (startJMDHM[3] === endJMDHM[3] && startJMDHM[4] > endJMDHM[4]);

        let days = endJMDHM[2] - startJMDHM[2] - (isHMStartAfterHMEnd ? 1 : 0);


        if (days < 0) {
            //Die Tage vom Starttag und dem Monat-1 und Jahr des Endes ohne H:M bis Monatsende plus die Tage vom Endmonatsanfang bis Endtag ohne H:M
            let startMinutes = LCalHelper.getTimeInMinutes(endJMDHM[0], endJMDHM[1] - 1, startJMDHM[2], 0, 0, lcal1.getTimeZone());
            let monthEndMinutes = LCalHelper.getTimeInMinutes(endJMDHM[0], endJMDHM[1], endJMDHM[2], 0, 0, lcal1.getTimeZone());

            days = Math.round((monthEndMinutes - startMinutes) / 1440 - (isHMStartAfterHMEnd ? 1 : 0)); //Rundung, weil eine Zeitumstellung dazwischen sein könnte
        }

        //Ist der Starttag der Messung vor dem 15. Oktober 1582, und ist das Ende gleich oder nach dem 15. Oktober? -> 10 Tage abziehen
        let gregChangeDayMinutes = LCalHelper.getTimeInMinutes(1582, 10, 15, 0, 0, timezone);
        if (measureStartMinutes < gregChangeDayMinutes && measureEndMinutes >= gregChangeDayMinutes) {
            days -= 10;
        }

        let isMStartAfterMEnd = startJMDHM[4] > endJMDHM[4];
        //Wenn Minute des Starts nach dem des Ende sind, dann entspricht die Stundendifferenz keiner Vollstunde -> es muss 1 subtrahiert werden
        let hours = endJMDHM[3] - startJMDHM[3] - (isMStartAfterMEnd ? 1 : 0);
        if (hours < 0) {
            hours += 24;
        }

        let minutes = endJMDHM[4] - startJMDHM[4];
        if (minutes < 0) {
            minutes += 60;
        }

        //Da es kein Jahr 0 gibt: Wenn Start kleiner 0 und Ende größer 0, dann muss ein Jahr abgezogen werden
        if (startJMDHM[0] < 0 && endJMDHM[0] > 0) {
            years--;
        }

        return [years, months, days, hours, minutes];
    }

    toString() {
        this.recomputeFields();
        return JSON.stringify(this);
    }
}



export default LCal
