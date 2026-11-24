import { FiCalendar } from "react-icons/fi";
import TodayChip from "../../../shared/components/TodayChip.jsx";
import { relativeDayLabel } from "../model/schedule.js";

// Data do dia selecionado com o selo de distância até hoje (Hoje, Amanhã,
// Em 3 dias...). No computador fica no cabeçalho do calendário; no celular,
// na faixa superior. Os dois usam o mesmo dia selecionado da lista.
export default function SelectedDayLine({ selected, today, className = "" }) {
  const date = new Date(`${selected}T12:00:00`);
  const long = date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const short = date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replaceAll(".", "");
  const isToday = selected === today;
  return <p className={`calendar-today-line${isToday ? " is-today" : ""}${className ? ` ${className}` : ""}`} aria-live="polite">
    {isToday ? <TodayChip /> : <TodayChip className="today-chip-other" Icon={FiCalendar}>{relativeDayLabel(selected, new Date(`${today}T12:00:00`))}</TodayChip>}
    <span className="today-long">{long}</span><span className="today-short">{short}</span>
  </p>;
}
