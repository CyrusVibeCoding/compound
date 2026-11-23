// Date-only deadlines use local calendar days, never UTC parsing.
export function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number);return y>=1000&&m>=1&&m<=12&&d>=1&&d<=new Date(y,m,0).getDate();}
export function localDate(value){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export function dateKey(date){return `${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function dateLabel(value){return validDate(value)?localDate(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'';}
export function todayTasks(tasks,today){return tasks.filter(t=>!t.done&&(t.today===today||t.dueDate===today));}
export function overdueTasks(tasks,today){return tasks.filter(t=>!t.done&&t.dueDate&&t.dueDate<today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));}
export function monthDays(month){const first=localDate(month.slice(0,7)+'-01'),offset=(first.getDay()+6)%7;return Array.from({length:42},(_,i)=>{const d=new Date(first);d.setDate(1-offset+i);return dateKey(d)});}
export function shiftMonth(month,delta){const d=localDate(month.slice(0,7)+'-01');d.setMonth(d.getMonth()+delta);return dateKey(d);}
