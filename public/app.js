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
  auth: { storageKey: 'sb-hzovkgmggfqoumxwbejm-auth-token' },
});
const el = id => document.getElementById(id);
let generation = 0;
const say = message => { el('status').textContent = message; };
async function api(path = '', method = 'GET', body) {
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/notes' + path, { method, cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청에 실패했습니다.');
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
  el('login').hidden = !!session; el('logout').hidden = !session; el('workspace').hidden = !session;
  el('notes').replaceChildren(); el('editor').reset();
  say(session ? '로그인되었습니다.' : '로그인 후 자료를 볼 수 있습니다.');
  if (session) { try { await load(); } catch (e) { say(e.message); } }
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
