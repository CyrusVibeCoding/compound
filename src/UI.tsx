import React,{useEffect,useRef,useState} from 'react';
import {X,Plus,Play,Check,Trash2,Circle,CheckCircle2,Sun,Box} from 'lucide-react';
import {dayKey} from './game.mjs';import {amount} from './production.mjs';
export type Task={id:string,title:string,project:string,done:boolean,notes:string,today:string,steps:{id:string,title:string,done:boolean}[]};
export function Modal({children,close,label='Details'}:{children:React.ReactNode,close:()=>void,label?:string}){
 const ref=useRef<HTMLDivElement>(null),closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{const previous=document.activeElement as HTMLElement;ref.current?.focus();function key(e:KeyboardEvent){if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){const els=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]');if(!els?.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()}},[]);
 return <div className="modal-backdrop" onClick={close}><div ref={ref} tabIndex={-1} className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="close icon-button" onClick={close} aria-label="Close"><X size={20}/></button>{children}</div></div>;
}
export function TaskRow({task,onOpen,onDone,onFocus}:{task:Task,onOpen:()=>void,onDone:()=>void,onFocus:()=>void}){
 return <div className="task-row"><button className="check-task" onClick={onDone} aria-label={`Complete ${task.title}`}><span/></button><button className="task-main" onClick={onOpen}><strong>{task.title}</strong><span>{task.project}{task.today===dayKey()?' · Today':''}{task.steps.length>0&&` · ${task.steps.filter(s=>s.done).length}/${task.steps.length} steps`}</span></button><button className="icon-button" onClick={onFocus} aria-label={`Focus on ${task.title}`}><Play size={16}/></button></div>;
}
export function TaskDetails({task,projects,dispatch,onStart,onDone,close}:{task:Task,projects:string[],dispatch:(a:any)=>void,onStart:(duration:number)=>void,onDone:()=>void,close:()=>void}){
 const [title,setTitle]=useState(task.title),[step,setStep]=useState(''),[duration,setDuration]=useState(10);
 return <Modal close={close} label="Edit task"><span className="eyebrow">YOUR NEXT STEP</span><input className="task-title-input" aria-label="Task title" value={title} maxLength={240} onChange={e=>{setTitle(e.target.value);if(e.target.value.trim())dispatch({type:'edit',id:task.id,title:e.target.value})}} onBlur={()=>{if(!title.trim())setTitle(task.title)}}/>
  <div className="task-options"><select aria-label="Project" value={task.project} onChange={e=>dispatch({type:'edit',id:task.id,project:e.target.value})}>{projects.map(p=><option key={p}>{p}</option>)}</select><button className={task.today===dayKey()?'selected':''} aria-pressed={task.today===dayKey()} onClick={()=>dispatch({type:'edit',id:task.id,today:task.today!==dayKey()})}><Sun size={15}/> Today</button></div>
  <textarea className="task-notes" aria-label="Task notes" placeholder="Notes, links, or what done looks like…" value={task.notes} maxLength={10000} onChange={e=>dispatch({type:'edit',id:task.id,notes:e.target.value})}/>
  <div className="subtasks">{task.steps.map(s=><button key={s.id} onClick={()=>dispatch({type:'toggleStep',id:task.id,stepId:s.id})}>{s.done?<CheckCircle2 size={18}/>:<Circle size={18}/>}<span className={s.done?'struck':''}>{s.title}</span></button>)}<form onSubmit={e=>{e.preventDefault();if(!step.trim())return;dispatch({type:'step',id:task.id,stepId:crypto.randomUUID(),title:step.trim()});setStep('')}}><input aria-label="Add a smaller step" placeholder="Add a smaller step…" value={step} onChange={e=>setStep(e.target.value)} maxLength={240}/><button className="icon-button" aria-label="Add subtask" disabled={!step.trim()}><Plus size={18}/></button></form></div>
  <span className="field-label">FOCUS TIME · 2 MATTER + 1 CHARGE / MIN</span><div className="durations">{[5,10,25].map(d=><button key={d} className={duration===d?'active':''} onClick={()=>setDuration(d)}>{d}<span>minutes</span></button>)}</div>
  <button className="primary wide" onClick={()=>onStart(duration)}><Play size={17} fill="currentColor"/> Start focus <span>+{duration*2} Matter</span></button>
  <button className="secondary wide" onClick={onDone}><Check size={18}/> Finished · +20 Matter +5 Charge</button>
  <button className="delete-task" onClick={()=>{if(window.confirm('Delete this task?')){dispatch({type:'delete',id:task.id});close()}}}><Trash2 size={15}/> Delete task</button>
 </Modal>;
}
export function AnimatedMatter({value}:{value:number}){
 const [display,setDisplay]=useState(value),previous=useRef(value);
 useEffect(()=>{const start=previous.current;previous.current=value;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplay(value);return;}let id=0;const at=performance.now();function frame(now:number){const t=Math.min(1,(now-at)/350);setDisplay(start+(value-start)*(1-(1-t)**3));if(t<1)id=requestAnimationFrame(frame)}id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id)},[value]);
 return <strong>{amount(display)}</strong>;
}
export function Focus({title,left,duration,onEnd,onFinish}:{title:string,left:number,duration:number,onEnd:()=>void,onFinish:(outcome:'finished'|'progress'|'continue',note:string)=>void}){
 const [note,setNote]=useState('');const ready=left===0;
 return <div className="focus-screen"><span className="eyebrow">{ready?'TIME WELL SPENT':'ONE THING AT A TIME'}</span><div className={`focus-sculpture ${ready?'ready':''}`}><div/><div/><Box size={40} strokeWidth={1}/></div><h2>{ready?'What moved forward?':'Make a little room.'}</h2><p>{title}</p>
  <div className="timer">{String(Math.floor(left/60000)).padStart(2,'0')}<span>:</span>{String(Math.floor(left/1000)%60).padStart(2,'0')}</div>
  {ready?<><p className="focus-hint">Effort earned {duration*2} Matter + up to {duration} Charge.<br/>Finish task: +20 Matter. Charge fills available tank space.</p><textarea className="progress-note" aria-label="Progress note" placeholder="Optional: what did you get done?" value={note} maxLength={500} onChange={e=>setNote(e.target.value)}/><button className="primary wide" onClick={()=>onFinish('finished',note)}><Check size={17}/> Finished task</button><button className="secondary wide" onClick={()=>onFinish('progress',note)}>Made progress</button><button className="text-button" onClick={()=>{onFinish('continue',note);setNote('')}}>Keep going · {duration} more minutes</button></>:<><p className="focus-hint">Lock your phone if you like. Time keeps counting.</p><button className="secondary wide" onClick={onEnd}>End session</button></>}
 </div>;
}
export type Flight={id:number,x:number,y:number,dx:number,dy:number}|null;
export function RewardFlight({flight}:{flight:Flight}){return flight&&<div className="reward-flight" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={`${flight.id}-${i}`} style={{left:flight.x,top:flight.y,'--dx':`${flight.dx+(i-3)*3}px`,'--dy':`${flight.dy}px`,animationDelay:`${i*35}ms`} as React.CSSProperties}/>)}</div>}
