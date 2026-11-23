import React,{useEffect,useReducer,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {House,Check,Plus,Map,ListTodo,Folder,Settings,Download,Upload,CheckCircle2,RotateCw,Users,Save,FileText,CalendarDays} from 'lucide-react';
import {type Kind} from './World';
import City from './City';
import Guide from './Guide';
import Pages from './Pages';
import Calendar from './Calendar';
import {todayTasks,overdueTasks} from './dates.mjs';
import {BUILDINGS,buildingCost,cityStats,advanceRent,amount,money} from './city.mjs';
import {loadLocal,saveLocal,resetLocal} from './storage.mjs';
import {useReducedEffects,type SceneEvent} from './effects';
import {INITIAL,reduce,remaining,validSave,migrate,dayKey} from './game.mjs';
import {AnimatedCash,TaskRow,TaskDetails,Modal,Focus,RewardFlight,type Task,type Flight} from './UI';
import './style.css';
let boot={source:'new',at:null as number|null,migrated:false};
function read(){const at=Date.now();let loaded;try{loaded=loadLocal(localStorage)}catch{loaded={state:INITIAL,source:'unavailable',at:null}}boot={source:loaded.source,at:loaded.at,migrated:loaded.state.version===1};return advanceRent(migrate(loaded.state,at),at)}
function App(){
 const [state,dispatch]=useReducer(reduce,undefined,read),[tab,setTab]=useState('city');
 const [openPageId,setOpenPageId]=useState<string|null>(null);
 const [sheet,setSheet]=useState<string|null>(null),[selectedId,setSelectedId]=useState<string|null>(null);
 const [title,setTitle]=useState(''),[project,setProject]=useState('Business'),[filter,setFilter]=useState<string|null>(null),[listFilter,setListFilter]=useState('today'),[newProject,setNewProject]=useState('');
 const [now,setNow]=useState(Date.now()),[toast,setToast]=useState(boot.source==='backup'?'Recovered local backup.':boot.migrated?'Your factory is now a city. Conversion details in Settings.':''),[storageError,setStorageError]=useState(false),[updateReady,setUpdateReady]=useState(false),[flight,setFlight]=useState<Flight>(null);
 const [savedNotes,setSavedNotes]=useState(state.notes);
 const [savedAt,setSavedAt]=useState<number|null>(boot.at),latest=useRef(state);latest.current=state;
 const [sceneEvent,setSceneEvent]=useState<SceneEvent>(null);
 const reduced=useReducedEffects(state.calm);
 useEffect(()=>{if(!sceneEvent)return;const id=setTimeout(()=>setSceneEvent(null),1100);return()=>clearTimeout(id)},[sceneEvent]);
 useEffect(()=>{const updated=()=>setUpdateReady(true);window.addEventListener('compound-update',updated);return()=>window.removeEventListener('compound-update',updated)},[]);
 function persist(current=latest.current){let result;try{result=saveLocal(localStorage,current)}catch{result={ok:false,at:null}}setStorageError(!result.ok);if(result.ok){setSavedAt(result.at);setSavedNotes(current.notes)}return result.ok;}
 useEffect(()=>{const id=setTimeout(()=>persist(state),350);return()=>clearTimeout(id)},[state]);
 useEffect(()=>{const flush=()=>{try{saveLocal(localStorage,latest.current)}catch{}};const hide=()=>{if(document.hidden)flush()};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hide);return()=>{window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hide)}},[]);
 function manualSave(){const ok=persist();setToast(ok?'Saved on this phone.':'Could not save. Download a backup in Settings.');if(ok&&navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}
 function resetProgress(){
  if(!window.confirm('Reset all progress on this device? This deletes tasks, notes, custom projects, focus history, cash, buildings, residents, and city layout, including local recovery copies. Export a backup first if you want to keep them. This cannot be undone.'))return;
  const at=Date.now(),fresh=migrate(INITIAL,at);
  let result;try{result=resetLocal(localStorage,fresh,at)}catch{result={ok:false,at:null}}
  if(!result.ok){setToast('Could not reset local save. Progress kept.');return;}
  latest.current=fresh;
  dispatch({type:'reset',now:at});setNow(at);setSavedAt(at);setStorageError(false);
  setSheet(null);setSelectedId(null);setOpenPageId(null);setTab('city');setTitle('');setProject('Business');setFilter(null);setListFilter('today');setNewProject('');setFlight(null);setSceneEvent(null);setToast('Progress reset. A fresh start.');
 }


 const focus=!!state.session;
 useEffect(()=>{const update=()=>{const at=Date.now();setNow(at);dispatch({type:'tick',now:at})};const id=setInterval(update,focus?1000:5000);const visible=()=>{if(!document.hidden)update()};document.addEventListener('visibilitychange',visible);window.addEventListener('focus',update);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',update)}},[focus]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(!flight)return;const id=setTimeout(()=>setFlight(null),1200);return()=>clearTimeout(id)},[flight]);
 const tasks:Task[]=state.tasks,projects:string[]=state.projects,pending=tasks.filter(t=>!t.done),today=todayTasks(tasks,dayKey(now)),overdue=overdueTasks(tasks,dayKey(now)),done=tasks.filter(t=>t.done).length;
 const selected=tasks.find(t=>t.id===selectedId),activeTask=tasks.find(t=>t.id===state.session?.taskId),stats=cityStats(state);
 const list=listFilter==='today'?today:listFilter==='overdue'?overdue:pending;
 function openPage(id:string){setOpenPageId(id);setSelectedId(null);setTab('pages')}
 const selectedBuilding=state.buildings.find((b:any)=>b.id===sheet),buildingKind=(selectedBuilding?.kind??'house') as Kind;
 const prices={house:buildingCost(state,'house'),'big-house':buildingCost(state,'big-house'),park:buildingCost(state,'park'),cafe:buildingCost(state,'cafe')};
 function reward(kind:'collect'|'task'|'session',origin?:DOMRect){const target=document.querySelector('.cash')?.getBoundingClientRect(),from=origin??document.querySelector('.sheet')?.getBoundingClientRect();if(!target)return;const x=from?from.left+from.width/2:window.innerWidth/2,y=from?from.top+Math.min(from.height/2,100):window.innerHeight*.55;setFlight({id:performance.now(),kind,x,y,dx:target.left+target.width/2-x,dy:target.top+target.height/2-y})}
 function pulse(kind:'place',point:[number,number,number]){setSceneEvent({id:performance.now(),at:Date.now(),kind,point})}
 function complete(id:string,origin?:DOMRect){reward('task',origin);dispatch({type:'complete',id});setToast('+$20 · Task finished.');setSelectedId(null)}
 function start(id:string,duration:number){const at=Date.now();dispatch({type:'start',id,duration,now:at});setNow(at);setSelectedId(null)}
 function add(e:React.FormEvent){e.preventDefault();if(!title.trim())return;dispatch({type:'add',id:crypto.randomUUID(),title,project});setTitle('');setListFilter('today');setToast('Added to Today.')}
 function exportSave(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='little-city-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importSave(file?:File){if(!file)return;try{const s=JSON.parse(await file.text());if(!validSave(s))throw Error();if(!window.confirm('Replace current progress with this backup?'))return;const at=Date.now(),next=advanceRent(migrate(s,at),at);if(!saveLocal(localStorage,next,at).ok)throw Error();latest.current=next;dispatch({type:'restore',state:next,now:at});setSheet(null);setSelectedId(null);setOpenPageId(null);setTab('city');setSavedAt(at);setToast('Backup restored.')}catch{setToast('Could not read backup. Current progress kept.')}}
 const row=(task:Task)=><TaskRow nextStep={state.history.find((h:any)=>h.taskId===task.id)?.nextStep} key={task.id} task={task} onOpen={()=>setSelectedId(task.id)} onDone={origin=>complete(task.id,origin)} onFocus={()=>start(task.id,10)}/>;
 return <div className={`app ${reduced?'calm-effects':''}`} onContextMenu={e=>{if(!(e.target as Element).closest('input,textarea,[contenteditable]'))e.preventDefault()}} onDragStart={e=>{if(!(e.target as Element).closest('input,textarea,[contenteditable]'))e.preventDefault()}}>
  {updateReady&&<button className="update-banner" onClick={()=>location.reload()}>Update ready · Tap to refresh</button>}
  <header><a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('city')}}><span className="brand-mark"><House size={21}/></span>little city<span className="brand-period">.</span></a><div className="header-right"><div className="cash" aria-label={`${money(state.cash)} cash`}><span className="cash-symbol">$</span><AnimatedCash value={Math.floor(state.cash*10+1e-7)/10} reduced={reduced}/></div><button className={`icon-button save-progress ${storageError?'save-error':''}`} aria-label="Save progress on this device" onClick={manualSave}><Save size={18}/></button><button className="icon-button settings" aria-label="Settings and backup" onClick={()=>setSheet('settings')}><Settings size={19}/></button></div></header>
  <main>
   {tab==='city'&&!focus&&<City buildings={state.buildings} prices={prices} cash={state.cash} placements={state.placements} rotations={state.rotations} onPlace={(id,kind,point)=>{dispatch({type:'place',id,kind,point});pulse('place',point)}} onSelect={setSheet} onUndo={()=>dispatch({type:'undoLayout'})} canUndo={!!state.layoutUndo} residents={stats.residents} rent={stats.rent} onHelp={()=>setSheet('guide')} reduced={reduced} event={sceneEvent} selection={selectedBuilding?.id??null}/>}
   {tab==='today'&&<section className="list-view"><span className="eyebrow">ONE THING AT A TIME</span><h1>Your next small step.</h1><p className="intro">Real work grows your city.</p>
    <form className="add-task" onSubmit={add}><div><Plus size={20}/><input aria-label="New task" placeholder="What do you want to work on?" value={title} maxLength={240} onChange={e=>setTitle(e.target.value)}/></div><div className="add-bottom"><select aria-label="Task project" value={project} onChange={e=>setProject(e.target.value)}>{projects.map(p=><option key={p}>{p}</option>)}</select><button className="small-button" disabled={!title.trim()}>Add task <Plus size={15}/></button></div></form>
    <div className="filters"><button className={listFilter==='today'?'active':''} onClick={()=>setListFilter('today')}>Today · {today.length}</button><button className={listFilter==='overdue'?'active':''} onClick={()=>setListFilter('overdue')}>Past due · {overdue.length}</button><button className={listFilter==='all'?'active':''} onClick={()=>setListFilter('all')}>All tasks · {pending.length}</button></div>
    <div className="task-list">{list.length===0?<div className="empty"><ListTodo size={29}/><h3>{pending.length?'Choose what matters today.':'A little space to start.'}</h3><p>{pending.length?'Open All tasks, then add a task to Today.':'Add one small, specific task above.'}</p></div>:list.map(row)}</div>
    {done>0&&<details className="completed"><summary>Completed · {done}</summary>{tasks.filter(t=>t.done).map(t=><div key={t.id}><CheckCircle2 size={17}/><span>{t.title}</span></div>)}</details>}
    {state.history.length>0&&<details className="completed"><summary>Focus history · {state.history.length}</summary>{state.history.slice(0,20).map((h:any,i:number)=><div className="history-item" key={`${h.at}-${i}`}><div><strong>{tasks.find(t=>t.id===h.taskId)?.title||'Focus session'}</strong><span>{h.minutes} min · {new Date(h.at).toLocaleDateString()} · {h.outcome||'progress'}</span>{h.note&&<p>{h.note}</p>}</div></div>)}</details>}
   </section>}
   {tab==='calendar'&&<Calendar tasks={tasks} projects={projects} today={dayKey(now)} dispatch={dispatch} row={row}/>}
   {tab==='pages'&&<Pages selected={openPageId} setSelected={setOpenPageId} tasks={tasks} row={row} onOpenTask={setSelectedId} notes={state.notes} projects={projects} dispatch={dispatch} onProjects={()=>setTab('projects')} saved={!storageError&&savedNotes===state.notes} storageError={storageError}/>}
   {tab==='projects'&&<section className="list-view"><button className="text-button" onClick={()=>setTab('pages')}>← Pages</button><span className="eyebrow">EFFORT ADDS UP</span><h1>Things worth building.</h1><p className="intro">Your work, with a place to grow.</p>
    <div className="stats"><div><strong>{done}</strong><span>tasks finished</span></div><div><strong>{state.minutes}</strong><span>focus minutes</span></div><div><strong>{amount(state.earned)}</strong><span>Cash from work</span></div></div>
    <form className="new-project" onSubmit={e=>{e.preventDefault();if(!newProject.trim())return;dispatch({type:'projectAdd',name:newProject});setNewProject('')}}><input aria-label="New project name" placeholder="New project…" value={newProject} maxLength={40} onChange={e=>setNewProject(e.target.value)}/><button className="icon-button" aria-label="Create project" disabled={!newProject.trim()}><Plus size={19}/></button></form>
    <div className="filters"><button className={filter===null?'active':''} onClick={()=>setFilter(null)}>All</button>{projects.map(p=><button key={p} className={filter===p?'active':''} onClick={()=>setFilter(p)}>{p}</button>)}</div>
    {projects.filter(p=>filter===null||filter===p).map(p=>{const ts=tasks.filter(t=>t.project===p),d=ts.filter(t=>t.done).length;return <div className="project-card" key={p}><div className="project-title"><Folder size={20}/><strong>{p}</strong><span>{d}/{ts.length}</span></div><div className="chapter-track"><i style={{width:`${ts.length?d/ts.length*100:0}%`}}/></div>{ts.filter(t=>!t.done).map(row)}{!ts.length&&<p>No tasks yet. Start with something small.</p>}<button className="text-button" onClick={()=>{setProject(p);setTab('today')}}><Plus size={16}/> Add a task</button></div>})}
   </section>}
  </main>
  <nav aria-label="Main navigation">{[{id:'city',label:'City',Icon:Map},{id:'today',label:'Today',Icon:ListTodo},{id:'pages',label:'Pages',Icon:FileText},{id:'calendar',label:'Calendar',Icon:CalendarDays}].map(({id,label,Icon})=><button key={id} className={tab===id||(id==='pages'&&tab==='projects')?'active':''} onClick={()=>setTab(id)}><Icon size={20}/><span>{label}</span>{id==='today'&&today.length>0&&<i>{today.length}</i>}</button>)}</nav>
  {sheet==='guide'&&<Guide close={()=>setSheet(null)} onToday={()=>{setSheet(null);setTab('today')}} onCity={()=>{setSheet(null);setTab('city')}}/>}
  {sheet==='settings'&&<Modal close={()=>setSheet(null)} label="Settings"><span className="eyebrow">YOUR CITY, SAVED HERE</span><h2>Settings</h2>
   <div className={`save-status ${storageError?'error':''}`} role="status"><Save size={19}/><div><strong>{storageError?'Local save unavailable':'Progress saved locally'}</strong><span>{savedAt?`Last saved ${new Date(savedAt).toLocaleTimeString()}`:'Your city and tasks stay in this browser.'}</span></div></div><button className="primary wide" onClick={manualSave}><Save size={17}/> Save on this phone</button>
   <button className="secondary wide" onClick={()=>setSheet('guide')}>How to play</button>
   <div className="motion-setting"><div><strong>Calmer effects</strong><span>Still residents, instant placement.</span></div><button className={`toggle ${state.calm?'on':''}`} role="switch" aria-label="Calmer effects" aria-checked={state.calm} onClick={()=>dispatch({type:'setCalm',calm:!state.calm})}><i/></button></div>
   <button className="secondary wide" onClick={exportSave}><Download size={18}/> Export backup</button><label className="secondary wide upload"><Upload size={18}/> Import backup<input type="file" accept=".json,application/json" onChange={e=>importSave(e.target.files?.[0])}/></label>
   <p className="help-note">Cash comes from tasks ($20), study ($2/min), and rent. Only placed homes earn rent: $2/hr per basic house, $6/hr per big house. Rent adds automatically while away. Parks and cafés are for visits, with no upkeep. No penalties for missing a day.</p>
   {state.legacyFactory&&<details className="migration-details"><summary>Your old save was kept</summary><p>Tasks, notes, projects, study history, and sessions are unchanged. Core → basic house; Press → big house; Assembler → park. IDs, positions and rotations stay the same. Old Matter, stored output and Charge became cash. Retired upgrades refunded {money(state.conversionCredit??0)}. The original factory snapshot remains inside exported backups.</p></details>}
   <p className="help-note">Autosaves after changes and on leaving. Export a backup before clearing browser data or switching devices. On iPhone: Safari → Share → Add to Home Screen.</p>
   <div className="reset-progress"><strong>Start fresh</strong><p className="help-note">Delete tasks, notes, projects, cash, city, study history, and recovery saves on this device. Export a backup above to keep a copy.</p><button className="secondary wide" onClick={resetProgress}>Reset all progress</button></div><small>Little city · 0.11 · No account needed</small>
  </Modal>}
  {selectedBuilding&&sheet&&<Modal close={()=>setSheet(null)} label={BUILDINGS[buildingKind].name}><span className="eyebrow">YOUR NEIGHBORHOOD</span><h2>{BUILDINGS[buildingKind].name}</h2><p>{BUILDINGS[buildingKind].description}</p><div className="building-detail"><Users size={24}/><strong>{BUILDINGS[buildingKind].residents?`${BUILDINGS[buildingKind].residents} ${BUILDINGS[buildingKind].residents===1?'resident':'residents'} · ${money(BUILDINGS[buildingKind].rent)}/hour rent`:'A destination for your residents'}</strong></div><p className="help-note">{state.placements[sheet]?'Placed in your city.':'Stored in tray. Place it to bring it to life.'} {BUILDINGS[buildingKind].residents?'Rent is cash added automatically, including while away. Storing a home pauses its rent and removes its residents until placed again.':'Neighbors visit automatically. No resource bars or maintenance.'}</p>
  {state.placements[sheet]&&<div className="building-actions"><button className="secondary wide" onClick={()=>dispatch({type:'rotate',id:sheet})}><RotateCw size={17}/> Rotate 90°</button><button className="secondary wide" onClick={()=>{dispatch({type:'unplace',id:sheet});setSheet(null)}}>Return to tray</button></div>}</Modal>}
  {selected&&!focus&&<TaskDetails key={selected.id} task={selected} pages={state.notes} onOpenPage={openPage} projects={projects} dispatch={dispatch} close={()=>setSelectedId(null)} onStart={d=>start(selected.id,d)} onDone={()=>complete(selected.id)}/>}
  {focus&&<Focus key={`${state.session.taskId}-${state.session.started}`} title={activeTask?.title||'Your focused time'} left={remaining(state.session,now)} duration={state.session.duration} onEnd={()=>{if(window.confirm('End this session? Incomplete sessions earn no effort reward.'))dispatch({type:'cancel'})}} onFinish={(outcome,note,nextStep)=>{const at=Date.now();reward(outcome==='finished'?'task':'session');dispatch({type:'finishSession',outcome,note,nextStep,now:at});setNow(at);setToast(outcome==='finished'?'Study paid. Task finished. +$20 bonus.':outcome==='continue'?'Cash earned. Next round started.':'Progress saved. Study cash earned.')}}/>}
  <RewardFlight flight={flight} reduced={reduced}/>
  {storageError&&<div className="storage-warning">Storage unavailable. Export your progress from Settings.</div>}{toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>{
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)window.dispatchEvent(new Event('compound-update'))});
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});setInterval(check,60000)}).catch(()=>{});
});
