import { isoDate } from "./schedule.js";

export function shiftDate(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function recurringStart(tasks, fallback) {
  return tasks.reduce((start, task) => task.recurrence === "daily" && task.due < start ? task.due : start, fallback);
}

export function dailyStreak(task, today) {
  if ((task.occurrences || []).some(day => day.due === today && day.skipped)) return 0;
  const completed = new Set((task.occurrences || []).filter(day => day.done && !day.skipped).map(day => day.due));
  let date = task.recurrence_until && task.recurrence_until < today ? task.recurrence_until : today;
  if (date === today && !completed.has(date)) date = shiftDate(date, -1);
  let streak = 0;
  while (date >= task.due && completed.has(date)) {
    streak += 1;
    date = shiftDate(date, -1);
  }
  return streak;
}

export function expandRecurringTasks(tasks, from, to, now) {
  const result = [];
  const today = isoDate(now);
  for (const task of tasks) {
    if (task.recurrence !== "daily") {
      result.push(task);
      continue;
    }
    const history = new Map((task.occurrences || []).map(day => [day.due, day]));
    const end = task.recurrence_until && task.recurrence_until < to ? task.recurrence_until : to;
    const streak = dailyStreak(task, today);
    for (let due = task.due > from ? task.due : from; due <= end; due = shiftDate(due, 1)) {
      const day = history.get(due);
      if (day?.skipped) continue;
      result.push({ ...task, id: `daily:${task.id}:${due}`, source_id: task.id, due, done: !!day?.done, streak });
    }
  }
  return result;
}
