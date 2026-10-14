import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
// This SDK placeholder has no Supabase permissions; the server supplies the real key.
const authFetch = async (input, init) => {
  const upstream = new URL(typeof input === 'string' ? input : input.url);
  if (upstream.origin !== 'https://hzovkgmggfqoumxwbejm.supabase.co' || !/^\/auth\/v1\/(token|logout|user)$/.test(upstream.pathname)) throw new Error('허용하지 않는 직접 요청입니다.');
  const target = new URL('/api/auth', window.location.origin);
  target.searchParams.set('path', upstream.pathname.split('/').pop());
  for (const [key, value] of upstream.searchParams) target.searchParams.append(key, value);
  const headers = new Headers(init?.headers);
  headers.delete('apikey');
  if (headers.get('Authorization') === 'Bearer auth-via-server') headers.delete('Authorization');
  return fetch(target, { ...init, headers, credentials: 'same-origin' });
};
const client = createClient('https://hzovkgmggfqoumxwbejm.supabase.co', 'auth-via-server', {
  global: { fetch: authFetch },
  auth: { persistSession: false, detectSessionInUrl: false },
});
const el = id => document.getElementById(id);
// Remove the old SDK session only; no new token or private key is persisted.
localStorage.removeItem('sb-hzovkgmggfqoumxwbejm-auth-token');
let generation = 0, deviceKey, approvedDevice, currentUser;
let campaignRows=[];
const hex=bytes=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
async function deviceStatus(request=false){
 el('workspace').hidden=true;el('operations').hidden=true;el('notes').replaceChildren();clearOperations();
 const current=generation;
 const {data:{session}}=await client.auth.getSession();
 if(!session)throw new Error('먼저 로그인하세요.');
 if(request&&!deviceKey)deviceKey=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
 const publicKey=deviceKey?await crypto.subtle.exportKey('jwk',deviceKey.publicKey):null;
 const response=await fetch(request?'/api/device':'/api/device?id='+approvedDevice?.id,{method:request?'POST':'GET',cache:'no-store',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:request?JSON.stringify({publicKey}):undefined});
 const result=await response.json();if(current!==generation)return;if(!response.ok){lockWorkspace();throw new Error(result.error);}
 approvedDevice=result;el('device-status').textContent='기기 상태: '+result.status+' · '+result.id;
 el('workspace').hidden=result.status!=='approved'; el('operations').hidden=result.status!=='approved';
 if(result.status==='approved')await load();else {el('notes').replaceChildren();clearOperations();}
}
async function proof(path,method,body){
 if(!deviceKey||approvedDevice?.status!=='approved')throw new Error('서버의 기기 승인이 필요합니다.');
 const time=String(Date.now()),nonce=hex(crypto.getRandomValues(new Uint8Array(16)));
 const hash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body?JSON.stringify(body):'')));
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},deviceKey.privateKey,new TextEncoder().encode([method,path,hash,time,nonce].join('\n')));
 return {'X-App-Device':approvedDevice.id,'X-App-Time':time,'X-App-Nonce':nonce,'X-App-Signature':base64url(signature)};
}
const say = message => { el('status').textContent = message; };
async function api(path = '', method = 'GET', body) {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/notes' + path, { method, cache: 'no-store', headers: { ...await proof('/api/notes'+path,method,body), Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) {if([401,403].includes(response.status))lockWorkspace();throw new Error(data.error || '요청에 실패했습니다.');}
  return data;
}
async function load() {
  const current = generation;
  const notes = await api();
  if (current !== generation) return;
  el('notes').replaceChildren(...notes.map(note => {
    const li = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = note.title;
    const body = document.createElement('span'); body.textContent = note.body;
    const edit = document.createElement('button'); edit.textContent = '수정'; edit.onclick = () => { el('note-id').value = note.id; el('title').value = note.title; el('body').value = note.body; };
    const remove = document.createElement('button'); remove.textContent = '삭제'; remove.onclick = async () => { try { await api('/' + note.id, 'DELETE'); el('editor').reset(); await load(); say('삭제했습니다.'); } catch (e) { say(e.message); } };
    li.append(title, body, edit, remove); return li;
  }));
}
async function state(session) {
  generation++;
  el('operations').hidden=true;clearOperations();
  el('login').hidden = !!session; el('logout').hidden = !session; el('workspace').hidden = true;
  if(currentUser!==session?.user?.id){approvedDevice=undefined;deviceKey=undefined;}
  currentUser=session?.user?.id;
  el('notes').replaceChildren(); el('editor').reset();
  say(session ? '로그인되었습니다.' : '로그인 후 자료를 볼 수 있습니다.');
  el('device-panel').hidden=!session; el('device-status').textContent='기기 승인 전에는 자료를 표시하지 않습니다.';
  if(session&&deviceKey&&approvedDevice){try{await deviceStatus(false);}catch(e){say(e.message);}}
}
el('login').onsubmit = async event => {
  event.preventDefault();
  const { error } = await client.auth.signInWithPassword({ email: el('email').value, password: el('password').value });
  el('password').value = '';
  if (error) say(error.message);
};
el('logout').onclick = async () => { const { error } = await client.auth.signOut(); if (error) say(error.message); };
el('editor').onsubmit = async event => {
  event.preventDefault();
  try { const id = el('note-id').value; await api(id ? '/' + id : '', id ? 'PUT' : 'POST', { title: el('title').value, body: el('body').value }); el('editor').reset(); await load(); say('저장했습니다.'); } catch (e) { say(e.message); }
};
el('cancel').onclick = () => el('editor').reset();
client.auth.onAuthStateChange((_event, session) => { setTimeout(() => state(session), 0); });
const { data: { session } } = await client.auth.getSession();
await state(session);

