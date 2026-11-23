import {useState,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight,Plus} from 'lucide-react';
import {dateLabel,localDate,monthDays,shiftMonth,validDate} from './dates.mjs';
import type {Task} from './UI';
export default function Calendar({tasks,projects,today,dispatch,row}:{tasks:Task[],projects:string[],today:string,dispatch:(a:any)=>void,row:(task:Task)=>ReactNode}){
 const [selected,setSelected]=useState(today),[month,setMonth]=useState(today.slice(0,7)+'-01'),[title,setTitle]=useState(''),[project,setProject]=useState(projects[0]??'Personal');
 const agenda=tasks.filter(t=>t.dueDate===selected).sort((a,b)=>Number(a.done)-Number(b.done));
 const counts=new Map<string,number>();for(const task of tasks)if(task.dueDate&&!task.done)counts.set(task.dueDate,(counts.get(task.dueDate)??0)+1);
 function choose(day:string){setSelected(day);setMonth(day.slice(0,7)+'-01')}
 function changeMonth(step:number){choose(shiftMonth(month,step))}
 return <section className="calendar-view" aria-label="Calendar"><span className="eyebrow">A LITTLE ROOM TO PLAN</span><div className="calendar-title"><h1>Calendar</h1><button className="secondary" onClick={()=>choose(today)}>Today</button></div>
 <p className="calendar-intro">Task due dates, all in one place.</p>
 <div className="month-heading"><button className="icon-button" aria-label="Previous month" disabled={month==='1000-01-01'} onClick={()=>changeMonth(-1)}><ChevronLeft size={20}/></button><h2 aria-live="polite">{localDate(month).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button className="icon-button" aria-label="Next month" disabled={month==='9999-12-01'} onClick={()=>changeMonth(1)}><ChevronRight size={20}/></button></div>
 <div className="month-grid" aria-label="Choose a date"><div className="week-labels" aria-hidden="true">{['M','T','W','T','F','S','S'].map((day,i)=><span key={i}>{day}</span>)}</div><div className="month-cells">{monthDays(month).map(day=><button key={day} disabled={!validDate(day)} aria-label={`${dateLabel(day)}${day===today?', today':''}${counts.get(day)?`, ${counts.get(day)} unfinished tasks`:''}`} aria-pressed={selected===day} aria-current={day===today?'date':undefined} className={`${day.slice(0,7)!==month.slice(0,7)?'outside':''} ${day===today?'is-today':''} ${selected===day?'selected':''}`} onClick={()=>choose(day)}><span>{Number(day.slice(-2))}</span>{!!counts.get(day)&&<small>{counts.get(day)}</small>}</button>)}</div></div>
 <div className="agenda-title"><h2>{dateLabel(selected)}</h2><span>{agenda.length} {agenda.length===1?'task':'tasks'}</span></div>
 <div className="day-agenda">{agenda.map(row)}{!agenda.length&&<p className="calendar-empty">No tasks due. Add one below or set a due date on an existing task.</p>}</div>
 <form className="calendar-add" onSubmit={e=>{e.preventDefault();if(!title.trim())return;dispatch({type:'add',id:crypto.randomUUID(),title,project,dueDate:selected});setTitle('')}}><label htmlFor="calendar-task-title">Add a task for this date</label><input id="calendar-task-title" aria-label="Calendar task title" placeholder="What needs doing?" maxLength={240} value={title} onChange={e=>setTitle(e.target.value)}/><div><select aria-label="Calendar task project" value={project} onChange={e=>setProject(e.target.value)}>{projects.map(p=><option key={p}>{p}</option>)}</select><button className="small-button" disabled={!title.trim()}><Plus size={16}/> Add task</button></div></form>
 <p className="page-hint">Dates stay on your local calendar day. Timed events and external calendar connections are planned for a later version.</p>
 </section>;
}
