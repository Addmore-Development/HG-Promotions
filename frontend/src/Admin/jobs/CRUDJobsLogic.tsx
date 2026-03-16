import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../AdminLayout'
import { ALL_JOBS } from '../../shared/jobs/jobsData'

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
type JobSource = 'base' | 'api' | 'admin'

interface Job {
  id: string; title: string; client: string; venue: string
  date: string; startDate?: string; startTime: string; endTime: string
  hourlyRate: number; totalSlots: number; filledSlots: number
  status: JobStatus; city: string; category?: string
  lat?: number; lng?: number
  source: JobSource
  applications?: any[]
<<<<<<< HEAD
  termsAndConditions?: string
=======
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
  pay?: string; payPer?: string; jobDate?: string
  location?: string; type?: string; duration?: string
  tags?: string[]; accentLine?: string
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

// ─── Client entry from API ────────────────────────────────────────────────────
interface ClientEntry {
  id: string
  name: string
  email: string
}

const STATUS_COLOR: Record<JobStatus, string> = {
  open: GL, filled: G3, completed: G, cancelled: G2,
}
const STATUS_BG: Record<JobStatus, string> = {
  open: hex2rgba(GL, 0.10), filled: hex2rgba(G3, 0.10),
  completed: hex2rgba(G, 0.10), cancelled: hex2rgba(G2, 0.22),
}
const STATUS_BORDER: Record<JobStatus, string> = {
  open: hex2rgba(GL, 0.45), filled: hex2rgba(G3, 0.45),
  completed: hex2rgba(G, 0.45), cancelled: hex2rgba(G2, 0.55),
}

const CATEGORY_OPTIONS = [
  'FMCG / Beverages', 'FMCG / Food', 'Retail', 'Telecoms', 'Automotive',
  'Financial Services', 'Healthcare / Pharma', 'Fitness & Wellness',
  'Fashion & Beauty', 'Quick Service Restaurant', 'Events & Entertainment',
  'Technology', 'Other',
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHeader() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function baseJobsToAdminJobs(): Job[] {
  return ALL_JOBS.map(j => ({
<<<<<<< HEAD
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
=======
    id:          j.id,
    title:       j.title,
    client:      j.company,
    venue:       j.location.split(',')[0]?.trim() || j.location,
    date:        j.jobDate,
    startTime:   '09:00',
    endTime:     '17:00',
    hourlyRate:  parseInt(j.pay.replace(/\D/g, '')) || 0,
    totalSlots:  j.slots,
    filledSlots: j.slots - j.slotsLeft,
    status:      j.slotsLeft === 0 ? 'filled' : ('open' as JobStatus),
    city:        j.location.split(',').slice(-1)[0]?.trim() || '',
    category:    j.type,
    source:      'base' as JobSource,
    pay:         j.pay,
    payPer:      j.payPer,
    jobDate:     j.jobDate,
    location:    j.location,
    type:        j.type,
    duration:    j.duration,
    tags:        j.tags,
    accentLine:  j.accentLine,
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
  }))
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const CITY_COORDS: Record<string, [number,number]> = {
  'johannesburg': [-26.2041, 28.0473], 'sandton': [-26.1076, 28.0567],
  'cape town': [-33.9249, 18.4241], 'durban': [-29.8587, 31.0218],
  'pretoria': [-25.7479, 28.2293], 'midrand': [-25.9986, 28.1272],
  'soweto': [-26.2678, 27.8546], 'port elizabeth': [-33.9608, 25.6022],
}
function cityCoords(city: string): [number,number] | null {
  return CITY_COORDS[city.toLowerCase()] || null
}

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_COLOR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 10px', borderRadius:3 }}>
      {status}
    </span>
  )
}

function SourceBadge({ source }: { source: JobSource }) {
  const map: Record<JobSource, { label:string; color:string }> = {
    base: { label:'Base', color:W28 }, api: { label:'Live', color:GL }, admin: { label:'Admin', color:G3 },
  }
  const s = map[source]
  return (
    <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:s.color, border:`1px solid ${hex2rgba(s.color,0.35)}`, padding:'2px 7px', borderRadius:3 }}>
      {s.label}
    </span>
  )
}

function Btn({ onClick, children, color = GL, outline = false, small = false, disabled = false }: any) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:small?'7px 14px':'11px 22px', background:disabled?'rgba(255,255,255,0.05)':outline?'transparent':`linear-gradient(135deg,${color},${hex2rgba(color,0.8)})`, border:`1px solid ${disabled?BB:color}`, color:disabled?W28:outline?color:B, fontFamily:FD, fontSize:small?10:11, fontWeight:700, letterSpacing:'0.08em', cursor:disabled?'not-allowed':'pointer', textTransform:'uppercase' as const, transition:'all 0.2s', borderRadius:3, boxShadow:outline||disabled?'none':`0 2px 12px ${hex2rgba(color,0.35)}` }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity='0.82';e.currentTarget.style.transform='translateY(-1px)'}}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
    >{children}</button>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick}
      style={{ padding:'5px 12px', background:active?hex2rgba(color,0.18):'rgba(12,10,7,0.85)', border:`1px solid ${active?color:'rgba(212,136,10,0.22)'}`, color:active?color:W55, fontFamily:FD, fontSize:10, fontWeight:active?700:400, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3, transition:'all 0.18s' }}>
      {label}
    </button>
  )
}

