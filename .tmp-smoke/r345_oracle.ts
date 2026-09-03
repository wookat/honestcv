import { recordResumeSnapshot, listResumeHistory, setActiveVersionId, sanitizeResume } from '../src/lib/resume'
const mem: Record<string,string> = {}
;(globalThis as any).localStorage = { getItem:(k:string)=>mem[k]??null, setItem:(k:string,v:string)=>{mem[k]=v}, removeItem:(k:string)=>{delete mem[k]} }
const r = (name: string) => sanitizeResume({ contact:{fullName:name}, experience:[] })!
let pass=0, fail=0
const ok=(c:boolean,m:string)=>{ c?pass++:(fail++,console.log('FAIL',m)) }
// null-scope checkpoint
recordResumeSnapshot(r('Draft v1'))
ok(listResumeHistory().length===1,'draft checkpoint recorded')
ok((listResumeHistory()[0].versionId??null)===null,'draft scope null')
// switch to copy A: gap check must be scoped — immediate record allowed
mem['honestcv.activeVersionId']=JSON.stringify?'':''
setActiveVersionId('ver-A')
recordResumeSnapshot(r('A v1'))
ok(listResumeHistory().length===2,'copy-A first checkpoint not suppressed by draft gap')
ok(listResumeHistory()[0].versionId==='ver-A','stamped ver-A')
// duplicate suppression within scope
recordResumeSnapshot(r('A v1'))
ok(listResumeHistory().length===2,'duplicate suppressed in-scope')
// gap suppression within scope
recordResumeSnapshot(r('A v2'))
ok(listResumeHistory().length===2,'10-min gap suppresses in-scope non-forced')
recordResumeSnapshot(r('A v2'), true)
ok(listResumeHistory().length===3,'force records')
// switch to copy B: immediate record allowed again
setActiveVersionId('ver-B')
recordResumeSnapshot(r('B v1'))
ok(listResumeHistory()[0].versionId==='ver-B','copy-B checkpoint recorded immediately')
// dialog filter semantics
const forB = listResumeHistory().filter(s=>(s.versionId??null)==='ver-B')
ok(forB.length===1 && forB[0].data.contact.fullName==='B v1','B sees only B')
const forNull = listResumeHistory().filter(s=>(s.versionId??null)===null)
ok(forNull.length===1 && forNull[0].data.contact.fullName==='Draft v1','draft sees only null-scope')
// legacy entry without versionId counts as null scope
const raw = JSON.parse(mem['honestcv.resumeHistory']); delete raw[raw.length-1].versionId
mem['honestcv.resumeHistory']=JSON.stringify(raw)
const forNull2 = listResumeHistory().filter(s=>(s.versionId??null)===null)
ok(forNull2.length===1,'legacy field-absent entry treated as null scope')
console.log(`oracle ${pass}/${pass+fail}`)
if (fail) process.exit(1)
