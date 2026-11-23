export function publishedRelease(html){
 for(const tag of html.match(/<meta\b[^>]*>/gi)??[]){
  if(!/\bname\s*=\s*['"]compound-release['"]/i.test(tag))continue;
  const release=tag.match(/\bcontent\s*=\s*['"]([^'"]+)['"]/i)?.[1];
  return release&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(release)?release:null;
 }
 return null;
}
export function freshUpdateUrl(current,release,at=Date.now()){
 const url=new URL(current);if(release)url.searchParams.set('v',release);
 url.searchParams.set('_update',String(at));return url.href;
}
export function releaseCheckUrl(current,at=Date.now()){
 const url=new URL('./index.html',current);url.searchParams.set('_update-check',String(at));return url.href;
}
