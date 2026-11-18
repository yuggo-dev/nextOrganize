const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const tokenKey = 'tarefas-session:' + apiBase;
export function saveSessionToken(token) {
  if (token) sessionStorage.setItem(tokenKey, token);
  else sessionStorage.removeItem(tokenKey);
}

export async function call(path, opts = {}) {
  const token = sessionStorage.getItem(tokenKey);
  const res = await fetch(apiBase + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json', 'X-Requested-With': 'tarefas',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...opts.headers,
    },
    credentials: apiBase.startsWith('http') ? 'omit' : 'same-origin',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth')) {
      saveSessionToken(null);
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new Error((await res.json().catch(() => ({}))).error || 'Erro ' + res.status);
  }
  return res.status === 204 ? null : res.json();
}
