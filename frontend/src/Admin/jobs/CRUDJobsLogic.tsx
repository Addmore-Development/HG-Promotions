import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Palette ──────────────────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'
const B   = '#0C0A07'
const D1  = '#0E0C06'
const D2  = '#151209'
const D3  = '#1C1709'
const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'
const W   = '#FAF3E8'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"
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

interface Job {
  id: string; title: string; client: string; venue: string
  date: string; startTime: string; endTime: string
  hourlyRate: number; totalSlots: number; filledSlots: number
  status: JobStatus; city: string; category?: string
  lat?: number; lng?: number
  // populated from API
  applications?: any[]
}

interface PromoterMatch {
  id: string; name: string; email: string; city: string
  reliabilityScore: number; profilePhotoUrl?: string
  status: string; distanceKm?: number
  appStatus?: 'ALLOCATED' | 'STANDBY' | 'DECLINED' | null
  appId?: string
}

interface ShortlistEntry {
  jobId: string; promoterId: string; promoterName: string; notifiedAt: string
  message: string; type: 'shortlisted' | 'not_needed'
}

const STATUS_COLOR: Record<JobStatus, string> = {
  open: GL, filled: G3, completed: G, cancelled: G2,
}
const STATUS_BG: Record<JobStatus, string> = {
  open:      hex2rgba(GL, 0.10),
  filled:    hex2rgba(G3, 0.10),
  completed: hex2rgba(G,  0.10),
  cancelled: hex2rgba(G2, 0.22),
}
const STATUS_BORDER: Record<JobStatus, string> = {
  open:      hex2rgba(GL, 0.45),
  filled:    hex2rgba(G3, 0.45),
  completed: hex2rgba(G,  0.45),
  cancelled: hex2rgba(G2, 0.55),
}

const CATEGORY_OPTIONS = [
  'FMCG / Beverages', 'FMCG / Food', 'Retail', 'Telecoms', 'Automotive',
  'Financial Services', 'Healthcare / Pharma', 'Fitness & Wellness',
  'Fashion & Beauty', 'Quick Service Restaurant', 'Events & Entertainment',
  'Technology', 'Other',
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHeader() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_COLOR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 10px', borderRadius:3 }}>{status}</span>
  )
}

function Btn({ onClick, children, color = GL, outline = false, small = false }: any) {
  return (
    <button onClick={onClick} style={{ padding:small?'7px 14px':'11px 22px', background:outline?'transparent':`linear-gradient(135deg,${color},${hex2rgba(color,0.8)})`, border:`1px solid ${color}`, color:outline?color:B, fontFamily:FD, fontSize:small?10:11, fontWeight:700, letterSpacing:'0.08em', cursor:'pointer', textTransform:'uppercase' as const, transition:'all 0.2s', borderRadius:3, boxShadow:outline?'none':`0 2px 12px ${hex2rgba(color,0.35)}` }}
      onMouseEnter={e=>{e.currentTarget.style.opacity='0.82';e.currentTarget.style.transform='translateY(-1px)'}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
    >{children}</button>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:'5px 12px', background:active?hex2rgba(color,0.18):'rgba(12,10,7,0.85)', border:`1px solid ${active?color:'rgba(212,136,10,0.22)'}`, color:active?color:W55, fontFamily:FD, fontSize:10, fontWeight:active?700:400, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3, transition:'all 0.18s' }}>
      {label}
    </button>
  )
}

const EMPTY_JOB: Omit<Job, 'id' | 'applications'> = {
  title:'', client:'', venue:'', date:'', startTime:'09:00', endTime:'17:00',
  hourlyRate:120, totalSlots:4, filledSlots:0, status:'open', city:'', category:'',
  lat: undefined, lng: undefined,
}

// ─── Haversine distance ───────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ─── City → rough coordinates for distance estimate ──────────────────────────
const CITY_COORDS: Record<string, [number,number]> = {
  'johannesburg': [-26.2041, 28.0473], 'sandton': [-26.1076, 28.0567],
  'cape town':    [-33.9249, 18.4241], 'durban':  [-29.8587, 31.0218],
  'pretoria':     [-25.7479, 28.2293], 'port elizabeth': [-33.9608, 25.6022],
  'gqeberha':     [-33.9608, 25.6022], 'bloemfontein': [-29.0852, 26.1596],
  'east london':  [-33.0153, 27.9116], 'nelspruit': [-25.4745, 30.9703],
  'sun city':     [-25.3377, 27.0953],
}

