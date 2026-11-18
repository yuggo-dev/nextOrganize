import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const files = [
  'edge/handler.js', 'infrastructure/postgres.js', 'infrastructure/postgres-repositories.js',
  'shared/http.js', 'domains/auth/service.js', 'domains/auth/repository.js',
  'domains/tasks/service.js', 'domains/tasks/postgres-service.js', 'domains/tasks/repository.js',
  'domains/tasks/validation.js', 'domains/task-types/repository.js', 'domains/task-types/service.js',
];
const destination = new URL('../../supabase/functions/_shared/backend/', import.meta.url);
for (const file of files) {
  const target = new URL(file, destination);
  await mkdir(fileURLToPath(new URL('.', target)), { recursive:true });
  await cp(new URL('../src/' + file, import.meta.url), target);
}
console.log('Código compartilhado da Edge Function atualizado.');
