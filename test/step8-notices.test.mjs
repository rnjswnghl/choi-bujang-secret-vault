import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../api/notices.js',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
const build=new Function('createClient','createLoginVerifier','config','const enforceAppDevice=async()=>true;\n'+source+'\nreturn handler;');
const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
process.env.SUPABASE_URL='https://hzovkgmggfqoumxwbejm.supabase.co';
process.env.SUPABASE_SECRET_KEY='local-test-placeholder';
test('API ignores forged body role; only stored instructor can update',async()=>{
 for(const instructor of [false,true]){
  let updated=false;
  const db={from(table){const q={select(){return q;},eq(){return q;},update(){updated=true;return q;},maybeSingle:async()=>({error:null,data:table==='vault_instructors'?(instructor?{user_id:'fixture'}:null):{id,title:'fixture',body:'fixture'}})};return q;}};
  const handler=build(()=>db,()=>async()=>({kind:'student',userId:'fixture'}),{});
  for(const body of [{title:'fixture',body:'fixture',role:'instructor'},{title:'fixture',body:'fixture'}]){
   let status;
   await handler({method:'PUT',headers:{authorization:'Bearer test.placeholder.signature'},query:{id},body},{setHeader(){},status(s){status=s;return this;},json(){}});
   assert.equal(status,!instructor?403:body.role?400:200);
  }
  assert.equal(updated,instructor);
 }
});
