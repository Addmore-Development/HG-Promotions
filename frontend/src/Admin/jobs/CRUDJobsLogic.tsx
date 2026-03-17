import React, { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../AdminLayout'
import { ALL_JOBS } from '../../shared/jobs/jobsData'

const G    = '#D4880A'
const GL   = '#E8A820'
const G2   = '#8B5A1A'
const G3   = '#C07818'
const G4   = '#F0C050'
const G5   = '#6B3F10'
const B    = '#0C0A07'
const D1   = '#0E0C06'
const D2   = '#151209'
const D3   = '#1C1709'
const BB   = 'rgba(212,136,10,0.16)'
const BB2  = 'rgba(212,136,10,0.06)'

// ─── Updated text colors ──────────────────────────────────────────────────────
const W   = '#CEC5B2'                   // warm mid-cream
const W85 = 'rgba(210,198,180,0.95)'   // near-full warm grey
const W75 = 'rgba(195,182,162,0.82)'   // medium-light warm grey
const W55 = 'rgba(192,178,158,0.80)'   // bright readable mid-grey
const W35 = 'rgba(168,152,130,0.55)'   // visible dark-grey
const W28 = 'rgba(172,158,136,0.65)'   // was nearly invisible, now clearly readable

const FD   = "'Playfair Display', Georgia, serif"
const MONO = "'DM Mono', 'Courier New', monospace"
const WARM_ACCENTS = [GL, G3, '#AB8D3F', G, G4, GL, G3, '#AB8D3F', G, G4]

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled'
type JobSource = 'base' | 'api' | 'admin'

interface Job {
  id: string; title: string; client: string; venue: string
  date: string; startDate?: string; startTime: string; endTime: string
  hourlyRate: number; totalSlots: number; filledSlots: number
  status: JobStatus; city: string; category?: string
  lat?: number; lng?: number; source: JobSource; applications?: any[]
  termsAndConditions?: string; pay?: string; payPer?: string; jobDate?: string
  location?: string; type?: string; duration?: string; tags?: string[]; accentLine?: string
}

interface PromoterMatch {
  id: string; name: string; email: string; city: string
  reliabilityScore: number; profilePhotoUrl?: string; status: string; distanceKm?: number
  appStatus?: 'ALLOCATED' | 'STANDBY' | 'DECLINED' | null; appId?: string
}

interface ShortlistEntry {
  jobId: string; promoterId: string; promoterName: string; notifiedAt: string
  message: string; type: 'shortlisted' | 'not_needed'
}

interface ClientEntry { id: string; name: string; email: string }

const STATUS_COLOR: Record<JobStatus, string> = { open: GL, filled: G3, completed: G, cancelled: G2 }
const STATUS_BG: Record<JobStatus, string> = {
  open: hex2rgba(GL, 0.10), filled: hex2rgba(G3, 0.10),
  completed: hex2rgba(G, 0.10), cancelled: hex2rgba(G2, 0.22),
}
const STATUS_BORDER: Record<JobStatus, string> = {
  open: hex2rgba(GL, 0.45), filled: hex2rgba(G3, 0.45),
  completed: hex2rgba(G, 0.45), cancelled: hex2rgba(G2, 0.55),
}

const CATEGORY_OPTIONS = [
  'FMCG / Beverages','FMCG / Food','Retail','Telecoms','Automotive',
  'Financial Services','Healthcare / Pharma','Fitness & Wellness',
  'Fashion & Beauty','Quick Service Restaurant','Events & Entertainment','Technology','Other',
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHeader() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function baseJobsToAdminJobs(): Job[] {
  return ALL_JOBS.map(j => ({
    id: j.id, title: j.title, client: j.company,
    venue: j.location.split(',')[0]?.trim() || j.location,
    date: j.jobDate, startTime: '09:00', endTime: '17:00',
    hourlyRate: parseInt(j.pay.replace(/\D/g, '')) || 0,
    totalSlots: j.slots, filledSlots: j.slots - j.slotsLeft,
    status: j.slotsLeft === 0 ? 'filled' : ('open' as JobStatus),
    city: j.location.split(',').slice(-1)[0]?.trim() || '',
    category: j.type, source: 'base' as JobSource,
    pay: j.pay, payPer: j.payPer, jobDate: j.jobDate, location: j.location,
    type: j.type, duration: j.duration, tags: j.tags, accentLine: j.accentLine,
  }))
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const CITY_COORDS: Record<string,[number,number]> = {
  'johannesburg':[-26.2041,28.0473],'sandton':[-26.1076,28.0567],'cape town':[-33.9249,18.4241],
  'durban':[-29.8587,31.0218],'pretoria':[-25.7479,28.2293],'midrand':[-25.9986,28.1272],
  'soweto':[-26.2678,27.8546],'port elizabeth':[-33.9608,25.6022],
}
function cityCoords(city: string): [number,number] | null { return CITY_COORDS[city.toLowerCase()] || null }

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_COLOR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 10px', borderRadius:3, whiteSpace:'nowrap' }}>
      {status}
    </span>
  )
}

function SourceBadge({ source }: { source: JobSource }) {
  const map: Record<JobSource,{label:string;color:string}> = { base:{label:'Base',color:W35}, api:{label:'Live',color:GL}, admin:{label:'Admin',color:G3} }
  const s = map[source]
  return (
    <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:s.color, border:`1px solid ${hex2rgba(s.color,0.35)}`, padding:'2px 7px', borderRadius:3, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function Btn({ onClick, children, color=GL, outline=false, small=false, disabled=false }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:small?'7px 14px':'11px 22px', background:disabled?'rgba(255,255,255,0.05)':outline?'transparent':`linear-gradient(135deg,${color},${hex2rgba(color,0.8)})`, border:`1px solid ${disabled?BB:color}`, color:disabled?W55:outline?color:B, fontFamily:FD, fontSize:small?10:11, fontWeight:700, letterSpacing:'0.08em', cursor:disabled?'not-allowed':'pointer', textTransform:'uppercase' as const, transition:'all 0.2s', borderRadius:3 }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity='0.82';e.currentTarget.style.transform='translateY(-1px)'}}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
    >{children}</button>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', background:active?hex2rgba(color,0.18):'rgba(12,10,7,0.85)', border:`1px solid ${active?color:'rgba(212,136,10,0.22)'}`, color:active?color:W55, fontFamily:FD, fontSize:10, fontWeight:active?700:400, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3, transition:'all 0.18s', whiteSpace:'nowrap' }}>
      {label}
    </button>
  )
}

