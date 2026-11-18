import {
  FaTag, FaBriefcase, FaLaptop, FaChartLine, FaClipboardCheck, FaBuilding,
  FaDumbbell, FaPersonRunning, FaHeartPulse, FaBicycle, FaPersonSwimming,
  FaHandsPraying, FaYinYang, FaCross, FaDove, FaSun,
  FaUser, FaHouse, FaPeopleGroup, FaHeart, FaMugHot,
  FaToriiGate, FaShieldHalved, FaMedal, FaBullseye,
  FaGraduationCap, FaBookOpen, FaLaptopCode, FaBrain, FaPenNib,
  FaUtensils, FaWallet, FaPlane, FaMusic, FaPalette, FaGamepad,
  FaStethoscope, FaPaw, FaLeaf, FaWrench, FaCalendarCheck, FaBolt, FaMountain, FaSeedling,
} from 'react-icons/fa6';
import { GiKimono, GiBlackBelt, GiMeditation } from 'react-icons/gi';

export const iconGroups = [
  {name:'Trabalho',items:[['FaBriefcase','Maleta',FaBriefcase],['FaLaptop','Computador',FaLaptop],['FaChartLine','Resultados',FaChartLine],['FaClipboardCheck','Projetos',FaClipboardCheck],['FaBuilding','Empresa',FaBuilding]]},
  {name:'Físico',items:[['FaDumbbell','Musculação',FaDumbbell],['FaPersonRunning','Corrida',FaPersonRunning],['FaHeartPulse','Condicionamento',FaHeartPulse],['FaBicycle','Ciclismo',FaBicycle],['FaPersonSwimming','Natação',FaPersonSwimming]]},
  {name:'Espiritual',items:[['GiMeditation','Meditação',GiMeditation],['FaHandsPraying','Oração',FaHandsPraying],['FaYinYang','Equilíbrio',FaYinYang],['FaCross','Fé',FaCross],['FaDove','Paz',FaDove],['FaSun','Luz',FaSun]]},
  {name:'Pessoal',items:[['FaUser','Pessoal',FaUser],['FaHouse','Casa',FaHouse],['FaPeopleGroup','Família',FaPeopleGroup],['FaHeart','Autocuidado',FaHeart],['FaMugHot','Pausa',FaMugHot]]},
  {name:'Dojo/MTAI',items:[['GiKimono','Quimono',GiKimono],['GiBlackBelt','Faixa',GiBlackBelt],['FaToriiGate','Dojo',FaToriiGate],['FaShieldHalved','Disciplina',FaShieldHalved],['FaMedal','Evolução',FaMedal],['FaBullseye','Foco',FaBullseye]]},
  {name:'Estudos',items:[['FaGraduationCap','Formação',FaGraduationCap],['FaBookOpen','Leitura',FaBookOpen],['FaLaptopCode','Programação',FaLaptopCode],['FaBrain','Aprendizado',FaBrain],['FaPenNib','Escrita',FaPenNib]]},
  {name:'Outros contextos',items:[['FaTag','Geral',FaTag],['FaUtensils','Alimentação',FaUtensils],['FaWallet','Finanças',FaWallet],['FaPlane','Viagens',FaPlane],['FaMusic','Música',FaMusic],['FaPalette','Criatividade',FaPalette],['FaGamepad','Lazer',FaGamepad],['FaStethoscope','Saúde',FaStethoscope],['FaPaw','Animais',FaPaw],['FaLeaf','Natureza',FaLeaf],['FaWrench','Manutenção',FaWrench],['FaCalendarCheck','Compromissos',FaCalendarCheck],['FaBolt','Energia',FaBolt],['FaMountain','Aventura',FaMountain],['FaSeedling','Crescimento',FaSeedling]]},
];
const registry = Object.fromEntries(iconGroups.flatMap(group=>group.items.map(([id,label,Component])=>[id,{label,Component}])));
export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function suggestedGroup(name='') {
  const value=normalize(name);
  if(/dojo|mtai|marcia|karate|judo|jiu|aikido/.test(value)) return 'Dojo/MTAI';
  if(/trabalh|profission|projeto|emprego/.test(value)) return 'Trabalho';
  if(/fisic|treino|exercic|academia|esporte/.test(value)) return 'Físico';
  if(/espirit|medit|oracao|relig/.test(value)) return 'Espiritual';
  if(/pessoal|familia|casa|autocuidado/.test(value)) return 'Pessoal';
  if(/estud|curso|leitura|escola|faculdade/.test(value)) return 'Estudos';
  return 'Outros contextos';
}
function suggestedIcon(name) {
  const value=normalize(name || '');
  const contexts=[[/alimenta|comida|cozinha/,'FaUtensils'],[/financ|dinheiro/,'FaWallet'],[/saude/,'FaStethoscope'],[/viage/,'FaPlane'],[/musica/,'FaMusic']];
  return contexts.find(([pattern])=>pattern.test(value))?.[1] || iconGroups.find(group=>group.name===suggestedGroup(name)).items[0][0];
}
export default function TypeIcon({icon,name='',...props}) {
  const Icon=registry[icon]?.Component || registry[suggestedIcon(name)]?.Component || FaTag;
  return <Icon aria-hidden="true" focusable="false" {...props} />;
}
