import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { extract } from './read-alerts.mjs';
import { decide } from './decide.mjs';
const rulesFile=new URL('./deny-rules.json',import.meta.url);
const logFile=new URL('../alerts.log',import.meta.url);
const TTL=15*60*1000;
const names=new Set(['abnormal_admin_group','abnormal_privileged_use','privilege_review','no_privilege_signal']);
export function makeRule(alert,decision,observedAt=Date.now()){
 const safe=extract(alert),checked=decide(alert);
 if(decision?.action!=='block'||checked.action!=='block'||decision.reason!==checked.reason||decision.confidence!==checked.confidence)return null;
 if(safe.account==='[redacted]'||!safe.timestamp||!/^pv-[0-9]+$/.test(alert?.id??'')||alert?.agent?.name!=='choi-bujang-pc')return null;
 const start=Date.parse(safe.timestamp);
 if(!Number.isFinite(observedAt)||start>observedAt||observedAt>=start+TTL)return null;
 return {id:'xdr.privilege.'+alert.id,account:safe.account,agentName:alert.agent.name,alertId:alert.id,pattern:checked.reason,startsAt:new Date(start).toISOString(),expiresAt:new Date(start+TTL).toISOString()};
}
export async function persistRules(rules){await writeFile(rulesFile,JSON.stringify(rules,null,2)+'\n');}
export async function logDecision(alert,decision){
 if(!['block','alert'].includes(decision?.action)||!/^pv-[0-9]+$/.test(alert?.id??'')||!names.has(decision.reason)||!Number.isFinite(decision.confidence))return;
 await appendFile(logFile,JSON.stringify({alertId:alert.id,action:decision.action,confidence:decision.confidence,pattern:decision.reason})+'\n');
}
export async function loadRules(){try{return JSON.parse(await readFile(rulesFile,'utf8'));}catch(error){if(error.code==='ENOENT')return [];throw error;}}
export function createGuard(baseDecide,getRules){
 // Account and endpoint come only from a trusted gateway mapping, not request fields.
 return async function guardedDecide(request,context={}){
  const {account,agentName,now=Date.now()}=context;
  const rules=await getRules();
  const match=typeof account==='string'&&typeof agentName==='string'&&rules.find(r=>r.account===account&&r.agentName===agentName&&Date.parse(r.startsAt)<=now&&now<Date.parse(r.expiresAt));
  if(match)return {schema:'aleph.decision.v1',requestId:request.requestId,decision:'deny',reasonCode:'starter_not_ready',ruleIds:[match.id]};
  return baseDecide(request,context);
 };
}
