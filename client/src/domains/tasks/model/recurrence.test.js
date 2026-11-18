import test from "node:test";
import assert from "node:assert/strict";
import { dailyStreak, expandRecurringTasks, shiftDate } from "./recurrence.js";
import { buildPerformance } from "./performance.js";
import { sortTasks } from "./schedule.js";

const now = new Date(2026, 10, 16, 12);
const daily = {
  id: 7, title: "Caminhar", category: "Físico", priority: 2,
  recurrence: "daily", due: "2026-11-14", due_time: "18:00", recurrence_until: null,
  occurrences: [{ due: "2026-11-14", done: true }, { due: "2026-11-15", done: true }],
};

test("daily occurrences have stable identities and independent completion across dates", () => {
  const entries = expandRecurringTasks([daily], "2026-11-13", "2026-11-17", now);
  assert.deepEqual(entries.map(task => task.due), ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"]);
  assert.deepEqual(entries.map(task => task.done), [true, true, false, false]);
  assert.equal(new Set(entries.map(task => task.id)).size, 4);
  assert.ok(entries.every(task => task.source_id === 7 && task.due_time === "18:00"));
  assert.equal(entries[2].id, expandRecurringTasks([daily], "2026-11-16", "2026-11-16", now)[0].id);
  assert.equal(daily.occurrences.length, 2);
  const oneOff = { ...entries[2], id: 8, source_id: undefined };
  assert.equal(sortTasks([entries[2], oneOff], now)[0].id, 8);
});

test("streak keeps yesterday's sequence while today is open, grows on completion and breaks on missed days", () => {
  assert.equal(dailyStreak(daily, "2026-11-16"), 2);
  const completed = { ...daily, occurrences: [...daily.occurrences, { due: "2026-11-16", done: true }] };
  assert.equal(dailyStreak(completed, "2026-11-16"), 3);
  assert.equal(dailyStreak(daily, "2026-11-17"), 0);
  assert.equal(dailyStreak({ ...daily, occurrences: [...daily.occurrences, { due: "2026-11-16", skipped: true }] }, "2026-11-16"), 0);
  assert.equal(dailyStreak({ ...completed, occurrences: completed.occurrences.filter(day => day.due !== "2026-11-15") }, "2026-11-16"), 1);
});

test("end dates and skipped days bound the series and interrupt the streak", () => {
  const task = { ...daily, recurrence_until: "2026-11-16", occurrences: [
    ...daily.occurrences, { due: "2026-11-16", done: false, skipped: true },
  ] };
  const entries = expandRecurringTasks([task], "2026-11-14", "2026-12-31", now);
  assert.equal(entries.length, 2);
  assert.equal(dailyStreak(task, "2026-11-17"), 0);
  assert.equal(expandRecurringTasks([{ ...daily, due: "2026-12-01" }], "2026-11-01", "2026-11-30", now).length, 0);
});

test("statistics include daily history through today and future calendar browsing does not change it", () => {
  const performance = buildPerformance([daily], now);
  assert.equal(performance.total, 3);
  assert.equal(performance.completed, 2);
  assert.equal(performance.completionRate, 67);
  expandRecurringTasks([daily], "2027-01-01", "2027-02-01", now);
  assert.deepEqual(buildPerformance([daily], now), performance);
  const normal = { id: 8, title: "Avulsa", category: "Casa", done: false, priority: 2, due: null };
  assert.equal(expandRecurringTasks([normal], "2026-11-01", "2026-11-30", now)[0], normal);
});

test("date iteration handles leap days and year boundaries", () => {
  assert.equal(shiftDate("2028-02-28", 1), "2028-02-29");
  assert.equal(shiftDate("2028-02-29", 1), "2028-03-01");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2027-01-01", -1), "2026-12-31");
});


test("weekly repetition selects weekdays and preserves streaks across rest days", () => {
  const weekly={...daily,id:9,due:'2026-11-16',recurrence:'weekly',recurrence_days:[1,3,5],recurrence_until:'2026-11-27',occurrences:[{due:'2026-11-16',done:true},{due:'2026-11-18',done:true}]};
  const entries=expandRecurringTasks([weekly],'2026-11-15','2026-12-05',new Date('2026-11-19T12:00:00'));
  assert.deepEqual(entries.map(task=>task.due),['2026-11-16','2026-11-18','2026-11-20','2026-11-23','2026-11-25','2026-11-27']);
  assert.equal(dailyStreak(weekly,'2026-11-19'),2);
  assert.equal(dailyStreak(weekly,'2026-11-20'),2);
  assert.equal(dailyStreak(weekly,'2026-11-21'),0);
  assert.equal(dailyStreak({...weekly,occurrences:[...weekly.occurrences,{due:'2026-11-20',skipped:true}]},'2026-11-20'),0);
  assert.equal(entries[0].source_id,9);
});
