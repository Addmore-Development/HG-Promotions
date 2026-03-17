import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type CheckStatus = 'checked-in' | 'checked-out' | 'no-show' | 'late'

interface LivePromoter {
  id:               string
  name:             string
  job:              string
  venue:            string
  city:             string
  status:           CheckStatus
  time:             string
  lat:              number
  lng:              number
  // Rich fields from Redis
  checkInTime?:     string
  hoursWorked?:     number
  currentEarnings?: number
  hourlyRate?:      number
  promoterPhoto?:   string
  jobId?:           string
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLK  = '#050402'
const BLK1 = '#0A0804'
const BLK2 = '#100C05'
const GL   = '#E8A820'
const GD   = '#C07818'
const GD2  = '#8B5A1A'
const BB   = 'rgba(212,136,10,0.16)'
const BB2  = 'rgba(212,136,10,0.08)'
const W    = '#FAF3E8'
const W4   = 'rgba(250,243,232,0.40)'
const W2   = 'rgba(250,243,232,0.20)'
const FD   = "'Playfair Display', Georgia, serif"
const FB   = "'DM Sans', system-ui, sans-serif"
const GREEN = '#4ade80'
const TEAL  = '#4AABB8'
const CORAL = '#C4614A'

function hex2rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

// ─── Mock data for when no live shifts exist ──────────────────────────────────
const MOCK_LIVE_PROMOTERS: LivePromoter[] = [
  { id: 'mock-1', name: 'Andiswa Ntlamvu',  job: 'Brand Activation',  venue: 'Sandton City',      city: 'Johannesburg', status: 'checked-in',  time: '09:15', lat: -26.1076, lng: 28.0567 },
  { id: 'mock-2', name: 'Asiphe Ntwentle',  job: 'Product Launch',    venue: 'Mall of Africa',    city: 'Midrand',      status: 'checked-in',  time: '08:50', lat: -25.9939, lng: 28.1128 },
  { id: 'mock-3', name: 'Thabo Molefe',     job: 'Sampling Campaign', venue: 'Eastgate Mall',     city: 'Johannesburg', status: 'late',        time: '10:00', lat: -26.1825, lng: 28.1081 },
  { id: 'mock-4', name: 'Zinhle Dlamini',   job: 'Event Staff',       venue: 'Montecasino',       city: 'Fourways',     status: 'checked-out', time: '14:30', lat: -26.0160, lng: 28.0105 },
]

// ─── Live timer ────────────────────────────────────────────────────────────────
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
    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: GREEN }}>
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ViewLiveMap() {
  const [promoters,    setPromoters]    = useState<LivePromoter[]>(MOCK_LIVE_PROMOTERS)
  const [selected,     setSelected]     = useState<LivePromoter | null>(null)
  const [filter,       setFilter]       = useState<string>('all')
  const [lastUpdated,  setLastUpdated]  = useState<Date>(new Date())
  const [loading,      setLoading]      = useState(false)
  const [isMock,       setIsMock]       = useState(true)
  const [, forceUpdate] = useState(0)

  // ── Load live promoters from Redis via backend ─────────────────────────────
  const loadPromoters = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hg_token')
      if (!token) {
        setPromoters(MOCK_LIVE_PROMOTERS)
        setIsMock(true)
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shifts/live-locations`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        setPromoters(MOCK_LIVE_PROMOTERS)
        setIsMock(true)
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      const liveData: any[] = await res.json()

      if (!liveData || liveData.length === 0) {
        // No real data — show mock for demo purposes
        setPromoters(MOCK_LIVE_PROMOTERS)
        setIsMock(true)
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      // Map Redis location data to LivePromoter shape
      const result: LivePromoter[] = liveData.map((loc: any): LivePromoter => ({
        id:               loc.userId          || loc.id || '',
        name:             loc.promoterName    || 'Unknown Promoter',
        job:              loc.jobTitle        || 'Unknown Job',
        venue:            loc.venue           || 'Unknown Venue',
        city:             '',
        status:           'checked-in' as CheckStatus,
        time:             loc.checkInTime
                            ? new Date(loc.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                            : '—',
        lat:              typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat) || -26.2041,
        lng:              typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng) || 28.0473,
        checkInTime:      loc.checkInTime,
        hoursWorked:      loc.hoursWorked,
        currentEarnings:  loc.currentEarnings,
        hourlyRate:       loc.hourlyRate,
        promoterPhoto:    loc.promoterPhoto,
        jobId:            loc.jobId,
      }))

      setPromoters(result)
      setIsMock(false)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[ViewLiveMap] loadPromoters error:', err)
      setPromoters(MOCK_LIVE_PROMOTERS)
      setIsMock(true)
      setLastUpdated(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPromoters()
    // Refresh every 15 seconds
    const interval = setInterval(() => {
      loadPromoters()
      forceUpdate(n => n + 1)
    }, 15_000)
    return () => clearInterval(interval)
  }, [loadPromoters])

  const filteredPromoters = promoters.filter(p =>
    filter === 'all' || p.status === filter
  )

  const statusColor = (s: CheckStatus): string => {
    if (s === 'checked-in')  return GREEN
    if (s === 'checked-out') return GD
    if (s === 'no-show')     return CORAL
    if (s === 'late')        return '#F59E0B'
    return W4
  }

  const statusLabel = (s: CheckStatus): string => {
    if (s === 'checked-in')  return '🟢 On Shift'
    if (s === 'checked-out') return '✓ Completed'
    if (s === 'no-show')     return '✗ No Show'
    if (s === 'late')        return '⚠ Late'
    return s
  }

  return (
    <div style={{ padding: '32px 48px' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase' as const, color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>
            Admin · Live Operations
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: W }}>Live Shift Map</h1>
          <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
            {isMock ? 'Preview mode — showing sample data' : `${promoters.length} promoter${promoters.length !== 1 ? 's' : ''} tracked live`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isMock && promoters.filter(p => p.status === 'checked-in').length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: hex2rgba(GREEN, 0.08), border: `1px solid ${hex2rgba(GREEN, 0.25)}`, padding: '7px 14px', borderRadius: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: GREEN }}>
                {promoters.filter(p => p.status === 'checked-in').length} live
              </span>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 4 }}>
              {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button
              onClick={loadPromoters}
              disabled={loading}
              style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${BB}`, color: W4, fontFamily: FB, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 2 }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!loading) { e.currentTarget.style.color = GL; e.currentTarget.style.borderColor = GL } }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = W4; e.currentTarget.style.borderColor = BB }}
            >
              {loading ? '↻ Loading…' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Mock data banner */}
      {isMock && (
        <div style={{ padding: '12px 16px', background: hex2rgba(GD, 0.1), border: `1px solid ${hex2rgba(GD, 0.35)}`, borderRadius: 3, marginBottom: 24, fontSize: 12, color: GD, fontFamily: FB }}>
          📋 No promoters currently on shift. Showing sample data for preview. Live data will appear here when promoters check in.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 24 }}>
        {[
          { label: 'On Shift',    value: promoters.filter(p => p.status === 'checked-in').length,  color: GREEN },
          { label: 'Completed',   value: promoters.filter(p => p.status === 'checked-out').length, color: GL   },
          { label: 'No Show',     value: promoters.filter(p => p.status === 'no-show').length,     color: CORAL },
          { label: 'Late',        value: promoters.filter(p => p.status === 'late').length,        color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ background: BLK2, padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, ${hex2rgba(s.color, 0.3)})` }} />
            <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: W4, marginTop: 5, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontFamily: FD }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { v: 'all',         l: 'All'       },
          { v: 'checked-in',  l: 'On Shift'  },
          { v: 'checked-out', l: 'Completed' },
          { v: 'late',        l: 'Late'      },
          { v: 'no-show',     l: 'No Show'   },
        ].map(opt => (
          <button
            key={opt.v}
            onClick={() => setFilter(opt.v)}
            style={{ padding: '6px 14px', border: `1px solid ${filter === opt.v ? GL : BB}`, background: filter === opt.v ? hex2rgba(GL, 0.12) : 'transparent', color: filter === opt.v ? GL : W4, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s' }}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {/* Map canvas — coordinate-based visualization */}
      <div style={{ background: BLK2, border: `1px solid ${BB}`, borderRadius: 3, marginBottom: 20, overflow: 'hidden', position: 'relative', height: 320 }}>
        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${hex2rgba(GL, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${hex2rgba(GL, 0.04)} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 9, color: W2, letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: FD }}>
          Live Positions
        </div>

        {/* Plot promoter dots */}
        {filteredPromoters.map(p => {
          // Normalize lat/lng to canvas coordinates
          // SA bounding box: lat -34 to -22, lng 16 to 33
          const x = Math.max(4, Math.min(96, ((p.lng - 16) / (33 - 16)) * 100))
          const y = Math.max(4, Math.min(96, ((p.lat - (-34)) / ((-22) - (-34))) * 100))
          const isActive = p.status === 'checked-in'

          return (
            <div
              key={p.id}
              onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
              style={{
                position:  'absolute',
                left:      `${x}%`,
                bottom:    `${y}%`,
                transform: 'translate(-50%, 50%)',
                cursor:    'pointer',
                zIndex:    selected?.id === p.id ? 10 : 1,
              }}
              title={`${p.name} — ${p.job}`}
            >
              {/* Pulse ring for active */}
              {isActive && (
                <div style={{
                  position:     'absolute',
                  top: '50%', left: '50%',
                  transform:    'translate(-50%, -50%)',
                  width:        28, height: 28,
                  borderRadius: '50%',
                  border:       `2px solid ${GREEN}`,
                  animation:    'pulse 1.5s ease-in-out infinite',
                  opacity:      0.5,
                }} />
              )}
              <div style={{
                width:        18, height: 18,
                borderRadius: '50%',
                background:   statusColor(p.status),
                border:       `2px solid ${BLK}`,
                boxShadow:    selected?.id === p.id ? `0 0 0 3px ${GL}` : 'none',
                transition:   'box-shadow 0.2s',
              }} />
            </div>
          )
        })}

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 12, right: 16, display: 'flex', gap: 14 }}>
          {[
            { color: GREEN, label: 'On Shift'  },
            { color: GD,    label: 'Done'      },
            { color: CORAL, label: 'No Show'   },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 9, color: W2, fontFamily: FB }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Promoter list */}
      <div style={{ background: BLK2, border: `1px solid ${BB}`, borderRadius: 3, overflow: 'hidden' }}>
        {filteredPromoters.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: W4, fontFamily: FD, fontSize: 14 }}>
            No promoters matching this filter
          </div>
        ) : (
          filteredPromoters.map((p, i) => (
            <div
              key={p.id}
              onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
              style={{
                padding:      '14px 20px',
                borderBottom: i < filteredPromoters.length - 1 ? `1px solid ${BB}` : 'none',
                cursor:       'pointer',
                background:   selected?.id === p.id ? hex2rgba(GL, 0.04) : 'transparent',
                display:      'flex',
                justifyContent: 'space-between',
                alignItems:   'center',
                transition:   'background 0.18s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { if (selected?.id !== p.id) e.currentTarget.style.background = BB2 }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = selected?.id === p.id ? hex2rgba(GL, 0.04) : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${hex2rgba(statusColor(p.status), 0.6)}`, flexShrink: 0 }}>
                  {p.promoterPhoto
                    ? <img src={p.promoterPhoto} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    : <div style={{ width: '100%', height: '100%', background: hex2rgba(GL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: GL, fontFamily: FD }}>
                        {p.name.charAt(0)}
                      </div>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>{p.job} · {p.venue}</div>
                  <div style={{ fontSize: 10, color: W2, fontFamily: FB, marginTop: 2 }}>
                    {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: statusColor(p.status), background: hex2rgba(statusColor(p.status), 0.1), border: `1px solid ${hex2rgba(statusColor(p.status), 0.4)}`, padding: '3px 8px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  {statusLabel(p.status)}
                </span>
                <div style={{ marginTop: 6, fontSize: 11, color: W4, fontFamily: FB }}>
                  {p.checkInTime ? <LiveTimer checkInTime={p.checkInTime} /> : p.time}
                </div>
                {p.currentEarnings != null && (
                  <div style={{ fontSize: 11, color: GL, fontFamily: FD, fontWeight: 700, marginTop: 2 }}>
                    R{p.currentEarnings} earned
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected promoter detail */}
      {selected && (
        <div style={{ marginTop: 16, padding: 20, background: BLK2, border: `1px solid ${hex2rgba(GL, 0.3)}`, borderRadius: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD }}>
              Detail — {selected.name}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Status',     value: statusLabel(selected.status) },
              { label: 'Job',        value: selected.job },
              { label: 'Venue',      value: selected.venue },
              { label: 'Check-in',   value: selected.time },
              { label: 'Hours',      value: selected.hoursWorked    ? `${selected.hoursWorked.toFixed(2)}h` : '—' },
              { label: 'Rate',       value: selected.hourlyRate      ? `R${selected.hourlyRate}/hr`         : '—' },
              { label: 'Earned',     value: selected.currentEarnings ? `R${selected.currentEarnings}`       : '—', accent: GL },
              { label: 'Latitude',   value: selected.lat.toFixed(5) },
              { label: 'Longitude',  value: selected.lng.toFixed(5) },
            ].map(r => (
              <div key={r.label} style={{ background: BB2, border: `1px solid ${BB}`, padding: '8px 10px', borderRadius: 2 }}>
                <div style={{ fontSize: 8, color: W4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>{r.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: (r as any).accent || W, fontFamily: FD }}>{r.value}</div>
              </div>
            ))}
          </div>
          
            href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: hex2rgba(GL, 0.08), border: `1px solid ${hex2rgba(GL, 0.3)}`, borderRadius: 3, color: GL, fontSize: 11, fontFamily: FD, fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = hex2rgba(GL, 0.15) }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = hex2rgba(GL, 0.08) }}
          >
            🗺️ Open in Google Maps →
          </a>
        </div>
      )}
    </div>
  )
}