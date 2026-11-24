import { useEffect, useState } from "react";
import Dashboard from "../tasks/Dashboard.jsx";
import { authApi as api } from "./api.js";
import Logo, { LogoMark } from "../../shared/components/Logo.jsx";

export default function Auth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    let active = true;
    api.me()
      .then(result => { if (active) setUser(result.user); })
      .catch(() => { if (active) setError("Não foi possível conectar ao servidor. Tente novamente."); })
      .finally(() => { if (active) setLoading(false); });
    const expire = () => {
      setUser(null);
      setError("Sua sessão expirou. Entre novamente.");
    };
    window.addEventListener("session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expire);
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api[mode](form);
      setUser(result.user);
      setForm({ name: "", email: "", password: "" });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      await api.logout();
      setUser(null);
      setMode("login");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="wrap app-loading" role="status"><LogoMark size={44} />Carregando sua conta…</div>;

  if (user) {
    return <Dashboard key={user.id} user={user} onLogout={logout} loggingOut={busy} sessionError={error} />;
  }

  const registering = mode === "register";
  return (
    <main className="wrap auth-wrap">
      <div className="auth-brand">
        <Logo size={46} />
        <p className="auth-tagline">Sua agenda pessoal, um próximo passo de cada vez.</p>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{registering ? "Criar sua conta" : "Entrar"}</h1>
      <p className="sub">{registering ? "Comece a organizar tarefas, rotinas e prazos." : "Acesse suas tarefas e prazos."}</p>
      {error && <div className="err" role="alert">{error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          {registering && <label>Nome
            <input name="name" autoComplete="name" required maxLength={100}
              value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
          </label>}
          <label>E-mail
            <input name="email" type="email" autoComplete="username" required maxLength={254}
              value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>Senha
            <input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"}
              required minLength={registering ? 8 : undefined} maxLength={128}
              aria-describedby={registering ? "password-help" : undefined}
              value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          </label>
          {registering && <small id="password-help">Use pelo menos 8 caracteres.</small>}
          <button className="main" type="submit">{busy ? "Aguarde…" : registering ? "Criar conta" : "Entrar"}</button>
        </fieldset>
      </form>
      <p className="auth-switch">{registering ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
        <button type="button" className="link-button" disabled={busy} onClick={() => {
          setMode(registering ? "login" : "register");
          setError("");
          setForm({ ...form, password: "" });
        }}>{registering ? "Entrar" : "Criar uma conta"}</button>
      </p>
      </section>
    </main>
  );
}