<<<<<<< HEAD
const EMPTY_JOB = {
  title:'', client:'', venue:'', date:'', startTime:'09:00', endTime:'17:00',
  hourlyRate:120, totalSlots:4, filledSlots:0, status:'open' as JobStatus, city:'', category:'',
  termsAndConditions:'',
=======
const EMPTY_JOB: Omit<Job, 'id'|'applications'|'source'> = {
  title:'', client:'', venue:'', date:'', startDate:'', startTime:'09:00', endTime:'17:00',
  hourlyRate:120, totalSlots:4, filledSlots:0, status:'open', city:'', category:'',
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
}

// ─── Fallback hardcoded clients (used if API is unreachable) ──────────────────
const FALLBACK_CLIENTS: ClientEntry[] = [
  { id:'f1', name:'Red Bull SA',         email:'' },
  { id:'f2', name:'AB InBev',            email:'' },
  { id:'f3', name:'Nike SA',             email:'' },
  { id:'f4', name:'Vodacom',             email:'' },
  { id:'f5', name:'Nedbank',             email:'' },
  { id:'f6', name:'Castle Lager SA',     email:'' },
  { id:'f7', name:'Standard Bank SA',    email:'' },
  { id:'f8', name:'MTN SA',              email:'' },
  { id:'f9', name:'Coca-Cola SA',        email:'' },
  { id:'f10',name:'KFC South Africa',    email:'' },
]

export default function CRUDJobsLogic() {
<<<<<<< HEAD
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create'|'edit'|'promoters'|null>(null)
  const [editing, setEditing] = useState<Job|null>(null)
  const [form, setForm] = useState(EMPTY_JOB)
  const [statusFilter, setStatusFilter] = useState<JobStatus|'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<JobSource|'all'>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tcError, setTcError] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string|null>(null)
  const [promoterJob, setPromoterJob] = useState<Job|null>(null)
=======
  const [jobs,          setJobs         ] = useState<Job[]>([])
  const [loading,       setLoading      ] = useState(true)
  const [modal,         setModal        ] = useState<'create'|'edit'|'promoters'|null>(null)
  const [editing,       setEditing      ] = useState<Job|null>(null)
  const [form,          setForm         ] = useState<Omit<Job,'id'|'applications'|'source'>>(EMPTY_JOB)
  const [statusFilter,  setStatusFilter ] = useState<JobStatus|'all'>('all')
  const [sourceFilter,  setSourceFilter ] = useState<JobSource|'all'>('all')
  const [search,        setSearch       ] = useState('')
  const [deleting,      setDeleting     ] = useState<string|null>(null)
  const [saving,        setSaving       ] = useState(false)

  // ── Requirements / tags / T&Cs ────────────────────────────────────────────────
  const [reqGender,     setReqGender    ] = useState('Any Gender')
  const [reqLanguages,  setReqLanguages ] = useState('')
  const [reqMinHeight,  setReqMinHeight ] = useState('')
  const [reqMinAge,     setReqMinAge    ] = useState('')
  const [reqExperience, setReqExperience] = useState('None')
  const [reqAttire,     setReqAttire    ] = useState('Smart Casual')
  const [reqOther,      setReqOther     ] = useState('')
  const [termsText,     setTermsText    ] = useState('')
  const [termsAgreed,   setTermsAgreed  ] = useState(false)

  const resetRequirements = () => {
    setReqGender('Any Gender'); setReqLanguages(''); setReqMinHeight('')
    setReqMinAge(''); setReqExperience('None'); setReqAttire('Smart Casual')
    setReqOther(''); setTermsText(''); setTermsAgreed(false)
  }

  // ── API-driven clients ────────────────────────────────────────────────────────
  const [clients,       setClients      ] = useState<ClientEntry[]>(FALLBACK_CLIENTS)
  const [clientsLoaded, setClientsLoaded] = useState(false)

  // Promoters panel
  const [promoterJob,   setPromoterJob  ] = useState<Job|null>(null)
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
  const [matchedPromos, setMatchedPromos] = useState<PromoterMatch[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [shortlistMsg, setShortlistMsg] = useState('')
  const [notifications, setNotifications] = useState<ShortlistEntry[]>([])

<<<<<<< HEAD
=======
  // ── Load approved business clients from API ───────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('hg_token')
    if (!token) {
      setClients(FALLBACK_CLIENTS)
      setClientsLoaded(true)
      return
    }

    // Fetch approved business users directly from the users endpoint
    fetch(`${API_URL}/users?role=BUSINESS&status=approved`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(async r => {
        if (r.ok) {
          const data: any[] = await r.json()
          return data
        }
        // Fallback: try admin/registrations and filter manually
        const r2 = await fetch(`${API_URL}/admin/registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (r2.ok) {
          const data: any[] = await r2.json()
          // status can be 'approved' directly from DB
          return data.filter((u: any) =>
            u.role?.toUpperCase() === 'BUSINESS' &&
            (u.status === 'approved' || u._rawStatus === 'approved')
          )
        }
        return []
      })
      .then((data: any[]) => {
        const bizClients: ClientEntry[] = data
          .filter((u: any) => u.role?.toUpperCase() === 'BUSINESS')
          .map((u: any) => ({
            id:    u.id,
            name:  u.fullName || u.name,
            email: u.email,
          }))
        // Merge: API registered clients first, then fallback mock clients
        const apiNames = new Set(bizClients.map(c => c.name.toLowerCase()))
        const merged = [
          ...bizClients,
          ...FALLBACK_CLIENTS.filter(f => !apiNames.has(f.name.toLowerCase())),
        ]
        setClients(merged)
        setClientsLoaded(true)
      })
      .catch(() => {
        setClients(FALLBACK_CLIENTS)
        setClientsLoaded(true)
      })
  }, [])

  // ── Load & merge all job sources ──────────────────────────────────────────────
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
  const loadJobs = useCallback(async () => {
    const base = baseJobsToAdminJobs()
    try {
      // Try fetching all jobs — backend may not support status=all, try both
      const res = await fetch(`${API_URL}/jobs`, { headers: authHeader() as any })
      if (res.ok) {
        const data: any[] = await res.json()
        const apiJobs: Job[] = data.map(j => ({
<<<<<<< HEAD
          id: j.id, title: j.title, client: j.client, venue: j.venue,
          date: j.date?.slice(0,10) || '', startTime: j.startTime || '09:00', endTime: j.endTime || '17:00',
          hourlyRate: j.hourlyRate || 0, totalSlots: j.totalSlots || 0, filledSlots: j.filledSlots || 0,
          status: (j.status?.toLowerCase() || 'open') as JobStatus,
          city: j.address?.split(',')[0] || '', category: j.filters?.category || '',
          lat: j.lat, lng: j.lng, source: 'api' as JobSource, applications: j.applications || [],
          termsAndConditions: j.termsAndConditions || '',
        }))
        const apiIds = new Set(apiJobs.map(j => j.id))
        setJobs([...apiJobs, ...base.filter(b => !apiIds.has(b.id))])
      } else { setJobs(base) }
    } catch { setJobs(base) }
=======
          id:          j.id,
          title:       j.title,
          client:      j.client,
          venue:       j.venue,
          date:        j.date?.slice(0,10) || '',
          startTime:   j.startTime || '09:00',
          endTime:     j.endTime   || '17:00',
          hourlyRate:  j.hourlyRate || 0,
          totalSlots:  j.totalSlots || 0,
          filledSlots: j.filledSlots || 0,
          status:      (j.status?.toLowerCase() || 'open') as JobStatus,
          city:        j.address?.split(',')[0] || j.city || '',
          category:    j.filters?.category || '',
          tags:        j.filters?.tags || [],
          lat:         j.lat,
          lng:         j.lng,
          source:      'api' as JobSource,
          applications: j.applications || [],
        }))
        const apiIds = new Set(apiJobs.map(j => j.id))
        const mergedBase = base.filter(b => !apiIds.has(b.id))
        setJobs([...apiJobs, ...mergedBase])
      } else {
        setJobs(base)
      }
    } catch {
      setJobs(base)
    }
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
    setLoading(false)
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

<<<<<<< HEAD
  useEffect(() => {
    const publicJobs = jobs.filter(j => j.status === 'open').map((j, idx) => {
      if (j.source === 'base') {
        const base = ALL_JOBS.find(b => b.id === j.id)
        if (base) return base
      }
      return {
        id: j.id, title: j.title, company: j.client, companyInitial: j.client.charAt(0),
        companyColor: WARM_ACCENTS[idx % WARM_ACCENTS.length],
        location: `${j.venue}, ${j.city}`, type: j.category || 'Brand Activation',
        pay: `R ${j.hourlyRate.toLocaleString('en-ZA')}`, payPer: 'per hour',
        date: j.date ? new Date(j.date).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '',
        jobDate: j.date, approvedAt: new Date().toISOString().slice(0,10),
        slots: j.totalSlots, slotsLeft: j.totalSlots - j.filledSlots,
        duration: `${j.startTime}–${j.endTime}`, tags: [j.category || 'Admin Posted'],
        accentLine: WARM_ACCENTS[idx % WARM_ACCENTS.length],
        gradient: `linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`,
        status: 'open', termsAndConditions: j.termsAndConditions || '',
      }
    })
=======
  // ── Sync open jobs to localStorage so landing page & public board are live ────
  useEffect(() => {
    const publicJobs = jobs
      .filter(j => j.status === 'open')
      .map((j, idx) => {
        if (j.source === 'base') {
          const base = ALL_JOBS.find(b => b.id === j.id)
          if (base) return base
        }
        return {
          id: j.id, title: j.title, company: j.client,
          companyInitial: j.client.charAt(0),
          companyColor: WARM_ACCENTS[idx % WARM_ACCENTS.length],
          location: `${j.venue}, ${j.city}`,
          type: j.category || 'Brand Activation',
          pay: `R ${j.hourlyRate.toLocaleString('en-ZA')}`, payPer: 'per hour',
          date: j.date ? new Date(j.date).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '',
          jobDate: j.date, approvedAt: new Date().toISOString().slice(0,10),
          slots: j.totalSlots, slotsLeft: j.totalSlots - j.filledSlots,
          duration: `${j.startTime}–${j.endTime}`,
          tags: [j.category || 'Admin Posted'],
          accentLine: WARM_ACCENTS[idx % WARM_ACCENTS.length],
          gradient: `linear-gradient(135deg, rgba(232,168,32,0.10) 0%, rgba(196,151,58,0.04) 100%)`,
          status: 'open',
        }
      })
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
    localStorage.setItem('hg_admin_jobs', JSON.stringify(publicJobs))
    window.dispatchEvent(new Event('storage'))
  }, [jobs])

<<<<<<< HEAD
  const save = async () => {
    if (!form.termsAndConditions || form.termsAndConditions.trim().length < 20) {
      setTcError(true); return
    }
    setTcError(false); setSaving(true)
=======
  // ── Save (create / update) ────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState('')

  const save = async () => {
    if (!form.title.trim())  { setSaveError('Job title is required'); return }
    if (!form.client.trim() || form.client === '__other__') { setSaveError('Client is required'); return }
    if (!form.date)          { setSaveError('Start date is required'); return }
    if (!termsAgreed)        { setSaveError('Please confirm compliance with T&Cs before saving'); return }
    setSaveError('')
    setSaving(true)
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
    try {
      // Ensure date is sent as full ISO string — Prisma requires DateTime
      const dateISO = form.date ? new Date(form.date).toISOString() : new Date().toISOString()
      // Build tags array from requirements
      const builtTags: string[] = []
      if (reqGender && reqGender !== 'Any Gender') builtTags.push(reqGender)
      if (reqLanguages) builtTags.push(reqLanguages)
      if (reqMinHeight) builtTags.push(`Min ${reqMinHeight}cm`)
      if (reqMinAge) builtTags.push(`${reqMinAge}+`)
      if (reqExperience && reqExperience !== 'None') builtTags.push(reqExperience)
      if (reqAttire && reqAttire !== 'Smart Casual') builtTags.push(reqAttire)
      if (reqOther) builtTags.push(reqOther)

      const payload = {
<<<<<<< HEAD
        title: form.title, client: form.client, brand: form.client, venue: form.venue,
        address: `${form.venue}, ${form.city}`,
        lat: (form as any).lat ?? cityCoords(form.city)?.[0] ?? -26.2041,
        lng: (form as any).lng ?? cityCoords(form.city)?.[1] ?? 28.0473,
        date: form.date, startTime: form.startTime, endTime: form.endTime,
        hourlyRate: form.hourlyRate, totalSlots: form.totalSlots, filledSlots: form.filledSlots,
        status: form.status.toUpperCase(), filters: { category: form.category || '' },
        termsAndConditions: form.termsAndConditions,
=======
        title:      form.title,
        client:     form.client,
        brand:      form.client,
        venue:      form.venue || form.city,
        address:    `${form.venue || form.city}, ${form.city}`,
        lat:        cityCoords(form.city)?.[0] ?? -26.2041,
        lng:        cityCoords(form.city)?.[1] ?? 28.0473,
        date:       dateISO,
        startTime:  form.startTime,
        endTime:    form.endTime,
        hourlyRate: Number(form.hourlyRate) || 0,
        totalSlots: Number(form.totalSlots) || 1,
        filledSlots: Number(form.filledSlots) || 0,
        status:     form.status.toUpperCase(),
        filters: {
          category:         form.category || '',
          gender:           reqGender,
          languages:        reqLanguages,
          minHeight:        reqMinHeight,
          minAge:           reqMinAge,
          experience:       reqExperience,
          attire:           reqAttire,
          other:            reqOther,
          tags:             builtTags,
          termsAndConditions: termsText,
        },
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
      }
      if (editing && editing.source !== 'base') {
        const res = await fetch(`${API_URL}/jobs/${editing.id}`, { method:'PUT', headers: authHeader() as any, body: JSON.stringify(payload) })
        if (res.ok) {
          await loadJobs(); closeModal()
        } else {
          const err = await res.json().catch(() => ({}))
          setSaveError(err.error || `Update failed (${res.status})`)
        }
      } else if (editing && editing.source === 'base') {
        const stored: any[] = JSON.parse(localStorage.getItem('hg_admin_jobs') || '[]')
        const updated = stored.map((j: any) => j.id === editing.id ? { ...j, ...payload, id: editing.id } : j)
        localStorage.setItem('hg_admin_jobs', JSON.stringify(updated))
        setJobs(prev => prev.map(j => j.id === editing.id ? { ...j, ...form, source:'admin' } : j))
        closeModal()
      } else {
        const res = await fetch(`${API_URL}/jobs`, { method:'POST', headers: authHeader() as any, body: JSON.stringify(payload) })
        if (res.ok) {
          await loadJobs(); closeModal()
        } else {
          const err = await res.json().catch(() => ({}))
          setSaveError(err.error || `Create failed (${res.status}) — check all required fields`)
        }
      }
    } catch (e) {
      console.error('Save job failed', e)
      setSaveError('Network error — is the backend running?')
    }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    const job = jobs.find(j => j.id === id)
<<<<<<< HEAD
    if (job?.source === 'base') { setJobs(prev => prev.filter(j => j.id !== id)) }
    else {
      try { await fetch(`${API_URL}/jobs/${id}`, { method:'DELETE', headers: authHeader() as any }); setJobs(prev => prev.filter(j => j.id !== id)) }
      catch (e) { console.error('Delete failed', e) }
=======
    if (job?.source === 'base') {
      setJobs(prev => prev.filter(j => j.id !== id))
    } else {
      try {
        await fetch(`${API_URL}/jobs/${id}`, { method:'DELETE', headers: authHeader() as any })
        setJobs(prev => prev.filter(j => j.id !== id))
      } catch (e) { console.error('Delete failed', e) }
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
    }
    setDeleting(null)
  }

<<<<<<< HEAD
  const toggleBaseStatus = (job: Job, newStatus: JobStatus) =>
=======
  const toggleBaseStatus = (job: Job, newStatus: JobStatus) => {
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))

  const openPromoterPanel = async (job: Job) => {
    setPromoterJob(job); setModal('promoters'); setPromoLoading(true); setShortlistMsg('')
    try {
      const [usersRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/users?role=PROMOTER&status=approved`, { headers: authHeader() as any }),
        fetch(`${API_URL}/applications/job/${job.id}`, { headers: authHeader() as any }),
      ])
      const users: any[] = usersRes.ok ? await usersRes.json() : []
      const apps: any[] = appsRes.ok ? await appsRes.json() : []
      const appMap = new Map(apps.map((a: any) => [a.promoterId, a]))
      const jobCoords = job.lat && job.lng ? [job.lat, job.lng] as [number,number] : cityCoords(job.city)
      const matched: PromoterMatch[] = users.map((u: any) => {
        const uc = cityCoords(u.city || '')
        return {
          id: u.id, name: u.fullName, email: u.email, city: u.city || '',
          reliabilityScore: u.reliabilityScore || 0, profilePhotoUrl: u.profilePhotoUrl, status: u.status,
          distanceKm: jobCoords && uc ? Math.round(haversineKm(jobCoords[0], jobCoords[1], uc[0], uc[1])) : undefined,
          appStatus: appMap.get(u.id)?.status || null, appId: appMap.get(u.id)?.id,
        }
      }).sort((a, b) => {
        const aA = a.appStatus ? 1 : 0; const bA = b.appStatus ? 1 : 0
        if (bA !== aA) return bA - aA
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm
        return (b.reliabilityScore || 0) - (a.reliabilityScore || 0)
      })
      setMatchedPromos(matched)
    } catch (e) { console.error('Load promoters failed', e) }
    setPromoLoading(false)
  }

  const allocatePromoter = async (promo: PromoterMatch, jobId: string) => {
    try {
      if (promo.appId) await fetch(`${API_URL}/applications/${promo.appId}/status`, { method:'PUT', headers: authHeader() as any, body: JSON.stringify({ status:'ALLOCATED' }) })
      else await fetch(`${API_URL}/applications`, { method:'POST', headers: authHeader() as any, body: JSON.stringify({ jobId, promoterId: promo.id }) })
      if (promoterJob) await openPromoterPanel({ ...promoterJob, id: jobId })
      await loadJobs()
    } catch (e) { console.error('Allocate failed', e) }
  }

  const markSlotOpen = async (job: Job) => {
    try {
      const appsRes = await fetch(`${API_URL}/applications/job/${job.id}`, { headers: authHeader() as any })
      const apps: any[] = appsRes.ok ? await appsRes.json() : []
      const standby = apps.filter((a: any) => a.status === 'STANDBY').slice(0, 3)
      if (standby.length === 0) { setShortlistMsg('No shortlisted promoters to notify.'); return }
      setNotifications(prev => [...prev, ...standby.map((app: any) => ({
        jobId: job.id, promoterId: app.promoterId, promoterName: app.promoter?.fullName || 'Promoter',
        notifiedAt: new Date().toISOString(), message: 'Shortlisted — slot available', type: 'shortlisted' as const,
      }))])
      setShortlistMsg(`✓ ${standby.length} shortlisted promoter${standby.length>1?'s':''} notified.`)
      await fetch(`${API_URL}/jobs/${job.id}`, { method:'PUT', headers: authHeader() as any, body: JSON.stringify({ status:'OPEN', filledSlots: Math.max(0, job.filledSlots-1) }) })
      await loadJobs()
    } catch (e) { console.error('Notify shortlist failed', e) }
  }

  const notifyNotNeeded = async (job: Job) => {
    const appsRes = await fetch(`${API_URL}/applications/job/${job.id}`, { headers: authHeader() as any })
    const apps: any[] = appsRes.ok ? await appsRes.json() : []
    const standby = apps.filter((a: any) => a.status === 'STANDBY').slice(0, 3)
    setNotifications(prev => [...prev, ...standby.map((app: any) => ({
      jobId: job.id, promoterId: app.promoterId, promoterName: app.promoter?.fullName || 'Promoter',
      notifiedAt: new Date().toISOString(), message: 'Not needed for shift', type: 'not_needed' as const,
    }))])
    setShortlistMsg(`✓ ${standby.length} promoter${standby.length>1?'s':''} notified they are not needed.`)
  }

  const openCreate = () => { setForm(EMPTY_JOB); setEditing(null); setModal('create'); setTcError(false) }
  const openEdit = (job: Job) => { setForm({ ...EMPTY_JOB, ...job }); setEditing(job); setModal('edit'); setTcError(false) }
  const closeModal = () => { setModal(null); setEditing(null); setPromoterJob(null); setTcError(false) }
  const F = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

<<<<<<< HEAD
=======
  const openCreate = () => {
    setForm(EMPTY_JOB); setEditing(null); setSaveError(''); resetRequirements(); setModal('create')
  }
  const openEdit = (job: Job) => {
    setForm({ ...job }); setEditing(job); setSaveError('')
    // Restore requirements from stored filters
    const f = (job as any).filters || {}
    setReqGender(f.gender || 'Any Gender')
    setReqLanguages(f.languages || '')
    setReqMinHeight(f.minHeight || '')
    setReqMinAge(f.minAge || '')
    setReqExperience(f.experience || 'None')
    setReqAttire(f.attire || 'Smart Casual')
    setReqOther(f.other || '')
    setTermsText(f.termsAndConditions || '')
    setTermsAgreed(false)
    setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditing(null); setPromoterJob(null); setSaveError('') }
  const F = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }))

  // ── Filtered view ─────────────────────────────────────────────────────────────
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
  const filtered = jobs.filter(j => {
    const sm = statusFilter === 'all' || j.status === statusFilter
    const om = sourceFilter === 'all' || j.source === sourceFilter
    const qm = !search || [j.title, j.client, j.city, j.venue].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return sm && om && qm
  })

  const counts = {
    all: jobs.length, open: jobs.filter(j=>j.status==='open').length,
    filled: jobs.filter(j=>j.status==='filled').length, completed: jobs.filter(j=>j.status==='completed').length,
    cancelled: jobs.filter(j=>j.status==='cancelled').length,
    base: jobs.filter(j=>j.source==='base').length, api: jobs.filter(j=>j.source==='api').length,
  }

