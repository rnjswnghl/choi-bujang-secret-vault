import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../api/notes.js',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
const build=new Function('randomUUID','createClient','createLoginVerifier','config','const enforceAppDevice=async()=>true;\n'+source+'\nreturn handler;');
const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
process.env.SUPABASE_URL='https://hzovkgmggfqoumxwbejm.supabase.co';process.env.SUPABASE_SECRET_KEY='local-test-placeholder';
async function get(userId,data,single=true,url){
 const q={select(){return q;},eq(){return q;},order(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data,error:null}).then(resolve);}};
 const handler=build(()=>id,()=>({from(){return q;}}),()=>async()=>({userId}),{});
 let status,body;
 await handler({method:'GET',query:single?{id}:{},...(url?{url}:{}),headers:{authorization:'Bearer test.placeholder.signature'}},{setHeader(){},status(s){status=s;return this;},json(v){body=v;}});
 return {status,body};
}
test('GET rechecks stored owner even if database adapter returns an unrelated row',async()=>{
 const row={id,title:'fixture',body:'fixture',owner_id:a};
 const allowed=await get(a,row);assert.equal(allowed.status,200);assert.deepEqual(Object.keys(allowed.body).sort(),['body','id','title']);
 const denied=await get(b,row);assert.equal(denied.status,404);assert.deepEqual(denied.body,{error:'메모가 없습니다.'});
 assert.equal((await get(a,{...row,owner_id:null})).status,404);
});
test('list never exposes another owner even if database filtering fails',async()=>{
 const rows=[{id,title:'fixture',body:'fixture',owner_id:a},{id,title:'other',body:'other',owner_id:b}];
 const out=await get(a,rows,false);assert.equal(out.status,200);assert.equal(out.body.length,1);assert.equal(out.body[0].title,'fixture');
});

test('real URL path must not degrade into a successful own-list response',async()=>{
 const other='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 // Model a plain Node/Vercel request: URL contains the ID but query has no dynamic parameter.
 const result=await get(a,[{id,title:'fixture',body:'fixture',owner_id:a}],false,'/api/notes/'+other);
 assert.notEqual(result.status,200);
});

test('URL own read stays a single object; conflicting IDs and function paths rejected',async()=>{
 const row={id,title:'fixture',body:'fixture',owner_id:a};
 const own=await get(a,row,false,'/api/notes/'+id);
 assert.equal(own.status,200);assert.equal(Array.isArray(own.body),false);assert.equal(own.body.id,id);
 const other='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 assert.equal((await get(a,row,false,'/api/notes/'+other)).status,404);
 assert.equal((await get(a,row,true,'/api/notes/'+other)).status,400);
 assert.equal((await get(a,row,false,'/api/notes/export')).status,400);
 assert.equal((await get(a,row,false,'/api/notes/'+id+'/extra')).status,404);
 assert.equal((await get(a,row,false,'/api/notes/'+id+'?id='+other)).status,400);
 assert.equal((await get(a,row,false,'/api/notes/'+id+'?role=instructor')).status,400);
});
