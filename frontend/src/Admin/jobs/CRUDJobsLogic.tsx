import { useState } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Warm palette ─────────────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'

const B  = '#0C0A07'
const D1 = '#0E0C06'
const D2 = '#151209'
const D3 = '#1C1709'
const GM = '#221C0A'

const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'

const W   = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'

const FD   = "'Playfair Display', Georgia, serif"
const MONO = "'DM Mono', 'Courier New', monospace"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#','')
  const r = parseInt(h.substring(0,2),16)
  const g = parseInt(h.substring(2,4),16)
  const b = parseInt(h.substring(4,6),16)
  return `rgba(${r},${g},${b},${alpha})`
}

type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled'

interface Job {
  id:          string
  title:       string
  client:      string
  venue:       string
  date:        string
  startTime:   string
  endTime:     string
  hourlyRate:  number
  totalSlots:  number
  filledSlots: number
  status:      JobStatus
  city:        string
}

const MOCK_JOBS: Job[] = [
  { id:'JB-201', title:'Brand Ambassador — Red Bull',  client:'Red Bull SA',  venue:'Sandton City',    date:'2026-03-15', startTime:'09:00', endTime:'17:00', hourlyRate:120, totalSlots:6,  filledSlots:6,  status:'filled',    city:'Johannesburg'   },
  { id:'JB-202', title:'Promoter — Castle Lite',       client:'AB InBev',     venue:'V&A Waterfront',  date:'2026-03-16', startTime:'12:00', endTime:'20:00', hourlyRate:110, totalSlots:4,  filledSlots:2,  status:'open',      city:'Cape Town'      },
  { id:'JB-203', title:'Brand Rep — Nike Launch',      client:'Nike SA',      venue:'Mall of Africa',  date:'2026-03-17', startTime:'10:00', endTime:'18:00', hourlyRate:135, totalSlots:8,  filledSlots:3,  status:'open',      city:'Johannesburg'   },
  { id:'JB-204', title:'Event Staff — Vodacom',        client:'Vodacom',      venue:'Greenacres Mall', date:'2026-03-12', startTime:'08:00', endTime:'16:00', hourlyRate:100, totalSlots:8,  filledSlots:8,  status:'filled',    city:'Port Elizabeth' },
  { id:'JB-205', title:'Hostess — Nedbank Golf Day',   client:'Nedbank',      venue:'Gary Player CC',  date:'2026-03-10', startTime:'07:00', endTime:'15:00', hourlyRate:150, totalSlots:12, filledSlots:12, status:'completed', city:'Sun City'       },
  { id:'JB-206', title:'Promoter — Savanna',           client:'Distell',      venue:'Gateway Theatre', date:'2026-03-18', startTime:'14:00', endTime:'22:00', hourlyRate:115, totalSlots:3,  filledSlots:0,  status:'open',      city:'Durban'         },
]

// Status colors — all warm, all clearly visible
// open=gold  filled=amber  completed=pale-gold(bright)  cancelled=cream-on-brown
const STATUS_COLOR: Record<JobStatus,string> = {
  open:      GL,          // bright gold
  filled:    G3,          // mid amber
  completed: G4,          // pale gold — bright and readable
  cancelled: '#E8D5A8',  // warm cream — visible on dark bg
}
const STATUS_BG: Record<JobStatus,string> = {
  open:      hex2rgba(GL,0.12),
  filled:    hex2rgba(G3,0.12),
  completed: hex2rgba(G4,0.12),
  cancelled: hex2rgba('#E8D5A8',0.08),
}
const STATUS_BORDER: Record<JobStatus,string> = {
  open:      hex2rgba(GL,0.45),
  filled:    hex2rgba(G3,0.45),
  completed: hex2rgba(G4,0.45),
  cancelled: hex2rgba('#E8D5A8',0.35),
}

const EMPTY_JOB: Omit<Job,'id'> = { title:'', client:'', venue:'', date:'', startTime:'09:00', endTime:'17:00', hourlyRate:100, totalSlots:4, filledSlots:0, status:'open', city:'' }

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:'7px 16px', border:`1px solid ${active?color:'rgba(212,136,10,0.22)'}`,
      cursor:'pointer', fontFamily:FD, fontSize:10, fontWeight:active?700:400,
      textTransform:'capitalize' as const, borderRadius:3,
      background:active?hex2rgba(color,0.18):'transparent',
      color:active?color:W55, transition:'all 0.18s',
    }}>{label}</button>
  )
}