<<<<<<< HEAD
  const inp: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:13, color:W, outline:'none', borderRadius:3 }
  const lbl: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }
  const registeredClients = ['Red Bull SA','AB InBev','Nike SA','Vodacom','Nedbank','Distell','SABMiller SA','Castle Lager SA','Standard Bank SA','MTN SA','Heineken SA','Woolworths SA','Tiger Brands','Coca-Cola SA','KFC South Africa','Old Mutual SA','Shoprite Holdings','Pick n Pay SA']
=======
  const inputStyle: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 16px', fontFamily:FD, fontSize:13, color:W, outline:'none', borderRadius:3 }
  const labelStyle: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Jobs</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Manage Jobs</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>
              <strong style={{ color:W }}>{jobs.length}</strong> total · <span style={{ color:GL }}>{counts.open} open</span> · <span style={{ color:W28 }}>{counts.base} base · {counts.api} live API</span>
            </p>
          </div>
          <Btn onClick={openCreate}>+ New Job</Btn>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:BB, marginBottom:24 }}>
          {[
            { label:'Total Jobs', value:counts.all, color:GL }, { label:'Open', value:counts.open, color:GL },
            { label:'Filled', value:counts.filled, color:G3 }, { label:'Completed', value:counts.completed, color:G },
            { label:'Cancelled', value:counts.cancelled, color:G2 },
          ].map((s,i) => (
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
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ display:'flex', gap:4 }}>
              {(['all','base','api'] as const).map(s=>(
                <FilterBtn key={s} label={s==='all'?'All Sources':s==='base'?`Base (${counts.base})`:`API (${counts.api})`} active={sourceFilter===s} color={G3} onClick={()=>setSourceFilter(s)} />
              ))}
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:W28, fontSize:12, pointerEvents:'none' }}>⌕</span>
              <input placeholder="Search jobs…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 14px 7px 30px', color:W, fontFamily:FD, fontSize:11, outline:'none', borderRadius:3, width:200 }}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
          </div>
        </div>

        {/* NOTIFICATION LOG */}
        {notifications.length > 0 && (
          <div style={{ background:hex2rgba(GL,0.06), border:`1px solid ${BB}`, borderRadius:4, padding:'14px 20px', marginBottom:20 }}>
            <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD, marginBottom:10 }}>Recent Notifications</div>
            {notifications.slice(-5).reverse().map((n,i)=>(
              <div key={i} style={{ fontSize:11, color:W55, fontFamily:FD, display:'flex', gap:12, marginBottom:4 }}>
                <span style={{ color:n.type==='shortlisted'?GL:G2, fontWeight:700 }}>{n.type==='shortlisted'?'⏳ Shortlisted':'✗ Not Needed'}</span>
                <span>{n.promoterName}</span>
                <span style={{ color:W28 }}>{new Date(n.notifiedAt).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        )}

        {/* TABLE — click row to expand actions */}
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:W55, fontFamily:FD }}>Loading jobs…</div>
        ) : (
          <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
              <colgroup>
<<<<<<< HEAD
                <col style={{ width:'6%' }} /><col style={{ width:'24%' }} /><col style={{ width:'13%' }} />
                <col style={{ width:'13%' }} /><col style={{ width:'9%' }} /><col style={{ width:'8%' }} />
                <col style={{ width:'7%' }} /><col style={{ width:'9%' }} /><col style={{ width:'6%' }} />
                <col style={{ width:'5%' }} />
=======
                <col style={{ width:'6%'  }} />
                <col style={{ width:'20%' }} />
                <col style={{ width:'11%' }} />
                <col style={{ width:'12%' }} />
                <col style={{ width:'8%'  }} />
                <col style={{ width:'7%'  }} />
                <col style={{ width:'6%'  }} />
                <col style={{ width:'7%'  }} />
                <col style={{ width:'5%'  }} />
                <col style={{ width:'18%' }} />
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
              </colgroup>
              <thead>
                <tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
                  {['ID','Title / Category','Client','Location','Date','Pay','Slots','Status','Source',''].map((h,i)=>(
                    <th key={i} style={{ padding:'13px 16px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W55, fontFamily:FD, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i) => {
                  const isBase = job.source === 'base'
                  const DIM = 'rgba(250,243,232,0.60)'
                  const isExpanded = expandedRow === job.id
                  return (
<<<<<<< HEAD
                    <React.Fragment key={job.id}>
                      <tr
                        style={{ borderBottom: isExpanded ? 'none' : `1px solid ${BB}`, transition:'background 0.15s', background:isExpanded?hex2rgba(GL,0.05):isBase?hex2rgba(GL,0.01):'transparent', cursor:'pointer' }}
                        onClick={()=>setExpandedRow(isExpanded ? null : job.id)}
                        onMouseEnter={e=>{ if(!isExpanded) e.currentTarget.style.background=BB2 }}
                        onMouseLeave={e=>{ if(!isExpanded) e.currentTarget.style.background=isBase?hex2rgba(GL,0.01):'transparent' }}>
                        <td style={{ padding:'16px 16px', fontSize:10, color:DIM, fontFamily:MONO, verticalAlign:'top', paddingTop:18 }}>{job.id}</td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top' }}>
                          <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD, lineHeight:1.3, marginBottom:3 }}>{job.title}</div>
                          {job.category && <div style={{ fontSize:10, color:DIM, fontFamily:FD, marginBottom:4 }}>{job.category}</div>}
                          {job.tags && job.tags.slice(0,2).map((t,ti)=>(
                            <span key={ti} style={{ fontSize:9, color:'rgba(250,243,232,0.70)', background:'rgba(250,243,232,0.07)', border:`1px solid rgba(212,136,10,0.30)`, padding:'2px 7px', borderRadius:2, fontFamily:FD, marginRight:4 }}>{t}</span>
                          ))}
                        </td>
                        <td style={{ padding:'16px 16px', fontSize:12, color:'rgba(250,243,232,0.80)', fontFamily:FD, verticalAlign:'top', paddingTop:18 }}>{job.client}</td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                          <div style={{ fontSize:12, color:W, fontFamily:FD, fontWeight:600 }}>{job.city || job.location?.split(',').slice(-1)[0]?.trim()}</div>
                          <div style={{ fontSize:11, color:DIM, fontFamily:FD, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.venue}</div>
                        </td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                          <div style={{ fontSize:12, color:'rgba(250,243,232,0.80)', fontFamily:FD, fontWeight:600 }}>
                            {job.jobDate || job.date ? new Date(job.jobDate||job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}
                          </div>
                          <div style={{ fontSize:10, color:DIM, fontFamily:FD, marginTop:3 }}>{isBase && job.duration ? job.duration : `${job.startTime}–${job.endTime}`}</div>
                        </td>
                        <td style={{ padding:'16px 16px', fontSize:14, color:GL, fontWeight:700, fontFamily:FD, verticalAlign:'top', paddingTop:18, whiteSpace:'nowrap' }}>
                          {isBase ? job.pay : `R${job.hourlyRate}/hr`}
                        </td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                          <div style={{ fontSize:13, color:W, fontFamily:FD, fontWeight:600 }}>{job.filledSlots}/{job.totalSlots}</div>
                          <div style={{ marginTop:6, height:3, background:'rgba(212,136,10,0.22)', borderRadius:2, width:44 }}>
                            <div style={{ height:'100%', borderRadius:2, background:STATUS_COLOR[job.status], width:`${job.totalSlots>0?(job.filledSlots/job.totalSlots)*100:0}%`, transition:'width 0.3s' }} />
                          </div>
                        </td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}><StatusBadge status={job.status} /></td>
                        <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}><SourceBadge source={job.source} /></td>
                        <td style={{ padding:'16px 16px', verticalAlign:'middle', textAlign:'center' }}>
                          <span style={{ color:isExpanded?GL:W28, fontSize:13, transition:'transform 0.2s', display:'inline-block', transform:isExpanded?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
                        </td>
                      </tr>

                      {/* ── EXPANDED ACTIONS ── */}
                      {isExpanded && (
                        <tr style={{ background:hex2rgba(GL,0.03), borderBottom:`1px solid ${BB}` }}>
                          <td colSpan={10} style={{ padding:'0 20px 20px 20px' }}>
                            <div style={{ paddingTop:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', borderTop:`1px solid ${BB}` }}>
                              <button onClick={e=>{e.stopPropagation();openEdit(job)}}
                                style={{ fontSize:11, color:GL, background:hex2rgba(GL,0.12), border:`1px solid ${hex2rgba(GL,0.4)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'8px 20px', borderRadius:3, transition:'all 0.15s', letterSpacing:'0.06em' }}
                                onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(GL,0.22)} onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(GL,0.12)}>
                                ✎ Edit Job
                              </button>
                              <button onClick={e=>{e.stopPropagation();openPromoterPanel(job)}}
                                style={{ fontSize:11, color:G4, background:hex2rgba(G4,0.12), border:`1px solid ${hex2rgba(G4,0.4)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'8px 20px', borderRadius:3, transition:'all 0.15s', letterSpacing:'0.06em' }}
                                onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(G4,0.22)} onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(G4,0.12)}>
                                👥 Manage Staff
                              </button>
                              {isBase && job.status==='open' && (
                                <button onClick={e=>{e.stopPropagation();toggleBaseStatus(job,'cancelled')}}
                                  style={{ fontSize:11, color:W55, background:'rgba(250,243,232,0.06)', border:`1px solid rgba(250,243,232,0.20)`, cursor:'pointer', fontFamily:FD, padding:'8px 20px', borderRadius:3, transition:'all 0.15s' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(250,243,232,0.12)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(250,243,232,0.06)'}>
                                  Cancel Job
                                </button>
                              )}
                              {isBase && job.status==='cancelled' && (
                                <button onClick={e=>{e.stopPropagation();toggleBaseStatus(job,'open')}}
                                  style={{ fontSize:11, color:GL, background:hex2rgba(GL,0.12), border:`1px solid ${hex2rgba(GL,0.4)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'8px 20px', borderRadius:3, transition:'all 0.15s' }}
                                  onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(GL,0.22)} onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(GL,0.12)}>
                                  Reopen Job
                                </button>
                              )}
                              {job.status==='filled' && !isBase && (
                                <button onClick={e=>{e.stopPropagation();markSlotOpen(job)}}
                                  style={{ fontSize:11, color:G4, background:hex2rgba(G4,0.12), border:`1px solid ${hex2rgba(G4,0.4)}`, cursor:'pointer', fontFamily:FD, padding:'8px 20px', borderRadius:3, transition:'all 0.15s' }}
                                  onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(G4,0.22)} onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(G4,0.12)}>
                                  + Open Slot
                                </button>
                              )}
                              <div style={{ width:1, height:28, background:BB, margin:'0 4px' }} />
                              <button onClick={e=>{e.stopPropagation();setDeleting(job.id)}}
                                style={{ fontSize:11, color:'rgba(232,180,140,0.85)', background:'rgba(139,90,26,0.10)', border:`1px solid rgba(139,90,26,0.35)`, cursor:'pointer', fontFamily:FD, padding:'8px 20px', borderRadius:3, transition:'all 0.15s' }}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(139,90,26,0.22)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(139,90,26,0.10)'}>
                                {isBase ? 'Hide' : 'Delete'}
                              </button>
                              {job.termsAndConditions ? (
                                <span style={{ marginLeft:'auto', fontSize:10, color:GL, fontFamily:FD, display:'flex', alignItems:'center', gap:5 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:GL, display:'inline-block' }} /> T&amp;C attached
                                </span>
                              ) : (
                                <span style={{ marginLeft:'auto', fontSize:10, color:G2, fontFamily:FD, display:'flex', alignItems:'center', gap:5 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:G2, display:'inline-block' }} /> No T&amp;C — click Edit to add
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
=======
                    <tr key={job.id}
                      style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.15s', background:isBase?hex2rgba(GL,0.01):'transparent' }}
                      onMouseEnter={e=>e.currentTarget.style.background=BB2}
                      onMouseLeave={e=>e.currentTarget.style.background=isBase?hex2rgba(GL,0.01):'transparent'}>
                      <td style={{ padding:'16px 16px', fontSize:10, color:DIM, fontFamily:MONO, verticalAlign:'top', paddingTop:18 }}>{job.id}</td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD, lineHeight:1.3, marginBottom:3 }}>{job.title}</div>
                        {job.category && <div style={{ fontSize:10, color:DIM, fontFamily:FD, marginBottom:5 }}>{job.category}</div>}
                        {(() => {
                          const displayTags = job.tags && job.tags.length > 0
                            ? job.tags
                            : (job as any).filters?.tags || []
                          return displayTags.length > 0 ? (
                            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                              {displayTags.slice(0,4).map((t: string, ti: number) => (
                                <span key={ti} style={{ fontSize:9, color:GL, background:hex2rgba(GL,0.08), border:`1px solid ${hex2rgba(GL,0.25)}`, padding:'2px 7px', borderRadius:2, fontFamily:FD }}>{t}</span>
                              ))}
                            </div>
                          ) : null
                        })()}
                      </td>
                      <td style={{ padding:'16px 16px', fontSize:12, color:'rgba(250,243,232,0.80)', fontFamily:FD, verticalAlign:'top', paddingTop:18 }}>{job.client}</td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                        <div style={{ fontSize:12, color:W, fontFamily:FD, fontWeight:600 }}>{job.city || job.location?.split(',').slice(-1)[0]?.trim()}</div>
                        <div style={{ fontSize:11, color:DIM, fontFamily:FD, marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{job.venue}</div>
                      </td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                        <div style={{ fontSize:12, color:'rgba(250,243,232,0.80)', fontFamily:FD, fontWeight:600 }}>
                          {job.jobDate || job.date ? new Date(job.jobDate||job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}
                        </div>
                        <div style={{ fontSize:10, color:DIM, fontFamily:FD, marginTop:3 }}>
                          {isBase && job.duration ? job.duration : `${job.startTime}–${job.endTime}`}
                        </div>
                      </td>
                      <td style={{ padding:'16px 16px', fontSize:14, color:GL, fontWeight:700, fontFamily:FD, verticalAlign:'top', paddingTop:18, whiteSpace:'nowrap' }}>
                        {isBase ? job.pay : `R${job.hourlyRate}/hr`}
                      </td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}>
                        <div style={{ fontSize:13, color:W, fontFamily:FD, fontWeight:600 }}>{job.filledSlots}/{job.totalSlots}</div>
                        <div style={{ marginTop:6, height:3, background:'rgba(212,136,10,0.22)', borderRadius:2, width:44 }}>
                          <div style={{ height:'100%', borderRadius:2, background:STATUS_COLOR[job.status], width:`${job.totalSlots>0?(job.filledSlots/job.totalSlots)*100:0}%`, transition:'width 0.3s' }} />
                        </div>
                      </td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}><StatusBadge status={job.status} /></td>
                      <td style={{ padding:'16px 16px', verticalAlign:'top', paddingTop:18 }}><SourceBadge source={job.source} /></td>
                      <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          <button onClick={()=>openEdit(job)}
                            style={{ fontSize:10, color:GL, background:hex2rgba(GL,0.10), border:`1px solid ${hex2rgba(GL,0.35)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(GL,0.20)}
                            onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(GL,0.10)}>
                            Edit
                          </button>
                          <button onClick={()=>openPromoterPanel(job)}
                            style={{ fontSize:10, color:G4, background:hex2rgba(G4,0.10), border:`1px solid ${hex2rgba(G4,0.35)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(G4,0.20)}
                            onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(G4,0.10)}>
                            Staff
                          </button>
                          {isBase && job.status==='open' && (
                            <button onClick={()=>toggleBaseStatus(job,'cancelled')}
                              style={{ fontSize:10, color:'rgba(250,243,232,0.60)', background:'rgba(250,243,232,0.05)', border:`1px solid rgba(250,243,232,0.18)`, cursor:'pointer', fontFamily:FD, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(250,243,232,0.10)'}
                              onMouseLeave={e=>e.currentTarget.style.background='rgba(250,243,232,0.05)'}>
                              Cancel
                            </button>
                          )}
                          {isBase && job.status==='cancelled' && (
                            <button onClick={()=>toggleBaseStatus(job,'open')}
                              style={{ fontSize:10, color:GL, background:hex2rgba(GL,0.10), border:`1px solid ${hex2rgba(GL,0.35)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(GL,0.20)}
                              onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(GL,0.10)}>
                              Reopen
                            </button>
                          )}
                          {job.status==='filled' && !isBase && (
                            <button onClick={()=>markSlotOpen(job)}
                              style={{ fontSize:10, color:G4, background:hex2rgba(G4,0.10), border:`1px solid ${hex2rgba(G4,0.35)}`, cursor:'pointer', fontFamily:FD, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.background=hex2rgba(G4,0.20)}
                              onMouseLeave={e=>e.currentTarget.style.background=hex2rgba(G4,0.10)}>
                              +Slot
                            </button>
                          )}
                          <button onClick={()=>setDeleting(job.id)}
                            style={{ fontSize:10, color:'rgba(232,180,140,0.85)', background:'rgba(139,90,26,0.12)', border:`1px solid rgba(139,90,26,0.40)`, cursor:'pointer', fontFamily:FD, padding:'5px 12px', borderRadius:3, whiteSpace:'nowrap' as const, transition:'all 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(139,90,26,0.25)'}
                            onMouseLeave={e=>e.currentTarget.style.background='rgba(139,90,26,0.12)'}>
                            {isBase ? 'Hide' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
                  )
                })}
              </tbody>
            </table>
            {filtered.length===0 && (
              <div style={{ padding:40, textAlign:'center', color:W55, fontSize:13, fontFamily:FD }}>No jobs match your filters.</div>
            )}
          </div>
        )}

        <div style={{ marginTop:12, fontSize:11, color:W28, fontFamily:FD }}>
          Showing <strong style={{ color:W55 }}>{filtered.length}</strong> of <strong style={{ color:W55 }}>{jobs.length}</strong> jobs · <span style={{ color:W28 }}>Click any row to expand actions</span>
        </div>

        {/* DELETE CONFIRM */}
        {deleting && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}
            onClick={e=>e.target===e.currentTarget&&setDeleting(null)}>
            <div style={{ background:D2, border:`1px solid ${hex2rgba(G2,0.7)}`, padding:'36px 40px', maxWidth:380, width:'100%', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:G2, borderRadius:'4px 4px 0 0' }} />
              <h3 style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:12 }}>{jobs.find(j=>j.id===deleting)?.source==='base' ? 'Hide Job?' : 'Delete Job?'}</h3>
              <p style={{ fontSize:13, color:W55, marginBottom:28, lineHeight:1.7, fontFamily:FD }}>
                {jobs.find(j=>j.id===deleting)?.source==='base' ? 'This base job will be hidden from this session.' : 'This job will be permanently removed from the platform.'}
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setDeleting(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:12, cursor:'pointer', borderRadius:3 }}>Cancel</button>
                <button onClick={()=>handleDelete(deleting)} style={{ flex:1, padding:'12px', background:hex2rgba(G2,0.25), border:`1px solid ${G2}`, color:'#E8D5A8', fontFamily:FD, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODAL */}
        {(modal==='create'||modal==='edit') && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, padding:'40px', width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${GL},${G5})`, borderRadius:'4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
              <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontFamily:FD, fontWeight:700 }}>{modal==='create'?'New Job':editing?.source==='base'?'Customise Base Job':'Edit Job'}</div>
              <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:16 }}>{modal==='create'?'Create a New Job':editing?.title}</h2>
              {editing?.source==='base' && (
                <div style={{ padding:'10px 14px', background:hex2rgba(GL,0.06), border:`1px solid ${hex2rgba(GL,0.22)}`, marginBottom:20, fontSize:12, color:GL, fontFamily:FD, borderRadius:3 }}>
                  ℹ️ Editing a base job creates an admin override saved to local storage.
                </div>
              )}
<<<<<<< HEAD
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div><label style={lbl}>Job Title</label><input type="text" value={form.title} onChange={e=>F('title',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                <div><label style={lbl}>Client</label>
                  <select value={form.client} onChange={e=>F('client',e.target.value)} style={{ ...inp, background:D3, cursor:'pointer' }}>
=======

              <div style={{ display:'flex', flexDirection:'column', gap:18, marginTop:16 }}>
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input type="text" value={form.title} onChange={e=>F('title',e.target.value)} style={inputStyle}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>

                {/* ── CLIENT DROPDOWN — API-driven ── */}
                <div>
                  <label style={labelStyle}>
                    Client
                    {!clientsLoaded && <span style={{ color:W28, fontWeight:400, marginLeft:8, fontSize:9 }}>Loading…</span>}
                    {clientsLoaded && clients.filter(c=>c.email).length > 0 && (
                      <span style={{ color:GL, fontWeight:400, marginLeft:8, fontSize:9 }}>
                        ● {clients.filter(c=>c.email).length} registered
                      </span>
                    )}
                  </label>
                  <select value={form.client} onChange={e=>F('client',e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
                    <option value="">— Select client —</option>
                    {/* Registered (API) clients shown first with a marker */}
                    {clients.filter(c => c.email).length > 0 && (
                      <optgroup label="── Registered Clients ──">
                        {clients.filter(c => c.email).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {/* Fallback / additional clients */}
                    <optgroup label="── Other Clients ──">
                      {clients.filter(c => !c.email).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <option value="__other__">Other (type below)</option>
                  </select>
                  {/* Allow typing a custom client name if Other is selected */}
                  {form.client === '__other__' && (
                    <input
                      type="text"
                      placeholder="Enter client name…"
                      style={{ ...inputStyle, marginTop:8 }}
                      onChange={e => F('client', e.target.value)}
                      onFocus={e=>e.currentTarget.style.borderColor=GL}
                      onBlur={e=>e.currentTarget.style.borderColor=BB}
                    />
                  )}
                </div>
<<<<<<< HEAD
                <div><label style={lbl}>Category</label>
                  <select value={form.category||''} onChange={e=>F('category',e.target.value)} style={{ ...inp, background:D3, cursor:'pointer' }}>
=======

                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={form.category||''} onChange={e=>F('category',e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
                    <option value="">— Select —</option>
                    {CATEGORY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
<<<<<<< HEAD
                  <div><label style={lbl}>Venue</label><input type="text" value={form.venue} onChange={e=>F('venue',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                  <div><label style={lbl}>City</label><input type="text" value={form.city} onChange={e=>F('city',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
=======
                  <div>
                    <label style={labelStyle}>Venue</label>
                    <input type="text" value={form.venue} onChange={e=>F('venue',e.target.value)} style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={form.city} onChange={e=>F('city',e.target.value)} style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Start Date *</label>
                    <input type="date" value={form.date} onChange={e=>F('date',e.target.value)} style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input type="date" value={form.startDate||''} min={form.date||''} onChange={e=>F('startDate',e.target.value)} style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
                </div>
                <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e=>F('date',e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[{label:'Start Time',key:'startTime',type:'time'},{label:'End Time',key:'endTime',type:'time'},{label:'Hourly Rate (R)',key:'hourlyRate',type:'number'},{label:'Total Slots',key:'totalSlots',type:'number'}].map(({label,key,type})=>(
                    <div key={key}><label style={lbl}>{label}</label><input type={type} value={(form as any)[key]} onChange={e=>F(key,type==='number'?+e.target.value:e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                  ))}
                </div>
                <div><label style={lbl}>Status</label>
                  <select value={form.status} onChange={e=>F('status',e.target.value)} style={{ ...inp, background:D3, cursor:'pointer' }}>
                    {(['open','filled','completed','cancelled'] as JobStatus[]).map(s=>(<option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>))}
                  </select>
                </div>
                {modal==='edit' && (
                  <div><label style={lbl}>Filled Slots</label><input type="number" min={0} max={form.totalSlots} value={form.filledSlots} onChange={e=>F('filledSlots',+e.target.value)} style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} /></div>
                )}

<<<<<<< HEAD
                {/* ── TERMS & CONDITIONS — REQUIRED ── */}
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:7 }}>
                    <label style={{ ...lbl, margin:0 }}>Terms &amp; Conditions</label>
                    <span style={{ fontSize:9, color:'#E07A5F', fontFamily:FD, fontWeight:700, letterSpacing:'0.1em' }}>REQUIRED</span>
                  </div>
                  <div style={{ fontSize:11, color:W28, fontFamily:FD, marginBottom:10, lineHeight:1.6 }}>
                    Promoters must read and accept these T&amp;Cs before applying. Include conduct, attire, punctuality, alcohol policies, and any legal requirements.
                  </div>
                  <textarea
                    value={form.termsAndConditions || ''}
                    onChange={e=>{ F('termsAndConditions', e.target.value); if(e.target.value.trim().length>=20) setTcError(false) }}
                    placeholder="e.g. Promoter must arrive 15 minutes before shift start. Smart casual dress code applies. No alcohol consumption during shift. Punctuality is mandatory — 2 no-shows result in account suspension. All promotional materials must be handled with care and returned intact..."
                    rows={6}
                    style={{ ...inp, resize:'vertical', lineHeight:1.7, borderColor: tcError ? '#E07A5F' : BB }}
                    onFocus={e=>e.currentTarget.style.borderColor=tcError?'#E07A5F':GL}
                    onBlur={e=>e.currentTarget.style.borderColor=tcError?'#E07A5F':BB}
                  />
                  {tcError && (
                    <div style={{ marginTop:8, fontSize:11, color:'#E07A5F', fontFamily:FD, display:'flex', alignItems:'center', gap:6 }}>
                      ⚠ Terms &amp; Conditions are required (minimum 20 characters). Promoters must accept these before applying.
                    </div>
                  )}
                  {!tcError && form.termsAndConditions && form.termsAndConditions.trim().length >= 20 && (
                    <div style={{ marginTop:6, fontSize:11, color:GL, fontFamily:FD }}>✓ {form.termsAndConditions.trim().length} characters — promoters will be shown this before applying</div>
                  )}
                </div>

=======
                {/* ── PROMOTER REQUIREMENTS ── */}
                <div style={{ marginTop:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ flex:1, height:1, background:BB }} />
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontFamily:FD, whiteSpace:'nowrap' }}>Promoter Requirements</span>
                    <div style={{ flex:1, height:1, background:BB }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div>
                      <label style={labelStyle}>Gender Preference</label>
                      <select value={reqGender} onChange={e=>setReqGender(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
                        {['Any Gender','Female','Male','Non-binary Inclusive'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Languages Required</label>
                      <input type="text" value={reqLanguages} onChange={e=>setReqLanguages(e.target.value)} placeholder="e.g. English, Zulu" style={inputStyle}
                        onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    </div>
                    <div>
                      <label style={labelStyle}>Minimum Height (cm)</label>
                      <input type="number" value={reqMinHeight} onChange={e=>setReqMinHeight(e.target.value)} placeholder="e.g. 165" style={inputStyle}
                        onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    </div>
                    <div>
                      <label style={labelStyle}>Minimum Age</label>
                      <input type="number" value={reqMinAge} onChange={e=>setReqMinAge(e.target.value)} placeholder="e.g. 21" style={inputStyle}
                        onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                    </div>
                    <div>
                      <label style={labelStyle}>Experience Required</label>
                      <select value={reqExperience} onChange={e=>setReqExperience(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
                        {['None','6 months+','1 year+','2+ years','3+ years'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Attire / Uniform</label>
                      <select value={reqAttire} onChange={e=>setReqAttire(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
                        {['Smart Casual','Formal','Brand Uniform Provided','All Black','Brand Specific'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop:14 }}>
                    <label style={labelStyle}>Additional Requirements</label>
                    <input type="text" value={reqOther} onChange={e=>setReqOther(e.target.value)} placeholder="e.g. Own transport, Food handling cert" style={inputStyle}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  {/* Preview tags */}
                  {[reqGender !== 'Any Gender' && reqGender, reqLanguages, reqMinHeight && `Min ${reqMinHeight}cm`, reqMinAge && `${reqMinAge}+`, reqExperience !== 'None' && reqExperience, reqAttire !== 'Smart Casual' && reqAttire, reqOther].filter(Boolean).length > 0 && (
                    <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
                      {[reqGender !== 'Any Gender' && reqGender, reqLanguages, reqMinHeight && `Min ${reqMinHeight}cm`, reqMinAge && `${reqMinAge}+`, reqExperience !== 'None' && reqExperience, reqAttire !== 'Smart Casual' && reqAttire, reqOther].filter(Boolean).map((tag,i)=>(
                        <span key={i} style={{ fontSize:10, color:GL, background:hex2rgba(GL,0.1), border:`1px solid ${hex2rgba(GL,0.3)}`, padding:'3px 10px', borderRadius:3, fontFamily:FD }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── TERMS & CONDITIONS ── */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ flex:1, height:1, background:BB }} />
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontFamily:FD, whiteSpace:'nowrap' }}>Terms & Conditions</span>
                    <div style={{ flex:1, height:1, background:BB }} />
                  </div>
                  <div style={{ padding:'12px 16px', background:hex2rgba(GL,0.04), border:`1px solid ${BB}`, borderRadius:3, marginBottom:14 }}>
                    <p style={{ fontSize:11, color:W55, lineHeight:1.7, fontFamily:FD }}>
                      Standard Honey Group T&Cs apply to all promoters. You may add campaign-specific terms below.
                    </p>
                  </div>
                  <label style={labelStyle}>Campaign-Specific Terms (Optional)</label>
                  <textarea value={termsText} onChange={e=>setTermsText(e.target.value)} rows={4}
                    placeholder="Enter any additional terms specific to this job, e.g. promoter must not consume product during shift, promoter is liable for equipment…"
                    style={{ ...inputStyle, resize:'vertical' as const, lineHeight:1.6 }}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB}
                  />
                  <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginTop:12, padding:'12px 14px', background:BB2, border:`1px solid ${BB}`, borderRadius:3 }}>
                    <input type="checkbox" checked={termsAgreed} onChange={e=>setTermsAgreed(e.target.checked)}
                      style={{ marginTop:2, accentColor:GL, width:15, height:15, flexShrink:0, cursor:'pointer' }} />
                    <span style={{ fontSize:12, color:W55, lineHeight:1.6, fontFamily:FD }}>
                      I confirm this job complies with Honey Group platform standards and all applicable South African labour regulations.
                    </span>
                  </label>
                </div>

                {saveError && (
                  <div style={{ padding:'10px 14px', background:'rgba(139,90,26,0.2)', border:'1px solid rgba(139,90,26,0.6)', borderRadius:3, fontSize:12, color:'#E8C090', fontFamily:FD }}>
                    ⚠ {saveError}
                  </div>
                )}
>>>>>>> 63baf9ead37b6d5dbca76f29b3ceb65da30be77d
                <Btn onClick={save} disabled={saving}>{saving?'Saving…':modal==='create'?'Create Job':'Save Changes'}</Btn>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTERS PANEL */}
        {modal==='promoters' && promoterJob && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
            onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div style={{ background:D2, border:`1px solid ${BB}`, width:'100%', maxWidth:760, maxHeight:'90vh', display:'flex', flexDirection:'column', position:'relative', borderRadius:4 }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G4},${GL})`, borderRadius:'4px 4px 0 0' }} />
              <div style={{ padding:'28px 32px 20px', borderBottom:`1px solid ${BB}` }}>
                <button onClick={closeModal} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
                <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:G4, fontWeight:700, fontFamily:FD, marginBottom:6 }}>Job · Promoters</div>
                <h2 style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W }}>{promoterJob.title}</h2>
                <div style={{ display:'flex', gap:20, marginTop:8, fontSize:12, color:W55, fontFamily:FD }}>
                  <span>📍 {promoterJob.venue}, {promoterJob.city}</span>
                  <span>📅 {promoterJob.jobDate||promoterJob.date ? new Date(promoterJob.jobDate||promoterJob.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}</span>
                  <span>👥 {promoterJob.filledSlots}/{promoterJob.totalSlots} filled</span>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
                  {promoterJob.status==='filled' && (
                    <button onClick={()=>markSlotOpen(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G4,0.15), border:`1px solid ${G4}`, color:G4, fontFamily:FD, fontSize:10, fontWeight:700, cursor:'pointer', borderRadius:3 }}>⚡ Open Spot — Notify Shortlist</button>
                  )}
                  {(promoterJob.status==='filled'||promoterJob.status==='open') && (
                    <button onClick={()=>notifyNotNeeded(promoterJob)} style={{ padding:'7px 16px', background:hex2rgba(G2,0.15), border:`1px solid ${G2}`, color:'#C89A70', fontFamily:FD, fontSize:10, fontWeight:700, cursor:'pointer', borderRadius:3 }}>✗ Not Needed — Notify Shortlist</button>
                  )}
                  {shortlistMsg && <span style={{ fontSize:11, color:GL, fontFamily:FD }}>{shortlistMsg}</span>}
                </div>
              </div>
              <div style={{ padding:'12px 32px', background:D1, borderBottom:`1px solid ${BB}`, display:'flex', gap:20, fontSize:10, color:W55, fontFamily:FD }}>
                <span><span style={{ color:GL }}>●</span> Allocated</span>
                <span><span style={{ color:G4 }}>●</span> Shortlisted</span>
                <span><span style={{ color:W28 }}>●</span> Not Applied</span>
                <span style={{ marginLeft:'auto', color:W28 }}>Sorted by proximity then reliability</span>
              </div>
              <div style={{ overflowY:'auto', flex:1 }}>
                {promoLoading ? (
                  <div style={{ padding:60, textAlign:'center', color:W28, fontFamily:FD }}>Loading promoters…</div>
                ) : matchedPromos.length===0 ? (
                  <div style={{ padding:60, textAlign:'center', color:W28, fontFamily:FD }}>No approved promoters found.</div>
                ) : matchedPromos.map((p,i)=>{
                  const isAllocated = p.appStatus==='ALLOCATED'
                  const isStandby = p.appStatus==='STANDBY'
                  const accentColor = isAllocated?GL:isStandby?G4:W28
                  return (
                    <div key={p.id} style={{ padding:'16px 32px', borderBottom:i<matchedPromos.length-1?`1px solid ${BB}`:'none', display:'flex', alignItems:'center', gap:16, background:isAllocated?hex2rgba(GL,0.04):isStandby?hex2rgba(G4,0.03):'transparent' }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:BB, border:`2px solid ${accentColor}`, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:accentColor, fontWeight:700, fontFamily:FD }}>
                        {p.profilePhotoUrl ? <img src={p.profilePhotoUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : p.name.charAt(0)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{p.name}</div>
                        <div style={{ fontSize:11, color:W55, fontFamily:FD, marginTop:2 }}>{p.city}{p.distanceKm!==undefined&&<span style={{ color:W28, marginLeft:8 }}>~{p.distanceKm}km</span>}</div>
                        <div style={{ fontSize:10, color:W28, fontFamily:FD, marginTop:2 }}>⭐ {p.reliabilityScore?p.reliabilityScore.toFixed(1):'—'} reliability</div>
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {isAllocated&&<span style={{ fontSize:9, fontWeight:700, color:GL, background:hex2rgba(GL,0.12), border:`1px solid ${hex2rgba(GL,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Allocated</span>}
                        {isStandby&&<span style={{ fontSize:9, fontWeight:700, color:G4, background:hex2rgba(G4,0.12), border:`1px solid ${hex2rgba(G4,0.4)}`, padding:'3px 9px', borderRadius:3, fontFamily:FD }}>Shortlisted</span>}
                        {!p.appStatus&&<span style={{ fontSize:9, color:W28, fontFamily:FD }}>Not applied</span>}
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {!isAllocated && promoterJob.filledSlots<promoterJob.totalSlots && (
                          <Btn small onClick={()=>allocatePromoter(p,promoterJob.id)} color={GL}>Allocate</Btn>
                        )}
                        {isAllocated&&<span style={{ fontSize:10, color:W28, fontFamily:FD }}>✓ On this job</span>}
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