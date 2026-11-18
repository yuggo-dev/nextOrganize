ALTER TABLE tarefas.tasks ADD COLUMN IF NOT EXISTS recurrence_days TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tarefas.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_check;
ALTER TABLE tarefas.tasks ADD CONSTRAINT tasks_recurrence_check CHECK (recurrence IN ('none', 'daily', 'weekly'));
