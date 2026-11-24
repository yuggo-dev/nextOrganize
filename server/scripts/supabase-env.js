// Conexão usada só pelos scripts de manutenção do banco de produção (Supabase).
// Fica em SUPABASE_DATABASE_URL, separada de DATABASE_URL, para que preencher
// o .env para uma migração não faça o Express local (npm run dev) usar a produção.
export function supabaseDatabaseUrl() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (url) return url;
  const hint = process.env.DATABASE_URL
    ? 'Os scripts do Supabase agora leem SUPABASE_DATABASE_URL. Renomeie DATABASE_URL para SUPABASE_DATABASE_URL no .env da raiz; DATABASE_URL faz o Express usar PostgreSQL.'
    : 'Configure SUPABASE_DATABASE_URL no .env da raiz com a conexão Session pooler do Supabase.';
  throw Object.assign(new Error(hint), { hint });
}
