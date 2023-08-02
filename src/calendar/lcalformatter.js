import LCal from './lcal.js';
import i18n from "../i18n/i18n";
/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */

/**
 * Ein Formatter für das LCal-Objekt
 */
class LCalFormatter {
    static formatDate(lcalIn, isShortFormat = false, languageCode="") {
        if(!(lcalIn instanceof LCal)) {
            return i18n("unknown", languageCode);
        }
        const lcal = lcalIn.getEarliestLCal();

        const year = lcal.getYear();
        const month = lcal.getMonth();
        const day = lcal.getDay();

        let result = "";
        //var absYear = Math.abs(year);

        const monthName = (isShortFormat ? i18n("monthNames", languageCode)[month - 1] : i18n("monthNamesL", languageCode)[month - 1]);


        const absYearStr = LCalFormatter.formatYearFromNumber(year, lcalIn.precision);

        /*
         9: years
         10: months
         11: days
         12: hours
         13: minutes
         */
        switch (lcalIn.precision) {
            case 10:
                result = monthName + " " + absYearStr;
                break; //monatsgenau20112012
            case 11:
            case 12:
            case 13:
            case 14:
                if(languageCode == "en") {
                    result =  monthName + " "+  ("0" + day).slice(-2) + ", " + absYearStr;
                } else {
                    result = ("0" + day).slice(-2) + ". " + monthName + " " + absYearStr;
                }
                break;
            default:
                result = absYearStr;
        }
        return result;
    }

    static formatTime(lcalIn, languageCode="") {
        if(!(lcalIn instanceof LCal)) {
            return i18n("unknown", languageCode);
        }
        let lcal = lcalIn.getEarliestLCal();
        return ("0" + lcal.getHour()).slice(-2) + ":" + ("0" + lcal.getMinute()).slice(-2);
    }

    static formatDateTime(lcalIn, languageCode="") {
        if(!(lcalIn instanceof LCal)) {
            return i18n("unknown", languageCode);
        }
        if(lcalIn.precision >= 12) {
            return LCalFormatter.formatDayNameL(lcalIn) + ", " + LCalFormatter.formatDate(lcalIn, languageCode) + " " + LCalFormatter.formatTime(lcalIn, languageCode) + " " + i18n("oClock", languageCode);
        } else if(lcalIn.precision >= 11) {
            return LCalFormatter.formatDayNameL(lcalIn) + ", " + LCalFormatter.formatDate(lcalIn, languageCode);
        } else {
            return LCalFormatter.formatDate(lcalIn, languageCode);
        }
    }

    static formatDayName(lcalIn, languageCode="") {
        let lcal = lcalIn.getEarliestLCal();
        return i18n("dayNames", languageCode)[lcal.getDayInWeek()];
    }

    static formatDayNameL(lcalIn, languageCode="") {
        let lcal = lcalIn.getEarliestLCal();
        return i18n("dayNamesL", languageCode)[lcal.getDayInWeek()];
    }

    static formatYear(lcalIn, languageCode="") {
        //Je nach Precision ein anderes Format wählen
        let lcal = lcalIn.getEarliestLCal();
        return LCalFormatter.formatYearFromNumber(lcal.getYear(), lcalIn.getPrecision(), languageCode);
    }

