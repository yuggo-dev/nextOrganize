export async function call(path, opts = {}) {
  const res = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json", "X-Requested-With": "tarefas" },
    credentials: "same-origin",
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth")) {
      window.dispatchEvent(new Event("session-expired"));
    }
    throw new Error((await res.json().catch(() => ({}))).error || "Erro " + res.status);
  }
  return res.status === 204 ? null : res.json();
}

