import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {ArrowLeft,Plus,Search,Archive,RotateCcw,ChevronUp,ChevronDown,Trash2,Folder,FileText,Heading,List,CheckSquare} from 'lucide-react';
import type {Task} from './UI';
import {matchingNotes} from './notes.mjs';
type Block={id:string,type:'text'|'heading'|'bullet'|'check',text:string,checked:boolean};
type Note={id:string,title:string,project:string|null,blocks:Block[],createdAt:number,updatedAt:number,archived:boolean};
function BlockInput({block,change,focus}:{block:Block,change:(text:string)=>void,focus:boolean}){
 const ref=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{if(ref.current){ref.current.style.height='auto';ref.current.style.height=ref.current.scrollHeight+'px'}},[block.text]);
 return <textarea ref={ref} autoFocus={focus} aria-label={block.type==='heading'?'Heading':block.type==='check'?'Checklist item':block.type==='bullet'?'Bullet item':'Paragraph'} placeholder={block.type==='heading'?'Heading':block.type==='check'?'Something to check off…':'Write something…'} maxLength={10000} rows={1} value={block.text} onChange={e=>change(e.target.value)}/>;
}
export default function Pages({notes,projects,dispatch,onProjects,saved,storageError,selected,setSelected,tasks,row,onOpenTask}:{selected:string|null,setSelected:(id:string|null)=>void,tasks:Task[],row:(task:Task)=>ReactNode,onOpenTask:(id:string)=>void,notes:Note[],projects:string[],dispatch:(action:any)=>void,onProjects:()=>void,saved:boolean,storageError:boolean}){
 const [query,setQuery]=useState(''),[project,setProject]=useState(''),[archived,setArchived]=useState(false),[focusBlock,setFocusBlock]=useState<string|null>(null),[taskTitle,setTaskTitle]=useState('');
 const note=notes.find(n=>n.id===selected),results:Note[]=matchingNotes(notes,query,project,archived);
 function edit(patch:Partial<Note>){if(note)dispatch({type:'noteEdit',id:note.id,...patch})}
 function newNote(){const id=crypto.randomUUID();dispatch({type:'noteAdd',id});setSelected(id);setFocusBlock(null)}
 function add(type:Block['type']){if(!note)return;const id=crypto.randomUUID();edit({blocks:[...note.blocks,{id,type,text:'',checked:false}]});setFocusBlock(id)}
 function change(id:string,patch:Partial<Block>){if(note)edit({blocks:note.blocks.map(b=>b.id===id?{...b,...patch}:b)})}
 function move(index:number,step:number){if(!note)return;const blocks=[...note.blocks];[blocks[index],blocks[index+step]]=[blocks[index+step],blocks[index]];edit({blocks})}
 if(note)return <section className="pages-view note-editor" aria-label="Page editor">
  <div className="pages-top"><button className="page-back" onClick={()=>setSelected(null)}><ArrowLeft size={18}/> Pages</button><span className={storageError?'note-save error':'note-save'} role="status">{storageError?'Not saved · Export a backup':saved?'Saved on this device':'Saving…'}</span></div>
  {note.archived&&<div className="archive-notice">This page is archived. <button onClick={()=>edit({archived:false})}><RotateCcw size={15}/> Restore page</button></div>}
  <input className="note-title" aria-label="Page title" placeholder="Untitled page" maxLength={160} value={note.title} onChange={e=>edit({title:e.target.value})}/>
  <label className="note-project"><Folder size={16}/><span>Project</span><select aria-label="Page project" value={note.project??''} onChange={e=>edit({project:e.target.value||null})}><option value="">No project</option>{projects.map(p=><option key={p}>{p}</option>)}</select></label>
  <div className="note-blocks">{note.blocks.map((block,index)=><div key={block.id} className={`note-block block-${block.type} ${block.checked&&block.type==='check'?'checked':''}`}>
   {block.type==='check'?<input type="checkbox" aria-label={`Check ${block.text||'item'}`} checked={block.checked} onChange={e=>change(block.id,{checked:e.target.checked})}/>:block.type==='bullet'?<span className="bullet-mark">•</span>:null}
   <BlockInput block={block} focus={focusBlock===block.id} change={text=>change(block.id,{text})}/>
   <div className="block-tools"><button aria-label="Move block up" disabled={index===0} onClick={()=>move(index,-1)}><ChevronUp size={15}/></button><button aria-label="Move block down" disabled={index===note.blocks.length-1} onClick={()=>move(index,1)}><ChevronDown size={15}/></button>{!block.text&&<button aria-label="Remove empty block" onClick={()=>edit({blocks:note.blocks.filter(b=>b.id!==block.id)})}><Trash2 size={14}/></button>}</div>
  </div>)}</div>
  {note.blocks.length<1000&&<div className="add-block" aria-label="Add content">{([{type:'text',label:'Text',Icon:FileText},{type:'heading',label:'Heading',Icon:Heading},{type:'bullet',label:'Bullet',Icon:List},{type:'check',label:'Checklist',Icon:CheckSquare}] as const).map(({type,label,Icon})=><button key={type} onClick={()=>add(type)}><Icon size={16}/>{label}</button>)}</div>}
  {!note.blocks.length&&<p className="page-hint">Start with a paragraph, heading, or checklist above.</p>}
  <section className="linked-tasks" aria-label="Page tasks"><h2>Tasks</h2>{tasks.filter(t=>t.pageId===note.id).sort((a,b)=>Number(a.done)-Number(b.done)).map(row)}{!tasks.some(t=>t.pageId===note.id)&&<p>No linked tasks yet. You can also link an existing task from its details.</p>}
  {!note.archived&&<form onSubmit={e=>{e.preventDefault();if(!taskTitle.trim())return;const id=crypto.randomUUID();dispatch({type:'add',id,title:taskTitle,project:note.project??projects[0],pageId:note.id});setTaskTitle('');onOpenTask(id)}}><input aria-label="Page task title" placeholder="Add a related task…" value={taskTitle} maxLength={240} onChange={e=>setTaskTitle(e.target.value)}/><button className="icon-button" aria-label="Add page task" disabled={!taskTitle.trim()}><Plus size={18}/></button></form>}</section>
  <div className="note-footer"><span>Created {new Date(note.createdAt).toLocaleDateString()}</span>{!note.archived&&<button onClick={()=>{edit({archived:true});setSelected(null)}}><Archive size={16}/> Archive page</button>}</div>
 </section>;
 return <section className="pages-view" aria-label="Pages">
  <div className="pages-top"><span className="eyebrow">ROOM FOR YOUR IDEAS</span><button className="page-back" onClick={onProjects}><Folder size={17}/> Projects</button></div>
  <div className="pages-heading"><div><h1>Pages</h1><p>Notes, plans, and things to remember.</p></div><button className="small-button" onClick={newNote}><Plus size={18}/> New page</button></div>
  <label className="page-search"><Search size={18}/><input aria-label="Search pages" placeholder="Search titles and notes…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <div className="page-filters"><select aria-label="Filter pages by project" value={project} onChange={e=>setProject(e.target.value)}><option value="">All projects</option>{projects.map(p=><option key={p}>{p}</option>)}</select><button aria-pressed={archived} onClick={()=>setArchived(v=>!v)}><Archive size={16}/>{archived?'Show active':'Archive'}</button></div>
  <div className="page-list">{results.map(n=><button className="page-card" key={n.id} onClick={()=>{setSelected(n.id);setFocusBlock(null)}}><FileText size={21}/><div><strong>{n.title.trim()||'Untitled page'}</strong><p>{n.blocks.map(b=>b.text).filter(Boolean).join(' ').slice(0,130)||'A blank page, ready for an idea.'}</p><small>{n.project?`${n.project} · `:''}{new Date(n.updatedAt).toLocaleDateString()}</small></div></button>)}</div>
  {!results.length&&<div className="empty"><FileText size={30}/><h3>{query||project?'No matching pages':archived?'No archived pages':'Your first page starts here.'}</h3><p>{query||project?'Try a different search or project.':archived?'Pages you archive will appear here.':'Keep class notes, plan a project, or write down an idea.'}</p></div>}
  <p className="page-hint">Saved on this device. Pages are included in Settings → Export backup.</p>
 </section>;
}
