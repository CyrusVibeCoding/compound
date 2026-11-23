import {test} from 'node:test';import assert from 'node:assert/strict';
import {publishedRelease,freshUpdateUrl,releaseCheckUrl} from '../src/updates.mjs';
test('published release comes only from valid release metadata',()=>{
 assert.equal(publishedRelease('<meta name="theme-color" content="#fff"><meta name="compound-release" content="little-city-shops-12-1">'),'little-city-shops-12-1');
 assert.equal(publishedRelease("<META content='next-release' name='compound-release'>"),'next-release');
 for(const value of ['<html>offline error</html>','<meta name="compound-release" content="https://elsewhere.example">'])assert.equal(publishedRelease(value),null);
});
test('updating busts the navigation cache and keeps the same app origin and path',()=>{
 const current='https://example.com/compound/?v=old&view=city#hello',updated=new URL(freshUpdateUrl(current,'new-release',123));
 assert.equal(updated.origin,'https://example.com');assert.equal(updated.pathname,'/compound/');assert.equal(updated.searchParams.get('v'),'new-release');assert.equal(updated.searchParams.get('view'),'city');assert.equal(updated.searchParams.get('_update'),'123');assert.equal(updated.hash,'#hello');
 const check=new URL(releaseCheckUrl(current,456));assert.equal(check.pathname,'/compound/index.html');assert.equal(check.searchParams.get('_update-check'),'456');
});