    static formatYearFromNumber(year, precision = 14, languageCode="" ) {
        if (year instanceof LCal) {
            year = year.getYear();
        }
        let result = "";
        let absYear = Math.abs(year);
        if (absYear / 1000000000 >= 1) {
            result = (Math.round(absYear / 100000000) / 10).toLocaleString() + " " + i18n("bn", languageCode);
        } else if (absYear / 1000000 >= 1) {
            result = (Math.round(absYear / 100000) / 10).toLocaleString() + " " + i18n("mn", languageCode);
        } else if (absYear / 10000 >= 1) {
            result = Math.round(absYear / 1000).toLocaleString() + " " + i18n("thousands", languageCode);
        } else {
            switch (precision) {
                case 8:
                    if(year < 0) {
                        absYear -= 10;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = absYear.toLocaleString() + " " + i18n("th", languageCode);
                    break; //Jahrzehnte genau: "er" anhängen (z.B. 1980er)
                case 7:
                    if(year < 0) {
                        absYear -= 100;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100) + 1).toLocaleString() + " " + i18n("cen", languageCode);
                    break; //Jahrhunderte genau: Jahrzehnte abschneiden und 1 dazuzählen
                case 6:
                    if(year < 0) {
                        absYear -= 1000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000) + 1).toLocaleString() + " " + i18n("mil", languageCode);
                    break; //Jahrtausende genau: Jahrhunderte abschneiden und 1 dazuzählen
                case 5:
                    if(year < 0) {
                        absYear -= 10000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 10000) + 1).toLocaleString() + " " + i18n("bil", languageCode);
                    break; //Jahrzehntausende genau: Jahrtausende abschneiden und 1 dazuzählen
                case 4:
                    if(year < 0) {
                        absYear -= 100000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100000) + 1).toLocaleString() + " " + i18n("tril", languageCode);
                    break; //Jahrhunderttausend genau: Jahrzehntausende abschneiden und 1 dazuzählen
                case 3:
                    if(year < 0) {
                        absYear -= 1000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000000) + 1).toLocaleString() + " " + i18n("mcCen", languageCode);
                    break; //Jahrmillion genau: Jahrhunderttausend abschneiden und 1 dazuzählen
                case 2:
                    if(year < 0) {
                        absYear -= 10000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 10000000) + 1).toLocaleString() + " " + i18n("bnCen", languageCode);
                    break; //Jahrzehnmillion genau: Jahrmillion abschneiden und 1 dazuzählen
                case 1:
                    if(year < 0) {
                        absYear -= 100000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100000000) + 1).toLocaleString() + " " + i18n("trilCen", languageCode);
                    break; //Jahrtausendmillion genau: Jahrzehnmillion abschneiden und 1 dazuzählen
                case 0:
                    if(year < 0) {
                        absYear -= 1000000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000000000) + 1).toLocaleString() + " " + i18n("bilCen", languageCode);
                    break; //Jahrmilliarden genau: Jahrtausendmillion abschneiden und 1 dazuzählen
                default:
                    result = absYear;
            }
        }

        if (year < 0) {
            result += " "+i18n("bc", languageCode);
        }
        return ""+result;
    }

    static formatMonthName(lcalIn, languageCode) {
        let lcal = lcalIn.getEarliestLCal();
        return i18n("monthNames", languageCode)[lcal.getMonth() - 1];
    }

    static formatMonthNameS(lcalIn, languageCode) {
        let lcal = lcalIn.getEarliestLCal();
        return i18n("monthNamesS", languageCode)[lcal.getMonth() - 1];
    }

    static formatMonthNameL(lcalIn, languageCode) {
        let lcal = lcalIn.getEarliestLCal();
        return i18n("monthNamesL", languageCode)[lcal.getMonth() - 1];
    }

    /**
     * Liefert eine Zeichenkette, die die Minuten in lesbarer Form ausgibt
     */
    static formatDuration(interval, languageCode="") {
        //Vom frühest möglichen Start bis zum spätest möglichen Ende des Intervalls
        let ymdhmMax = interval.start.getEarliestLCal().getDistanceInYMDHM(interval.end.getLatestLCal(), "Europe/Berlin");
        //Vom spätest möglichen Start bis zum frühest möglichen Ende des Intervalls
        let ymdhmMin = interval.start.getLatestLCal().getDistanceInYMDHM(interval.end.getEarliestLCal(), "Europe/Berlin");

        let ymdhmApprox = [];

        //von vorne her die Felder vergleichen. Wenn unterschiedlich, dann den Index merken. Nur bis zu diesem darf das Ergebnis angezeigt werden.
        //Ausnahme: Jahr ist unterschiedlich, dann von/bis Jahr anzeigen
        for (let n = 0; n < 5; n++) {
            ymdhmApprox.push(ymdhmMax[n]);
            if (ymdhmMax[n] !== ymdhmMin[n]) {
                break;
            }

        }

        let str = "";

        if (ymdhmApprox[0] > 0) {
            str += LCalFormatter.formatYearFromNumber(ymdhmApprox[0], 14) + " " + i18n("yearsS", languageCode);
        }
        if (ymdhmApprox.length > 1 && ymdhmApprox[1] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[1] + " " + i18n("monthS", languageCode);
        }
        if (ymdhmApprox.length > 2 && ymdhmApprox[2] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[2] + " " + i18n("daysS", languageCode);
        }
        if (ymdhmApprox.length > 3 && ymdhmApprox[3] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[3] + " " + i18n("hoursS", languageCode);
        }
        if (ymdhmApprox.length > 4 && ymdhmApprox[4] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[4] + " " + i18n("minutesS", languageCode);
        }
        if (str.length === 0) {
            str = "0";
        }

        if (ymdhmApprox.length < 4) {
            str = "~ " + str;
        }

        return str;
    }

    /**
     * Formatiert ein objekt, das start... und end...-Informationen hat
     * @param o
     * @returns {*}
     */
    static formatStartEnd(o, isPerson, languageCode="") {

        let start = o.start;

        let fromStart;
        if (!start && o.startYear && o.startMonth && o.startDay) {
            start = new LCal().initYMDHM(o.startYear, o.startMonth, o.startDay).setPrecision(o.startPrecision || 11); //Tagesgenau
        }
        if (start) {
            fromStart = LCalFormatter.formatDate(start, languageCode);
        }

        let end = o.end;
        let toEnd;
        if (!end && o.endYear && o.endMonth && o.endDay) {
            end = new LCal().initYMDHM(o.endYear, o.endMonth, o.endDay).setPrecision(o.endPrecision || 11); //Tagesgenau
            end.addDay(1);
        }
        if (end) {
            toEnd = LCalFormatter.formatDate(end, languageCode);
        }

        if (fromStart && toEnd && fromStart === toEnd) {
            return "am " + fromStart;
        } else if (fromStart && toEnd) {
            if (isPerson) {
                return "* " + fromStart + ", † " + toEnd;
            } else {
                return fromStart + " bis " + toEnd;
            }
        } else if (fromStart && !toEnd) {
            if (isPerson) {
                return "* " + fromStart;
            } else {
                return "ab " + fromStart;
            }
        } else if (!fromStart && toEnd) {
            if (isPerson) {
                return "† " + toEnd;
            } else {
                return "bis " + toEnd;
            }
        }

        return null;
    }

    static formatDay(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return lcal.getDay();
    }


    static formatType(lcal, languageCode="") {
        switch (lcal.type) {
            case 569:
                return i18n("born", languageCode);
            case 2310:
                return i18n("earliest", languageCode); //Frühestmögliches Datum
            case 1319:
                return i18n("earliest", languageCode); //Frühestmöglicher Zeitpunkt
            case 580:
                return i18n("start", languageCode);
            case 571:
                return i18n("founded", languageCode);
            case 575:
                return i18n("discovered", languageCode);
            case 577:
                return i18n("published", languageCode);
            case 574:
                return i18n("firstDescribed", languageCode);
            case 1636:
                return i18n("baptized", languageCode);
            case 1191:
                return i18n("premiered", languageCode);
            case 1249:
                return i18n("firstMentioned", languageCode);
            case 1317:
                return i18n("activeYears", languageCode);
            case 1619:
                return i18n("opened", languageCode);
            case 1734:
                return i18n("inaugurated", languageCode);
            case 2031:
                return i18n("activeSince", languageCode);
            case 2754:
                return i18n("production", languageCode);
            case 585:
                return i18n("moment", languageCode);
            case 606:
                return i18n("maidenFlight", languageCode);
            case 619:
                return i18n("start", languageCode); //Start eines Raumfahrzeugs
            case 570:
                return i18n("died", languageCode);
            case 1326:
                return i18n("latest", languageCode);
            case 582:
                return i18n("end", languageCode);
            case 730:
                return i18n("closed1", languageCode);
            case 576:
                return i18n("dissolved", languageCode);
            case 746:
                return i18n("missingSince", languageCode);
            case 2032:
                return i18n("activeUntil", languageCode);
            case 2669:
                return i18n("discontinued", languageCode); //im Sinne von beendet
            case 3999:
                return i18n("closed", languageCode);
            case 620:
                return i18n("landing", languageCode);
            case 621:
                return i18n("reentry", languageCode);
            default:
                return null;
        }
    }
}

export default LCalFormatter