const EMPTY_JOB: Omit<Job,'id'|'applications'|'source'> = {
  title:'', client:'', venue:'', date:'', startDate:'', startTime:'09:00', endTime:'17:00',
  hourlyRate:120, totalSlots:4, filledSlots:0, status:'open', city:'', category:'', termsAndConditions:'',
}

const FALLBACK_CLIENTS: ClientEntry[] = [
  {id:'f1',name:'Red Bull SA',email:''},{id:'f2',name:'AB InBev',email:''},{id:'f3',name:'Nike SA',email:''},
  {id:'f4',name:'Vodacom',email:''},{id:'f5',name:'Nedbank',email:''},{id:'f6',name:'Castle Lager SA',email:''},
  {id:'f7',name:'Standard Bank SA',email:''},{id:'f8',name:'MTN SA',email:''},{id:'f9',name:'Coca-Cola SA',email:''},
  {id:'f10',name:'KFC South Africa',email:''},
]

export default function CRUDJobsLogic() {
  const [jobs,setJobs]                   = useState<Job[]>(() => baseJobsToAdminJobs())
  const [loading,setLoading]             = useState(false)
  const [modal,setModal]                 = useState<'create'|'edit'|'promoters'|null>(null)
  const [editing,setEditing]             = useState<Job|null>(null)
  const [form,setForm]                   = useState<Omit<Job,'id'|'applications'|'source'>>(EMPTY_JOB)
  const [statusFilter,setStatusFilter]   = useState<JobStatus|'all'>('all')
  const [sourceFilter,setSourceFilter]   = useState<JobSource|'all'>('all')
  const [search,setSearch]               = useState('')
  const [deleting,setDeleting]           = useState<string|null>(null)
  const [saving,setSaving]               = useState(false)
  const [saveError,setSaveError]         = useState('')
  const [reqGender,setReqGender]         = useState('Any Gender')
  const [reqLanguages,setReqLanguages]   = useState('')
  const [reqMinHeight,setReqMinHeight]   = useState('')
  const [reqMinAge,setReqMinAge]         = useState('')
  const [reqExperience,setReqExperience] = useState('None')
  const [reqAttire,setReqAttire]         = useState('Smart Casual')
  const [reqOther,setReqOther]           = useState('')
  const [termsText,setTermsText]         = useState('')
  const [termsAgreed,setTermsAgreed]     = useState(false)
  const [clients,setClients]             = useState<ClientEntry[]>(FALLBACK_CLIENTS)
  const [clientsLoaded,setClientsLoaded] = useState(false)
  const [otherClient,setOtherClient]     = useState('')
  const [promoterJob,setPromoterJob]     = useState<Job|null>(null)
  const [matchedPromos,setMatchedPromos] = useState<PromoterMatch[]>([])
  const [promoLoading,setPromoLoading]   = useState(false)
  const [shortlistMsg,setShortlistMsg]   = useState('')
  const [notifications,setNotifications] = useState<ShortlistEntry[]>([])

  const resetRequirements = () => {
    setReqGender('Any Gender'); setReqLanguages(''); setReqMinHeight(''); setReqMinAge('')
    setReqExperience('None'); setReqAttire('Smart Casual'); setReqOther(''); setTermsText(''); setTermsAgreed(false)
  }

  useEffect(() => {
    const token = localStorage.getItem('hg_token')
    if (!token) { setClients(FALLBACK_CLIENTS); setClientsLoaded(true); return }
    fetch(`${API_URL}/users?role=BUSINESS&status=approved`, { headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' } })
      .then(async r => r.ok ? (await r.json()) as any[] : [])
      .then((data:any[]) => {
        const biz: ClientEntry[] = data.filter((u:any)=>u.role?.toUpperCase()==='BUSINESS').map((u:any)=>({id:u.id,name:u.fullName||u.name,email:u.email}))
        const names = new Set(biz.map(c=>c.name.toLowerCase()))
        setClients([...biz,...FALLBACK_CLIENTS.filter(f=>!names.has(f.name.toLowerCase()))])
        setClientsLoaded(true)
      })
      .catch(()=>{ setClients(FALLBACK_CLIENTS); setClientsLoaded(true) })
  },[])

  const loadJobs = useCallback(async () => {
    const base = baseJobsToAdminJobs()
    try {
      const res = await fetch(`${API_URL}/jobs`, { headers: authHeader() as any })
      if (res.ok) {
        const data:any[] = await res.json()
        const apiJobs:Job[] = data.map(j=>({
          id:j.id,title:j.title,client:j.client,venue:j.venue,
          date:j.date?.slice(0,10)||'',startTime:j.startTime||'09:00',endTime:j.endTime||'17:00',
          hourlyRate:j.hourlyRate||0,totalSlots:j.totalSlots||0,filledSlots:j.filledSlots||0,
          status:(j.status?.toLowerCase()||'open') as JobStatus,
          city:j.address?.split(',')[0]||j.city||'',category:j.filters?.category||'',
          tags:j.filters?.tags||[],lat:j.lat,lng:j.lng,source:'api' as JobSource,
          applications:j.applications||[],termsAndConditions:j.termsAndConditions||j.filters?.termsAndConditions||'',
        }))
        const apiIds = new Set(apiJobs.map(j=>j.id))
        setJobs([...apiJobs,...base.filter(b=>!apiIds.has(b.id))])
      }
    } catch { /* base jobs already visible */ }
  },[])

  useEffect(()=>{ loadJobs() },[loadJobs])

  useEffect(()=>{
    const publicJobs = jobs.filter(j=>j.status==='open').map((j,idx)=>{
      if (j.source==='base') { const base=ALL_JOBS.find(b=>b.id===j.id); if(base) return base }
      return {
        id:j.id,title:j.title,company:j.client,companyInitial:j.client.charAt(0),
        companyColor:WARM_ACCENTS[idx%WARM_ACCENTS.length],location:`${j.venue}, ${j.city}`,
        type:j.category||'Brand Activation',pay:`R ${j.hourlyRate.toLocaleString('en-ZA')}`,payPer:'per hour',
        date:j.date?new Date(j.date).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):'',
        jobDate:j.date,approvedAt:new Date().toISOString().slice(0,10),
        slots:j.totalSlots,slotsLeft:j.totalSlots-j.filledSlots,duration:`${j.startTime}–${j.endTime}`,
        tags:[j.category||'Admin Posted'],accentLine:WARM_ACCENTS[idx%WARM_ACCENTS.length],
        gradient:`linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`,
        status:'open',termsAndConditions:j.termsAndConditions||'',
      }
    })
    localStorage.setItem('hg_admin_jobs',JSON.stringify(publicJobs))
    window.dispatchEvent(new Event('storage'))
  },[jobs])

  const save = async () => {
    if (!form.title.trim()) { setSaveError('Job title is required'); return }
    const resolvedClient = form.client === '__other__' ? otherClient.trim() : form.client.trim()
    if (!resolvedClient) { setSaveError('Client is required'); return }
    if (!form.date) { setSaveError('Start date is required'); return }
    if (!termsAgreed) { setSaveError('Please confirm compliance with T&Cs before saving'); return }
    setSaveError(''); setSaving(true)
    try {
      const dateISO = form.date ? new Date(form.date).toISOString() : new Date().toISOString()
      const builtTags:string[] = []
      if (reqGender&&reqGender!=='Any Gender') builtTags.push(reqGender)
      if (reqLanguages) builtTags.push(reqLanguages)
      if (reqMinHeight) builtTags.push(`Min ${reqMinHeight}cm`)
      if (reqMinAge) builtTags.push(`${reqMinAge}+`)
      if (reqExperience&&reqExperience!=='None') builtTags.push(reqExperience)
      if (reqAttire&&reqAttire!=='Smart Casual') builtTags.push(reqAttire)
      if (reqOther) builtTags.push(reqOther)
      const payload = {
        title:form.title, client:resolvedClient, brand:resolvedClient,
        venue:form.venue||form.city,address:`${form.venue||form.city}, ${form.city}`,
        lat:cityCoords(form.city)?.[0]??-26.2041,lng:cityCoords(form.city)?.[1]??28.0473,
        date:dateISO,startTime:form.startTime,endTime:form.endTime,
        hourlyRate:Number(form.hourlyRate)||0,totalSlots:Number(form.totalSlots)||1,
        filledSlots:Number(form.filledSlots)||0,status:form.status.toUpperCase(),
        termsAndConditions:termsText,
        filters:{category:form.category||'',gender:reqGender,languages:reqLanguages,
          minHeight:reqMinHeight,minAge:reqMinAge,experience:reqExperience,attire:reqAttire,
          other:reqOther,tags:builtTags,termsAndConditions:termsText},
      }
      if (editing&&editing.source!=='base') {
        const res = await fetch(`${API_URL}/jobs/${editing.id}`,{method:'PUT',headers:authHeader() as any,body:JSON.stringify(payload)})
        if (res.ok) { await loadJobs(); closeModal() }
        else { const err=await res.json().catch(()=>({})); setSaveError(err.error||`Update failed (${res.status})`) }
      } else if (editing&&editing.source==='base') {
        const stored:any[]=JSON.parse(localStorage.getItem('hg_admin_jobs')||'[]')
        localStorage.setItem('hg_admin_jobs',JSON.stringify(stored.map((j:any)=>j.id===editing.id?{...j,...payload,id:editing.id}:j)))
        setJobs(prev=>prev.map(j=>j.id===editing.id?{...j,...form,source:'admin'}:j)); closeModal()
      } else {
        const res = await fetch(`${API_URL}/jobs`,{method:'POST',headers:authHeader() as any,body:JSON.stringify(payload)})
        if (res.ok) { await loadJobs(); closeModal() }
        else { const err=await res.json().catch(()=>({})); setSaveError(err.error||`Create failed (${res.status})`) }
      }
    } catch { setSaveError('Network error — backend may be offline.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id:string) => {
    const job=jobs.find(j=>j.id===id)
    if (job?.source==='base') { setJobs(prev=>prev.filter(j=>j.id!==id)) }
    else { try { await fetch(`${API_URL}/jobs/${id}`,{method:'DELETE',headers:authHeader() as any}) } catch {} setJobs(prev=>prev.filter(j=>j.id!==id)) }
    setDeleting(null)
  }

  const openPromoterPanel = async (job:Job) => {
    setPromoterJob(job); setModal('promoters'); setPromoLoading(true); setShortlistMsg('')
    try {
      const [usersRes,appsRes] = await Promise.all([
        fetch(`${API_URL}/users?role=PROMOTER&status=approved`,{headers:authHeader() as any}),
        fetch(`${API_URL}/applications/job/${job.id}`,{headers:authHeader() as any}),
      ])
      const users:any[]=usersRes.ok?await usersRes.json():[]
      const apps:any[]=appsRes.ok?await appsRes.json():[]
      const appMap=new Map(apps.map((a:any)=>[a.promoterId,a]))
      const jobCoords=job.lat&&job.lng?[job.lat,job.lng] as [number,number]:cityCoords(job.city)
      setMatchedPromos(users.map((u:any)=>{
        const uc=cityCoords(u.city||'')
        return {id:u.id,name:u.fullName,email:u.email,city:u.city||'',reliabilityScore:u.reliabilityScore||0,
          profilePhotoUrl:u.profilePhotoUrl,status:u.status,
          distanceKm:jobCoords&&uc?Math.round(haversineKm(jobCoords[0],jobCoords[1],uc[0],uc[1])):undefined,
          appStatus:appMap.get(u.id)?.status||null,appId:appMap.get(u.id)?.id}
      }).sort((a,b)=>{const aA=a.appStatus?1:0,bA=b.appStatus?1:0;if(bA!==aA) return bA-aA;if(a.distanceKm!==undefined&&b.distanceKm!==undefined) return a.distanceKm-b.distanceKm;return (b.reliabilityScore||0)-(a.reliabilityScore||0)}))
    } catch {}
    setPromoLoading(false)
  }

  const allocatePromoter = async (promo:PromoterMatch,jobId:string) => {
    try {
      if (promo.appId) await fetch(`${API_URL}/applications/${promo.appId}/status`,{method:'PUT',headers:authHeader() as any,body:JSON.stringify({status:'ALLOCATED'})})
      else await fetch(`${API_URL}/applications`,{method:'POST',headers:authHeader() as any,body:JSON.stringify({jobId,promoterId:promo.id})})
      if (promoterJob) await openPromoterPanel({...promoterJob,id:jobId}); await loadJobs()
    } catch {}
  }

  const markSlotOpen = async (job:Job) => {
    try {
      const appsRes=await fetch(`${API_URL}/applications/job/${job.id}`,{headers:authHeader() as any})
      const apps:any[]=appsRes.ok?await appsRes.json():[]
      const standby=apps.filter((a:any)=>a.status==='STANDBY').slice(0,3)
      if (!standby.length) { setShortlistMsg('No shortlisted promoters.'); return }
      setNotifications(prev=>[...prev,...standby.map((app:any)=>({jobId:job.id,promoterId:app.promoterId,promoterName:app.promoter?.fullName||'Promoter',notifiedAt:new Date().toISOString(),message:'Slot available',type:'shortlisted' as const}))])
      setShortlistMsg(`✓ ${standby.length} promoter${standby.length>1?'s':''} notified.`)
      await fetch(`${API_URL}/jobs/${job.id}`,{method:'PUT',headers:authHeader() as any,body:JSON.stringify({status:'OPEN',filledSlots:Math.max(0,job.filledSlots-1)})})
      await loadJobs()
    } catch {}
  }

  const notifyNotNeeded = async (job:Job) => {
    try {
      const appsRes=await fetch(`${API_URL}/applications/job/${job.id}`,{headers:authHeader() as any})
      const apps:any[]=appsRes.ok?await appsRes.json():[]
      const standby=apps.filter((a:any)=>a.status==='STANDBY').slice(0,3)
      setNotifications(prev=>[...prev,...standby.map((app:any)=>({jobId:job.id,promoterId:app.promoterId,promoterName:app.promoter?.fullName||'Promoter',notifiedAt:new Date().toISOString(),message:'Not needed',type:'not_needed' as const}))])
      setShortlistMsg(`✓ ${standby.length} promoter${standby.length>1?'s':''} notified not needed.`)
    } catch {}
  }

  const openCreate = () => { setForm(EMPTY_JOB); setEditing(null); setSaveError(''); resetRequirements(); setOtherClient(''); setModal('create') }
  const openEdit = (job:Job) => {
    setForm({...EMPTY_JOB,...job}); setEditing(job); setSaveError('')
    const f=(job as any).filters||{}
    setReqGender(f.gender||'Any Gender'); setReqLanguages(f.languages||''); setReqMinHeight(f.minHeight||'')
    setReqMinAge(f.minAge||''); setReqExperience(f.experience||'None'); setReqAttire(f.attire||'Smart Casual')
    setReqOther(f.other||''); setTermsText(f.termsAndConditions||job.termsAndConditions||''); setTermsAgreed(false); setOtherClient(''); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditing(null); setPromoterJob(null); setSaveError('') }
  const F = (key:string,value:string|number) => setForm(prev=>({...prev,[key]:value}))

  const filtered = jobs.filter(j => {
    const sm=statusFilter==='all'||j.status===statusFilter
    const om=sourceFilter==='all'||j.source===sourceFilter
    const qm=!search||[j.title,j.client,j.city,j.venue].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
    return sm&&om&&qm
  })

  const counts = {
    all:jobs.length,open:jobs.filter(j=>j.status==='open').length,
    filled:jobs.filter(j=>j.status==='filled').length,completed:jobs.filter(j=>j.status==='completed').length,
    cancelled:jobs.filter(j=>j.status==='cancelled').length,
    base:jobs.filter(j=>j.source==='base').length,api:jobs.filter(j=>j.source==='api').length,
  }

  const inp: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:13, color:W, outline:'none', borderRadius:3 }
  const lbl: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px', minWidth:0, overflowX:'hidden' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Jobs</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Manage Jobs</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>
              <strong style={{ color:W85 }}>{jobs.length}</strong> total · <span style={{ color:GL }}>{counts.open} open</span> · <span style={{ color:W35 }}>{counts.base} base · {counts.api} live API</span>
            </p>
          </div>
          <Btn onClick={openCreate}>+ New Job</Btn>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:BB, marginBottom:24 }}>
          {[{label:'Total Jobs',value:counts.all,color:GL},{label:'Open',value:counts.open,color:GL},{label:'Filled',value:counts.filled,color:G3},{label:'Completed',value:counts.completed,color:G},{label:'Cancelled',value:counts.cancelled,color:G2}].map((s,i)=>(
            <div key={i} style={{ background:'rgba(20,16,5,0.6)', padding:'18px 20px', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${s.color},${hex2rgba(s.color,0.3)})` }} />
              <div style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:9, color:W55, marginTop:6, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:FD }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {(['all','open','filled','completed','cancelled'] as const).map(f=>(
              <FilterBtn key={f} label={f==='all'?`All (${counts.all})`:`${f} (${counts[f as JobStatus]??0})`} active={statusFilter===f} color={f==='all'?GL:STATUS_COLOR[f as JobStatus]||GL} onClick={()=>setStatusFilter(f)} />
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:4 }}>
              {(['all','base','api'] as const).map(s=>(
                <FilterBtn key={s} label={s==='all'?'All Sources':s==='base'?`Base (${counts.base})`:`API (${counts.api})`} active={sourceFilter===s} color={G3} onClick={()=>setSourceFilter(s)} />
              ))}
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:W35, fontSize:12, pointerEvents:'none' }}>⌕</span>
              <input placeholder="Search jobs…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 14px 7px 30px', color:W, fontFamily:FD, fontSize:11, outline:'none', borderRadius:3, width:180 }}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {notifications.length>0&&(
          <div style={{ background:hex2rgba(GL,0.06), border:`1px solid ${BB}`, borderRadius:4, padding:'14px 20px', marginBottom:20 }}>
            <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD, marginBottom:10 }}>Recent Notifications</div>
            {notifications.slice(-5).reverse().map((n,i)=>(
              <div key={i} style={{ fontSize:11, color:W55, fontFamily:FD, display:'flex', gap:12, marginBottom:4 }}>
                <span style={{ color:n.type==='shortlisted'?GL:G2, fontWeight:700 }}>{n.type==='shortlisted'?'⏳ Shortlisted':'✗ Not Needed'}</span>
                <span>{n.promoterName}</span>
                <span style={{ color:W35 }}>{new Date(n.notifiedAt).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden', width:'100%' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'5%'  }} />
              <col style={{ width:'22%' }} />
              <col style={{ width:'11%' }} />
              <col style={{ width:'12%' }} />
              <col style={{ width:'9%'  }} />
              <col style={{ width:'8%'  }} />
              <col style={{ width:'7%'  }} />
              <col style={{ width:'8%'  }} />
              <col style={{ width:'7%'  }} />
              <col style={{ width:'11%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
                {['ID','Title / Category','Client','Location','Date','Pay','Slots','Status','Source','Actions'].map((h,i)=>(
                  <th key={i} style={{ padding:'12px 12px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:W55, fontFamily:FD, whiteSpace:'nowrap', overflow:'hidden' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job,i)=>{
                const isBase = job.source==='base'
                return (
                  <tr key={job.id}
                    style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.15s', background:isBase?hex2rgba(GL,0.01):'transparent' }}
                    onMouseEnter={e=>e.currentTarget.style.background=BB2}
                    onMouseLeave={e=>e.currentTarget.style.background=isBase?hex2rgba(GL,0.01):'transparent'}>

                    <td style={{ padding:'14px 12px', fontSize:9, color:W35, fontFamily:MONO, verticalAlign:'middle', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.id}</td>

                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:W85, fontFamily:FD, lineHeight:1.3, marginBottom:2 }}>{job.title}</div>
                      {job.category&&<div style={{ fontSize:9, color:W55, fontFamily:FD, marginBottom:3 }}>{job.category}</div>}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {(job.tags&&job.tags.length>0?job.tags:(job as any).filters?.tags||[]).slice(0,2).map((t:string,ti:number)=>(
                          <span key={ti} style={{ fontSize:8, color:GL, background:hex2rgba(GL,0.08), border:`1px solid ${hex2rgba(GL,0.22)}`, padding:'1px 6px', borderRadius:2, fontFamily:FD }}>{t}</span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding:'14px 12px', fontSize:11, color:W85, fontFamily:FD, verticalAlign:'middle', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {job.client}
                      {job.clientId && <div style={{ fontSize:8, color:GL, marginTop:2 }}>Registered Business</div>}
                    </td>

                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}>
                      <div style={{ fontSize:11, color:W85, fontFamily:FD, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.city||job.location?.split(',').slice(-1)[0]?.trim()}</div>
                      <div style={{ fontSize:9, color:W55, fontFamily:FD, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.venue}</div>
                    </td>

                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}>
                      <div style={{ fontSize:11, color:W85, fontFamily:FD, fontWeight:600, whiteSpace:'nowrap' }}>
                        {job.jobDate||job.date?new Date(job.jobDate||job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}):'—'}
                      </div>
                      <div style={{ fontSize:9, color:W55, fontFamily:FD, marginTop:2, whiteSpace:'nowrap' }}>{isBase&&job.duration?job.duration:`${job.startTime}–${job.endTime}`}</div>
                    </td>

                    <td style={{ padding:'14px 12px', fontSize:13, color:GL, fontWeight:700, fontFamily:FD, verticalAlign:'middle', whiteSpace:'nowrap' }}>
                      {isBase?job.pay:`R${job.hourlyRate}/hr`}
                    </td>

                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}>
                      <div style={{ fontSize:12, color:W85, fontFamily:FD, fontWeight:600 }}>{job.filledSlots}/{job.totalSlots}</div>
                      <div style={{ marginTop:5, height:3, background:'rgba(212,136,10,0.22)', borderRadius:2, width:36 }}>
                        <div style={{ height:'100%', borderRadius:2, background:STATUS_COLOR[job.status], width:`${job.totalSlots>0?(job.filledSlots/job.totalSlots)*100:0}%` }} />
                      </div>
                    </td>

                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}><StatusBadge status={job.status} /></td>
                    <td style={{ padding:'14px 12px', verticalAlign:'middle' }}><SourceBadge source={job.source} /></td>

                    <td style={{ padding:'10px 12px', verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <button onClick={() => openEdit(job)} title="Edit job"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:10, fontWeight:700, color:GL, background:hex2rgba(GL,0.10), border:`1px solid ${hex2rgba(GL,0.35)}`, borderRadius:3, cursor:'pointer', fontFamily:FD, transition:'all 0.15s', whiteSpace:'nowrap' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=hex2rgba(GL,0.20);e.currentTarget.style.borderColor=GL}}
                          onMouseLeave={e=>{e.currentTarget.style.background=hex2rgba(GL,0.10);e.currentTarget.style.borderColor=hex2rgba(GL,0.35)}}>
                          ✎ Edit
                        </button>
                        <button onClick={() => setDeleting(job.id)} title={isBase ? 'Hide job' : 'Delete job'}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:10, fontWeight:600, color:'rgba(220,175,130,0.90)', background:'rgba(139,90,26,0.12)', border:`1px solid rgba(139,90,26,0.40)`, borderRadius:3, cursor:'pointer', fontFamily:FD, transition:'all 0.15s', whiteSpace:'nowrap' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(139,90,26,0.25)';e.currentTarget.style.borderColor='rgba(139,90,26,0.65)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='rgba(139,90,26,0.12)';e.currentTarget.style.borderColor='rgba(139,90,26,0.40)'}}>
                          🗑 {isBase ? 'Hide' : 'Delete'}
                        </button>
                        <button onClick={() => openPromoterPanel(job)} title="Manage staff"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:10, fontWeight:600, color:G4, background:hex2rgba(G4,0.08), border:`1px solid ${hex2rgba(G4,0.30)}`, borderRadius:3, cursor:'pointer', fontFamily:FD, transition:'all 0.15s', whiteSpace:'nowrap' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=hex2rgba(G4,0.18);e.currentTarget.style.borderColor=G4}}
                          onMouseLeave={e=>{e.currentTarget.style.background=hex2rgba(G4,0.08);e.currentTarget.style.borderColor=hex2rgba(G4,0.30)}}>
                          👥 Staff
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length===0&&<div style={{ padding:40, textAlign:'center', color:W55, fontSize:13, fontFamily:FD }}>No jobs match your filters.</div>}
        </div>

        <div style={{ marginTop:10, fontSize:11, color:W35, fontFamily:FD }}>
          Showing <strong style={{ color:W55 }}>{filtered.length}</strong> of <strong style={{ color:W55 }}>{jobs.length}</strong> jobs
        </div>

        {/* DELETE CONFIRM */}
        {deleting&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }} onClick={e=>e.target===e.currentTarget&&setDeleting(null)}>
            <div style={{ background:D2, border:`1px solid ${hex2rgba(G2,0.7)}`, padding:'36px 40px', maxWidth:400, width:'100%', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G2, borderRadius:'4px 4px 0 0' }} />
              <h3 style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:12 }}>
                {jobs.find(j=>j.id===deleting)?.source==='base' ? 'Hide Job?' : 'Delete Job?'}
              </h3>
              <p style={{ fontSize:13, color:W55, marginBottom:8, lineHeight:1.7, fontFamily:FD }}>
                <strong style={{ color:W85 }}>{jobs.find(j=>j.id===deleting)?.title}</strong>
              </p>
              <p style={{ fontSize:13, color:W55, marginBottom:28, lineHeight:1.7, fontFamily:FD }}>
                {jobs.find(j=>j.id===deleting)?.source==='base'
                  ? 'This base job will be hidden from this session.'
                  : 'This job will be permanently removed from the platform. This cannot be undone.'}
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setDeleting(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:12, cursor:'pointer', borderRadius:3 }}>Cancel</button>
                <button onClick={()=>handleDelete(deleting)} style={{ flex:1, padding:'12px', background:hex2rgba(G2,0.25), border:`1px solid ${G2}`, color:'#D8C0A0', fontFamily:FD, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>
                  {jobs.find(j=>j.id===deleting)?.source==='base' ? 'Hide' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODAL */}
        {(modal==='create'||modal==='edit')&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }} onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, padding:'40px', width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${GL},${G5})`, borderRadius:'4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W35, fontSize:18 }}>✕</button>
              <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontFamily:FD, fontWeight:700 }}>{modal==='create'?'New Job':editing?.source==='base'?'Customise Base Job':'Edit Job'}</div>
              <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:16 }}>{modal==='create'?'Create a New Job':editing?.title}</h2>
              {editing?.source==='base'&&<div style={{ padding:'10px 14px', background:hex2rgba(GL,0.06), border:`1px solid ${hex2rgba(GL,0.22)}`, marginBottom:20, fontSize:12, color:GL, fontFamily:FD, borderRadius:3 }}>ℹ️ Editing a base job creates an admin override.</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:18, marginTop:16 }}>
                <div><label style={lbl}>Job Title</label><input type="text" value={form.title} onChange={e=>F('title',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                <div>
                  <label style={lbl}>Client{!clientsLoaded&&<span style={{ color:W35, fontWeight:400, marginLeft:8, fontSize:9 }}>Loading…</span>}</label>
                  <select value={form.client} onChange={e=>F('client',e.target.value)} style={{ ...inp, background:D3, cursor:'pointer' }}>
                    <option value="">— Select client —</option>
                    {clients.filter(c=>c.email).length>0&&<optgroup label="── Registered Clients ──">{clients.filter(c=>c.email).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>}
                    <optgroup label="── Other Clients ──">{clients.filter(c=>!c.email).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</optgroup>
                    <option value="__other__">Other (type below)</option>
                  </select>
                  {form.client==='__other__'&&(
                    <input type="text" autoFocus placeholder="Enter client name…" value={otherClient} onChange={e=>setOtherClient(e.target.value)}
                      style={{ ...inp,marginTop:8 }} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  )}
                </div>
                <div><label style={lbl}>Category</label><select value={form.category||''} onChange={e=>F('category',e.target.value)} style={{ ...inp,background:D3,cursor:'pointer' }}><option value="">— Select —</option>{CATEGORY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div><label style={lbl}>Venue</label><input type="text" value={form.venue} onChange={e=>F('venue',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                  <div><label style={lbl}>City</label><input type="text" value={form.city} onChange={e=>F('city',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div><label style={lbl}>Start Date *</label><input type="date" value={form.date} onChange={e=>F('date',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                  <div><label style={lbl}>End Date</label><input type="date" value={form.startDate||''} min={form.date||''} onChange={e=>F('startDate',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[{label:'Start Time',key:'startTime',type:'time'},{label:'End Time',key:'endTime',type:'time'},{label:'Hourly Rate (R)',key:'hourlyRate',type:'number'},{label:'Total Slots',key:'totalSlots',type:'number'}].map(({label,key,type})=>(
                    <div key={key}><label style={lbl}>{label}</label><input type={type} value={(form as any)[key]} onChange={e=>F(key,type==='number'?+e.target.value:e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                  ))}
                </div>
                <div><label style={lbl}>Status</label><select value={form.status} onChange={e=>F('status',e.target.value)} style={{ ...inp,background:D3,cursor:'pointer' }}>{(['open','filled','completed','cancelled'] as JobStatus[]).map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
                {modal==='edit'&&<div><label style={lbl}>Filled Slots</label><input type="number" min={0} max={form.totalSlots} value={form.filledSlots} onChange={e=>F('filledSlots',+e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>}
                <div style={{ marginTop:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}><div style={{ flex:1, height:1, background:BB }}/><span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontFamily:FD, whiteSpace:'nowrap' }}>Promoter Requirements</span><div style={{ flex:1, height:1, background:BB }}/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div><label style={lbl}>Gender Preference</label><select value={reqGender} onChange={e=>setReqGender(e.target.value)} style={{ ...inp,background:D3,cursor:'pointer' }}>{['Any Gender','Female','Male','Non-binary Inclusive'].map(o=><option key={o}>{o}</option>)}</select></div>
                    <div><label style={lbl}>Languages Required</label><input type="text" value={reqLanguages} onChange={e=>setReqLanguages(e.target.value)} placeholder="e.g. English, Zulu" style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                    <div><label style={lbl}>Min Height (cm)</label><input type="number" value={reqMinHeight} onChange={e=>setReqMinHeight(e.target.value)} placeholder="165" style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                    <div><label style={lbl}>Min Age</label><input type="number" value={reqMinAge} onChange={e=>setReqMinAge(e.target.value)} placeholder="18" style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                    <div><label style={lbl}>Experience</label><select value={reqExperience} onChange={e=>setReqExperience(e.target.value)} style={{ ...inp,background:D3,cursor:'pointer' }}>{['None','6 months+','1 year+','2+ years','3+ years'].map(o=><option key={o}>{o}</option>)}</select></div>
                    <div><label style={lbl}>Attire</label><select value={reqAttire} onChange={e=>setReqAttire(e.target.value)} style={{ ...inp,background:D3,cursor:'pointer' }}>{['Smart Casual','Formal','Brand Uniform Provided','All Black','Brand Specific'].map(o=><option key={o}>{o}</option>)}</select></div>
                  </div>
                  <div style={{ marginTop:14 }}><label style={lbl}>Additional Requirements</label><input type="text" value={reqOther} onChange={e=>setReqOther(e.target.value)} placeholder="e.g. Own transport" style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}><div style={{ flex:1, height:1, background:BB }}/><span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontFamily:FD, whiteSpace:'nowrap' }}>Terms & Conditions</span><div style={{ flex:1, height:1, background:BB }}/></div>
                  <label style={lbl}>Campaign-Specific Terms</label>
                  <textarea value={termsText} onChange={e=>setTermsText(e.target.value)} rows={5} placeholder="Enter any additional terms specific to this job…" style={{ ...inp,resize:'vertical' as const,lineHeight:1.6 }} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginTop:12, padding:'12px 14px', background:BB2, border:`1px solid ${BB}`, borderRadius:3 }}>
                    <input type="checkbox" checked={termsAgreed} onChange={e=>setTermsAgreed(e.target.checked)} style={{ marginTop:2, accentColor:GL, width:15, height:15, flexShrink:0, cursor:'pointer' }} />
                    <span style={{ fontSize:12, color:W55, lineHeight:1.6, fontFamily:FD }}>I confirm this job complies with Honey Group platform standards and all applicable South African labour regulations.</span>
                  </label>
                </div>
                {saveError&&<div style={{ padding:'10px 14px', background:'rgba(139,90,26,0.2)', border:'1px solid rgba(139,90,26,0.6)', borderRadius:3, fontSize:12, color:'#D8B888', fontFamily:FD }}>⚠ {saveError}</div>}
                <Btn onClick={save} disabled={saving}>{saving?'Saving…':modal==='create'?'Create Job':'Save Changes'}</Btn>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTERS PANEL */}
        {modal==='promoters'&&promoterJob&&(
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }} onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, width:'100%', maxWidth:760, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G4},${GL})`, borderRadius:'4px 4px 0 0' }} />
              <div style={{ padding:'28px 32px 20px', borderBottom:`1px solid ${BB}` }}>
                <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W35, fontSize:18 }}>✕</button>
                <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G4, fontWeight:700, fontFamily:FD, marginBottom:6 }}>Job · Promoters</div>
                <h2 style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W }}>{promoterJob.title}</h2>
                <div style={{ display:'flex', gap:20, marginTop:8, fontSize:12, color:W55, fontFamily:FD }}><span>📍 {promoterJob.venue}, {promoterJob.city}</span><span>👥 {promoterJob.filledSlots}/{promoterJob.totalSlots} filled</span></div>
                <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
                  {promoterJob.status==='filled'&&<button onClick={()=>markSlotOpen(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G4,0.15), border:`1px solid ${G4}`, color:G4, fontFamily:FD, fontSize:10, fontWeight:700, cursor:'pointer', borderRadius:3 }}>⚡ Open Spot — Notify Shortlist</button>}
                  {(promoterJob.status==='filled'||promoterJob.status==='open')&&<button onClick={()=>notifyNotNeeded(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G2,0.15), border:`1px solid ${G2}`, color:'#C89A70', fontFamily:FD, fontSize:10, fontWeight:700, cursor:'pointer', borderRadius:3 }}>✗ Not Needed — Notify Shortlist</button>}
                  {shortlistMsg&&<span style={{ fontSize:11, color:GL, fontFamily:FD }}>{shortlistMsg}</span>}
                </div>
              </div>
              <div style={{ overflowY:'auto', flex:1 }}>
                {promoLoading?<div style={{ padding:60, textAlign:'center', color:W35, fontFamily:FD }}>Loading promoters…</div>:matchedPromos.length===0?<div style={{ padding:60, textAlign:'center', color:W35, fontFamily:FD }}>No approved promoters found.</div>:matchedPromos.map((p,i)=>{
                  const isAllocated=p.appStatus==='ALLOCATED',isStandby=p.appStatus==='STANDBY',accentColor=isAllocated?GL:isStandby?G4:W35
                  return (
                    <div key={p.id} style={{ padding:'16px 32px', borderBottom:i<matchedPromos.length-1?`1px solid ${BB}`:'none', display:'flex', alignItems:'center', gap:16, background:isAllocated?hex2rgba(GL,0.04):isStandby?hex2rgba(G4,0.03):'transparent' }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:BB, border:`2px solid ${accentColor}`, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:accentColor, fontWeight:700, fontFamily:FD }}>
                        {p.profilePhotoUrl?<img src={p.profilePhotoUrl} alt={p.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:p.name.charAt(0)}
                      </div>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:W85, fontFamily:FD }}>{p.name}</div><div style={{ fontSize:11, color:W55, fontFamily:FD }}>{p.city}{p.distanceKm!==undefined&&<span style={{ color:W35, marginLeft:8 }}>~{p.distanceKm}km</span>}</div></div>
                      <div style={{ flexShrink:0 }}>
                        {isAllocated&&<span style={{ fontSize:9, fontWeight:700, color:GL, background:hex2rgba(GL,0.12), border:`1px solid ${hex2rgba(GL,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Allocated</span>}
                        {isStandby&&<span style={{ fontSize:9, fontWeight:700, color:G4, background:hex2rgba(G4,0.12), border:`1px solid ${hex2rgba(G4,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Shortlisted</span>}
                        {!p.appStatus&&<span style={{ fontSize:9, color:W35, fontFamily:FD }}>Not applied</span>}
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {!isAllocated&&promoterJob.filledSlots<promoterJob.totalSlots&&<Btn small onClick={()=>allocatePromoter(p,promoterJob.id)} color={GL}>Allocate</Btn>}
                        {isAllocated&&<span style={{ fontSize:10, color:W35, fontFamily:FD }}>✓ On this job</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}