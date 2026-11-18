import {useState} from 'react';
import TypeIcon, {iconGroups,normalize,suggestedGroup} from './icons.jsx';

export default function IconPicker({value,onChange,name,color}) {
  const [group,setGroup]=useState('suggested');
  const [search,setSearch]=useState('');
  const selectedGroup=group==='suggested'?suggestedGroup(name):group;
  const query=normalize(search.trim());
  const choices=iconGroups.filter(item=>query || selectedGroup==='all' || item.name===selectedGroup)
    .flatMap(item=>item.items.map(([id,label])=>({id,label,context:item.name})))
    .filter(item=>!query || normalize(`${item.label} ${item.context} ${item.id}`).includes(query));
  return <div className="icon-picker" style={{'--picker-color':color}}>
    <div className="icon-picker-heading"><span>Ícone do tipo</span><button type="button" className={`icon-auto${value==null?' selected':''}`} aria-pressed={value==null} onClick={()=>onChange(null)}><TypeIcon name={name} /> Automático</button></div>
    <input type="search" aria-label="Buscar ícones" placeholder="Buscar: leitura, saúde, música…" value={search} onChange={event=>setSearch(event.target.value)} />
    <div className="icon-contexts" role="group" aria-label="Contextos dos ícones">
      {[['suggested','Sugestões'],...iconGroups.map(item=>[item.name,item.name]),['all','Todos']].map(([id,label])=><button key={id} type="button" aria-pressed={group===id} onClick={()=>{setGroup(id);setSearch('');}}>{label}</button>)}
    </div>
    <div className="icon-choices" role="group" aria-label={query?'Resultados da busca':`Ícones de ${selectedGroup==='all'?'todos os contextos':selectedGroup}`}>
      {choices.map(item=><button key={item.id} type="button" title={item.label} aria-label={`${item.label}, ${item.context}`} aria-pressed={value===item.id} onClick={()=>onChange(item.id)}><TypeIcon icon={item.id} /><span>{item.label}</span></button>)}
      {!choices.length && <p className="icon-no-results" role="status">Nenhum ícone encontrado. Tente outro termo.</p>}
    </div>
  </div>;
}
