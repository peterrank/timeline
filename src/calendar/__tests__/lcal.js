import LCal from "../lcal";
import LCalHelper from "../lcalhelper";

describe("LCal", () => {
    const lcal = new LCal().initYMDHM(1, 1, 1, 0, 0, "Europe/Berlin");

    it("leap year", () => {
        expect(LCalHelper.isLeapYear(-120400)).toBeTruthy();
        expect(LCalHelper.isLeapYear(-120399)).toBeFalsy();
        expect(LCalHelper.isLeapYear(2004)).toBeTruthy();
    });

    it("time in minutes should be same", () => {
        let time = LCalHelper.getTimeInMinutes(-120400, 12, 5, 0, 0, "Europe/Berlin");
        expect(time).toBe(-60846246780);
    });

    it("clone should be same result", () => {
        let lcal = new LCal().initYMDHM(1204, 12, 5, 0, 0, "Europe/Berlin", 10, 0).setTimeZone("Europe/Berlin");
        let lcal2 = lcal.clone();

        expect(lcal.getJSDate().getTime()).toBe(lcal.getJSDate().getTime());


        lcal = new LCal().initYMDHM(-120400, 12, 5, 0, 0, "Europe/Berlin", 10, 0).setTimeZone("Europe/Berlin");
        lcal2 = lcal.clone();

        expect(lcal.getJSDate().getTime()).toBe(lcal.getJSDate().getTime());
        expect(lcal2.getYear()).toBe(-120400);
    });

    it("1.1.1 should be saturday", () => {
        expect(lcal.getDayInWeek()).toBe(5);
    });

    /*it("jsverifytest", () => {
        const v = jsc.checkForall(jsc.integer,
            (a) => {
                let lcal = new LCal().setJulianMinutes(a);
                let jsDate = lcal.getJSDate();
                return lcal.getYear() === jsDate.getFullYear();
            });

        expect(v).toBe(true);
    });*/

    it("LCal to Date", () => {
        let lcal = new LCal().initYMDHM(2017, 1, 1, 0, 0).setTimeZone("Europe/Berlin");
        let d = new Date(2017, 0, 1, 0, 0);
        //console.log("1. JulianMinutes: "+lcal.getJulianMinutes());

        expect(lcal.getJSDate().getTime()).toBe(d.getTime());
    });

    it("Date to LCal", () => {
        let d = new Date(2017, 0, 1, 0, 0);

        let julianMinutes = LCalHelper.unixToJulian(d.getTime());
        //console.log("2. JulianMinutes: "+julianMinutes);
        let lcal = new LCal().setTimeZone("Europe/Berlin").setJulianMinutes(julianMinutes);


        expect(lcal.getYear()).toBe(2017);
    });

    it("Urknall", () => {
        let julianMinutes = -7258245521149500;
        let lcal = new LCal().setTimeZone("Europe/Berlin").setJulianMinutes(julianMinutes);

        //console.log(lcal.getYear());


        let urknall = new LCal().initYMDHM(-13800000000, 1, 1, 0, 0, "Europe/Berlin");
        //console.log("Urknall julmin: "+urknall.getJulianMinutes());

        expect(lcal.getYear()).toBe(-13800000000);
    });

    it("distance in ymdhm", () => {
        const lcal1 = new LCal().initYMDHM(2018, 2, 13, 0, 0).setTimeZone("Europe/Berlin");
        const lcal2 = new LCal().initYMDHM(2018, 4, 1, 0, 0).setTimeZone("Europe/Berlin");
        const ymdhm = lcal2.getDistanceInYMDHM(lcal1, lcal1.getTimeZone());

        expect(ymdhm[1]).toBe(1);
        expect(ymdhm[2]).toBe(19);
    });

    it("latest lcal", () => {
        const lcal1 = new LCal().initYMDHM(-1972, 2, 13, 0, 0).setTimeZone("Europe/Berlin").setPrecision(9);
        expect(lcal1.getLatestLCal().getYear()).toBe(-1971);
    })
});
