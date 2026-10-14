// Test preloader only; not imported by the submission command.
// NODE_OPTIONS='--import=./scripts/bundle-readonly-guard.mjs' npm run bundle
const upstreamFetch=globalThis.fetch;
let requests=0,blocked=0;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 const method=String(init.method??input?.method??'GET').toUpperCase();
 const forbiddenHost=url.hostname==='localhost'||url.hostname.endsWith('.local')||url.hostname.endsWith('.internal')||url.hostname.startsWith('[')||/^\d+(?:\.\d+){3}$/.test(url.hostname);
 requests++;
 if(url.protocol!=='https:'||url.username||url.password||forbiddenHost||!['GET','HEAD'].includes(method)||init.body!==undefined){
  blocked++;
  throw new Error('bundle_read_only_violation');
 }
 return upstreamFetch(input,init);
};
process.on('beforeExit',()=>{
 if(requests||blocked)process.stdout.write(`read_only_guard: requests=${requests}, blocked=${blocked}\n`);
 // A caught network rejection must still fail the whole command.
 if(blocked)process.exitCode=1;
});
