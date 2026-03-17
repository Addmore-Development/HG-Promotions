import { useState, useEffect, useCallback, useRef } from 'react'

const BLK   = '#050402'
const BLK1  = '#0A0804'
const BLK2  = '#100C05'
const BLK3  = '#181206'
const GL    = '#E8A820'
const GD    = '#C07818'
const GD2   = '#8B5A1A'
const GD3   = '#6B3F10'
const BB    = 'rgba(212,136,10,0.16)'
const BB2   = 'rgba(212,136,10,0.08)'
const W     = '#FAF3E8'
const W7    = 'rgba(250,243,232,0.70)'
const W4    = 'rgba(250,243,232,0.40)'
const W2    = 'rgba(250,243,232,0.20)'
const FD    = "'Playfair Display', Georgia, serif"
const FB    = "'DM Sans', system-ui, sans-serif"
const GREEN = '#4ade80'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHdr(): Record<string, string> {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function hex2rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

interface LivePromoter {
  userId:           string
  lat:              number
  lng:              number
  timestamp:        number
  shiftId?:         string
  jobId?:           string
  jobTitle?:        string
  venue?:           string
  promoterName?:    string
  promoterPhoto?:   string
  checkInTime?:     string
  hourlyRate?:      number
  hoursWorked?:     number
  currentEarnings?: number
}

// ── Live timer ────────────────────────────────────────────────────────────────
function LiveTimer({ checkInTime }: { checkInTime: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(checkInTime).getTime()) / 1000)
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [checkInTime])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = Math.floor(elapsed % 60)
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: GREEN }}>
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ── Promoter card ─────────────────────────────────────────────────────────────
function PromoterCard({ p, isSelected, onClick }: {
  p:          LivePromoter
  isSelected: boolean
  onClick:    () => void
}) {
  const lastSeen = Math.round((Date.now() - p.timestamp) / 1000)
  const isStale  = lastSeen > 120

  return (
    <div
      onClick={onClick}
      style={{
        padding:    '16px 20px',
        background: isSelected ? hex2rgba(GL, 0.06) : BLK2,
        border:     `1px solid ${isSelected ? hex2rgba(GL, 0.4) : BB}`,
        borderRadius: 3,
        cursor:     'pointer',
        transition: 'all 0.2s',
        position:   'relative',
        overflow:   'hidden',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = hex2rgba(GL, 0.3)
          e.currentTarget.style.background  = BLK3
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = BB
          e.currentTarget.style.background  = BLK2
        }
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position:   'absolute',
        top: 0, left: 0, right: 0,
        height:     2,
        background: isStale ? hex2rgba(GL, 0.3) : GREEN,
      }} />

      {/* Avatar + name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${isStale ? BB : GREEN}`,
          }}>
            {p.promoterPhoto
              ? <img
                  src={p.promoterPhoto}
                  alt={p.promoterName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                />
              : <div style={{
                  width: '100%', height: '100%',
                  background: hex2rgba(GL, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: GL, fontFamily: FD,
                }}>
                  {(p.promoterName || '?').charAt(0)}
                </div>
            }
          </div>
          {/* Live indicator dot */}
          <div style={{
            position:   'absolute',
            bottom: 0, right: 0,
            width: 10, height: 10,
            borderRadius: '50%',
            background:  isStale ? GD2 : GREEN,
            border:      `2px solid ${BLK2}`,
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 2 }}>
            {p.promoterName || 'Unknown'}
          </div>
          <div style={{
            fontSize: 11, color: W4, fontFamily: FB,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.jobTitle || '—'}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {!isStale && p.checkInTime
            ? <LiveTimer checkInTime={p.checkInTime} />
            : <span style={{ fontSize: 10, color: W4, fontFamily: FB }}>
                {lastSeen < 60 ? `${lastSeen}s ago` : `${Math.floor(lastSeen / 60)}m ago`}
              </span>
          }
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Location', value: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` },
          { label: 'Hours',    value: p.hoursWorked    ? `${p.hoursWorked.toFixed(1)}h` : '—' },
          { label: 'Earnings', value: p.currentEarnings ? `R${p.currentEarnings}`       : '—', accent: GL },
        ].map(s => (
          <div key={s.label} style={{ background: BB2, padding: '8px 10px', borderRadius: 2 }}>
            <div style={{ fontSize: 8, color: W2, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.accent || W, fontFamily: FD }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {p.venue && (
        <div style={{ marginTop: 8, fontSize: 10, color: W4, fontFamily: FB }}>
          📍 {p.venue}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BusinessTracking() {
  const [livePromoters, setLivePromoters] = useState<LivePromoter[]>([])
  const [jobs,          setJobs]          = useState<any[]>([])
  const [selectedJob,   setSelectedJob]   = useState<string>('all')
  const [selectedPromo, setSelectedPromo] = useState<LivePromoter | null>(null)
  const [lastRefresh,   setLastRefresh]   = useState(new Date())
  const [loading,       setLoading]       = useState(true)
  const [, forceUpdate]                   = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [locRes, jobsRes] = await Promise.all([
        fetch(`${API}/shifts/live-locations`, { headers: authHdr() as any }),
        fetch(`${API}/jobs`,                  { headers: authHdr() as any }),
      ])
      if (locRes.ok) {
        const locs: LivePromoter[] = await locRes.json()
        setLivePromoters(locs)
      }
      if (jobsRes.ok) {
        const jj: any[] = await jobsRes.json()
        setJobs(jj.filter((j: any) => ['OPEN','FILLED','IN_PROGRESS'].includes(j.status)))
      }
    } catch (e) {
      console.error('[BusinessTracking] load error:', e)
    }
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => {
      loadData()
      forceUpdate(n => n + 1)
    }, 15_000)
    return () => clearInterval(interval)
  }, [loadData])

  const filteredPromoters = livePromoters.filter(p =>
    selectedJob === 'all' || p.jobId === selectedJob
  )

  const totalEarningsLive = filteredPromoters.reduce((sum, p) => sum + (p.currentEarnings || 0), 0)

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase' as const, color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>
              Operations · Live
            </div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W }}>
              Live Tracking
            </h1>
            <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
              Real-time location of promoters on your active campaigns. Updates every 30 seconds.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {livePromoters.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: hex2rgba(GREEN, 0.08),
                border:     `1px solid ${hex2rgba(GREEN, 0.25)}`,
                padding:    '7px 14px', borderRadius: 3,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: GREEN }}>
                  {filteredPromoters.length} live on shift
                </span>
              </div>
            )}
            <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>
              Updated {lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button
              onClick={loadData}
              style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${BB}`, color: W4, fontFamily: FB, fontSize: 10, cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = GL; e.currentTarget.style.borderColor = GL }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = W4; e.currentTarget.style.borderColor = BB }}
            >
              ↻ Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, marginBottom: 24 }}>
        {[
          { label: 'Promoters On Shift', value: filteredPromoters.length,                                         color: GREEN },
          { label: 'Live Cost So Far',   value: `R${totalEarningsLive}`,                                          color: GL    },
          { label: 'Active Jobs',        value: new Set(livePromoters.map(p => p.jobId)).size,                    color: GD    },
        ].map((s, i) => (
          <div key={i} className="biz-page" style={{ background: BLK2, padding: '20px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, ${hex2rgba(s.color, 0.3)})` }} />
            <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: W4, marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontFamily: FD }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Job filter tabs */}
      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
          <button
            onClick={() => setSelectedJob('all')}
            style={{ padding: '6px 14px', border: `1px solid ${selectedJob === 'all' ? GL : BB}`, background: selectedJob === 'all' ? hex2rgba(GL, 0.12) : 'transparent', color: selectedJob === 'all' ? GL : W4, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s' }}
          >
            All Jobs
          </button>
          {jobs.map(job => {
            const count = livePromoters.filter(p => p.jobId === job.id).length
            return (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                style={{ padding: '6px 14px', border: `1px solid ${selectedJob === job.id ? GL : BB}`, background: selectedJob === job.id ? hex2rgba(GL, 0.12) : 'transparent', color: selectedJob === job.id ? GL : W4, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s' }}
              >
                {job.title}
                {count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 9, color: GREEN }}>● {count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Promoter cards */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>Loading…</div>
      ) : filteredPromoters.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: `1px dashed ${BB}`, borderRadius: 3 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📍</div>
          <p style={{ fontFamily: FD, fontSize: 20, color: W4, marginBottom: 8 }}>No promoters on shift right now</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>
            When a promoter checks in, their live location will appear here and update every 30 seconds.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[...filteredPromoters]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(p => (
              <PromoterCard
                key={p.userId}
                p={p}
                isSelected={selectedPromo?.userId === p.userId}
                onClick={() => setSelectedPromo(prev => prev?.userId === p.userId ? null : p)}
              />
            ))
          }
        </div>
      )}

      {/* Selected promoter detail panel */}
      {selectedPromo && (
        <div style={{ marginTop: 20, padding: 24, background: BLK2, border: `1px solid ${hex2rgba(GL, 0.3)}`, borderRadius: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD }}>
              Location Detail — {selectedPromo.promoterName}
            </div>
            <button
              onClick={() => setSelectedPromo(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {[
              { label: 'Latitude',      value: selectedPromo.lat.toFixed(6) },
              { label: 'Longitude',     value: selectedPromo.lng.toFixed(6) },
              { label: 'Job',           value: selectedPromo.jobTitle || '—' },
              { label: 'Venue',         value: selectedPromo.venue    || '—' },
              { label: 'Check-in Time', value: selectedPromo.checkInTime ? new Date(selectedPromo.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—' },
              { label: 'Hours Worked',  value: selectedPromo.hoursWorked    ? `${selectedPromo.hoursWorked.toFixed(2)}h`   : '—' },
              { label: 'Rate',          value: selectedPromo.hourlyRate      ? `R${selectedPromo.hourlyRate}/hr`            : '—' },
              { label: 'Earned So Far', value: selectedPromo.currentEarnings ? `R${selectedPromo.currentEarnings}`         : '—', accent: GL },
              { label: 'Last Ping',     value: `${Math.round((Date.now() - selectedPromo.timestamp) / 1000)}s ago` },
            ].map(r => (
              <div key={r.label} style={{ background: BB2, border: `1px solid ${BB}`, padding: '10px 12px', borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: W4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4, fontFamily: FB }}>{r.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: (r as any).accent || W, fontFamily: FD }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Google Maps link — properly typed anchor element */}
          <div style={{ marginTop: 14 }}>
            
              href={`https://www.google.com/maps?q=${selectedPromo.lat},${selectedPromo.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            8,
                padding:        '9px 18px',
                background:     hex2rgba(GL, 0.08),
                border:         `1px solid ${hex2rgba(GL, 0.3)}`,
                borderRadius:   3,
                color:          GL,
                fontSize:       11,
                fontFamily:     FD,
                fontWeight:     700,
                textDecoration: 'none',
                transition:     'all 0.2s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = hex2rgba(GL, 0.15)
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = hex2rgba(GL, 0.08)
              }}
            >
              🗺️ Open in Google Maps →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}