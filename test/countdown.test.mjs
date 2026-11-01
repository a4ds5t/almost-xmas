import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const countdown = require("../countdown.js");

// Fixtures use explicit years on purpose: the point is that the *source* has no
// hard-coded target year, not that the tests avoid concrete dates.
const local = (year, monthIndex, day, hours = 0, minutes = 0, seconds = 0) =>
  new Date(year, monthIndex, day, hours, minutes, seconds);

describe("nextOccurrence (generic primitive)", () => {
  it("returns this year's date mid-year", () => {
    const target = countdown.nextOccurrence(12, 25, local(2026, 6, 15, 18, 30));
    assert.equal(target.getFullYear(), 2026);
    assert.equal(target.getMonth(), 11);
    assert.equal(target.getDate(), 25);
    assert.equal(target.getHours(), 0);
    assert.equal(target.getMinutes(), 0);
    assert.equal(target.getSeconds(), 0);
    assert.equal(target.getMilliseconds(), 0);
  });

  it("keeps the current occurrence on the day itself", () => {
    const target = countdown.nextOccurrence(12, 25, local(2026, 11, 25, 15, 0));
    assert.equal(target.getFullYear(), 2026);
    assert.equal(target.getDate(), 25);
  });

  it("rolls to next year the day after", () => {
    const target = countdown.nextOccurrence(12, 25, local(2026, 11, 26, 0, 0, 0));
    assert.equal(target.getFullYear(), 2027);
    assert.equal(target.getMonth(), 11);
    assert.equal(target.getDate(), 25);
  });

  it("takes a 1-based month, so January is 1 and December is 12", () => {
    const newYear = countdown.nextOccurrence(1, 1, local(2026, 5, 10));
    assert.equal(newYear.getMonth(), 0);
    assert.equal(newYear.getDate(), 1);
    assert.equal(newYear.getFullYear(), 2027);

    const epiphany = countdown.nextOccurrence(1, 6, local(2026, 11, 31));
    assert.equal(epiphany.getMonth(), 0);
    assert.equal(epiphany.getDate(), 6);
    assert.equal(epiphany.getFullYear(), 2027);
  });

  it("works for a mid-year holiday such as Pentecost's fixed-date cousin", () => {
    const target = countdown.nextOccurrence(6, 14, local(2026, 5, 1));
    assert.equal(target.getFullYear(), 2026);
    assert.equal(target.getMonth(), 5);
    assert.equal(target.getDate(), 14);
  });

  it("rolls across a leap year", () => {
    assert.equal(countdown.nextOccurrence(12, 25, local(2028, 11, 27)).getFullYear(), 2029);
    assert.equal(countdown.nextOccurrence(12, 25, local(2028, 1, 29)).getFullYear(), 2028);
  });

  it("defaults `now` to the current time", () => {
    const target = countdown.nextOccurrence(12, 25);
    assert.equal(target.getMonth(), 11);
    assert.equal(target.getDate(), 25);
    assert.ok(target.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 366);
  });
});

describe("getOccurrenceYear", () => {
  it("keeps the current year mid-year", () => {
    assert.equal(countdown.getOccurrenceYear(12, 25, local(2026, 6, 15)), 2026);
  });

  it("keeps the current year late on the day before", () => {
    assert.equal(countdown.getOccurrenceYear(12, 25, local(2026, 11, 24, 23, 59, 59)), 2026);
  });

  it("keeps the day itself", () => {
    assert.equal(countdown.getOccurrenceYear(12, 25, local(2026, 11, 25, 12, 0, 0)), 2026);
  });

  it("rolls to next year from the day after", () => {
    assert.equal(countdown.getOccurrenceYear(12, 25, local(2026, 11, 26, 0, 0, 0)), 2027);
  });

  it("rolls to next year in January", () => {
    assert.equal(countdown.getOccurrenceYear(12, 25, local(2027, 0, 3)), 2027);
  });
});

describe("isOccurrenceDay", () => {
  it("is true only on the day itself", () => {
    assert.equal(countdown.isOccurrenceDay(12, 25, local(2026, 11, 25, 0, 0, 0)), true);
    assert.equal(countdown.isOccurrenceDay(12, 25, local(2026, 11, 25, 23, 59, 59)), true);
    assert.equal(countdown.isOccurrenceDay(12, 25, local(2026, 11, 24, 23, 59, 59)), false);
    assert.equal(countdown.isOccurrenceDay(12, 25, local(2026, 11, 26, 0, 0, 0)), false);
  });

  it("does not fire for the same day number in another month", () => {
    assert.equal(countdown.isOccurrenceDay(1, 25, local(2026, 11, 25)), false);
  });
});

describe("getRemainingFor", () => {
  it("counts down to the given occurrence", () => {
    const remaining = countdown.getRemainingFor(12, 25, local(2026, 6, 15, 12, 0, 0));
    assert.equal(remaining.isOccurrenceDay, false);
    assert.equal(remaining.days, 162);
    assert.equal(remaining.hours, 12);
    assert.equal(remaining.minutes, 0);
    assert.equal(remaining.seconds, 0);
  });

  it("is all zero on the day itself", () => {
    const remaining = countdown.getRemainingFor(12, 25, local(2026, 11, 25, 14, 30, 0));
    assert.equal(remaining.isOccurrenceDay, true);
    assert.equal(remaining.totalMs, 0);
    assert.equal(remaining.days, 0);
    assert.equal(remaining.hours, 0);
    assert.equal(remaining.minutes, 0);
    assert.equal(remaining.seconds, 0);
  });

  it("points at next year's occurrence from the day after", () => {
    const remaining = countdown.getRemainingFor(12, 25, local(2026, 11, 26, 0, 0, 30));
    assert.equal(remaining.isOccurrenceDay, false);
    assert.equal(remaining.target.getFullYear(), 2027);
    assert.equal(remaining.days, 363);
    assert.equal(remaining.hours, 23);
    assert.equal(remaining.minutes, 59);
    assert.equal(remaining.seconds, 30);
  });
});