el('device-request').onclick=()=>deviceStatus(true).catch(e=>say(e.message));
el('device-check').onclick=()=>deviceStatus(false).catch(e=>say(e.message));
window.addEventListener('offline',()=>{generation++;el('operations').hidden=true;clearOperations();el('workspace').hidden=true;el('notes').replaceChildren();say('오프라인입니다. 보호 자료는 오프라인으로 저장하지 않습니다.');});

if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>say('오프라인 안내 등록에 실패했습니다. 온라인으로 이용하세요.'));

function lockWorkspace(){
 if(approvedDevice)approvedDevice={...approvedDevice,status:'unverified'};
 el('workspace').hidden=true;el('operations').hidden=true;el('notes').replaceChildren();clearOperations();
}
function clearOperations(){
 campaignRows=[];
 el('operations-summary').textContent='서버 결과 미확인';
 el('operations-rows').replaceChildren();
}
function renderOperations(rows){
 el('operations-rows').replaceChildren(...rows.map(row=>{
  const tr=document.createElement('tr');
  for(const value of [row.id,row.expected,row.execution==='not_run'?'미실행':row.actual,row.requestId??'—',row.checkedAt??'—']){
   const td=document.createElement('td');td.textContent=String(value??'확인 불가');td.style.padding='8px';tr.append(td);
  }return tr;
 }));
}
async function operationsRequest(){
 clearOperations();
 const current=generation;const {data:{session}}=await client.auth.getSession();
 if(!session)throw new Error('로그인이 필요합니다.');
 const path='/api/operations';
 const response=await fetch(path,{cache:'no-store',headers:{...await proof(path,'GET'),Authorization:`Bearer ${session.access_token}`}});
 if(!response.ok){if(current===generation){clearOperations();if([401,403].includes(response.status))lockWorkspace();}throw new Error('작전실 조회 HTTP '+response.status);}
 const data=await response.json();if(current!==generation)return;
 campaignRows=data.campaign;renderOperations(campaignRows);
 el('operations-summary').textContent=JSON.stringify({requestId:data.requestId,checkedAt:data.checkedAt,rules:data.rules,devices:data.devices,recovery:data.recovery,policyBackup:data.policyBackup,detection:data.detection,identityRevocation:data.identityRevocation},null,2);
}
el('operations-refresh').onclick=()=>operationsRequest().catch(e=>{clearOperations();say(e.message);});
el('operations-test').onclick=async()=>{
 const current=generation;const {data:{session}}=await client.auth.getSession();if(!session)return;
 const rows=[];
 for(const [id,expected,signed,authenticated] of [
  ['정상 본인 목록 / 4·5·11','HTTP 200',true,true],
  ['무인증 목록 / 3·5','HTTP 401',false,false],
  ['서명 없는 목록 / 11','HTTP 403',false,true]
 ]){
  const clientRequestId=crypto.randomUUID();let requestId=null,actual,checkedAt,execution='not_run';
  try{
   const headers={'X-Client-Request-Id':clientRequestId};
   if(authenticated)headers.Authorization=`Bearer ${session.access_token}`;
   if(signed)Object.assign(headers,await proof('/api/notes','GET'));
   const response=await fetch('/api/notes',{headers,cache:'no-store'});
   requestId=response.headers.get('X-Request-Id');execution='executed';actual='HTTP '+response.status;checkedAt=new Date().toISOString();
   // Discard the response body: no memo is copied to this report.
   if(response.body)await response.body.cancel();
  }catch{actual='연결 실패';checkedAt=new Date().toISOString();}
  if(current!==generation)return;
  rows.push({id,expected,actual,requestId,checkedAt,execution});
 }
 renderOperations([...rows,...campaignRows]);
};
