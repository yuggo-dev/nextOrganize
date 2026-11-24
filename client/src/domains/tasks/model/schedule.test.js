import test from "node:test";
import assert from "node:assert/strict";
import { calendarDays, daysFromToday, isMissed, isOverdue, isPending, isoDate, sortTasks } from "./schedule.js";

test("today comes before future and overdue tasks and time breaks ties", () => {
  const now = new Date(2026, 10, 16, 12, 0);
  const task = (id, due, due_time, done = false) => ({ id, due, due_time, done, priority: 2 });
  const entries = [task(1, "2026-11-15", "09:00"), task(2, "2026-11-17", "09:00"),
    task(3, "2026-11-16", "18:00"), task(4, "2026-11-16", "14:00"),
    task(5, "2026-11-16", "10:00"), task(6, "2026-11-16", "13:00", true)];
  assert.deepEqual(sortTasks(entries, now).map(task => task.id), [4, 3, 2, 1, 5, 6]);
  assert.equal(isOverdue(entries[4], now), true);
  assert.equal(isOverdue(task(7, "2026-11-16", null), now), false);
  assert.equal(isOverdue(task(8, "2026-11-15", "09:00", true), now), false);
});

test("regulares só atrasam depois do dia e quando contam atraso; senão ficam não feitas", () => {
  const now = new Date(2026, 10, 16, 23, 0);
  const regular = (due, tracks_overdue, done = false) => ({ recurrence: "daily", due, tracks_overdue, done, notify_time: "07:00", priority: 2 });
  // Durante o próprio dia, mesmo depois do horário de notificação, não atrasa.
  assert.equal(isOverdue(regular("2026-11-16", true), now), false);
  assert.equal(isMissed(regular("2026-11-16", false), now), false);
  // Dia passado: atrasada ou não feita, conforme a escolha.
  assert.equal(isOverdue(regular("2026-11-15", true), now), true);
  assert.equal(isMissed(regular("2026-11-15", true), now), false);
  assert.equal(isOverdue(regular("2026-11-15", false), now), false);
  assert.equal(isMissed(regular("2026-11-15", false), now), true);
  assert.equal(isPending(regular("2026-11-15", false), now), false);
  assert.equal(isPending(regular("2026-11-15", true), now), true);
  // Concluída nunca é atrasada nem não feita.
  assert.equal(isMissed(regular("2026-11-15", false, true), now), false);
  // Não feitas vão depois das atrasadas e antes das concluídas.
  const order = sortTasks([
    { id: 1, ...regular("2026-11-15", false) },
    { id: 2, ...regular("2026-11-15", true) },
    { id: 3, ...regular("2026-11-15", true, true) },
  ], now).map(task => task.id);
  assert.deepEqual(order, [2, 1, 3]);
});

test("calendar includes 42 consecutive local dates and handles leap years and seven-day boundaries", () => {
  const cells = calendarDays(new Date(2028, 1, 1));
  assert.equal(cells.length, 42);
  assert.equal(cells[0].getDay(), 0);
  assert.ok(cells.some(date => isoDate(date) === "2028-02-29"));
  assert.equal(new Set(cells.map(isoDate)).size, 42);
  const now = new Date(2026, 11, 28, 23, 59);
  assert.equal(daysFromToday("2027-01-04", now), 7);
  assert.equal(daysFromToday("2027-01-05", now), 8);
});
