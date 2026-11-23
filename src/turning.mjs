// Frame-rate independent shortest-arc turning; routes and clocks stay unchanged.
export function turnTowards(current,target,seconds){
 const arc=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+arc*(-Math.expm1(-12*Math.max(0,Math.min(seconds,.1))));
}
