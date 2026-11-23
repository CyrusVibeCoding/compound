// Closed-form damped spring. Large frame gaps are capped to avoid jumps after backgrounding.
export function spring(value,velocity,target,delta,frequency=18,damping=.76){
 const dt=Math.max(0,Math.min(delta,.05)),w=frequency,z=damping,wd=w*Math.sqrt(1-z*z),x=value-target,e=Math.exp(-z*w*dt),c=Math.cos(wd*dt),s=Math.sin(wd*dt);
 return [target+e*(x*c+(velocity+z*w*x)/wd*s),e*(velocity*c-(z*w*velocity+w*w*x)/wd*s)];
}
