/**
 * Shared recurring-date countdown maths for the Almost Christmas site.
 *
 * Loaded as a plain script (defines the `XmasCountdown` global) or required from
 * Node tests (`module.exports`). No bundler, no module syntax, so classic
 * <script> tags keep working.
 *
 * Generic API — use this for any fixed-date holiday, e.g. New Year's Day
 * (`nextOccurrence(1, 1)`) or a future Easter page:
 *
 *   XmasCountdown.nextOccurrence(month, day, now)  // Date: next `day`/`month` at 00:00 local
 *   XmasCountdown.getOccurrenceYear(month, day, now) // the calendar year that target falls in
 *   XmasCountdown.isOccurrenceDay(month, day, now)   // true only on that calendar day
 *   XmasCountdown.getRemainingFor(month, day, now)   // { days, hours, minutes, seconds, ... }
 *
 * `month` is 1-based (1 = January, 12 = December), matching how holidays are
 * written, unlike JavaScript's 0-based `Date` months.
 *
 * Moveable feasts (Easter, Pentecost) do not have a fixed month/day, so they do
 * not go through `nextOccurrence`. They plug in the same way at the page level:
 * compute the date for the year with a small astronomical/ecclesiastical
 * algorithm and hand the resulting Date to `getRemainingUntil(target, now)`.
 * Nothing here assumes Christmas, so those pages reuse the same splitting code.
 *
 * Christmas convenience wrappers (kept stable for the root page and tests):
 *
 *   XmasCountdown.getChristmasTarget(now) // Date: 25 Dec 00:00 local, next one
 *   XmasCountdown.getRemaining(now)       // { days, hours, minutes, seconds, isChristmas, ... }
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.XmasCountdown = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 1-based calendar month, so it reads the same as the holiday itself.
  var CHRISTMAS_MONTH = 12;
  var CHRISTMAS_DAY = 25;

  var DAY_MS = 1000 * 60 * 60 * 24;
  var HOUR_MS = 1000 * 60 * 60;
  var MINUTE_MS = 1000 * 60;

  function toDate(value) {
    if (value == null) return new Date();
    return value instanceof Date ? value : new Date(value);
  }

  // The calendar year the next occurrence of day/month falls in: the current
  // year on the day itself, next year from the day after. On 25 December it is
  // today's Christmas (remaining time zero); from 26 December it rolls over.
  function getOccurrenceYear(month, day, now) {
    var date = toDate(now);
    var year = date.getFullYear();
    var currentMonth = date.getMonth() + 1;
    var currentDay = date.getDate();
    if (currentMonth > month || (currentMonth === month && currentDay > day)) {
      year++;
    }
    return year;
  }

  // Next occurrence of day/month at 00:00 local time of this machine.
  function nextOccurrence(month, day, now) {
    return new Date(getOccurrenceYear(month, day, now), month - 1, day, 0, 0, 0, 0);
  }

  function isOccurrenceDay(month, day, now) {
    var date = toDate(now);
    return date.getMonth() + 1 === month && date.getDate() === day;
  }

  // Wall-clock difference: both sides as if they were UTC, so a DST change
  // doesn't add or remove an hour. Milliseconds are dropped, so the seconds
  // tile ticks once per second.
  function wallClockDiff(now, target) {
    var from = Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    var to = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    return to - from;
  }

  function splitRemaining(now, target) {
    var date = toDate(now);
    var totalMs = Math.max(0, wallClockDiff(date, target));
    return {
      target: target,
      isOccurrenceDay: date.getFullYear() === target.getFullYear() &&
        date.getMonth() === target.getMonth() &&
        date.getDate() === target.getDate(),
      totalMs: totalMs,
      days: Math.floor(totalMs / DAY_MS),
      hours: Math.floor((totalMs % DAY_MS) / HOUR_MS),
      minutes: Math.floor((totalMs % HOUR_MS) / MINUTE_MS),
      seconds: Math.floor((totalMs % MINUTE_MS) / 1000)
    };
  }

  // Countdown to an explicit target Date. Moveable feasts (Easter, Pentecost)
  // compute their own target and call this.
  function getRemainingUntil(target, now) {
    return splitRemaining(now, toDate(target));
  }

  function getRemainingFor(month, day, now) {
    var date = toDate(now);
    return splitRemaining(date, nextOccurrence(month, day, date));
  }

  // --- Christmas wrappers -------------------------------------------------

  function getChristmasYear(now) {
    return getOccurrenceYear(CHRISTMAS_MONTH, CHRISTMAS_DAY, now);
  }

  function getChristmasTarget(now) {
    return nextOccurrence(CHRISTMAS_MONTH, CHRISTMAS_DAY, now);
  }

  function isChristmasDay(now) {
    return isOccurrenceDay(CHRISTMAS_MONTH, CHRISTMAS_DAY, now);
  }

  function getRemaining(now) {
    var remaining = getRemainingFor(CHRISTMAS_MONTH, CHRISTMAS_DAY, now);
    remaining.isChristmas = isChristmasDay(now);
    return remaining;
  }

  return {
    CHRISTMAS_MONTH: CHRISTMAS_MONTH,
    CHRISTMAS_DAY: CHRISTMAS_DAY,
    getOccurrenceYear: getOccurrenceYear,
    nextOccurrence: nextOccurrence,
    isOccurrenceDay: isOccurrenceDay,
    getRemainingFor: getRemainingFor,
    getRemainingUntil: getRemainingUntil,
    getChristmasYear: getChristmasYear,
    getChristmasTarget: getChristmasTarget,
    isChristmasDay: isChristmasDay,
    getRemaining: getRemaining
  };
});
