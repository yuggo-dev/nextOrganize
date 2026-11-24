import { FiSun } from "react-icons/fi";

// Selo de dia usado na plataforma: "Hoje" em azul cheio, com sol. Com outro
// texto e ícone (ex.: "Amanhã"), use className="today-chip-other" para a versão
// contornada, que não se confunde com o dia atual.
export default function TodayChip({ children = "Hoje", className = "", Icon = FiSun }) {
  return <span className={`today-chip${className ? ` ${className}` : ""}`}><Icon aria-hidden="true" />{children}</span>;
}
