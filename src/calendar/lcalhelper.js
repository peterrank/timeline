/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
import LCal from './lcal.js';

/**
 * Hilfsfunktionen zum Rechnen mit Zeiten
 */
class LCalHelper {
    static getStandardTimeZoneOffset(timezone) {
        switch (timezone) {
            case "UTC":
                return 0;
            case "Europe/Berlin":
                return 60;
            default:
                return 0;
        }
    }

    static getTimeInMinutes(year, month, day, hour, minute, timezone) {
        let origYear = year;
        let origMonth = month;

        let mjt;
        let b;

        //Da in astronomischen Jahren gerechnet wird, wird bei Jahren, die kleiner als 0 sind ein Jahr dazuaddiert
        if (year < 0) {
            year += 1;
        }

        if ((year > 1582) || ((year === 1582) && (month > 10) ) || ((year === 1582) && (month === 10) && (day >= 15) )) {
            b = Math.floor(year / 400) - Math.floor(year / 100) + Math.floor(year / 4);
        } else {
            b = Math.floor((year + 4716) / 4) - 1181;
        }
        if (month <= 2) {
            if (LCalHelper.isLeapYear(year)) {
                b = b - 1;
            }
            year = year - 1;
            month = month + 13;
        } else {
            month = month + 1;
        }
        mjt = 365 * year - 679004 + b + Math.floor(30.6 * month) + day;
        let julianDay = mjt + 2400001;

        let retVal = julianDay * 1440 + hour * 60 + minute;

        retVal -= LCalHelper.getStandardTimeZoneOffset(timezone);

        if (LCalHelper.isDaylightSavingTime(origYear, origMonth, day, hour, minute, timezone)) {
            retVal -= 60;
        }
        return retVal;
    }

    //Liefert ein Array mit Jahr, Montat, Tag, Stunde, Minute zurück
    static getYMDHM(julianminutes, timezone) {

        julianminutes += LCalHelper.getStandardTimeZoneOffset(timezone);

        let juliantag = Math.floor(julianminutes / 1440);
        let rest = julianminutes - juliantag * 1440;
        let hour = Math.floor(rest / 60);
        let minute = rest - hour * 60;

        let a, b, c, d, e, f, g, z;
        let jahr, monat, tag;

        z = Math.floor(juliantag + 0.5);
        f = (juliantag + 0.5) - z;

        if (z >= 2299161) {
            g = Math.floor((z - 1867216.25) / 36524.25);
            c = Math.floor(g / 4);
            a = z + 1 + g - c;
        } else {
            a = z;
        }

        b = a + 1524;
        c = Math.floor((b - 122.1) / 365.25);
        d = Math.floor(365.25 * c);
        e = Math.floor(((b - d) / 30.6001));
        z = Math.floor(30.6001 * e);
        tag = Math.floor(b - d - z + f);

        if (e > 13.5) {
            monat = e - 13;
        } else {
            monat = e - 1;
        }

        if (monat > 2.5) {
            jahr = c - 4716;
        } else {
            jahr = c - 4715;
        }

        //Das Ergebnis ist in astronomischen Jahren, d.h. es wird mit dem Jahr 0 gerechnet
        //Wir wollen aber kein Jahr 0
        if (jahr <= 0) {
            jahr -= 1;
        }


        //Falls die Zeitzone "Europe/Berlin" ist, dann muss im Sommer eine Stunde dazugezählt werden (aktueller Berechnungsstand an dieser Stelle wäre Winterzeit)
        //Das folgende kann gemacht werden, weil die Anfrage bei MEZ und MESZ das gleiche Ergebnis liefert
        if (LCalHelper.isDaylightSavingTime(jahr, monat, tag, hour, minute, timezone)) {
            //Eine Stunde aufaddieren und so tun, als wäre es UTC
            return LCalHelper.getYMDHM(julianminutes + 60, "UTC");
        }
        return [jahr, monat, tag, hour, minute];

    }


    /*
     * Liefert true zurück, wenn die angegebene Zeit in der Sommerzeit liegt
     * Sommerzeit: seit 1996: letzter Sonntag im März 2 Uhr bis letzter Sonntag im Oktober 3 Uhr.
     *
     * ACHTUNG: Derzeit wird nur bei der Zeitzone "Europe/Berlin" mit Sommerzeit gerechnet
     *
     * http://de.wikipedia.org/wiki/Sommerzeit
     * http://www.mikrocontroller.net/attachment/highlight/8391
     */
    static isDaylightSavingTime(jahr, monat, tag, hour, minute, timezone) {
        if (timezone === "Europe/Berlin") {
            if (jahr >= 1996) {
                //April bis September sind immer Sommerzeit
                if (monat > 3 && monat < 10) {
                    return true;
                }
                //November bis Februar ist immer Winterzeit
                if (monat < 3 || monat > 10) {
                    return false;
                }

                //Für die Berechnung des Wochentags ist die Zeitzone nicht wichtig
                let dayInWeek = LCalHelper.getDayInWeek(new LCal().initYMDHM(jahr, monat, tag, hour, minute, "UTC"));

                let wday = (dayInWeek + 1) % 7; //So steht der Sonntag an Stelle 0

                //Letzter Sonntag im Monat oder danach?
                if ((tag - wday >= 25 && (wday || hour > 2)) || tag > 31) {
                    if (monat === 10) {
                        return false;
                    }
                } else {
                    if (monat === 3) {
                        return false;
                    }
                }
                return true;
            }
        }
        //TODO: Regelungen vor 1996...
        return false;
    }