describe("getRemainingUntil (moveable feasts plug in here)", () => {
  it("counts down to an explicit target Date", () => {
    const target = new Date(2026, 3, 5, 0, 0, 0, 0);
    const remaining = countdown.getRemainingUntil(target, local(2026, 3, 1, 0, 0, 0));
    assert.equal(remaining.target, target);
    assert.equal(remaining.days, 4);
    assert.equal(remaining.hours, 0);
    assert.equal(remaining.isOccurrenceDay, false);
  });

  it("reports the target day itself", () => {
    const target = new Date(2026, 3, 5, 0, 0, 0, 0);
    const remaining = countdown.getRemainingUntil(target, local(2026, 3, 5, 9, 0, 0));
    assert.equal(remaining.isOccurrenceDay, true);
    assert.equal(remaining.totalMs, 0);
  });
});

describe("Christmas wrappers keep the old API", () => {
  it("getChristmasYear matches the generic primitive", () => {
    assert.equal(countdown.getChristmasYear(local(2026, 6, 15)), 2026);
    assert.equal(countdown.getChristmasYear(local(2026, 11, 25, 12, 0, 0)), 2026);
    assert.equal(countdown.getChristmasYear(local(2026, 11, 26, 0, 0, 1)), 2027);
    assert.equal(countdown.getChristmasYear(local(2027, 0, 3)), 2027);
  });

  it("getChristmasTarget matches the generic primitive", () => {
    const fromHelper = countdown.getChristmasTarget(local(2026, 11, 26, 9, 15));
    const fromGeneric = countdown.nextOccurrence(12, 25, local(2026, 11, 26, 9, 15));
    assert.equal(fromHelper.getTime(), fromGeneric.getTime());
  });

  it("isChristmasDay is true only on 25 December", () => {
    assert.equal(countdown.isChristmasDay(local(2026, 11, 25, 0, 0, 0)), true);
    assert.equal(countdown.isChristmasDay(local(2026, 11, 25, 23, 59, 59)), true);
    assert.equal(countdown.isChristmasDay(local(2026, 11, 24, 23, 59, 59)), false);
    assert.equal(countdown.isChristmasDay(local(2026, 11, 26, 0, 0, 0)), false);
  });

  it("getRemaining adds isChristmas alongside isOccurrenceDay", () => {
    const remaining = countdown.getRemaining(local(2026, 11, 25, 14, 30, 0));
    assert.equal(remaining.isChristmas, true);
    assert.equal(remaining.isOccurrenceDay, true);
    assert.equal(remaining.totalMs, 0);
  });
});

describe("25 vs 26 December boundary", () => {
  it("24 Dec 23:59:59 is still counting down to this year's Christmas", () => {
    const remaining = countdown.getRemaining(local(2026, 11, 24, 23, 59, 59));
    assert.equal(remaining.isChristmas, false);
    assert.equal(remaining.target.getFullYear(), 2026);
    assert.equal(remaining.days, 0);
    assert.equal(remaining.hours, 0);
    assert.equal(remaining.minutes, 0);
    assert.equal(remaining.seconds, 1);
  });

  it("25 Dec 00:00:00 is the Christmas state", () => {
    const remaining = countdown.getRemaining(local(2026, 11, 25, 0, 0, 0));
    assert.equal(remaining.isChristmas, true);
    assert.equal(remaining.totalMs, 0);
  });

  it("25 Dec 23:59:59 is still the Christmas state", () => {
    const remaining = countdown.getRemaining(local(2026, 11, 25, 23, 59, 59));
    assert.equal(remaining.isChristmas, true);
    assert.equal(remaining.totalMs, 0);
  });

  it("26 Dec 00:00:00 is back to the countdown, one year out", () => {
    const remaining = countdown.getRemaining(local(2026, 11, 26, 0, 0, 0));
    assert.equal(remaining.isChristmas, false);
    assert.equal(remaining.target.getFullYear(), 2027);
    assert.equal(remaining.target.getMonth(), 11);
    assert.equal(remaining.target.getDate(), 25);
    assert.equal(remaining.days, 364);
    assert.equal(remaining.hours, 0);
    assert.equal(remaining.minutes, 0);
    assert.equal(remaining.seconds, 0);
  });

  it("never treats second Christmas day as Christmas", () => {
    for (const hours of [0, 6, 12, 23]) {
      assert.equal(countdown.isChristmasDay(local(2026, 11, 26, hours)), false);
    }
  });

  it("keeps rolling forward every year", () => {
    for (const year of [2026, 2027, 2028, 2029, 2030]) {
      assert.equal(countdown.getChristmasTarget(local(year, 11, 26)).getFullYear(), year + 1);
      assert.equal(countdown.getChristmasTarget(local(year, 0, 1)).getFullYear(), year);
    }
  });
});

describe("getRemaining leap years and midnight edges", () => {
  it("handles a leap-year rollover", () => {
    const remaining = countdown.getRemaining(local(2028, 1, 1, 0, 0, 0));
    assert.equal(remaining.target.getFullYear(), 2028);
    assert.equal(remaining.days, 328);
    assert.equal(remaining.hours, 0);
  });

  it("never returns negative values just after midnight on New Year's Day", () => {
    const remaining = countdown.getRemaining(local(2027, 0, 1, 0, 0, 1));
    assert.ok(remaining.days > 300);
    assert.equal(remaining.target.getFullYear(), 2027);
  });
});
