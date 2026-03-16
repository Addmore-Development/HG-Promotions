import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Strict Gold & Black Palette ──────────────────────────────────────────────
const BLK   = '#050402'
const BLK1  = '#0A0804'
const BLK2  = '#100C05'
const BLK3  = '#181206'
const BLK4  = '#201808'
const GOLD  = '#D4880A'
const GL    = '#E8A820'
const GL2   = '#F0C050'
const GD    = '#C07818'
const GD2   = '#8B5A1A'
const GD3   = '#6B3F10'
const GREEN = '#4ade80'
const BB    = 'rgba(212,136,10,0.16)'
const BB2   = 'rgba(212,136,10,0.08)'
const W     = '#FAF3E8'
const W7    = 'rgba(250,243,232,0.70)'
const W4    = 'rgba(250,243,232,0.40)'
const W2    = 'rgba(250,243,232,0.20)'
const FD    = "'Playfair Display', Georgia, serif"
const FB    = "'DM Sans', system-ui, sans-serif"

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHdr() {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}
function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

interface TrackJob {
  id: string; title: string; client: string; venue: string
  address: string; date: string; startTime: string; endTime: string
  hourlyRate: number; totalSlots: number; filledSlots: number; status: string
}

interface TrackPromoter {
  promoterId:  string
  fullName:    string
  email:       string
  city?:       string
  profilePhotoUrl?: string
  headshotUrl?: string
  checkStatus: 'checked-in' | 'scheduled' | 'completed' | 'absent'
  checkInTime?: string
  checkOutTime?: string
  totalHours?: number
  liveEarning?: number
  hourlyRate:  number
}

