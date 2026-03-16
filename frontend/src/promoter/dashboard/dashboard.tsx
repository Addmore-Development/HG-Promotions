import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLK  = '#050402'
const BLK1 = '#0A0804'
const BLK2 = '#100C05'
const GL   = '#E8A820'
const GD   = '#C07818'
const GD2  = '#8B5A1A'
const BB   = 'rgba(212,136,10,0.16)'
const W    = '#FAF3E8'
const W7   = 'rgba(250,243,232,0.70)'
const W4   = 'rgba(250,243,232,0.40)'
const TEAL = '#4AABB8'
const FD   = "'Playfair Display', Georgia, serif"
const FB   = "'DM Sans', system-ui, sans-serif"

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHdr() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : {}
}

function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

// ─── SA city keywords — used to extract city name from a full address ─────────
// "27 Kotze Street, Hillbrow, Johannesburg, 2000" → extracts "johannesburg"
// "Sandton City, Johannesburg" → extracts "johannesburg"
const SA_CITIES = [
  'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth',
  'bloemfontein', 'east london', 'nelspruit', 'polokwane', 'kimberley',
  'pietermaritzburg', 'rustenburg', 'george', 'upington', 'vanderbijlpark',
  'soweto', 'sandton', 'randburg', 'roodepoort', 'benoni', 'boksburg',
  'germiston', 'springs', 'midrand', 'centurion', 'tshwane', 'ekurhuleni',
  'stellenbosch', 'paarl', 'worcester', 'bellville', 'mitchells plain',
  'khayelitsha', 'tygervalley', 'hillbrow', 'braamfontein', 'rosebank',
  'fourways', 'randpark ridge', 'alexandra', 'soweto', 'lenasia',
]

// Extract meaningful city tokens from a stored city value that may be a full address
function extractCityTokens(cityValue: string): string[] {
  if (!cityValue) return []
  const lower = cityValue.toLowerCase()

  // First check if it matches a known SA city directly
  const knownMatch = SA_CITIES.find(c => lower.includes(c))
  if (knownMatch) return [knownMatch]

  // Otherwise split by comma and use each part as a token
  return cityValue
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 2 && !/^\d+$/.test(s)) // skip pure numbers like postcodes
}

