import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = (await readFile(new URL('../api/notes.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');
// Execute the production handler with isolated DB/verifier dependencies, without making JWTs.
const build = new Function('randomUUID', 'createClient', 'createLoginVerifier', 'config', source + '\nreturn handler;');
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const noteId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
function setup(userId) {
  const rows = [{ id: noteId, owner_id: a, title: 'fixture', content: 'fictional' }];
  const db = { from() {
    let mode = 'read', values, filters = [], single = false;
    const q = {
      select() { return q; }, eq(key, value) { filters.push([key,value]); return q; }, order() { return q; },
      maybeSingle() { single = true; return q; },
      insert(v) { mode = 'insert'; values = v; return q; },
      update(v) { mode = 'update'; values = v; return q; }, delete() { mode = 'delete'; return q; },
      then(resolve) {
        if (mode === 'insert') { rows.push(values); return Promise.resolve({error:null}).then(resolve); }
        const selected = rows.filter(row => filters.every(([k,v]) => row[k] === v));
        if (mode === 'update') selected.forEach(row => Object.assign(row,values));
        const data = selected.map(row => ({id:row.id,title:row.title,body:row.content}));
        if (mode === 'delete') for (const row of selected) rows.splice(rows.indexOf(row),1);
        return Promise.resolve({data:single ? data[0] ?? null : data,error:null}).then(resolve);
      },
    }; return q;
  }};
  const handler = build(() => 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', () => db, () => async () => ({ userId }), {});
  const request = async (method, id, body, queryExtras={}) => {
    let status, data;
    await handler({ method, headers:{authorization:'Bearer test.placeholder.signature'}, query:{...(id?{id}:{}),...queryExtras}, body },
      { setHeader(){}, status(code){status=code;return this;}, json(value){data=value;return this;} });
    return {status,data};
  };
  return {rows,request};
}
process.env.SUPABASE_URL = 'https://hzovkgmggfqoumxwbejm.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'local-test-placeholder';
test('B cannot read, modify, or delete A; own list excludes A', async () => {
  const {request,rows} = setup(b);
  assert.deepEqual((await request('GET')).data, []);
  for (const method of ['GET','PUT','DELETE']) {
    const result = await request(method,noteId,{title:'changed',body:'changed'});
    assert.equal(result.status,404);
  }
  assert.equal(rows.length,1); assert.equal(rows[0].title,'fixture'); assert.equal(rows[0].owner_id,a);
});
test('A keeps own CRUD and deletion returns 404 on subsequent GET', async () => {
  const {request,rows} = setup(a);
  assert.equal((await request('GET',noteId)).status,200);
  assert.equal((await request('PUT',noteId,{title:'updated',body:'updated'})).status,200);
  assert.equal(rows[0].owner_id,a);
  assert.equal((await request('POST',null,{title:'new',body:'new'})).status,201);
  assert.equal(rows[1].owner_id,a);
  assert.equal((await request('DELETE',noteId)).status,200);
  assert.equal((await request('GET',noteId)).status,404);
});
test('forged owner fields and URL identity are rejected', async () => {
  const {request,rows} = setup(a);
  for (const method of ['POST','PUT']) assert.equal((await request(method, method==='PUT'?noteId:null,{title:'x',body:'x',owner_id:b})).status,403);
  assert.equal((await request('GET',noteId,null,{owner_id:b})).status,400);
  assert.equal(rows[0].owner_id,a); assert.equal(rows.length,1);
});