// ─── Live Timer ───────────────────────────────────────────────────────────────
function LiveTimer({ checkIn }: { checkIn: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(checkIn).getTime()) / 1000)
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [checkIn])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = Math.floor(elapsed % 60)
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ─── Promoter Live Card ───────────────────────────────────────────────────────
function PromoterCard({ p }: { p: TrackPromoter }) {
  const isLive      = p.checkStatus === 'checked-in'
  const isCompleted = p.checkStatus === 'completed'
  const statusColor = isLive ? GREEN : isCompleted ? GD : p.checkStatus === 'scheduled' ? GL : W4
  const liveEarning = isLive && p.checkInTime
    ? (Date.now() - new Date(p.checkInTime).getTime()) / 3600000 * p.hourlyRate
    : 0

  return (
    <div style={{
      background: BLK2, border: `1px solid ${isLive ? hex2rgba(GREEN, 0.25) : BB}`,
      position: 'relative', overflow: 'hidden', borderRadius: 3,
      boxShadow: isLive ? `0 0 20px ${hex2rgba(GREEN, 0.06)}` : 'none',
    }}>
      <div style={{ height: 2, background: statusColor }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Photo */}
            <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${hex2rgba(statusColor, 0.5)}` }}>
              {p.headshotUrl || p.profilePhotoUrl ? (
                <img src={p.headshotUrl || p.profilePhotoUrl} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: hex2rgba(GL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: GL, fontFamily: FD }}>
                  {p.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 2 }}>{p.fullName}</div>
              <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>{p.city || p.email}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {isLive ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: GREEN, fontFamily: FD, letterSpacing: '0.16em' }}>ON SHIFT</span>
                </div>
                {p.checkInTime && <LiveTimer checkIn={p.checkInTime} />}
              </>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: hex2rgba(statusColor, 0.1), border: `1px solid ${hex2rgba(statusColor, 0.4)}`, padding: '3px 10px', borderRadius: 2, fontFamily: FD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {p.checkStatus === 'scheduled' ? 'Scheduled' : p.checkStatus === 'completed' ? 'Completed' : 'Absent'}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${BB}` }}>
          {[
            { label: 'Check In',  value: p.checkInTime ? new Date(p.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—' },
            { label: 'Hours',     value: p.totalHours ? `${p.totalHours.toFixed(1)}h` : isLive && p.checkInTime ? `${((Date.now() - new Date(p.checkInTime).getTime()) / 3600000).toFixed(1)}h` : '—' },
            { label: isLive ? 'Live Earning' : 'Payout', value: isLive ? `R${liveEarning.toFixed(0)}` : p.totalHours ? `R${(p.totalHours * p.hourlyRate).toFixed(0)}` : '—', accent: GL },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '10px 12px', borderRight: i < 2 ? `1px solid ${BB}` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: W2, fontFamily: FB, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 700, color: s.accent || W }}>{s.value}</div>
            </div>
          ))}
        </div>

        {isLive && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: hex2rgba(GREEN, 0.04), border: `1px solid ${hex2rgba(GREEN, 0.15)}`, fontSize: 11, color: W4, fontFamily: FB }}>
            View-only · Promoters check in and out from their own app
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function BusinessTracking() {
  const [jobs,        setJobs]        = useState<TrackJob[]>([])
  const [promoters,   setPromoters]   = useState<TrackPromoter[]>([])
  const [selectedJob, setSelectedJob] = useState<string>('')
  const [loading,     setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [, forceUpdate] = useState(0)

  const loadData = useCallback(async () => {
    try {
      // Load jobs for this business
      const jobsRes = await fetch(`${API}/jobs?status=all`, { headers: authHdr() as any })
      if (jobsRes.ok) {
        const data: TrackJob[] = await jobsRes.json()
        const openJobs = data.filter(j => ['OPEN', 'FILLED', 'IN_PROGRESS'].includes(j.status))
        setJobs(openJobs)
        if (!selectedJob && openJobs.length > 0) setSelectedJob(openJobs[0].id)
      }
    } catch (e) { console.error('Load jobs failed', e) }
    setLoading(false)
    setLastRefresh(new Date())
  }, [selectedJob])

  const loadPromoters = useCallback(async (jobId: string) => {
    if (!jobId) return
    try {
      const job = jobs.find(j => j.id === jobId)
      const [appRes, shiftRes] = await Promise.all([
        fetch(`${API}/applications/job/${jobId}`, { headers: authHdr() as any }),
        fetch(`${API}/shifts/all`, { headers: authHdr() as any }),
      ])
      const apps:   any[] = appRes.ok   ? await appRes.json()   : []
      const shifts: any[] = shiftRes.ok ? await shiftRes.json() : []

      // Map shifts by promoter for this job
      const shiftMap = new Map<string, any>()
      shifts
        .filter((s: any) => s.jobId === jobId)
        .forEach((s: any) => shiftMap.set(s.promoterId, s))

      const promos: TrackPromoter[] = apps
        .filter((a: any) => a.status === 'ALLOCATED')
        .map((a: any) => {
          const shift = shiftMap.get(a.promoterId)
          const u = a.promoter || {}
          let checkStatus: TrackPromoter['checkStatus'] = 'scheduled'
          if (shift) {
            const st = shift.status?.toLowerCase()
            if (st === 'checked_in' || st === 'checked-in') checkStatus = 'checked-in'
            else if (st === 'approved' || st === 'pending_approval' || st === 'checked_out') checkStatus = 'completed'
          }
          return {
            promoterId:      a.promoterId,
            fullName:        u.fullName || 'Unknown',
            email:           u.email   || '',
            city:            u.city,
            profilePhotoUrl: u.profilePhotoUrl,
            headshotUrl:     u.headshotUrl,
            checkStatus,
            checkInTime:  shift?.checkInTime  || undefined,
            checkOutTime: shift?.checkOutTime || undefined,
            totalHours:   shift?.totalHours   || undefined,
            hourlyRate:   job?.hourlyRate      || 0,
          }
        })

      setPromoters(promos)
    } catch (e) { console.error('Load promoters failed', e) }
  }, [jobs])

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (selectedJob) loadPromoters(selectedJob)
  }, [selectedJob, loadPromoters])
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
      if (selectedJob) loadPromoters(selectedJob)
      forceUpdate(n => n + 1)
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedJob, loadData, loadPromoters])

  const currentJob  = jobs.find(j => j.id === selectedJob)
  const liveCount   = promoters.filter(p => p.checkStatus === 'checked-in').length
  const doneCount   = promoters.filter(p => p.checkStatus === 'completed').length
  const pendingCount = promoters.filter(p => p.checkStatus === 'scheduled').length

  const liveEarningTotal = promoters
    .filter(p => p.checkStatus === 'checked-in' && p.checkInTime)
    .reduce((acc, p) => acc + (Date.now() - new Date(p.checkInTime!).getTime()) / 3600000 * p.hourlyRate, 0)

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Operations · Live</div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W }}>Live Tracking</h1>
            <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>Monitor promoters on your active campaigns in real-time.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {liveCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: hex2rgba(GREEN, 0.08), border: `1px solid ${hex2rgba(GREEN, 0.25)}`, padding: '7px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: GREEN }}>{liveCount} on shift</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GL }} />
              <span style={{ fontSize: 10, color: W4, fontFamily: FB }}>Updated {lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>Loading…</div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: `1px dashed ${BB}` }}>
          <p style={{ fontFamily: FD, fontSize: 20, color: W4, marginBottom: 8 }}>No active jobs</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>Active jobs with allocated promoters will appear here for live tracking.</p>
        </div>
      ) : (
        <>
          {/* Job selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            {jobs.map(job => {
              const live = 0 // will be updated from promoters
              const active = selectedJob === job.id
              return (
                <button key={job.id} onClick={() => setSelectedJob(job.id)}
                  style={{ padding: '9px 18px', background: active ? hex2rgba(GL, 0.12) : BLK2, border: `1px solid ${active ? hex2rgba(GL, 0.45) : BB}`, fontFamily: FD, fontSize: 11, fontWeight: active ? 700 : 400, letterSpacing: '0.04em', color: active ? GL : W4, cursor: 'pointer', transition: 'all 0.2s', borderRadius: 2 }}>
                  {job.title}
                </button>
              )
            })}
          </div>

          {currentJob && (
            <>
              {/* Summary bar */}
              <div className="biz-page" style={{ background: BLK2, border: `1px solid ${BB}`, padding: '16px 22px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between', borderRadius: 3 }}>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 17, fontWeight: 700, color: W, marginBottom: 4 }}>{currentJob.title}</div>
                  <div style={{ fontSize: 12, color: W4, fontFamily: FB }}>📍 {currentJob.venue || currentJob.address} · R{currentJob.hourlyRate}/hr</div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  {[
                    { label: 'On Shift',  value: liveCount,    color: GREEN },
                    { label: 'Pending',   value: pendingCount, color: GL },
                    { label: 'Completed', value: doneCount,    color: GD },
                    { label: 'Live Cost', value: `R${liveEarningTotal.toFixed(0)}`, color: GL },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: W2, fontFamily: FB, marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promoters grid */}
              {promoters.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', border: `1px dashed ${BB}` }}>
                  <p style={{ fontFamily: FD, fontSize: 18, color: W4, marginBottom: 8 }}>No promoters allocated</p>
                  <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>Go to Jobs to select promoters for this campaign.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {promoters.map(p => <PromoterCard key={p.promoterId} p={p} />)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}