import {Modal} from './UI';
import {amount,factoryStats} from './production.mjs';
export default function InventionSheet({state,dispatch,close}:{state:any,dispatch:(action:any)=>void,close:()=>void}){
 const build=state.invention,stats=factoryStats(state),done=build.work>=50;
 const stages=[{name:'Support frame',start:0,end:10},{name:'Dish & gimbal',start:10,end:26},{name:'Mechanism & activation',start:26,end:50}];
 return <Modal close={close} label="Kinetic observatory"><span className="eyebrow">WORK BECOMES SOMETHING</span><h2>Kinetic observatory</h2><p>A working sculpture, built from your effort. Complete its frame, install the dish, then bring it to life. Yours to keep.</p>
 <div className="build-total"><strong>{amount(build.work)} / 50</strong><span>permanent parts installed</span></div>
 {stages.map(stage=><div className="build-stage" key={stage.name}><div><strong>{stage.name}</strong><span>{amount(Math.max(0,Math.min(stage.end-stage.start,build.work-stage.start)))} / {stage.end-stage.start}</span></div><progress aria-label={stage.name} max={stage.end-stage.start} value={Math.max(0,build.work-stage.start)}/></div>)}
 <label className="build-project">Link to project <select value={build.project} onChange={e=>dispatch({type:'build',project:e.target.value})}><option value="">Any real work</option>{state.projects.map((p:string)=><option key={p}>{p}</option>)}</select></label><p className="help-note">A project label for your collection. All work can power this build; your task completion stays independent.</p>
 <div className="upgrade-benefit"><strong>{done?'Observatory complete':stats.enabled?`Your Charge can install ${amount(Math.min(50-build.work,state.factory.charge*stats.buildYield))} parts`:'Place a Core to start'}</strong><p>{done?'The dish now turns. Hide or display it whenever you like. Remaining Charge stays yours.':`10 Charge makes ${amount(10*stats.buildYield)} parts. ${amount((50-build.work)/stats.buildYield)} Charge left to finish. Core fabricates; Press and Assembler each increase speed and efficiency. No adjacency needed.`}</p></div>
 {!done&&<button className="primary wide" onClick={()=>{dispatch({type:'build',active:!build.active});close()}}>{build.active?'Pause build · produce Matter':'Build this · use Charge'}</button>}
 {done&&build.active&&<button className="primary wide" onClick={()=>{dispatch({type:'build',active:false});close()}}>Return to Matter production</button>}
 {(build.active||build.work>0)&&<button className="secondary wide" onClick={()=>dispatch({type:'build',hidden:!build.hidden})}>{build.hidden?'Display on farm':'Hide from farm'}</button>}
 <p className="help-note">Progress never expires. Runs while away using available Charge, then stops. Existing stored Matter stays claimable. No extra rewards for watching.</p>
 </Modal>;
}
