import LCal from './lcal.js';
/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 */
const monthNamesS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const monthNames = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const monthNamesL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const dayNamesL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

/**
 * Ein Formatter für das LCal-Objekt
 */
class LCalFormatter {
    //TODO: das muss internationaler werden
    static formatDate(lcalIn, isShortFormat = false) {
        if(!(lcalIn instanceof LCal)) {
            return "unbekannter Zeitpunkt";
        }
        const lcal = lcalIn.getEarliestLCal();

        const year = lcal.getYear();
        const month = lcal.getMonth();
        const day = lcal.getDay();

        let result = "";
        //var absYear = Math.abs(year);

        const monthName = (isShortFormat ? monthNames[month - 1] : monthNamesL[month - 1]);


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
                result = ("0" + day).slice(-2) + ". " + monthName + " " + absYearStr;
                break;
            default:
                result = absYearStr;
        }

        return result;
    }

    static formatTime(lcalIn) {
        if(!(lcalIn instanceof LCal)) {
            return "unbekannter Zeitpunkt";
        }
        let lcal = lcalIn.getEarliestLCal();
        return ("0" + lcal.getHour()).slice(-2) + ":" + ("0" + lcal.getMinute()).slice(-2);
    }

    static formatDateTime(lcalIn) {
        if(!(lcalIn instanceof LCal)) {
            return "unbekannter Zeitpunkt";
        }
        if(lcalIn.precision >= 12) {
            return LCalFormatter.formatDayNameL(lcalIn) + ", " + LCalFormatter.formatDate(lcalIn) + " " + LCalFormatter.formatTime(lcalIn) + " Uhr";
        } else if(lcalIn.precision >= 11) {
            return LCalFormatter.formatDayNameL(lcalIn) + ", " + LCalFormatter.formatDate(lcalIn);
        } else {
            return LCalFormatter.formatDate(lcalIn);
        }
    }

    static formatDayName(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return dayNames[lcal.getDayInWeek()];
    }

    static formatDayNameL(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return dayNamesL[lcal.getDayInWeek()];
    }

    static formatYear(lcalIn) {
        //Je nach Precision ein anderes Format wählen
        let lcal = lcalIn.getEarliestLCal();
        return LCalFormatter.formatYearFromNumber(lcal.getYear(), lcalIn.getPrecision());
    }

    static formatYearFromNumber(year, precision = 14) {
        if (year instanceof LCal) {
            year = year.getYear();
        }
        let result = "";
        let absYear = Math.abs(year);
        if (absYear / 1000000000 >= 1) {
            result = (Math.round(absYear / 100000000) / 10).toLocaleString() + " Mrd.";
        } else if (absYear / 1000000 >= 1) {
            result = (Math.round(absYear / 100000) / 10).toLocaleString() + " Mio.";
        } else if (absYear / 10000 >= 1) {
            result = Math.round(absYear / 1000).toLocaleString() + " Tsd.";
        } else {
            switch (precision) {
                case 8:
                    if(year < 0) {
                        absYear -= 10;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = absYear.toLocaleString() + "er";
                    break; //Jahrzehnte genau: "er" anhängen (z.B. 1980er)
                case 7:
                    if(year < 0) {
                        absYear -= 100;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100) + 1).toLocaleString() + ". Jh.";
                    break; //Jahrhunderte genau: Jahrzehnte abschneiden und 1 dazuzählen
                case 6:
                    if(year < 0) {
                        absYear -= 1000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000) + 1).toLocaleString() + ". Jtd.";
                    break; //Jahrtausende genau: Jahrhunderte abschneiden und 1 dazuzählen
                case 5:
                    if(year < 0) {
                        absYear -= 10000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 10000) + 1).toLocaleString() + ". Jztd.";
                    break; //Jahrzehntausende genau: Jahrtausende abschneiden und 1 dazuzählen
                case 4:
                    if(year < 0) {
                        absYear -= 100000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100000) + 1).toLocaleString() + ". Jhtd.";
                    break; //Jahrhunderttausend genau: Jahrzehntausende abschneiden und 1 dazuzählen
                case 3:
                    if(year < 0) {
                        absYear -= 1000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000000) + 1).toLocaleString() + ". Jmio.";
                    break; //Jahrmillion genau: Jahrhunderttausend abschneiden und 1 dazuzählen
                case 2:
                    if(year < 0) {
                        absYear -= 10000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 10000000) + 1).toLocaleString() + ". Jzmio.";
                    break; //Jahrzehnmillion genau: Jahrmillion abschneiden und 1 dazuzählen
                case 1:
                    if(year < 0) {
                        absYear -= 100000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 100000000) + 1).toLocaleString() + ". Jtmio.";
                    break; //Jahrtausendmillion genau: Jahrzehnmillion abschneiden und 1 dazuzählen
                case 0:
                    if(year < 0) {
                        absYear -= 1000000000;
                        if(absYear===0) {
                            absYear = 1;
                        }
                    }
                    result = (Math.floor(absYear / 1000000000) + 1).toLocaleString() + ". Jmrd.";
                    break; //Jahrmilliarden genau: Jahrtausendmillion abschneiden und 1 dazuzählen
                default:
                    result = absYear;
            }
        }

        if (year < 0) {
            result += " v. Chr.";
        }
        return result;
    }

    static formatMonthName(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return monthNames[lcal.getMonth() - 1];
    }

    static formatMonthNameS(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return monthNamesS[lcal.getMonth() - 1];
    }

    static formatMonthNameL(lcalIn) {
        let lcal = lcalIn.getEarliestLCal();
        return monthNamesL[lcal.getMonth() - 1];
    }

    /**
     * Liefert eine Zeichenkette, die die Minuten in lesbarer Form ausgibt
     */
    static formatDuration(interval) {
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

        /*console.log("formatDuration");
        console.log(ymdhmMin);
        console.log(ymdhmMax);
        console.log(ymdhmApprox);*/

        let str = "";

        if (ymdhmApprox[0] > 0) {
            str += LCalFormatter.formatYearFromNumber(ymdhmApprox[0], 14) + " J";
        }
        if (ymdhmApprox.length > 1 && ymdhmApprox[1] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[1] + " Mon";
        }
        if (ymdhmApprox.length > 2 && ymdhmApprox[2] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[2] + " T";
        }
        if (ymdhmApprox.length > 3 && ymdhmApprox[3] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[3] + " Std";
        }
        if (ymdhmApprox.length > 4 && ymdhmApprox[4] > 0) {
            str += (str.length > 0 ? ", " : "") + ymdhmApprox[4] + " Min";
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
    static formatStartEnd(o, isPerson) {

        let start = o.start;

        let fromStart;
        if (!start && o.startYear && o.startMonth && o.startDay) {
            start = new LCal().initYMDHM(o.startYear, o.startMonth, o.startDay).setPrecision(o.startPrecision || 11); //Tagesgenau
        }
        if (start) {
            fromStart = LCalFormatter.formatDate(start);
        }

        let end = o.end;
        let toEnd;
        if (!end && o.endYear && o.endMonth && o.endDay) {
            end = new LCal().initYMDHM(o.endYear, o.endMonth, o.endDay).setPrecision(o.endPrecision || 11); //Tagesgenau
            end.addDay(1);
        }
        if (end) {
            toEnd = LCalFormatter.formatDate(end);
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


    static formatType(lcal) {
        switch (lcal.type) {
            case 569:
                return "geboren";
            case 2310:
                return "frühestens"; //Frühestmögliches Datum
            case 1319:
                return "frühestens"; //Frühestmöglicher Zeitpunkt
            case 580:
                return "Start";
            case 571:
                return "Gründung/ Erstellung / Entstehung";
            case 575:
                return "Entdeckung";
            case 577:
                return "Publikation";
            case 574:
                return "Erstbeschreibung";
            case 1636:
                return "getauft";
            case 1191:
                return "Uraufführung";
            case 1249:
                return "Ersterwähnung";
            case 1317:
                return "Wirkungsjahre";
            case 1619:
                return "eröffnet";
            case 1734:
                return "Amtseid";
            case 2031:
                return "aktiv seit";
            case 2754:
                return "Produktion";
            case 585:
                return "Zeitpunkt";
            case 606:
                return "Jungfernflug";
            case 619:
                return "Start"; //Start eines Raumfahrzeugs
            case 570:
                return "gestorben";
            case 1326:
                return "spätestens";
            case 582:
                return "Ende";
            case 730:
                return "Stilllegung";
            case 576:
                return "aufgelöst";
            case 746:
                return "verschollen seit";
            case 2032:
                return "aktiv bis";
            case 2669:
                return "eingestellt"; //im Sinne von beendet
            case 3999:
                return "geschlossen";
            case 620:
                return "Landung";
            case 621:
                return "Wiedereintritt ";
            default:
                return null;
        }
    }
}

export default LCalFormatter