    /**
     * Liefert per Default immer die Zeitzone Europe/Berlin
     * @param date
     * @returns {*}
     */
    static getLCal(date) {
        if (date instanceof Date) {
            return new LCal().setJulianMinutes(LCalHelper.unixToJulian(date.getTime())).setTimeZone("Europe/Berlin");
        }
        return null;
    }

    static getJSDate(lcal) {
        if (lcal instanceof LCal) {
            return lcal.getJSDate();
        }
        return null;
    }

    /**
     * Umrechnug von julianischen Minuten in einen Unix-Zeitstempel.
     * Der Wert des erwarteten Zeitstempels muss im erlaubten Bereich liegen
     */
    static julianToUnix(julianMinutes) {
        return (julianMinutes - 3514446720) * 60000;
    }

    /**
     * Liefert die Julianischen Minuten für einen übergebenen Unix-Zeitstempel.
     * das Ergebnis wird gerundet
     */
    static unixToJulian(unixmillis) {
        return Math.round(unixmillis / 60000) + 3514446720;
    }

    /**
     * ist das übergebene Jahr ein Schaltjahr?
     */
    static isLeapYear(jahr) {
        if (jahr % 4 !== 0) return false;
        if (jahr < 1582) return true;
        if (jahr % 400 === 0) return true;
        if (jahr % 100 === 0) return false;
        return true;
    }

    /**
     * Liefert den Wochentag (UT ohne Zeitumstellung)
     */
    static getDayInWeek(time) {
        //die Zeitzone von time beachten!!
        let julianminutes = time.getJulianMinutes() + LCalHelper.getStandardTimeZoneOffset(time.getTimeZone());

        //LCalHelper.isDaylightSavingTime(time.getYear(), time.getMonth(), time.getDay(), time.getHour(), time.getMinute(), time.getTimeZone());

        if (LCalHelper.isDaylightSavingTime(time.getYear(), time.getMonth(), time.getDay(), time.getHour(), time.getMinute(), time.getTimeZone())) {
            julianminutes += 60;
        }

        julianminutes = Math.round(julianminutes);
        var dayOfWeek = Math.floor(julianminutes / 1440) % 7;
        if (dayOfWeek < 0) {
            dayOfWeek += 7;
        }
        return dayOfWeek;
    }

    static getNowMinutes() {
        var today = new Date();
        return LCalHelper.getTimeInMinutes(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), "UTC");
    }

    //Handelt es sich um einen "runden" Tag
    static isBigDay(years, isBirthday) {
        //Bei Geburtstagen: zusätzlich, wenn die Person 18 wird
        if(isBirthday && years===18) {
            return true;
        }
        //Bei sonstigen Tagen: 25, 50, 75, 100 oder einer 10er Potenz davon.
        //D.h. die Zahl in einen String umwandeln. Hat die Zahl mehr als zwei Stellen, dann nimm die ersten beiden. Sind die in der Aufzählung enthalten? Besteht der Rest nur aus 0en?  -> liefere true
        const yearStr = ""+years;
        if(yearStr.length>=2) {
            const s = (yearStr).slice(0, 2);
            if (s === "25" || s === "50" || s === "75" || s === "10") {
                //besteht der Rest nur aus 0en?
                return yearStr.slice(2).replace("0", "").length===0;
            }
        }
        return false;
    }

    /**
     * Die Precision wird ungenauer, je größer das Intervall ist. Damit kann dann bei größeren Abständen eine ungenauere Angabe der Entfernung zu heute erfolgen
     * @param mouseLCal
     * @param now
     * @returns {*}
     */
    static adaptPrecisionByDistance(mouseLCal, now) {
        //Die Genauigkeit des mouseLCal ändern, je nach dem wie groß der Abstand ist (damit nicht immer Minuten mit angezeigt werden, wenn z.B. der Abstand 1000 Jahre beträgt)
        const dist  = Math.abs(now.getDistanceInMinutes(mouseLCal));
        let adaptedMouseLCal = mouseLCal.clone();
        if(dist > 2628000) { //Bei mehr als 5 * 365 Tagen Abstand: Jahresgenau
            adaptedMouseLCal.setPrecision(9);
        } else if(dist > 576000) { //Bei mehr als 400 Tagen Abstand: Monatsgenau
            adaptedMouseLCal.setPrecision(10);
        } else if(dist > 57600) { //Bei mehr als 40 Tagen Abstand: Tagesgenau
            adaptedMouseLCal.setPrecision(11);
        } else if(dist > 2880) { //Bei mehr als 2 Tagen Abstand: Stundengenau
            adaptedMouseLCal.setPrecision(12);
        }
        return adaptedMouseLCal;
    }
}

export default LCalHelper;
