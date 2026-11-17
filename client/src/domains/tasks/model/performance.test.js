import test from "node:test";
import assert from "node:assert/strict";
import { buildPerformance } from "./performance.js";

const now = new Date(2026, 10, 16, 12, 0);
const tasks = [
  { id: 1, type_id: 10, category: "Trabalho", category_color: "#6366f1", done: true, priority: 1, due: "2026-11-15" },
  { id: 2, type_id: 10, category: "Trabalho", category_color: "#6366f1", done: false, priority: 2, due: "2026-11-16", due_time: "13:00" },
  { id: 3, type_id: 11, category: "Físico", done: false, priority: 1, due: "2026-11-16", due_time: "11:00" },
  { id: 4, type_id: 11, category: "Físico", done: false, priority: 2, due: "2026-11-14" },
  { id: 5, category: "Pessoal", done: true, priority: 3, due: null },
  { id: 6, type_id: 12, category: "Estudos", done: false, priority: 3, due: "2026-12-01" },
];

test("performance partitions statuses and calculates completion across types and priorities", () => {
  const data = buildPerformance(tasks, now);
  assert.equal(data.total, 6);
  assert.equal(data.completed, 2);
  assert.equal(data.open, 4);
  assert.equal(data.overdue, 2);
  assert.equal(data.scheduled, 2);
  assert.equal(data.completionRate, 33);
  assert.equal(data.completed + data.scheduled + data.overdue, data.total);
  assert.equal(data.types.length, 4);
  const work = data.types.find(type => type.id === 10);
  assert.equal(work.completed, 1);
  assert.equal(work.total, 2);
  assert.equal(data.priorities.reduce((sum, row) => sum + row.total, 0), data.total);
  assert.equal(data.days.at(-1).total, 2);
  assert.equal(data.days.reduce((sum, day) => sum + day.total, 0), 4);
});

test("periods use deadline dates and exclude undated and future records from the last seven days", () => {
  const week = buildPerformance(tasks, now, "week");
  assert.equal(week.total, 4);
  assert.equal(week.completed, 1);
  assert.equal(week.completionRate, 25);
  const month = buildPerformance(tasks, now, "month");
  assert.equal(month.total, 4);
  const boundary = buildPerformance([
    { category: "Casa", done: true, priority: 2, due: "2026-12-27" },
    { category: "Casa", done: true, priority: 2, due: "2026-12-28" },
    { category: "Casa", done: false, priority: 2, due: "2027-01-03" },
    { category: "Casa", done: false, priority: 2, due: "2027-01-04" },
  ], new Date(2027, 0, 3, 12), "week");
  assert.equal(boundary.total, 2);
  assert.equal(boundary.days[0].due, "2026-12-28");
  assert.equal(boundary.days.at(-1).due, "2027-01-03");
});

test("empty datasets and legacy priorities keep finite rates and complete counts", () => {
  const empty = buildPerformance([], now);
  assert.equal(empty.completionRate, 0);
  assert.equal(empty.total, 0);
  assert.equal(empty.days.length, 7);
  const legacy = buildPerformance([{ category: "Legado", done: false, priority: 7 }], now);
  assert.equal(legacy.priorities.find(row => row.id === "other").total, 1);
  assert.equal(legacy.types[0].color, "#64748b");
  assert.equal(legacy.scheduled, 1);
});
