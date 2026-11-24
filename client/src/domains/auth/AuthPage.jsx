import { useEffect, useState } from "react";
import Dashboard from "../tasks/Dashboard.jsx";
import { authApi as api } from "./api.js";
import { FiArrowRight, FiCalendar, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiRepeat, FiTag, FiUser } from "react-icons/fi";
import Logo, { LogoMark } from "../../shared/components/Logo.jsx";

export default function Auth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const switchMode = next => {
    if (next === mode) return;
    setMode(next);
    setError("");
    setShowPassword(false);
    setForm({ ...form, password: "" });
  };
  return (
    <>
    {/* Fora do <main>: a animação de entrada usa transform, que prenderia o fundo fixo ao bloco. */}
    <div className="auth-backdrop" aria-hidden="true" />
    <main className="auth-shell">
      <section className="auth-showcase" aria-label="Sobre o nextOrganize">
        <Logo size={44} />
        <h2 className="auth-headline">Organize o dia.<br /><span>Avance um passo de cada vez.</span></h2>
        <p className="auth-lead">Tarefas, rotinas semanais e prazos no mesmo lugar, com o próximo passo sempre à vista.</p>
        <AgendaPreview />
        <ul className="auth-features">
          <li><FiRepeat aria-hidden="true" />Rotinas que se repetem</li>
          <li><FiCalendar aria-hidden="true" />Calendário do mês</li>
          <li><FiTag aria-hidden="true" />Tipos com cor e ícone</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-tabs" role="group" aria-label="Escolha como continuar">
          <button type="button" aria-pressed={!registering} disabled={busy} onClick={() => switchMode("login")}>Entrar</button>
          <button type="button" aria-pressed={registering} disabled={busy} onClick={() => switchMode("register")}>Criar conta</button>
        </div>
        <h1 id="auth-title">{registering ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
        <p className="sub">{registering ? "Leva menos de um minuto para começar." : "Entre para ver o que vem a seguir."}</p>
        {error && <div className="err" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <fieldset disabled={busy}>
            {registering && <label>Nome
              <span className="auth-input"><FiUser aria-hidden="true" />
                <input name="name" autoComplete="name" required maxLength={100} placeholder="Como quer ser chamado"
                  value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
              </span>
            </label>}
            <label>E-mail
              <span className="auth-input"><FiMail aria-hidden="true" />
                <input name="email" type="email" autoComplete="username" required maxLength={254} placeholder="voce@exemplo.com"
                  value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
              </span>
            </label>
            <label>Senha
              <span className="auth-input"><FiLock aria-hidden="true" />
                <input name="password" type={showPassword ? "text" : "password"}
                  autoComplete={registering ? "new-password" : "current-password"}
                  required minLength={registering ? 8 : undefined} maxLength={128}
                  aria-describedby={registering ? "password-help" : undefined}
                  value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
                <button type="button" className="auth-reveal" aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(value => !value)}>
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                </button>
              </span>
            </label>
            {registering && <small id="password-help">Use pelo menos 8 caracteres.</small>}
            <button className="main auth-submit" type="submit">
              {busy ? "Aguarde…" : <>{registering ? "Criar conta" : "Entrar"}<FiArrowRight aria-hidden="true" /></>}
            </button>
          </fieldset>
        </form>
        <p className="auth-switch">{registering ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
          <button type="button" className="link-button" disabled={busy}
            onClick={() => switchMode(registering ? "login" : "register")}>{registering ? "Entrar" : "Criar uma conta"}</button>
        </p>
      </section>
    </main>
    </>
  );
}

// Amostra ilustrativa da agenda, só decorativa: não usa dados da conta.
const PREVIEW_TASKS = [
  { title: "Treino da manhã", time: "07:00", color: "#22c55e", done: true },
  { title: "Revisar o relatório", time: "10:30", color: "#299cf2", next: true },
  { title: "Estudar 30 minutos", time: "19:00", color: "#a855f7" },
];

function AgendaPreview() {
  return (
    <div className="auth-preview" aria-hidden="true">
      <div className="auth-preview-head">
        <strong>Hoje</strong>
        <span>1 de 3 feitas</span>
      </div>
      <div className="auth-preview-progress"><span /></div>
      <ul>
        {PREVIEW_TASKS.map(task => (
          <li key={task.title} className={task.done ? "done" : task.next ? "next" : ""} style={{ "--task-color": task.color }}>
            <span className="auth-preview-check">{task.done && <FiCheck />}</span>
            <span className="auth-preview-title">{task.title}</span>
            {task.next && <span className="auth-preview-badge">Próximo</span>}
            <time>{task.time}</time>
          </li>
        ))}
      </ul>
    </div>
  );
}
