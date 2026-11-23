import {Check,Lock,Sparkles,Trophy} from 'lucide-react';
import {FINISHES,milestones,finishUnlocked,effectiveFinish} from './progression.mjs';
import {Modal} from './UI';
import {amount} from './production.mjs';
export default function Unlocks({state,onChoose,close}:{state:any,onChoose:(look:string)=>void,close:()=>void}){
 const steps=milestones(state),achieved=steps.filter(m=>m.achieved).length,next=steps.find(m=>!m.achieved);
 return <Modal close={close} label="Unlocks and machine finishes"><span className="eyebrow">YOUR EFFORT, MADE VISIBLE</span><h2>A little more yours.</h2><p className="unlock-intro">{achieved} of {steps.length} milestones. {next?`Next: ${next.detail.toLowerCase()}.`:'Every milestone reached. Keep building your world.'}</p>
  <div className="finish-options" aria-label="Machine finishes">{FINISHES.map(f=>{const unlocked=finishUnlocked(state,f.id),selected=effectiveFinish(state)===f.id;return <button key={f.id} disabled={!unlocked} aria-pressed={selected} className={`finish-option ${selected?'selected':''}`} onClick={()=>onChoose(f.id)}><span className={`finish-swatch ${f.id}`}><span/><span/><span/>{selected&&<Check size={17}/>}</span><strong>{f.name}</strong><small>{unlocked?(selected?'In use':'Apply finish'):<><Lock size={10}/> {f.id==='graphite'?'3 tasks':'25 focus min'}</>}</small></button>})}</div>
  <div className="milestone-list">{steps.map(m=><div key={m.id} className={`milestone ${m.achieved?'achieved':''}`}><span className="milestone-icon">{m.achieved?<Trophy size={18}/>:<Sparkles size={18}/>}</span><div><div className="milestone-title"><strong>{m.name}</strong><span>{amount(Math.min(m.value,m.target))}/{m.target}</span></div><p>{m.detail}</p><div className="milestone-track" role="progressbar" aria-label={m.detail} aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={Math.min(m.value,m.target)}><i style={{width:`${m.progress*100}%`}}/></div><small>{m.achieved?'Unlocked · ':''}{m.reward}</small></div></div>)}</div>
 </Modal>;
}
