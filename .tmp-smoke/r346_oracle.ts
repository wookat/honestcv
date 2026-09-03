import { recordResumeSnapshot, listResumeHistory, setActiveVersionId, sanitizeResume } from '../src/lib/resume'
const mem: Record<string,string> = {}
;(globalThis as any).localStorage = { getItem:(k:string)=>mem[k]??null, setItem:(k:string,v:string)=>{mem[k]=v}, removeItem:(k:string)=>{delete mem[k]} }
const r = (n:string) => sanitizeResume({ contact:{fullName:n}, experience:[] })!
let pass=0, fail=0
const ok=(c:boolean,m:string)=>{ c?pass++:(fail++,console.log('FAIL',m)) }
// mount with empty history records baseline
recordResumeSnapshot(r('Baseline'))
ok(listResumeHistory().length===1,'baseline recorded on empty history')
// re-mount with identical draft: dedup, no spam
recordResumeSnapshot(r('Baseline'))
ok(listResumeHistory().length===1,'identical mount snapshot deduped')
// re-mount with changed draft within gap: suppressed (no spam)
recordResumeSnapshot(r('Edited'))
ok(listResumeHistory().length===1,'mount snapshot within 10-min gap suppressed')
// stale newest (backdated): mount records again
const h = JSON.parse(mem['honestcv.resumeHistory']); h[0].at -= 11*60*1000; mem['honestcv.resumeHistory']=JSON.stringify(h)
recordResumeSnapshot(r('Edited'))
ok(listResumeHistory().length===2,'mount snapshot recorded after stale gap')
// new copy scope gets its own baseline immediately
setActiveVersionId('ver-X')
recordResumeSnapshot(r('Copy baseline'))
ok(listResumeHistory()[0].versionId==='ver-X' && listResumeHistory().length===3,'per-copy baseline immediate')
console.log(`oracle ${pass}/${pass+fail}`)
if (fail) process.exit(1)
