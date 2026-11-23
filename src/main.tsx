import React,{useEffect,useReducer,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Box,Check,Plus,Layers,ListTodo,Folder,Settings,Download,Upload,CheckCircle2,RotateCw,Zap} from 'lucide-react';
import {type Kind} from './World';
import Farm from './Farm';
import {INITIAL,reduce,cost,remaining,validSave,migrate,dayKey} from './game.mjs';
import {advance,factoryStats,productionStatus,upgradeBenefit,amount} from './production.mjs';
import {AnimatedMatter,TaskRow,TaskDetails,Modal,Focus,RewardFlight,type Task,type Flight} from './UI';
import './style.css';
const names={core:'The Core',press:'The Press',assembler:'The Assembler'};
const descriptions={core:'Stores work-earned Charge and converts it into Matter.',press:'Processes Charge faster when both it and your Core are placed.',assembler:'Collects production automatically and increases storage capacity.'};
function read(){const now=Date.now();try{const s=JSON.parse(localStorage.getItem('compound-v1')||'null');return advance(migrate(validSave(s)?s:INITIAL,now),now)}catch{return migrate(INITIAL,now)}}
function App(){
 const [state,dispatch]=useReducer(reduce,undefined,read),[tab,setTab]=useState('world');
 const [sheet,setSheet]=useState<Kind|'settings'|null>(null),[selectedId,setSelectedId]=useState<string|null>(null);
 const [title,setTitle]=useState(''),[project,setProject]=useState('Business'),[filter,setFilter]=useState<string|null>(null),[listFilter,setListFilter]=useState('today'),[newProject,setNewProject]=useState('');
 const [now,setNow]=useState(Date.now()),[toast,setToast]=useState(''),[storageError,setStorageError]=useState(false),[updateReady,setUpdateReady]=useState(false),[flight,setFlight]=useState<Flight>(null);
 useEffect(()=>{const updated=()=>setUpdateReady(true);window.addEventListener('compound-update',updated);return()=>window.removeEventListener('compound-update',updated)},[]);
 useEffect(()=>{try{localStorage.setItem('compound-v1',JSON.stringify(state));setStorageError(false)}catch{setStorageError(true)}},[state]);
 const focus=!!state.session;
 useEffect(()=>{const update=()=>{const at=Date.now();setNow(at);dispatch({type:'tick',now:at})};const id=setInterval(update,focus?1000:5000);const visible=()=>{if(!document.hidden)update()};document.addEventListener('visibilitychange',visible);window.addEventListener('focus',update);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',update)}},[focus]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(!flight)return;const id=setTimeout(()=>setFlight(null),1200);return()=>clearTimeout(id)},[flight]);
 const tasks:Task[]=state.tasks,projects:string[]=state.projects,pending=tasks.filter(t=>!t.done),today=pending.filter(t=>t.today===dayKey(now)),done=tasks.filter(t=>t.done).length;
 const selected=tasks.find(t=>t.id===selectedId),activeTask=tasks.find(t=>t.id===state.session?.taskId),stats=factoryStats(state),status=productionStatus(state);
 const list=listFilter==='today'?today:pending;
 function complete(id:string){dispatch({type:'complete',id});setToast('+20 Matter · Task finished. Tank recharged.');setSelectedId(null)}
 function start(id:string,duration:number){const at=Date.now();dispatch({type:'start',id,duration,now:at});setNow(at);setSelectedId(null)}
 function add(e:React.FormEvent){e.preventDefault();if(!title.trim())return;dispatch({type:'add',id:crypto.randomUUID(),title,project});setTitle('');setListFilter('today');setToast('Added to Today.')}
 function collect(){const from=document.querySelector('.collect-button')?.getBoundingClientRect(),to=document.querySelector('.matter')?.getBoundingClientRect();if(from&&to)setFlight({id:Date.now(),x:from.left+from.width/2,y:from.top+from.height/2,dx:to.left+to.width/2-from.left-from.width/2,dy:to.top+to.height/2-from.top-from.height/2});dispatch({type:'collect'});setToast(`Collected ${amount(state.factory.stored)} Matter.`)}
 function exportSave(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='compound-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importSave(file?:File){if(!file)return;try{const s=JSON.parse(await file.text());if(!validSave(s))throw Error();if(!window.confirm('Replace current progress with this backup?'))return;localStorage.setItem('compound-v1',JSON.stringify(s));location.reload()}catch{setToast('Could not read backup. Current progress kept.')}}
 const row=(task:Task)=><TaskRow key={task.id} task={task} onOpen={()=>setSelectedId(task.id)} onDone={()=>complete(task.id)} onFocus={()=>start(task.id,10)}/>;
 return <div className="app">
  {updateReady&&<button className="update-banner" onClick={()=>location.reload()}>Update ready · Tap to refresh</button>}
  <header><a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('world')}}><span className="brand-mark"><Box size={21}/></span>compound<span className="brand-period">.</span></a><div className="header-right"><div className="matter" aria-label={`${amount(state.matter)} Matter`}><span className="matter-icon">✦</span><AnimatedMatter value={state.matter}/><span>Matter</span></div><button className="icon-button settings" aria-label="Settings and backup" onClick={()=>setSheet('settings')}><Settings size={19}/></button></div></header>
  <main>
   {tab==='world'&&!focus&&<Farm levels={state.levels} matter={state.matter} placements={state.placements} rotations={state.rotations} onPlace={(kind,point)=>dispatch({type:'place',kind,point})} onSelect={setSheet} onUndo={()=>dispatch({type:'undoLayout'})} canUndo={!!state.layoutUndo} charge={state.factory.charge} chargeCapacity={stats.chargeCapacity} stored={state.factory.stored} status={status} onCollect={collect}/>}
   {tab==='today'&&<section className="list-view"><span className="eyebrow">ONE THING AT A TIME</span><h1>Your next small step.</h1><p className="intro">Real work powers your farm.</p>
    <form className="add-task" onSubmit={add}><div><Plus size={20}/><input aria-label="New task" placeholder="What do you want to work on?" value={title} maxLength={240} onChange={e=>setTitle(e.target.value)}/></div><div className="add-bottom"><select aria-label="Task project" value={project} onChange={e=>setProject(e.target.value)}>{projects.map(p=><option key={p}>{p}</option>)}</select><button className="small-button" disabled={!title.trim()}>Add task <Plus size={15}/></button></div></form>
    <div className="filters"><button className={listFilter==='today'?'active':''} onClick={()=>setListFilter('today')}>Today · {today.length}</button><button className={listFilter==='all'?'active':''} onClick={()=>setListFilter('all')}>All tasks · {pending.length}</button></div>
    <div className="task-list">{list.length===0?<div className="empty"><ListTodo size={29}/><h3>{pending.length?'Choose what matters today.':'A little space to start.'}</h3><p>{pending.length?'Open All tasks, then add a task to Today.':'Add one small, specific task above.'}</p></div>:list.map(row)}</div>
    {done>0&&<details className="completed"><summary>Completed · {done}</summary>{tasks.filter(t=>t.done).map(t=><div key={t.id}><CheckCircle2 size={17}/><span>{t.title}</span></div>)}</details>}
    {state.history.length>0&&<details className="completed"><summary>Focus history · {state.history.length}</summary>{state.history.slice(0,20).map((h:any,i:number)=><div className="history-item" key={`${h.at}-${i}`}><div><strong>{tasks.find(t=>t.id===h.taskId)?.title||'Focus session'}</strong><span>{h.minutes} min · {new Date(h.at).toLocaleDateString()} · {h.outcome||'progress'}</span>{h.note&&<p>{h.note}</p>}</div></div>)}</details>}
   </section>}
   {tab==='projects'&&<section className="list-view"><span className="eyebrow">EFFORT ADDS UP</span><h1>Things worth building.</h1><p className="intro">Your work, with a place to grow.</p>
    <div className="stats"><div><strong>{done}</strong><span>tasks finished</span></div><div><strong>{state.minutes}</strong><span>focus minutes</span></div><div><strong>{amount(state.earned)}</strong><span>Matter earned</span></div></div>
    <form className="new-project" onSubmit={e=>{e.preventDefault();if(!newProject.trim())return;dispatch({type:'projectAdd',name:newProject});setNewProject('')}}><input aria-label="New project name" placeholder="New project…" value={newProject} maxLength={40} onChange={e=>setNewProject(e.target.value)}/><button className="icon-button" aria-label="Create project" disabled={!newProject.trim()}><Plus size={19}/></button></form>
    <div className="filters"><button className={filter===null?'active':''} onClick={()=>setFilter(null)}>All</button>{projects.map(p=><button key={p} className={filter===p?'active':''} onClick={()=>setFilter(p)}>{p}</button>)}</div>
    {projects.filter(p=>filter===null||filter===p).map(p=>{const ts=tasks.filter(t=>t.project===p),d=ts.filter(t=>t.done).length;return <div className="project-card" key={p}><div className="project-title"><Folder size={20}/><strong>{p}</strong><span>{d}/{ts.length}</span></div><div className="chapter-track"><i style={{width:`${ts.length?d/ts.length*100:0}%`}}/></div>{ts.filter(t=>!t.done).map(row)}{!ts.length&&<p>No tasks yet. Start with something small.</p>}<button className="text-button" onClick={()=>{setProject(p);setTab('today')}}><Plus size={16}/> Add a task</button></div>})}
   </section>}
  </main>
  <nav aria-label="Main navigation">{[{id:'world',label:'World',Icon:Layers},{id:'today',label:'Today',Icon:ListTodo},{id:'projects',label:'Projects',Icon:Folder}].map(({id,label,Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={20}/><span>{label}</span>{id==='today'&&today.length>0&&<i>{today.length}</i>}</button>)}</nav>
  {sheet&&<Modal close={()=>setSheet(null)} label={sheet==='settings'?'Settings':names[sheet]}>{sheet==='settings'?<>
   <span className="eyebrow">YOUR WORLD, YOUR DATA</span><h2>Keep what you build.</h2><p>Progress saves on this device. Export a backup before clearing browser data or switching phones.</p>
   <button className="secondary wide" onClick={exportSave}><Download size={18}/> Export backup</button><label className="secondary wide upload"><Upload size={18}/> Import backup<input type="file" accept=".json,application/json" onChange={e=>importSave(e.target.files?.[0])}/></label>
   <div className="help-note">Focus: 2 Matter +1 Charge per minute. Finished task: 20 Matter +5 Charge. Charge stops accumulating at tank capacity. Only placed machines operate; stored Charge never expires.<br/><br/>On iPhone: Safari → Share → Add to Home Screen. Production catches up when reopened, including offline. Background notifications are not enabled.</div><small>Compound · Powered farm 0.3 · No account needed</small>
  </>:<>
   <span className="eyebrow">YOUR MACHINERY</span><h2>{names[sheet]}</h2><p>{descriptions[sheet]}</p>
   <div className="upgrade-detail"><Box size={30}/><div><strong>Level {state.levels[sheet]} of 3</strong><span>{state.placements[sheet]?'Placed · active benefits':'In tray · place to operate'}</span></div></div>
   <div className="upgrade-benefit"><span className="field-label">{state.levels[sheet]===3?'COMPLETE':'NEXT UPGRADE'}</span><p>{upgradeBenefit(state,sheet)}</p></div>
   <button className="primary wide" disabled={cost(sheet,state.levels[sheet])===null||state.matter<cost(sheet,state.levels[sheet])} onClick={()=>{dispatch({type:'upgrade',kind:sheet});setToast('Upgraded. New parts, more possibility.')}}>{state.levels[sheet]===3?<><Check size={18}/> Fully upgraded</>:<>Upgrade <span>✦ {cost(sheet,state.levels[sheet])}</span></>}</button>
   {state.placements[sheet]&&<div className="machine-actions"><button className="secondary wide" onClick={()=>dispatch({type:'rotate',kind:sheet})}><RotateCw size={17}/> Rotate 90°</button><button className="secondary wide" onClick={()=>{dispatch({type:'unplace',kind:sheet});setSheet(null)}}>Return to tray</button></div>}
   {cost(sheet,state.levels[sheet])!==null&&state.matter<cost(sheet,state.levels[sheet])&&<div className="shortfall">{amount(cost(sheet,state.levels[sheet])-state.matter)} more Matter needed.</div>}
   {sheet==='core'&&<p className="help-note"><Zap size={13}/> {amount(state.factory.charge)} / {stats.chargeCapacity} Charge · {amount(state.factory.stored)} / {stats.storageCapacity} output stored. {amount(stats.rate*stats.yield)} Matter/min while powered.</p>}
  </>}</Modal>}
  {selected&&!focus&&<TaskDetails key={selected.id} task={selected} projects={projects} dispatch={dispatch} close={()=>setSelectedId(null)} onStart={d=>start(selected.id,d)} onDone={()=>complete(selected.id)}/>}
  {focus&&<Focus key={`${state.session.taskId}-${state.session.started}`} title={activeTask?.title||'Your focused time'} left={remaining(state.session,now)} duration={state.session.duration} onEnd={()=>{if(window.confirm('End this session? Incomplete sessions earn no effort reward.'))dispatch({type:'cancel'})}} onFinish={(outcome,note)=>{const at=Date.now();dispatch({type:'finishSession',outcome,note,now:at});setNow(at);setToast(outcome==='finished'?'Task finished. Farm charged.':outcome==='continue'?'Effort collected. Next round started.':'Progress saved. Farm charged.')}}/>}
  <RewardFlight flight={flight}/>
  {storageError&&<div className="storage-warning">Storage unavailable. Export your progress from Settings.</div>}{toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>{
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)window.dispatchEvent(new Event('compound-update'))});
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});setInterval(check,60000)}).catch(()=>{});
});