function Btn({ children, onClick, outline=false, small=false, color=G }: any) {
  return (
    <button onClick={onClick} style={{
      padding:small?'7px 16px':'11px 24px',
      background:outline?'transparent':`linear-gradient(135deg,${color},${hex2rgba(color,0.8)})`,
      border:`1px solid ${color}`, color:outline?color:B,
      fontFamily:FD, fontSize:small?10:11, fontWeight:700,
      letterSpacing:'0.08em', cursor:'pointer', textTransform:'uppercase' as const,
      transition:'all 0.2s', borderRadius:3,
      boxShadow:outline?'none':`0 2px 12px ${hex2rgba(color,0.35)}`,
    }}
      onMouseEnter={e=>{e.currentTarget.style.opacity='0.82';e.currentTarget.style.transform='translateY(-1px)'}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
    >{children}</button>
  )
}

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span style={{
      fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
      fontFamily:FD, color:STATUS_COLOR[status],
      background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`,
      padding:'3px 10px', borderRadius:3,
    }}>{status}</span>
  )
}

export default function CRUDJobsLogic() {
  const [jobs,     setJobs    ]=useState<Job[]>(MOCK_JOBS)
  const [modal,    setModal   ]=useState<'create'|'edit'|null>(null)
  const [editing,  setEditing ]=useState<Job|null>(null)
  const [form,     setForm    ]=useState<Omit<Job,'id'>>(EMPTY_JOB)
  const [filter,   setFilter  ]=useState<JobStatus|'all'>('all')
  const [deleting, setDeleting]=useState<string|null>(null)

  const filtered=jobs.filter(j=>filter==='all'||j.status===filter)
  const openCreate=()=>{ setForm(EMPTY_JOB); setEditing(null); setModal('create') }
  const openEdit  =(job:Job)=>{ setForm({...job}); setEditing(job); setModal('edit') }
  const closeModal=()=>{ setModal(null); setEditing(null) }

  const save=()=>{
    if(modal==='create'){ setJobs(prev=>[{...form,id:`JB-${Math.floor(Math.random()*900+100)}`},...prev]) }
    else if(editing){ setJobs(prev=>prev.map(j=>j.id===editing.id?{...form,id:editing.id}:j)) }
    closeModal()
  }

  const deleteJob=(id:string)=>{ setJobs(prev=>prev.filter(j=>j.id!==id)); setDeleting(null) }
  const F=(key:keyof typeof form,value:string|number)=>setForm(prev=>({...prev,[key]:value}))

  const counts={ all:jobs.length, open:jobs.filter(j=>j.status==='open').length, filled:jobs.filter(j=>j.status==='filled').length, completed:jobs.filter(j=>j.status==='completed').length, cancelled:jobs.filter(j=>j.status==='cancelled').length }

  const inputStyle:React.CSSProperties={ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:13, color:W, outline:'none', borderRadius:3 }
  const labelStyle:React.CSSProperties={ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:W55, display:'block', marginBottom:7, fontFamily:FD }

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Jobs</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Manage Jobs</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>{jobs.length} total jobs across all cities.</p>
          </div>
          <Btn onClick={openCreate}>+ New Job</Btn>
        </div>

        {/* FILTERS */}
        <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
          {(['all','open','filled','completed','cancelled'] as const).map(f=>(
            <FilterBtn key={f} label={f==='all'?`All (${counts.all})`:`${f} (${counts[f]})`} active={filter===f} color={f==='all'?GL:STATUS_COLOR[f]} onClick={()=>setFilter(f)} />
          ))}
        </div>

        {/* TABLE */}
        <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
                {['ID','Title','Client','City / Venue','Date','Rate','Slots','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'13px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FD, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job,i)=>(
                <tr key={job.id}
                  style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=BB2}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'14px 18px', fontSize:11, color:W28, fontFamily:MONO }}>{job.id}</td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{job.title}</div>
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD }}>{job.client}</td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, color:W, fontFamily:FD }}>{job.city}</div>
                    <div style={{ fontSize:11, color:W28, fontFamily:FD }}>{job.venue}</div>
                  </td>
                  <td style={{ padding:'14px 18px', whiteSpace:'nowrap' }}>
                    <div style={{ fontSize:12, color:W55, fontFamily:FD }}>{new Date(job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</div>
                    <div style={{ fontSize:10, color:W28, fontFamily:FD }}>{job.startTime}–{job.endTime}</div>
                  </td>
                  <td style={{ padding:'14px 18px', fontSize:13, color:GL, fontWeight:700, fontFamily:FD }}>R{job.hourlyRate}/hr</td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontSize:12, color:W, fontFamily:FD }}>{job.filledSlots}/{job.totalSlots}</div>
                    <div style={{ marginTop:5, height:3, background:BB, borderRadius:2, width:48 }}>
                      <div style={{ height:'100%', borderRadius:2, background:STATUS_COLOR[job.status], width:`${(job.filledSlots/job.totalSlots)*100}%`, transition:'width 0.3s' }} />
                    </div>
                  </td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={job.status} /></td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>openEdit(job)} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700 }}>Edit</button>
                      <span style={{ color:W28 }}>·</span>
                      <button onClick={()=>setDeleting(job.id)} style={{ fontSize:11, color:'#C89A70', background:'none', border:'none', cursor:'pointer', fontFamily:FD }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div style={{ padding:40, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>No jobs match this filter.</div>}
        </div>

        {/* DELETE CONFIRM */}
        {deleting&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
            <div style={{ background:D2, border:`1px solid ${hex2rgba(G2,0.7)}`, padding:'36px 40px', maxWidth:380, width:'100%', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G2, borderRadius:'4px 4px 0 0' }} />
              <h3 style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:12 }}>Delete Job?</h3>
              <p style={{ fontSize:13, color:W55, marginBottom:28, lineHeight:1.7, fontFamily:FD }}>This action cannot be undone. The job and all associated shifts will be permanently removed.</p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setDeleting(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:12, cursor:'pointer', borderRadius:3 }}>Cancel</button>
                <button onClick={()=>deleteJob(deleting)} style={{ flex:1, padding:'12px', background:hex2rgba(G2,0.25), border:`1px solid ${G2}`, color:'#E8D5A8', fontFamily:FD, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE/EDIT MODAL */}
        {modal&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, padding:'40px', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${GL},${G5})`, borderRadius:'4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
              <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontFamily:FD, fontWeight:700 }}>{modal==='create'?'New Job':'Edit Job'}</div>
              <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:28 }}>{modal==='create'?'Create a New Job':`Editing ${editing?.id}`}</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                {([
                  {label:'Job Title', key:'title',  type:'text',   placeholder:'Brand Ambassador — Red Bull'},
                  {label:'Client',    key:'client',  type:'text',   placeholder:'Red Bull SA'},
                  {label:'Venue',     key:'venue',   type:'text',   placeholder:'Sandton City'},
                  {label:'City',      key:'city',    type:'text',   placeholder:'Johannesburg'},
                  {label:'Date',      key:'date',    type:'date',   placeholder:''},
                ] as const).map(({label,key,type,placeholder})=>(
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e=>F(key,e.target.value)}
                      style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                ))}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[
                    {label:'Start Time',       key:'startTime',   type:'time'},
                    {label:'End Time',         key:'endTime',     type:'time'},
                    {label:'Hourly Rate (R)',   key:'hourlyRate',  type:'number'},
                    {label:'Total Slots',       key:'totalSlots',  type:'number'},
                  ].map(({label,key,type})=>(
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} value={(form as any)[key]} onChange={e=>F(key as any,type==='number'?+e.target.value:e.target.value)}
                        style={inputStyle}
                        onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e=>F('status',e.target.value)}
                    style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
                    {(['open','filled','completed','cancelled'] as JobStatus[]).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <Btn onClick={save}>{modal==='create'?'Create Job':'Save Changes'}</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}