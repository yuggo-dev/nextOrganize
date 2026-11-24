-- Regulares: horário de notificação no lugar do horário de conclusão, e escolha
-- de contar ou não atraso quando o dia passa sem conclusão. Pode ser repetida.
ALTER TABLE tarefas.tasks ADD COLUMN IF NOT EXISTS notify_time TEXT;
ALTER TABLE tarefas.tasks ADD COLUMN IF NOT EXISTS tracks_overdue INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tarefas.tasks DROP CONSTRAINT IF EXISTS tasks_tracks_overdue_check;
ALTER TABLE tarefas.tasks ADD CONSTRAINT tasks_tracks_overdue_check CHECK (tracks_overdue IN (0, 1));
UPDATE tarefas.tasks SET notify_time = due_time, due_time = NULL
  WHERE recurrence <> 'none' AND due_time IS NOT NULL;
