import { useId } from "react";

// Símbolo do nextOrganize: o ✓ (tarefa feita) seguido do › (o próximo passo).
// Mantenha em sincronia com client/public/favicon.svg.
export function LogoMark({ size = 36, title, className = "" }) {
  const gradient = useId();
  return (
    <svg className={`logo-mark ${className}`.trim()} width={size} height={size} viewBox="0 0 64 64"
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fb0ff" />
          <stop offset="1" stopColor="#0f63b8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${gradient})`} />
      <path d="M13 33.5 21.5 42 37 24" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 21.5 51 32 41 42.5" fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = 40, className = "" }) {
  return (
    <span className={`logo ${className}`.trim()}>
      <LogoMark size={size} />
      <span className="logo-wordmark"><span className="logo-next">next</span>Organize</span>
    </span>
  );
}
