import { isoDate } from "./schedule.js";
import { dailyStreak, scheduledOn, shiftDate } from "./recurrence.js";

export const isHabit = task => ["daily", "weekly"].includes(task.recurrence);

// Estado de um dia de um hábito: fora da programação, removido, feito, não
// feito (dia passado) ou pendente (hoje ainda em aberto).
function dayStatus(task, date, today, history) {
  if (date < task.due || (task.recurrence_until && date > task.recurrence_until) || date > today || !scheduledOn(task, date)) return "off";
  const entry = history.get(date);
  if (entry?.skipped) return "off";
  if (entry?.done) return "done";
  return date === today ? "pending" : "missed";
}

// Maior sequência de dias programados cumpridos em todo o histórico.
function bestStreak(task, today, history) {
  let best = 0;
  let current = 0;
  const end = task.recurrence_until && task.recurrence_until < today ? task.recurrence_until : today;
  for (let date = task.due; date <= end; date = shiftDate(date, 1)) {
    const status = dayStatus(task, date, today, history);
    if (status === "done") best = Math.max(best, ++current);
    else if (status === "missed") current = 0;
  }
  return best;
}

// Desempenho dos hábitos (tarefas diárias e semanais) numa janela de dias até
// hoje. Hoje só conta na taxa se já foi feito, para não punir o dia em curso.
export function buildHabits(tasks, now, windowDays = 28) {
  const today = isoDate(now);
  const start = shiftDate(today, -(windowDays - 1));
  const dates = Array.from({ length: windowDays }, (_, index) => shiftDate(start, index));
  const weekdays = Array.from({ length: 7 }, () => ({ expected: 0, done: 0 }));
  const perDay = new Map(dates.map(date => [date, { expected: 0, done: 0 }]));

  const habits = tasks.filter(isHabit).map(task => {
    const history = new Map((task.occurrences || []).map(day => [day.due, day]));
    const days = dates.map(date => ({ date, status: dayStatus(task, date, today, history) }));
    let expected = 0;
    let done = 0;
    for (const day of days) {
      if (day.status === "off" || day.status === "pending") continue;
      expected += 1;
      done += day.status === "done" ? 1 : 0;
      const weekday = weekdays[new Date(`${day.date}T12:00:00Z`).getUTCDay()];
      weekday.expected += 1;
      weekday.done += day.status === "done" ? 1 : 0;
      const total = perDay.get(day.date);
      total.expected += 1;
      total.done += day.status === "done" ? 1 : 0;
    }
    return {
      id: task.id,
      title: task.title,
      recurrence: task.recurrence,
      recurrence_days: task.recurrence_days || [],
      category: task.category,
      icon: task.category_icon || null,
      color: task.category_color || "#64748b",
      expected,
      done,
      rate: expected ? Math.round(done / expected * 100) : null,
      streak: dailyStreak(task, today),
      best: bestStreak(task, today, history),
      todayStatus: dayStatus(task, today, today, history),
      days,
    };
  }).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || b.streak - a.streak || a.title.localeCompare(b.title, "pt-BR"));

  const expected = habits.reduce((sum, habit) => sum + habit.expected, 0);
  const done = habits.reduce((sum, habit) => sum + habit.done, 0);
  const perfectDays = [...perDay.values()].filter(day => day.expected > 0 && day.done === day.expected).length;
  const activeDays = [...perDay.values()].filter(day => day.expected > 0).length;

  return {
    windowDays,
    habits,
    expected,
    done,
    consistency: expected ? Math.round(done / expected * 100) : null,
    perfectDays,
    activeDays,
    bestCurrent: habits.reduce((best, habit) => habit.streak > (best?.streak ?? 0) ? habit : best, null),
    todayDone: habits.filter(habit => habit.todayStatus === "done").length,
    todayTotal: habits.filter(habit => habit.todayStatus !== "off").length,
    weekdays: weekdays.map((day, index) => ({ index, ...day, rate: day.expected ? Math.round(day.done / day.expected * 100) : null })),
  };
}