function cityCoords(city: string): [number,number] | null {
  return CITY_COORDS[city.toLowerCase()] || null
}

export default function CRUDJobsLogic() {
  const [jobs,         setJobs        ] = useState<Job[]>([])
  const [loading,      setLoading     ] = useState(true)
  const [modal,        setModal       ] = useState<'create'|'edit'|'promoters'|null>(null)
  const [editing,      setEditing     ] = useState<Job|null>(null)
  const [form,         setForm        ] = useState<Omit<Job,'id'|'applications'>>(EMPTY_JOB)
  const [filter,       setFilter      ] = useState<JobStatus|'all'>('all')
  const [deleting,     setDeleting    ] = useState<string|null>(null)
  const [saving,       setSaving      ] = useState(false)

  // Promoters panel
  const [promoterJob,  setPromoterJob ] = useState<Job|null>(null)
  const [matchedPromos,setMatchedPromos] = useState<PromoterMatch[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [shortlistMsg, setShortlistMsg] = useState('')

  // Notification log (in-memory for this session)
  const [notifications, setNotifications] = useState<ShortlistEntry[]>([])

  // ── Load jobs from API ────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/jobs?status=all`, { headers: authHeader() as any })
      if (res.ok) {
        const data: any[] = await res.json()
        const mapped: Job[] = data.map(j => ({
          id:          j.id,
          title:       j.title,
          client:      j.client,
          venue:       j.venue,
          date:        j.date?.slice(0, 10) || '',
          startTime:   j.startTime || '09:00',
          endTime:     j.endTime   || '17:00',
          hourlyRate:  j.hourlyRate || 0,
          totalSlots:  j.totalSlots || 0,
          filledSlots: j.filledSlots || 0,
          status:      (j.status?.toLowerCase() || 'open') as JobStatus,
          city:        j.address?.split(',')[0] || '',
          category:    j.filters?.category || '',
          lat:         j.lat,
          lng:         j.lng,
          applications: j.applications || [],
        }))
        setJobs(mapped)
      }
    } catch (e) { console.warn('Jobs load failed', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

  // Sync to localStorage for public jobs board
  useEffect(() => {
    const publicJobs = jobs
      .filter(j => j.status === 'open')
      .map((j, idx) => ({
        id: j.id, title: j.title, company: j.client,
        companyInitial: j.client.charAt(0),
        companyColor: WARM_ACCENTS[idx % WARM_ACCENTS.length],
        location: `${j.venue}, ${j.city}`,
        type: j.category || 'Brand Activation',
        pay: `R ${j.hourlyRate.toLocaleString('en-ZA')}`, payPer: 'per hour',
        date: j.date ? new Date(j.date).toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short', year:'numeric' }) : '',
        jobDate: j.date, approvedAt: new Date().toISOString().slice(0, 10),
        slots: j.totalSlots, slotsLeft: j.totalSlots - j.filledSlots,
        duration: `${j.startTime}–${j.endTime}`,
        tags: [j.category || 'Admin Posted'],
        accentLine: WARM_ACCENTS[idx % WARM_ACCENTS.length],
        gradient: `linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`,
        status: 'open', address: `${j.venue}, ${j.city}`,
      }))
    localStorage.setItem('hg_admin_jobs', JSON.stringify(publicJobs))
    window.dispatchEvent(new Event('storage'))
  }, [jobs])

  // ── Save job (create / update) ────────────────────────────────────────────────
  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        title:      form.title,
        client:     form.client,
        brand:      form.client,
        venue:      form.venue,
        address:    `${form.venue}, ${form.city}`,
        lat:        form.lat ?? cityCoords(form.city)?.[0] ?? -26.2041,
        lng:        form.lng ?? cityCoords(form.city)?.[1] ?? 28.0473,
        date:       form.date,
        startTime:  form.startTime,
        endTime:    form.endTime,
        hourlyRate: form.hourlyRate,
        totalSlots: form.totalSlots,
        filledSlots: form.filledSlots,
        status:     form.status.toUpperCase(),
        filters:    { category: form.category || '' },
      }

      let res: Response
      if (editing) {
        res = await fetch(`${API}/jobs/${editing.id}`, { method:'PUT', headers: authHeader() as any, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`${API}/jobs`, { method:'POST', headers: authHeader() as any, body: JSON.stringify(payload) })
      }

      if (res.ok) {
        await loadJobs()
        closeModal()

        // If editing and a slot just opened (status changed from filled to open),
        // notify shortlisted promoters
        if (editing && editing.status === 'filled' && form.status === 'open') {
          await notifyShortlisted(editing.id, 'slot_opened')
        }
      }
    } catch (e) { console.error('Save job failed', e) }
    finally { setSaving(false) }
  }

  // ── Delete job ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/jobs/${id}`, { method:'DELETE', headers: authHeader() as any })
      setJobs(prev => prev.filter(j => j.id !== id))
    } catch (e) { console.error('Delete failed', e) }
    setDeleting(null)
  }

  // ── Open promoters panel for a job ───────────────────────────────────────────
  const openPromoterPanel = async (job: Job) => {
    setPromoterJob(job)
    setModal('promoters')
    setPromoLoading(true)
    setShortlistMsg('')

    try {
      // Get all approved promoters
      const [usersRes, appsRes] = await Promise.all([
        fetch(`${API}/users?role=PROMOTER&status=approved`, { headers: authHeader() as any }),
        fetch(`${API}/applications/job/${job.id}`, { headers: authHeader() as any }),
      ])

      const users: any[] = usersRes.ok ? await usersRes.json() : []
      const apps:  any[] = appsRes.ok  ? await appsRes.json()  : []

      const appMap = new Map(apps.map((a: any) => [a.promoterId, a]))
      const jobCoords = job.lat && job.lng
        ? [job.lat, job.lng] as [number,number]
        : cityCoords(job.city)

      const matched: PromoterMatch[] = users.map((u: any) => {
        const userCoords = cityCoords(u.city || '')
        let distanceKm: number | undefined
        if (jobCoords && userCoords) {
          distanceKm = Math.round(haversineKm(jobCoords[0], jobCoords[1], userCoords[0], userCoords[1]))
        }
        const app = appMap.get(u.id)
        return {
          id:               u.id,
          name:             u.fullName,
          email:            u.email,
          city:             u.city || '',
          reliabilityScore: u.reliabilityScore || 0,
          profilePhotoUrl:  u.profilePhotoUrl,
          status:           u.status,
          distanceKm,
          appStatus:        app?.status || null,
          appId:            app?.id,
        }
      })

      // Sort: applied first, then by distance, then reliability
      matched.sort((a, b) => {
        const aApplied = a.appStatus ? 1 : 0
        const bApplied = b.appStatus ? 1 : 0
        if (bApplied !== aApplied) return bApplied - aApplied
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm
        }
        return (b.reliabilityScore || 0) - (a.reliabilityScore || 0)
      })

      setMatchedPromos(matched)
    } catch (e) {
      console.error('Load promoters failed', e)
    }
    setPromoLoading(false)
  }

  // ── Allocate a promoter to a job ──────────────────────────────────────────────
  const allocatePromoter = async (promo: PromoterMatch, jobId: string) => {
    try {
      if (promo.appId) {
        await fetch(`${API}/applications/${promo.appId}/status`, {
          method: 'PUT', headers: authHeader() as any,
          body: JSON.stringify({ status: 'ALLOCATED' }),
        })
      } else {
        // No application yet — admin creates one
        await fetch(`${API}/applications`, {
          method: 'POST', headers: authHeader() as any,
          body: JSON.stringify({ jobId, promoterId: promo.id }),
        })
      }
      // Refresh promoter list
      if (promoterJob) await openPromoterPanel({ ...promoterJob, id: jobId })
      await loadJobs()
    } catch (e) { console.error('Allocate failed', e) }
  }

  // ── Mark slot as open and notify shortlisted ──────────────────────────────────
  const markSlotOpen = async (job: Job) => {
    try {
      // Find standby (shortlisted) applicants for this job
      const appsRes = await fetch(`${API}/applications/job/${job.id}`, { headers: authHeader() as any })
      const apps: any[] = appsRes.ok ? await appsRes.json() : []
      const standby = apps.filter((a: any) => a.status === 'STANDBY').slice(0, 3)

      if (standby.length === 0) {
        setShortlistMsg('No shortlisted promoters to notify.')
        return
      }

      const msg = 'This job is full. You have been shortlisted so please keep yourself available, incase there are any changes.'
      const newNotifs: ShortlistEntry[] = []

      for (const app of standby) {
        // In production this would send a push/SMS/email via backend
        // For now we store in-memory and log to audit
        newNotifs.push({
          jobId:         job.id,
          promoterId:    app.promoterId,
          promoterName:  app.promoter?.fullName || 'Promoter',
          notifiedAt:    new Date().toISOString(),
          message:       msg,
          type:          'shortlisted',
        })

        // Record notification via audit log endpoint
        await fetch(`${API}/shifts/${app.id}/issue`, {
          method: 'POST', headers: authHeader() as any,
          body: JSON.stringify({ type: 'shortlist_notification', note: msg }),
        }).catch(() => {})
      }

      setNotifications(prev => [...prev, ...newNotifs])
      setShortlistMsg(`✓ ${standby.length} shortlisted promoter${standby.length > 1 ? 's' : ''} notified.`)

      // Update job filledSlots - decrement by 1 to signal open spot
      await fetch(`${API}/jobs/${job.id}`, {
        method: 'PUT', headers: authHeader() as any,
        body: JSON.stringify({ status: 'OPEN', filledSlots: Math.max(0, job.filledSlots - 1) }),
      })
      await loadJobs()

    } catch (e) { console.error('Notify shortlist failed', e) }
  }

  // ── After 15 min: notify shortlisted they are not needed ─────────────────────
  const notifyNotNeeded = async (job: Job) => {
    const appsRes = await fetch(`${API}/applications/job/${job.id}`, { headers: authHeader() as any })
    const apps: any[] = appsRes.ok ? await appsRes.json() : []
    const standby = apps.filter((a: any) => a.status === 'STANDBY').slice(0, 3)

    const msg = 'You are not currently needed for this shift. We will notify you if there are any further changes. Thank you for your availability.'
    const newNotifs: ShortlistEntry[] = standby.map((app: any) => ({
      jobId:        job.id,
      promoterId:   app.promoterId,
      promoterName: app.promoter?.fullName || 'Promoter',
      notifiedAt:   new Date().toISOString(),
      message:      msg,
      type:         'not_needed' as const,
    }))
    setNotifications(prev => [...prev, ...newNotifs])
    setShortlistMsg(`✓ ${standby.length} promoter${standby.length>1?'s':''} notified they are not needed.`)
  }

  const notifyShortlisted = async (jobId: string, _reason: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) await markSlotOpen(job)
  }

  // ── Mark job complete ─────────────────────────────────────────────────────────
  const markComplete = async (job: Job) => {
    await fetch(`${API}/jobs/${job.id}`, {
      method: 'PUT', headers: authHeader() as any,
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'completed' } : j))
  }

  const openCreate = () => { setForm(EMPTY_JOB); setEditing(null); setModal('create') }
  const openEdit   = (job: Job) => { setForm({ ...job }); setEditing(job); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null); setPromoterJob(null) }
  const F = (key: keyof typeof form, value: string | number) => setForm(prev => ({ ...prev, [key]: value }))

  const registeredClients = ['Red Bull SA','AB InBev','Nike SA','Vodacom','Nedbank','Distell','SABMiller SA','Castle Lager SA','Standard Bank SA','MTN SA','Heineken SA','Woolworths SA','Tiger Brands','Coca-Cola SA','KFC South Africa','Old Mutual SA','Shoprite Holdings','Pick n Pay SA']

  const filtered = jobs.filter(j => filter==='all' || j.status===filter)
  const counts = { all:jobs.length, open:jobs.filter(j=>j.status==='open').length, filled:jobs.filter(j=>j.status==='filled').length, completed:jobs.filter(j=>j.status==='completed').length, cancelled:jobs.filter(j=>j.status==='cancelled').length }

  const inputStyle: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:13, color:W, outline:'none', borderRadius:3 }
  const labelStyle: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Jobs</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Manage Jobs</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>{jobs.length} total jobs</p>
          </div>
          <Btn onClick={openCreate}>+ New Job</Btn>
        </div>

        {/* FILTERS */}
        <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
          {(['all','open','filled','completed','cancelled'] as const).map(f=>(
            <FilterBtn key={f} label={f==='all'?`All (${counts.all})`:`${f} (${counts[f as JobStatus] ?? 0})`} active={filter===f} color={f==='all'?GL:STATUS_COLOR[f as JobStatus]||GL} onClick={()=>setFilter(f)} />
          ))}
        </div>

        {/* NOTIFICATION LOG */}
        {notifications.length > 0 && (
          <div style={{ background:hex2rgba(GL,0.06), border:`1px solid ${BB}`, borderRadius:4, padding:'14px 20px', marginBottom:20 }}>
            <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD, marginBottom:10 }}>Recent Notifications Sent</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {notifications.slice(-5).reverse().map((n, i) => (
                <div key={i} style={{ fontSize:11, color:W55, fontFamily:FD, display:'flex', gap:12 }}>
                  <span style={{ color: n.type==='shortlisted' ? GL : G2, fontWeight:700 }}>{n.type==='shortlisted' ? '⏳ Shortlisted' : '✗ Not Needed'}</span>
                  <span>{n.promoterName}</span>
                  <span style={{ color:W28 }}>{new Date(n.notifiedAt).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLE */}
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:W28, fontFamily:FD }}>Loading jobs…</div>
        ) : (
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
                {filtered.map((job, i) => (
                  <tr key={job.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=BB2}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'14px 18px', fontSize:11, color:W28, fontFamily:MONO }}>{job.id.slice(0,8)}</td>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{job.title}</div>
                      {job.category && <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD }}>{job.category}</div>}
                    </td>
                    <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD }}>{job.client}</td>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ fontSize:12, color:W, fontFamily:FD }}>{job.city}</div>
                      <div style={{ fontSize:11, color:W28, fontFamily:FD }}>{job.venue}</div>
                    </td>
                    <td style={{ padding:'14px 18px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:12, color:W55, fontFamily:FD }}>{job.date ? new Date(job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}</div>
                      <div style={{ fontSize:10, color:W28, fontFamily:FD }}>{job.startTime}–{job.endTime}</div>
                    </td>
                    <td style={{ padding:'14px 18px', fontSize:13, color:GL, fontWeight:700, fontFamily:FD }}>R{job.hourlyRate}/hr</td>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ fontSize:12, color:W, fontFamily:FD }}>{job.filledSlots}/{job.totalSlots}</div>
                      <div style={{ marginTop:5, height:3, background:BB, borderRadius:2, width:48 }}>
                        <div style={{ height:'100%', borderRadius:2, background:STATUS_COLOR[job.status], width:`${job.totalSlots > 0 ? (job.filledSlots/job.totalSlots)*100 : 0}%`, transition:'width 0.3s' }} />
                      </div>
                    </td>
                    <td style={{ padding:'14px 18px' }}><StatusBadge status={job.status} /></td>
                    <td style={{ padding:'14px 18px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>openEdit(job)} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700 }}>Edit</button>
                        <span style={{ color:W28 }}>·</span>
                        <button onClick={()=>openPromoterPanel(job)} style={{ fontSize:11, color:G4, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700 }}>Promoters</button>
                        <span style={{ color:W28 }}>·</span>
                        {(job.status === 'open' || job.status === 'filled') && (
                          <>
                            <button onClick={()=>markComplete(job)} style={{ fontSize:11, color:G3, background:'none', border:'none', cursor:'pointer', fontFamily:FD }}>Complete</button>
                            <span style={{ color:W28 }}>·</span>
                          </>
                        )}
                        {job.status === 'filled' && (
                          <>
                            <button onClick={()=>markSlotOpen(job)} style={{ fontSize:11, color:G4, background:'none', border:'none', cursor:'pointer', fontFamily:FD }}>Open Slot</button>
                            <span style={{ color:W28 }}>·</span>
                          </>
                        )}
                        <button onClick={()=>setDeleting(job.id)} style={{ fontSize:11, color:'#C89A70', background:'none', border:'none', cursor:'pointer', fontFamily:FD }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length===0 && <div style={{ padding:40, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>No jobs match this filter.</div>}
          </div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleting && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}
            onClick={e=>e.target===e.currentTarget&&setDeleting(null)}>
            <div style={{ background:D2, border:`1px solid ${hex2rgba(G2,0.7)}`, padding:'36px 40px', maxWidth:380, width:'100%', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G2, borderRadius:'4px 4px 0 0' }} />
              <h3 style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:12 }}>Delete Job?</h3>
              <p style={{ fontSize:13, color:W55, marginBottom:28, lineHeight:1.7, fontFamily:FD }}>This job will be permanently removed from the platform.</p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setDeleting(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:12, cursor:'pointer', borderRadius:3 }}>Cancel</button>
                <button onClick={()=>handleDelete(deleting)} style={{ flex:1, padding:'12px', background:hex2rgba(G2,0.25), border:`1px solid ${G2}`, color:'#E8D5A8', fontFamily:FD, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATE / EDIT MODAL ── */}
        {(modal === 'create' || modal === 'edit') && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, padding:'40px', width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${GL},${G5})`, borderRadius:'4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
              <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontFamily:FD, fontWeight:700 }}>{modal==='create'?'New Job':'Edit Job'}</div>
              <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:24 }}>{modal==='create'?'Create a New Job':`Editing Job`}</h2>

              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input type="text" placeholder="Brand Ambassador — Red Bull" value={form.title} onChange={e=>F('title',e.target.value)}
                    style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>

                {/* Client */}
                <div>
                  <label style={labelStyle}>Client</label>
                  <select value={form.client} onChange={e=>F('client',e.target.value)}
                    style={{ ...inputStyle, background:D3, cursor:'pointer', color:form.client?W:W55 }}>
                    <option value="">— Select registered client —</option>
                    {registeredClients.map(c=><option key={c} value={c}>{c}</option>)}
                    <option value="__other__">Other (type below)</option>
                  </select>
                  {form.client==='__other__' && (
                    <input type="text" placeholder="Enter client name" onChange={e=>F('client',e.target.value)}
                      style={{ ...inputStyle, marginTop:8 }}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  )}
                </div>

                {/* Category — links to promoter matching */}
                <div>
                  <label style={labelStyle}>Category <span style={{ color:W28, fontWeight:400 }}>(used to match promoters)</span></label>
                  <select value={form.category || ''} onChange={e=>F('category',e.target.value)}
                    style={{ ...inputStyle, background:D3, cursor:'pointer', color:form.category?W:W55 }}>
                    <option value="">— Select category —</option>
                    {CATEGORY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Venue, City */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Venue</label>
                    <input type="text" placeholder="Sandton City" value={form.venue} onChange={e=>F('venue',e.target.value)}
                      style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input type="text" placeholder="Johannesburg" value={form.city} onChange={e=>F('city',e.target.value)}
                      style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={form.date} onChange={e=>F('date',e.target.value)}
                    style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>

                {/* Time & Rate grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[
                    { label:'Start Time',      key:'startTime',  type:'time'   },
                    { label:'End Time',        key:'endTime',    type:'time'   },
                    { label:'Hourly Rate (R)', key:'hourlyRate', type:'number' },
                    { label:'Total Slots',     key:'totalSlots', type:'number' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} value={(form as any)[key]} onChange={e=>F(key as any, type==='number' ? +e.target.value : e.target.value)}
                        style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e=>F('status',e.target.value)}
                    style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
                    {(['open','filled','completed','cancelled'] as JobStatus[]).map(s=>(
                      <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Filled Slots — only show when editing */}
                {modal === 'edit' && (
                  <div>
                    <label style={labelStyle}>Filled Slots</label>
                    <input type="number" min={0} max={form.totalSlots} value={form.filledSlots} onChange={e=>F('filledSlots',+e.target.value)}
                      style={inputStyle} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    <div style={{ fontSize:10, color:W28, marginTop:5, fontFamily:FD }}>
                      Setting filled slots below total will automatically notify shortlisted promoters when you save.
                    </div>
                  </div>
                )}

                <Btn onClick={save}>{saving ? 'Saving…' : modal==='create' ? 'Create Job' : 'Save Changes'}</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── PROMOTERS PANEL ── */}
        {modal === 'promoters' && promoterJob && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, padding:'0', width:'100%', maxWidth:760, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G4},${GL})`, borderRadius:'4px 4px 0 0' }} />

              {/* Panel header */}
              <div style={{ padding:'28px 32px 20px', borderBottom:`1px solid ${BB}` }}>
                <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
                <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G4, fontWeight:700, fontFamily:FD, marginBottom:6 }}>Job · Promoters</div>
                <h2 style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W }}>{promoterJob.title}</h2>
                <div style={{ display:'flex', gap:20, marginTop:8, fontSize:12, color:W55, fontFamily:FD }}>
                  <span>📍 {promoterJob.venue}, {promoterJob.city}</span>
                  <span>📅 {promoterJob.date ? new Date(promoterJob.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}</span>
                  <span>👥 {promoterJob.filledSlots}/{promoterJob.totalSlots} filled</span>
                  {promoterJob.category && <span>🏷 {promoterJob.category}</span>}
                </div>

                {/* Shortlist notification controls */}
                <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
                  {promoterJob.status === 'filled' && (
                    <button onClick={()=>markSlotOpen(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G4,0.15), border:`1px solid ${G4}`, color:G4, fontFamily:FD, fontSize:10, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3 }}>
                      ⚡ Open Spot — Notify Shortlist
                    </button>
                  )}
                  {(promoterJob.status === 'filled' || promoterJob.status === 'open') && (
                    <button onClick={()=>notifyNotNeeded(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G2,0.15), border:`1px solid ${G2}`, color:'#C89A70', fontFamily:FD, fontSize:10, fontWeight:700, letterSpacing:'0.1em', cursor:'pointer', borderRadius:3 }}>
                      ✗ Not Needed — Notify Shortlist
                    </button>
                  )}
                  {shortlistMsg && <span style={{ fontSize:11, color:GL, fontFamily:FD }}>{shortlistMsg}</span>}
                </div>
              </div>

              {/* Legend */}
              <div style={{ padding:'12px 32px', background:D1, borderBottom:`1px solid ${BB}`, display:'flex', gap:20, fontSize:10, color:W55, fontFamily:FD }}>
                <span><span style={{ color:GL }}>●</span> Allocated</span>
                <span><span style={{ color:G4 }}>●</span> Shortlisted (Standby)</span>
                <span><span style={{ color:W28 }}>●</span> Not Applied</span>
                <span style={{ marginLeft:'auto', color:W28 }}>Sorted by proximity then reliability</span>
              </div>

              {/* Promoter list */}
              <div style={{ overflowY:'auto', flex:1 }}>
                {promoLoading ? (
                  <div style={{ padding:60, textAlign:'center', color:W28, fontFamily:FD }}>Loading promoters…</div>
                ) : matchedPromos.length === 0 ? (
                  <div style={{ padding:60, textAlign:'center', color:W28, fontFamily:FD }}>No approved promoters found.</div>
                ) : (
                  matchedPromos.map((p, i) => {
                    const isAllocated = p.appStatus === 'ALLOCATED'
                    const isStandby   = p.appStatus === 'STANDBY'
                    const accentColor = isAllocated ? GL : isStandby ? G4 : W28
                    return (
                      <div key={p.id} style={{ padding:'16px 32px', borderBottom:i<matchedPromos.length-1?`1px solid ${BB}`:'none', display:'flex', alignItems:'center', gap:16, background:isAllocated?hex2rgba(GL,0.04):isStandby?hex2rgba(G4,0.03):'transparent' }}>

                        {/* Avatar */}
                        <div style={{ width:40, height:40, borderRadius:'50%', background:BB, border:`2px solid ${accentColor}`, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:accentColor, fontWeight:700, fontFamily:FD }}>
                          {p.profilePhotoUrl
                            ? <img src={p.profilePhotoUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : p.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{p.name}</div>
                          <div style={{ fontSize:11, color:W55, fontFamily:FD, marginTop:2 }}>
                            {p.city}
                            {p.distanceKm !== undefined && (
                              <span style={{ color:W28, marginLeft:8 }}>
                                ~{p.distanceKm < 50 ? `${p.distanceKm}km away` : `${p.distanceKm}km`}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:10, color:W28, fontFamily:FD, marginTop:2 }}>
                            ⭐ {p.reliabilityScore ? p.reliabilityScore.toFixed(1) : '—'} reliability
                          </div>
                        </div>

                        {/* Status badge */}
                        <div style={{ flexShrink:0, textAlign:'right' }}>
                          {isAllocated && <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:GL, background:hex2rgba(GL,0.12), border:`1px solid ${hex2rgba(GL,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Allocated</span>}
                          {isStandby   && <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:G4, background:hex2rgba(G4,0.12), border:`1px solid ${hex2rgba(G4,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Shortlisted</span>}
                          {!p.appStatus && <span style={{ fontSize:9, color:W28, fontFamily:FD }}>Not applied</span>}
                        </div>

                        {/* Actions */}
                        <div style={{ flexShrink:0, display:'flex', gap:8 }}>
                          {!isAllocated && promoterJob.filledSlots < promoterJob.totalSlots && (
                            <Btn small onClick={()=>allocatePromoter(p, promoterJob.id)} color={GL}>Allocate</Btn>
                          )}
                          {isAllocated && (
                            <span style={{ fontSize:10, color:W28, fontFamily:FD, alignSelf:'center' }}>✓ On this job</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}