// Check if a job's location matches the promoter's city value
function jobMatchesPromoterCity(job: any, promoterCityRaw: string): boolean {
  if (!promoterCityRaw) return false

  const tokens = extractCityTokens(promoterCityRaw)
  if (tokens.length === 0) return false

  const jobText = [
    job.address || '',
    job.venue   || '',
    job.city    || '',
  ].join(' ').toLowerCase()

  return tokens.some(token => jobText.includes(token))
}

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const navigate = useNavigate()

  const [profile,  setProfile]  = useState<any>(null)
  const [myApps,   setMyApps]   = useState<any[]>([])
  const [allJobs,  setAllJobs]  = useState<any[]>([])
  const [myShifts, setMyShifts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [time,     setTime]     = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    try {
      const [meRes, appsRes, jobsRes, shiftsRes] = await Promise.all([
        fetch(`${API}/auth/me`,         { headers: authHdr() as any }),
        fetch(`${API}/applications/my`, { headers: authHdr() as any }),
        fetch(`${API}/jobs`,            { headers: authHdr() as any }),
        fetch(`${API}/shifts/my`,       { headers: authHdr() as any }),
      ])
      if (meRes.ok)     setProfile(await meRes.json())
      if (appsRes.ok)   setMyApps(await appsRes.json())
      if (jobsRes.ok)   setAllJobs(await jobsRes.json())
      if (shiftsRes.ok) setMyShifts(await shiftsRes.json())
    } catch (e) {
      console.error('[Dashboard] load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const h = time.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (profile?.fullName || '').split(' ')[0] || 'Promoter'

  const allocatedApps = myApps.filter(a =>
    a.status === 'ALLOCATED' || a.status === 'allocated'
  )
  const pendingApps = myApps.filter(a =>
    a.status === 'STANDBY'  || a.status === 'standby'  ||
    a.status === 'PENDING'  || a.status === 'pending'
  )

  const jobForApp = (app: any) => allJobs.find(j => j.id === app.jobId || j.id === app.job?.id)

  // Upcoming confirmed job
  const upcomingJob = allocatedApps
    .map(a => ({ app: a, job: a.job || jobForApp(a) }))
    .filter(({ job }) => job && new Date(job.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.job.date).getTime() - new Date(b.job.date).getTime())[0]

  // Today's active shift
  const todayShift = myShifts.find(s => {
    const job = allJobs.find(j => j.id === s.jobId)
    if (!job) return false
    return (
      new Date(job.date).toDateString() === new Date().toDateString() &&
      (s.status === 'SCHEDULED' || s.status === 'CHECKED_IN')
    )
  })

  const promoterCityRaw = profile?.city || ''

  // Get a display-friendly city name
  const cityDisplayName = (() => {
    if (!promoterCityRaw) return ''
    const tokens = extractCityTokens(promoterCityRaw)
    if (tokens.length === 0) return promoterCityRaw
    // Capitalise first token
    return tokens[0].replace(/\b\w/g, c => c.toUpperCase())
  })()

  // ALL jobs in the promoter's city/area that they haven't applied to
  const appliedJobIds = new Set(myApps.map(a => a.jobId || a.job?.id))
  const nearbyJobs = allJobs.filter(j => {
    if (appliedJobIds.has(j.id)) return false
    if (!['OPEN', 'open'].includes(j.status)) return false
    return jobMatchesPromoterCity(j, promoterCityRaw)
  }).slice(0, 3)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
      <div style={{ width: 22, height: 22, border: `2px solid ${GL}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 14, color: W4, fontFamily: FB }}>Loading your dashboard…</span>
    </div>
  )

  const nav = (tab: string) => onNavigate ? onNavigate(tab) : navigate(`/promoter/?tab=${tab}`)

  return (
    <div style={{ padding: '32px 48px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Promoter Dashboard</div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W, lineHeight: 1.1 }}>
              {greeting},<br /><span style={{ color: GL }}>{firstName}</span>
            </h1>
            <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
              {allocatedApps.length > 0
                ? `You have ${allocatedApps.length} confirmed job${allocatedApps.length > 1 ? 's' : ''}`
                : nearbyJobs.length > 0
                ? `${nearbyJobs.length} job${nearbyJobs.length > 1 ? 's' : ''} available in ${cityDisplayName || 'your area'}`
                : 'Welcome back to your Honey Group portal'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FD, fontSize: 24, color: GL }}>
                {time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 11, color: W4, marginTop: 4, fontFamily: FB }}>
                {time.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            <button
              onClick={() => window.open('/', '_blank')}
              style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${hex2rgba(GL, 0.35)}`, color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = hex2rgba(GL, 0.1)}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              ⊹ Browse Site
            </button>
          </div>
        </div>
      </div>

      {/* Today's shift alert */}
      {todayShift && (() => {
        const todayJob = allJobs.find(j => j.id === todayShift.jobId)
        return todayJob ? (
          <div style={{ padding: '14px 20px', background: hex2rgba(TEAL, 0.1), border: `1px solid ${hex2rgba(TEAL, 0.4)}`, borderRadius: 3, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, fontFamily: FD }}>
                {todayShift.status === 'CHECKED_IN' ? '🟢 You are currently on shift' : '⏰ You have a shift today'}
              </div>
              <div style={{ fontSize: 11, color: W4, marginTop: 3, fontFamily: FB }}>
                {todayJob.title} — tap to {todayShift.status === 'CHECKED_IN' ? 'check out' : 'check in'}
              </div>
            </div>
            <button onClick={() => nav('shifts')}
              style={{ padding: '10px 18px', background: TEAL, border: 'none', color: '#0C0A07', fontFamily: FD, fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {todayShift.status === 'CHECKED_IN' ? 'Check Out →' : 'Check In →'}
            </button>
          </div>
        ) : null
      })()}

      {/* Account pending warning */}
      {profile && profile.status !== 'approved' && profile.status !== 'blacklisted' && (
        <div style={{ padding: '14px 18px', background: hex2rgba(GD2, 0.2), border: `1px solid ${hex2rgba(GD, 0.4)}`, borderRadius: 3, marginBottom: 24, fontSize: 13, color: GL, fontFamily: FB, lineHeight: 1.6 }}>
          ⏳ Your account is <strong>pending admin approval</strong>. You can browse jobs but cannot apply until approved.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 28 }}>
        {[
          { label: 'Confirmed Jobs',   value: allocatedApps.length,                                              color: GL,   tab: 'jobs'    },
          { label: 'Pending Interest', value: pendingApps.length,                                                color: GD,   tab: 'jobs'    },
          { label: 'Shifts Done',      value: myShifts.filter(s => s.status === 'APPROVED').length,              color: TEAL, tab: 'shifts'  },
          { label: 'Reliability',      value: profile?.reliabilityScore ? `${profile.reliabilityScore}/5` : '—', color: GL,   tab: 'profile' },
        ].map((s, i) => (
          <div key={i} onClick={() => nav(s.tab)}
            style={{ background: BLK2, padding: '20px 22px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BLK1}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = BLK2}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, ${hex2rgba(s.color, 0.3)})` }} />
            <div style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: W4, marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FD }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: BB, marginBottom: 24 }}>

        {/* Next Confirmed Job */}
        <div style={{ background: BLK2, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: W }}>Next Confirmed Job</h2>
            <button onClick={() => nav('jobs')}
              style={{ background: 'none', border: 'none', color: GL, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>
              View All →
            </button>
          </div>

          {upcomingJob ? (
            <div>
              <div style={{ padding: 18, background: hex2rgba(GL, 0.06), border: `1px solid ${hex2rgba(GL, 0.2)}`, borderRadius: 3, marginBottom: 16 }}>
                <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 6 }}>
                  {upcomingJob.job.title}
                </div>
                <div style={{ fontSize: 12, color: W4, fontFamily: FB, marginBottom: 12 }}>
                  {upcomingJob.job.client}
                </div>
                {[
                  { icon: '📍', text: upcomingJob.job.venue || upcomingJob.job.address?.split(',')[0] },
                  { icon: '📅', text: fmtDate(upcomingJob.job.date) },
                  { icon: '🕐', text: `${upcomingJob.job.startTime} – ${upcomingJob.job.endTime}` },
                  { icon: '💰', text: `R${upcomingJob.job.hourlyRate}/hr` },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, width: 20, textAlign: 'center' }}>{r.icon}</span>
                    <span style={{ fontSize: 13, color: W7, fontFamily: FB }}>{r.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => nav('shifts')}
                style={{ width: '100%', padding: '11px', background: `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: BLK, fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3 }}>
                View Shift & Check In →
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 13, color: W4, fontFamily: FB, marginBottom: 16 }}>No upcoming confirmed jobs yet</p>
              <button onClick={() => nav('jobs')}
                style={{ padding: '10px 20px', background: hex2rgba(GL, 0.12), border: `1px solid ${hex2rgba(GL, 0.35)}`, color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 3 }}>
                Browse Jobs
              </button>
            </div>
          )}
        </div>

        {/* Jobs in Your Area */}
        <div style={{ background: BLK2, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: W }}>
              ⚡ Jobs in {cityDisplayName || 'Your Area'}
            </h2>
            <button onClick={() => nav('jobs')}
              style={{ background: 'none', border: 'none', color: GL, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}>
              See All →
            </button>
          </div>

          {!promoterCityRaw ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
              <p style={{ fontSize: 13, color: W4, fontFamily: FB, marginBottom: 12 }}>
                Set your city in your profile to see local jobs
              </p>
              <button onClick={() => nav('profile')}
                style={{ padding: '10px 20px', background: hex2rgba(GL, 0.12), border: `1px solid ${hex2rgba(GL, 0.35)}`, color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 3 }}>
                Update Profile →
              </button>
            </div>
          ) : nearbyJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 13, color: W4, fontFamily: FB }}>
                No open jobs in {cityDisplayName} right now
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nearbyJobs.map(job => (
                <div key={job.id} onClick={() => nav('jobs')}
                  style={{ padding: '14px 16px', background: hex2rgba(GL, 0.06), border: `1px solid ${hex2rgba(GL, 0.18)}`, borderRadius: 3, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, transition: 'all 0.18s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hex2rgba(GL, 0.4); (e.currentTarget as HTMLElement).style.background = hex2rgba(GL, 0.1) }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = hex2rgba(GL, 0.18); (e.currentTarget as HTMLElement).style.background = hex2rgba(GL, 0.06) }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: W, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>
                      {job.address?.split(',')[0] || job.venue} · {fmtDate(job.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: GL }}>
                      R{job.hourlyRate}<span style={{ fontSize: 10, color: W4, fontWeight: 400 }}>/hr</span>
                    </div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>
                      {job.totalSlots - job.filledSlots} slot{job.totalSlots - job.filledSlots !== 1 ? 's' : ''} left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Confirmed Jobs */}
      {allocatedApps.length > 0 && (
        <div style={{ background: BLK2, padding: 28, border: `1px solid ${BB}`, borderRadius: 3 }}>
          <h2 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: W, marginBottom: 20 }}>My Confirmed Jobs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {allocatedApps.slice(0, 5).map((app, i) => {
              const job = app.job || jobForApp(app)
              if (!job) return null
              return (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < Math.min(allocatedApps.length, 5) - 1 ? `1px solid ${BB}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 3, background: hex2rgba(GL, 0.12), border: `1px solid ${BB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: W, marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>
                      {job.client} · {fmtDate(job.date)} · {job.startTime}–{job.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: GL, fontFamily: FD, fontWeight: 700 }}>R{job.hourlyRate}/hr</div>
                    <div style={{ fontSize: 9, color: TEAL, fontFamily: FD, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confirmed</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard