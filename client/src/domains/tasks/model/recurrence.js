import { isoDate } from "./schedule.js";

export function shiftDate(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function recurringStart(tasks, fallback) {
  return tasks.reduce((start, task) => ["daily", "weekly"].includes(task.recurrence) && task.due < start ? task.due : start, fallback);
}

export function scheduledOn(task, date) {
  return task.recurrence !== "weekly" || (task.recurrence_days || []).includes(new Date(`${date}T12:00:00Z`).getUTCDay());
}

export function dailyStreak(task, today) {
  if (task.recurrence === "weekly" && !task.recurrence_days?.length) return 0;
  if ((task.occurrences || []).some(day => day.due === today && day.skipped)) return 0;
  const completed = new Set((task.occurrences || []).filter(day => day.done && !day.skipped).map(day => day.due));
  let date = task.recurrence_until && task.recurrence_until < today ? task.recurrence_until : today;
  while (date >= task.due && !scheduledOn(task, date)) date = shiftDate(date, -1);
  if (date === today && !completed.has(date)) date = shiftDate(date, -1);
  while (date >= task.due && !scheduledOn(task, date)) date = shiftDate(date, -1);
  let streak = 0;
  while (date >= task.due && completed.has(date)) {
    streak += 1;
    date = shiftDate(date, -1);
    while (date >= task.due && !scheduledOn(task, date)) date = shiftDate(date, -1);
  }
  return streak;
}

export function expandRecurringTasks(tasks, from, to, now) {
  const result = [];
  const today = isoDate(now);
  for (const task of tasks) {
    if (!["daily", "weekly"].includes(task.recurrence)) {
      result.push(task);
      continue;
    }
    const history = new Map((task.occurrences || []).map(day => [day.due, day]));
    const end = task.recurrence_until && task.recurrence_until < to ? task.recurrence_until : to;
    const streak = dailyStreak(task, today);
    for (let due = task.due > from ? task.due : from; due <= end; due = shiftDate(due, 1)) {
      if (!scheduledOn(task, due)) continue;
      const day = history.get(due);
      if (day?.skipped) continue;
      result.push({ ...task, id: `daily:${task.id}:${due}`, source_id: task.id, series_start: task.due, due, done: !!day?.done, streak });
    }
  }
  return result;
}
