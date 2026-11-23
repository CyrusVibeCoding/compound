import React,{useEffect,useReducer,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Box,Check,Plus,Layers,ListTodo,Folder,Settings,Download,Upload,CheckCircle2,RotateCw,Zap,Sparkles,Save} from 'lucide-react';
import {type Kind} from './World';
import Farm from './Farm';
import InventionSheet from './InventionSheet';
import Unlocks from './Unlocks';
import {newMachineCost} from './machines.mjs';
import {loadLocal,saveLocal} from './storage.mjs';
import {milestones,effectiveFinish} from './progression.mjs';
import {useReducedEffects,type SceneEvent} from './effects';
import {INITIAL,reduce,cost,remaining,validSave,migrate,dayKey} from './game.mjs';
import {advance,factoryStats,productionStatus,upgradeBenefit,amount} from './production.mjs';
import {AnimatedMatter,TaskRow,TaskDetails,Modal,Focus,RewardFlight,type Task,type Flight} from './UI';
import './style.css';
const names={core:'The Core',press:'The Press',assembler:'The Assembler'};
const descriptions={core:'Powers construction or produces Matter. Upgrades improve capacity and fabrication efficiency.',press:'Speeds fabrication and reduces Charge needed for construction.',assembler:'Installs invention parts, improves construction efficiency, and collects Matter automatically.'};
let boot={source:'new',at:null as number|null};
function read(){const at=Date.now();let loaded;try{loaded=loadLocal(localStorage)}catch{loaded={state:INITIAL,source:'unavailable',at:null}}boot={source:loaded.source,at:loaded.at};return advance(migrate(loaded.state,at),at)}
function App(){
 const [state,dispatch]=useReducer(reduce,undefined,read),[tab,setTab]=useState('world');
 const [sheet,setSheet]=useState<string|null>(null),[selectedId,setSelectedId]=useState<string|null>(null);
 const [title,setTitle]=useState(''),[project,setProject]=useState('Business'),[filter,setFilter]=useState<string|null>(null),[listFilter,setListFilter]=useState('today'),[newProject,setNewProject]=useState('');
 const [now,setNow]=useState(Date.now()),[toast,setToast]=useState(boot.source==='backup'?'Recovered local backup.':''),[storageError,setStorageError]=useState(false),[updateReady,setUpdateReady]=useState(false),[flight,setFlight]=useState<Flight>(null);
 const [savedAt,setSavedAt]=useState<number|null>(boot.at),latest=useRef(state);latest.current=state;
 const [sceneEvent,setSceneEvent]=useState<SceneEvent>(null),[unlockNotice,setUnlockNotice]=useState('');
 const previousWork=useRef(state.invention.work);
 useEffect(()=>{const before=previousWork.current,work=state.invention.work;previousWork.current=work;if([10,26,50].some(n=>before<n&&work>=n)){setToast(work>=50?'Observatory complete. Your effort, made visible.':work>=26?'Dish installed. Next: bring it to life.':'Frame complete. Next: dish and gimbal.');}},[state.invention.work]);
 const reduced=useReducedEffects(state.calm),steps=milestones(state),unlockCount=steps.filter(m=>m.achieved).length,seen=useRef(new Set(steps.filter(m=>m.achieved).map(m=>m.id)));
 useEffect(()=>{const reached=steps.filter(m=>m.achieved&&!seen.current.has(m.id));reached.forEach(m=>seen.current.add(m.id));if(reached.length)setUnlockNotice(reached[reached.length-1].reward)},[unlockCount]);
 useEffect(()=>{if(!sceneEvent)return;const id=setTimeout(()=>setSceneEvent(null),1100);return()=>clearTimeout(id)},[sceneEvent]);
 useEffect(()=>{if(!unlockNotice)return;const id=setTimeout(()=>setUnlockNotice(''),5500);return()=>clearTimeout(id)},[unlockNotice]);
 useEffect(()=>{const updated=()=>setUpdateReady(true);window.addEventListener('compound-update',updated);return()=>window.removeEventListener('compound-update',updated)},[]);
 function persist(current=latest.current){let result;try{result=saveLocal(localStorage,current)}catch{result={ok:false,at:null}}setStorageError(!result.ok);if(result.ok)setSavedAt(result.at);return result.ok;}
 useEffect(()=>{persist(state)},[state]);
 useEffect(()=>{const flush=()=>{try{saveLocal(localStorage,latest.current)}catch{}};const hide=()=>{if(document.hidden)flush()};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',hide);return()=>{window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',hide)}},[]);
 function manualSave(){const ok=persist();setToast(ok?'Saved on this phone.':'Could not save. Download a backup in Settings.');if(ok&&navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}

 const focus=!!state.session;
 useEffect(()=>{const update=()=>{const at=Date.now();setNow(at);dispatch({type:'tick',now:at})};const id=setInterval(update,focus||state.invention.active?1000:5000);const visible=()=>{if(!document.hidden)update()};document.addEventListener('visibilitychange',visible);window.addEventListener('focus',update);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',update)}},[focus,state.invention.active]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(!flight)return;const id=setTimeout(()=>setFlight(null),1200);return()=>clearTimeout(id)},[flight]);
 const tasks:Task[]=state.tasks,projects:string[]=state.projects,pending=tasks.filter(t=>!t.done),today=pending.filter(t=>t.today===dayKey(now)),done=tasks.filter(t=>t.done).length;
 const selected=tasks.find(t=>t.id===selectedId),activeTask=tasks.find(t=>t.id===state.session?.taskId),stats=factoryStats(state),status=productionStatus(state);
 const list=listFilter==='today'?today:pending;
 const selectedMachine=state.machines.find((m:any)=>m.id===sheet),machineKind=(selectedMachine?.kind??'core') as Kind;
 const prices={core:newMachineCost(state,'core')??Infinity,press:newMachineCost(state,'press')??Infinity,assembler:newMachineCost(state,'assembler')??Infinity};
 function reward(kind:'collect'|'task'|'session',origin?:DOMRect){const target=document.querySelector('.matter')?.getBoundingClientRect(),from=origin??document.querySelector('.sheet')?.getBoundingClientRect();if(!target)return;const x=from?from.left+from.width/2:window.innerWidth/2,y=from?from.top+Math.min(from.height/2,100):window.innerHeight*.55;setFlight({id:performance.now(),kind,x,y,dx:target.left+target.width/2-x,dy:target.top+target.height/2-y})}
 function pulse(kind:'place'|'upgrade'|'collect',point:[number,number,number],machine?:Kind){setSceneEvent({id:performance.now(),at:Date.now(),kind,point,machine})}
 function complete(id:string,origin?:DOMRect){reward('task',origin);dispatch({type:'complete',id});setToast('+20 Matter · Task finished. Tank recharged.');setSelectedId(null)}
 function start(id:string,duration:number){const at=Date.now();dispatch({type:'start',id,duration,now:at});setNow(at);setSelectedId(null)}
 function add(e:React.FormEvent){e.preventDefault();if(!title.trim())return;dispatch({type:'add',id:crypto.randomUUID(),title,project});setTitle('');setListFilter('today');setToast('Added to Today.')}
 function collect(){reward('collect',document.querySelector('.collect-button')?.getBoundingClientRect());const core=state.machines.find((m:any)=>m.kind==='core'&&state.placements[m.id]);if(core)pulse('collect',state.placements[core.id]);dispatch({type:'collect'});setToast(`Collected ${amount(state.factory.stored)} Matter.`)}
 function exportSave(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='compound-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importSave(file?:File){if(!file)return;try{const s=JSON.parse(await file.text());if(!validSave(s))throw Error();if(!window.confirm('Replace current progress with this backup?'))return;if(!saveLocal(localStorage,migrate(s,Date.now())).ok)throw Error();location.reload()}catch{setToast('Could not read backup. Current progress kept.')}}
 const row=(task:Task)=><TaskRow key={task.id} task={task} onOpen={()=>setSelectedId(task.id)} onDone={origin=>complete(task.id,origin)} onFocus={()=>start(task.id,10)}/>;
 return <div className={`app ${reduced?'calm-effects':''}`} onContextMenu={e=>{if(!(e.target as Element).closest('input,textarea,[contenteditable]'))e.preventDefault()}} onDragStart={e=>{if(!(e.target as Element).closest('input,textarea,[contenteditable]'))e.preventDefault()}}>
  {updateReady&&<button className="update-banner" onClick={()=>location.reload()}>Update ready · Tap to refresh</button>}
  <header><a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('world')}}><span className="brand-mark"><Box size={21}/></span>compound<span className="brand-period">.</span></a><div className="header-right"><div className="matter" aria-label={`${amount(state.matter)} Matter`}><span className="matter-icon">✦</span><AnimatedMatter value={state.matter} reduced={reduced}/><span>Matter</span></div><button className={`icon-button save-progress ${storageError?'save-error':''}`} aria-label="Save progress on this device" onClick={manualSave}><Save size={18}/></button><button className="icon-button settings" aria-label="Settings and backup" onClick={()=>setSheet('settings')}><Settings size={19}/></button></div></header>
  <main>
   {tab==='world'&&!focus&&<Farm invention={state.invention} onBuild={()=>setSheet('invention')} machines={state.machines} prices={prices} levels={state.levels} matter={state.matter} placements={state.placements} rotations={state.rotations} onPlace={(id,kind,point)=>{dispatch({type:'place',id,kind,point});pulse('place',point,kind)}} onSelect={setSheet} onUndo={()=>dispatch({type:'undoLayout'})} canUndo={!!state.layoutUndo} charge={state.factory.charge} chargeCapacity={stats.chargeCapacity} stored={state.factory.stored} status={status} onCollect={collect} onUnlocks={()=>setSheet('unlocks')} unlockCount={unlockCount} look={effectiveFinish(state)} reduced={reduced} event={sceneEvent} selection={sheet&&sheet!=='settings'&&sheet!=='unlocks'&&sheet!=='invention'?sheet:null}/>}
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
  {sheet==='invention'&&<InventionSheet state={state} dispatch={dispatch} close={()=>setSheet(null)}/>}
  {sheet==='unlocks'&&<Unlocks state={state} close={()=>setSheet(null)} onChoose={look=>{dispatch({type:'setLook',look});setToast('Finish applied. Your world, your way.');setSheet(null)}}/>}
  {sheet&&(sheet==='settings'||selectedMachine)&&sheet!=='unlocks'&&<Modal close={()=>setSheet(null)} label={sheet==='settings'?'Settings':names[machineKind]}>{sheet==='settings'?<>
   <span className="eyebrow">SAVED ON THIS PHONE</span><h2>Keep what you build.</h2><div className={`save-status ${storageError?'error':''}`} role="status"><Save size={19}/><div><strong>{storageError?'Local save unavailable':savedAt?'Progress saved locally':'Preparing local save…'}</strong><span>{savedAt?`Last saved ${new Date(savedAt).toLocaleTimeString()}`:'Your tasks, machines, and layout stay in this browser.'}</span></div></div><button className="primary wide" onClick={manualSave}><Save size={17}/> Save on this phone</button><p className="help-note">Autosaves after changes and when leaving the app. A local recovery copy is also kept. Download a backup for a file you can keep when switching phones or clearing browser data.</p>
   <div className="motion-setting"><div><strong>Calmer effects</strong><span>Less movement. Same rewards.</span></div><button className={`toggle ${state.calm?'on':''}`} role="switch" aria-label="Calmer effects" aria-checked={state.calm} onClick={()=>dispatch({type:'setCalm',calm:!state.calm})}><i/></button></div><button className="secondary wide" onClick={()=>setSheet('unlocks')}><Sparkles size={18}/> Finishes & milestones</button>
   <button className="secondary wide" onClick={exportSave}><Download size={18}/> Export backup</button><label className="secondary wide upload"><Upload size={18}/> Import backup<input type="file" accept=".json,application/json" onChange={e=>importSave(e.target.files?.[0])}/></label>
   <div className="help-note">Focus: 2 Matter +1 Charge per minute. Finished task: 20 Matter +5 Charge. Charge stops accumulating at tank capacity. Build mode spends Charge on permanent invention parts. Pause it to produce Matter. Only placed machines operate; stored Charge never expires.<br/><br/>On iPhone: Safari → Share → Add to Home Screen. Production catches up when reopened, including offline. Background notifications are not enabled.</div><small>Compound · Working inventions 0.6 · No account needed</small>
  </>:<>
   <span className="eyebrow">YOUR MACHINERY</span><h2>{names[machineKind]}</h2><p>{descriptions[machineKind]}</p>
   <div className="upgrade-detail"><Box size={30}/><div><strong>Level {(selectedMachine?.level??1)} of 3 · this {machineKind}</strong><span>{state.placements[sheet]?'Placed · active benefits':'In tray · place to operate'}</span></div></div>
   <div className="upgrade-benefit"><span className="field-label">{(selectedMachine?.level??1)===3?'COMPLETE':'NEXT UPGRADE'}</span><p>{upgradeBenefit(state,sheet)}</p></div>
   <button className="primary wide" disabled={cost(machineKind,(selectedMachine?.level??1))===null||state.matter<cost(machineKind,(selectedMachine?.level??1))} onClick={()=>{dispatch({type:'upgrade',id:sheet});if(state.placements[sheet])pulse('upgrade',state.placements[sheet],machineKind);setSheet(null);setToast('Upgraded. New parts, more possibility.')}}>{(selectedMachine?.level??1)===3?<><Check size={18}/> Fully upgraded</>:<>Upgrade this machine <span>✦ {cost(machineKind,(selectedMachine?.level??1))}</span></>}</button>
   {state.placements[sheet]&&<div className="machine-actions"><button className="secondary wide" onClick={()=>dispatch({type:'rotate',id:sheet})}><RotateCw size={17}/> Rotate 90°</button><button className="secondary wide" onClick={()=>{dispatch({type:'unplace',id:sheet});setSheet(null)}}>Return to tray</button></div>}
   {cost(machineKind,(selectedMachine?.level??1))!==null&&state.matter<cost(machineKind,(selectedMachine?.level??1))&&<div className="shortfall">{amount(cost(machineKind,(selectedMachine?.level??1))-state.matter)} more Matter needed.</div>}
   {machineKind==='core'&&<p className="help-note"><Zap size={13}/> {amount(state.factory.charge)} / {stats.chargeCapacity} Charge · {amount(state.factory.stored)} / {stats.storageCapacity} output stored. {amount(stats.rate*stats.yield)} Matter/min while powered.</p>}
  </>}</Modal>}
  {selected&&!focus&&<TaskDetails key={selected.id} task={selected} projects={projects} dispatch={dispatch} close={()=>setSelectedId(null)} onStart={d=>start(selected.id,d)} onDone={()=>complete(selected.id)}/>}
  {focus&&<Focus key={`${state.session.taskId}-${state.session.started}`} title={activeTask?.title||'Your focused time'} left={remaining(state.session,now)} duration={state.session.duration} onEnd={()=>{if(window.confirm('End this session? Incomplete sessions earn no effort reward.'))dispatch({type:'cancel'})}} onFinish={(outcome,note)=>{const at=Date.now();reward(outcome==='finished'?'task':'session');dispatch({type:'finishSession',outcome,note,now:at});setNow(at);setToast(outcome==='finished'?'Task finished. Farm charged.':outcome==='continue'?'Effort collected. Next round started.':'Progress saved. Farm charged.')}}/>}
  <RewardFlight flight={flight} reduced={reduced}/>{unlockNotice&&!focus&&<button className="unlock-notice" onClick={()=>{setUnlockNotice('');setSheet('unlocks')}}><span><Sparkles size={21}/></span><div><small>MILESTONE REACHED</small><strong>{unlockNotice}</strong></div><span>View</span></button>}
  {storageError&&<div className="storage-warning">Storage unavailable. Export your progress from Settings.</div>}{toast&&!unlockNotice&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>{
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)window.dispatchEvent(new Event('compound-update'))});
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{updateViaCache:'none'}).then(reg=>{const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});setInterval(check,60000)}).catch(()=>{});
});
