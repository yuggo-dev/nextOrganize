import test from "node:test";
import assert from "node:assert/strict";
import { buildHabits } from "./habits.js";

const now = new Date(2026, 10, 24, 10);
const habit = (overrides = {}) => ({
  id: 1, title: "Meditar", recurrence: "daily", due: "2026-11-18", category: "Pessoal",
  occurrences: [], ...overrides,
});

test("consistência ignora hoje em aberto e conta não feitos", () => {
  const data = buildHabits([habit({ occurrences: [
    { due: "2026-11-21", done: true }, { due: "2026-11-22", done: true }, { due: "2026-11-23", done: true },
  ] })], now, 7);
  const [meditar] = data.habits;
  assert.equal(meditar.expected, 6); // 18 a 23; hoje (24) está pendente
  assert.equal(meditar.done, 3);
  assert.equal(meditar.rate, 50);
  assert.equal(meditar.streak, 3);
  assert.equal(meditar.best, 3);
  assert.equal(meditar.todayStatus, "pending");
  assert.equal(data.perfectDays, 3);
});

test("hábito semanal só conta os dias programados e a melhor sequência", () => {
  const data = buildHabits([habit({
    recurrence: "weekly", recurrence_days: [1, 3], due: "2026-11-02",
    occurrences: [{ due: "2026-11-02", done: true }, { due: "2026-11-04", done: true }, { due: "2026-11-09", done: true }, { due: "2026-11-23", done: true }],
  })], now, 28);
  const [weekly] = data.habits;
  assert.equal(weekly.expected, 7); // seg e qua de 02/11 a 23/11
  assert.equal(weekly.done, 4);
  assert.equal(weekly.best, 3);
  assert.equal(weekly.streak, 1);
});

test("tarefas pontuais não entram nos hábitos", () => {
  const data = buildHabits([{ id: 2, title: "Relatório", recurrence: "none", due: "2026-11-24" }], now);
  assert.equal(data.habits.length, 0);
  assert.equal(data.consistency, null);
});
