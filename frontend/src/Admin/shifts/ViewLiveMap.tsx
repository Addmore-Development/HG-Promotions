import { useState, useEffect, useCallback } from 'react'

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
  checkInTime?:     string
  hoursWorked?:     number
  currentEarnings?: number
  hourlyRate?:      number
  promoterPhoto?:   string
  jobId?:           string
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLK  = '#050402'
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
const GREEN  = '#4ade80'
const CORAL  = '#C4614A'
const AMBER  = '#F59E0B'

// Pre-computed style strings — never compute inside JSX
const GL_08  = 'rgba(232,168,32,0.08)'
const GL_015 = 'rgba(232,168,32,0.15)'
const GL_012 = 'rgba(232,168,32,0.12)'
const GL_03  = 'rgba(232,168,32,0.3)'
const GL_04  = 'rgba(232,168,32,0.4)'
const GL_006 = 'rgba(232,168,32,0.06)'
const BB_1px = '1px solid rgba(212,136,10,0.16)'
const GREEN_008 = 'rgba(74,222,128,0.08)'
const GREEN_025 = 'rgba(74,222,128,0.25)'

// Safe emoji constants — never inline emoji directly in JSX text
const MAP_EMOJI = '\uD83D\uDDFA'   // U+1F5FA  world map

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LIVE_PROMOTERS: LivePromoter[] = [
  { id: 'mock-1', name: 'Andiswa Ntlamvu',  job: 'Brand Activation',  venue: 'Sandton City',   city: 'Johannesburg', status: 'checked-in',  time: '09:15', lat: -26.1076, lng: 28.0567 },
  { id: 'mock-2', name: 'Asiphe Ntwentle',  job: 'Product Launch',    venue: 'Mall of Africa', city: 'Midrand',      status: 'checked-in',  time: '08:50', lat: -25.9939, lng: 28.1128 },
  { id: 'mock-3', name: 'Thabo Molefe',     job: 'Sampling Campaign', venue: 'Eastgate Mall',  city: 'Johannesburg', status: 'late',        time: '10:00', lat: -26.1825, lng: 28.1081 },
  { id: 'mock-4', name: 'Zinhle Dlamini',   job: 'Event Staff',       venue: 'Montecasino',    city: 'Fourways',     status: 'checked-out', time: '14:30', lat: -26.0160, lng: 28.0105 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hoverIn(el: HTMLElement, bg: string, border?: string) {
  el.style.background = bg
  if (border !== undefined) el.style.borderColor = border
}
function hoverOut(el: HTMLElement, bg: string, border?: string) {
  el.style.background = bg
  if (border !== undefined) el.style.borderColor = border
}

function statusColor(s: CheckStatus): string {
  if (s === 'checked-in')  return GREEN
  if (s === 'checked-out') return GD
  if (s === 'no-show')     return CORAL
  if (s === 'late')        return AMBER
  return W4
}

function statusLabel(s: CheckStatus): string {
  if (s === 'checked-in')  return 'On Shift'
  if (s === 'checked-out') return 'Completed'
  if (s === 'no-show')     return 'No Show'
  if (s === 'late')        return 'Late'
  return s
}

// ─── Live timer ───────────────────────────────────────────────────────────────
function LiveTimer(props: { checkInTime: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const update = () => setElapsed((Date.now() - new Date(props.checkInTime).getTime()) / 1000)
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [props.checkInTime])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = Math.floor(elapsed % 60)
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: GREEN }}>
      {String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0')}
    </span>
  )
}

// ─── Google Maps button — isolated component so the anchor never causes parser issues ──
function MapsButton(props: { lat: number; lng: number }) {
  const href = 'https://www.google.com/maps?q=' + props.lat + ',' + props.lng
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 16px',
    background: GL_08,
    border: '1px solid ' + GL_03,
    borderRadius: 3, color: GL, fontSize: 11,
    fontFamily: FD, fontWeight: 700,
    textDecoration: 'none',
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      onMouseEnter={e => hoverIn(e.currentTarget, GL_015)}
      onMouseLeave={e => hoverOut(e.currentTarget, GL_08)}
    >
      {MAP_EMOJI + ' Open in Google Maps'}
    </a>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge(props: { status: CheckStatus }) {
  const c = statusColor(props.status)
  const style: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: c,
    background: c + '1a',
    border: '1px solid ' + c + '66',
    padding: '3px 8px', borderRadius: 2,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  }
  return <span style={style}>{statusLabel(props.status)}</span>
}

// ─── Detail box ───────────────────────────────────────────────────────────────
function DetailBox(props: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: BB2, border: BB_1px, padding: '8px 10px', borderRadius: 2 }}>
      <div style={{ fontSize: 8, color: W4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>{props.label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: props.accent || W, fontFamily: FD }}>{props.value}</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ViewLiveMap() {
  const [promoters,   setPromoters]   = useState<LivePromoter[]>(MOCK_LIVE_PROMOTERS)
  const [selected,    setSelected]    = useState<LivePromoter | null>(null)
  const [filter,      setFilter]      = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [loading,     setLoading]     = useState(false)
  const [isMock,      setIsMock]      = useState(true)
  const [, forceUpdate] = useState(0)

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
        (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/shifts/live-locations',
        { headers: { Authorization: 'Bearer ' + token } }
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
        setPromoters(MOCK_LIVE_PROMOTERS)
        setIsMock(true)
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      const result: LivePromoter[] = liveData.map((loc: any): LivePromoter => ({
        id:             loc.userId       || '',
        name:           loc.promoterName || 'Unknown Promoter',
        job:            loc.jobTitle     || 'Unknown Job',
        venue:          loc.venue        || 'Unknown Venue',
        city:           '',
        status:         'checked-in' as CheckStatus,
        time:           loc.checkInTime
                          ? new Date(loc.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                          : '\u2014',
        lat:            typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat) || -26.2041,
        lng:            typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng) || 28.0473,
        checkInTime:    loc.checkInTime,
        hoursWorked:    loc.hoursWorked,
        currentEarnings: loc.currentEarnings,
        hourlyRate:     loc.hourlyRate,
        promoterPhoto:  loc.promoterPhoto,
        jobId:          loc.jobId,
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
    const interval = setInterval(() => { loadPromoters(); forceUpdate(n => n + 1) }, 15000)
    return () => clearInterval(interval)
  }, [loadPromoters])

  const filteredPromoters = promoters.filter(p => filter === 'all' || p.status === filter)

  const onCount   = promoters.filter(p => p.status === 'checked-in').length
  const doneCount = promoters.filter(p => p.status === 'checked-out').length
  const nsCount   = promoters.filter(p => p.status === 'no-show').length
  const lateCount = promoters.filter(p => p.status === 'late').length

  return (
    <div style={{ padding: '32px 48px' }}>
      <style>{'@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes spin { to{transform:rotate(360deg)} }'}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase' as const, color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>
            Admin &middot; Live Operations
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: W }}>Live Shift Map</h1>
          <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
            {isMock ? 'Preview mode \u2014 showing sample data' : promoters.length + ' promoter' + (promoters.length !== 1 ? 's' : '') + ' tracked live'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isMock && onCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: GREEN_008, border: '1px solid ' + GREEN_025, padding: '7px 14px', borderRadius: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: GREEN }}>{onCount} live</span>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 4 }}>
              {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button
              onClick={loadPromoters}
              disabled={loading}
              style={{ padding: '6px 14px', background: 'transparent', border: BB_1px, color: W4, fontFamily: FB, fontSize: 10, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 2 }}
              onMouseEnter={e => { if (!loading) hoverIn(e.currentTarget, 'transparent', GL) }}
              onMouseLeave={e => hoverOut(e.currentTarget, 'transparent', BB)}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Mock banner */}
      {isMock && (
        <div style={{ padding: '12px 16px', background: 'rgba(192,120,24,0.1)', border: '1px solid rgba(192,120,24,0.35)', borderRadius: 3, marginBottom: 24, fontSize: 12, color: GD, fontFamily: FB }}>
          No promoters currently on shift. Showing sample data. Live data appears here when promoters check in.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 24 }}>
        {[
          { label: 'On Shift',  value: onCount,   color: GREEN },
          { label: 'Completed', value: doneCount, color: GL    },
          { label: 'No Show',   value: nsCount,   color: CORAL },
          { label: 'Late',      value: lateCount, color: AMBER },
        ].map((s, i) => (
          <div key={i} style={{ background: BLK2, padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, ' + s.color + ', ' + s.color + '44)' }} />
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
            style={{ padding: '6px 14px', border: '1px solid ' + (filter === opt.v ? GL : BB), background: filter === opt.v ? GL_012 : 'transparent', color: filter === opt.v ? GL : W4, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {/* Map canvas */}
      <div style={{ background: BLK2, border: BB_1px, borderRadius: 3, marginBottom: 20, overflow: 'hidden', position: 'relative', height: 320 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(232,168,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,168,32,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 9, color: W2, letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontFamily: FD }}>
          Live Positions
        </div>

        {filteredPromoters.map(p => {
          const x = Math.max(4, Math.min(96, ((p.lng - 16) / (33 - 16)) * 100))
          const y = Math.max(4, Math.min(96, ((p.lat - (-34)) / ((-22) - (-34))) * 100))
          const c = statusColor(p.status)
          const isActive = p.status === 'checked-in'
          const dotStyle: React.CSSProperties = {
            position: 'absolute', left: x + '%', bottom: y + '%',
            transform: 'translate(-50%, 50%)', cursor: 'pointer',
            zIndex: selected?.id === p.id ? 10 : 1,
          }
          const ringStyle: React.CSSProperties = {
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 28, height: 28, borderRadius: '50%',
            border: '2px solid ' + GREEN,
            animation: 'pulse 1.5s ease-in-out infinite',
            opacity: 0.5,
          }
          const circleStyle: React.CSSProperties = {
            width: 18, height: 18, borderRadius: '50%',
            background: c, border: '2px solid ' + BLK,
            boxShadow: selected?.id === p.id ? '0 0 0 3px ' + GL : 'none',
            transition: 'box-shadow 0.2s',
          }
          return (
            <div key={p.id} style={dotStyle} onClick={() => setSelected(prev => prev?.id === p.id ? null : p)} title={p.name + ' \u2014 ' + p.job}>
              {isActive && <div style={ringStyle} />}
              <div style={circleStyle} />
            </div>
          )
        })}

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
      <div style={{ background: BLK2, border: BB_1px, borderRadius: 3, overflow: 'hidden' }}>
        {filteredPromoters.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: W4, fontFamily: FD, fontSize: 14 }}>
            No promoters matching this filter
          </div>
        ) : (
          filteredPromoters.map((p, i) => {
            const isLast   = i === filteredPromoters.length - 1
            const isSel    = selected?.id === p.id
            const rowBg    = isSel ? GL_006 : 'transparent'
            const rowBorder = isLast ? 'none' : BB_1px
            const c        = statusColor(p.status)
            const avatarBorder = '2px solid ' + c + '99'
            return (
              <div
                key={p.id}
                onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
                style={{ padding: '14px 20px', borderBottom: rowBorder, cursor: 'pointer', background: rowBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.18s' }}
                onMouseEnter={e => { if (!isSel) hoverIn(e.currentTarget, BB2) }}
                onMouseLeave={e => { hoverOut(e.currentTarget, isSel ? GL_006 : 'transparent') }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: avatarBorder, flexShrink: 0 }}>
                    {p.promoterPhoto
                      ? <img src={p.promoterPhoto} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      : <div style={{ width: '100%', height: '100%', background: GL_012, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: GL, fontFamily: FD }}>
                          {p.name.charAt(0)}
                        </div>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>{p.job + ' \u00B7 ' + p.venue}</div>
                    <div style={{ fontSize: 10, color: W2, fontFamily: FB, marginTop: 2 }}>{p.lat.toFixed(4) + ', ' + p.lng.toFixed(4)}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StatusBadge status={p.status} />
                  <div style={{ marginTop: 6, fontSize: 11, color: W4, fontFamily: FB }}>
                    {p.checkInTime ? <LiveTimer checkInTime={p.checkInTime} /> : p.time}
                  </div>
                  {p.currentEarnings != null && (
                    <div style={{ fontSize: 11, color: GL, fontFamily: FD, fontWeight: 700, marginTop: 2 }}>
                      {'R' + p.currentEarnings + ' earned'}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selected detail */}
      {selected && (
        <div style={{ marginTop: 16, padding: 20, background: BLK2, border: '1px solid ' + GL_03, borderRadius: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD }}>
              {'Detail \u2014 ' + selected.name}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 16 }}>
              &times;
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 14 }}>
            <DetailBox label="Status"    value={statusLabel(selected.status)} />
            <DetailBox label="Job"       value={selected.job} />
            <DetailBox label="Venue"     value={selected.venue} />
            <DetailBox label="Check-in"  value={selected.time} />
            <DetailBox label="Hours"     value={selected.hoursWorked     ? selected.hoursWorked.toFixed(2) + 'h' : '\u2014'} />
            <DetailBox label="Rate"      value={selected.hourlyRate       ? 'R' + selected.hourlyRate + '/hr'    : '\u2014'} />
            <DetailBox label="Earned"    value={selected.currentEarnings  ? 'R' + selected.currentEarnings      : '\u2014'} accent={GL} />
            <DetailBox label="Latitude"  value={selected.lat.toFixed(5)} />
            <DetailBox label="Longitude" value={selected.lng.toFixed(5)} />
          </div>
          <MapsButton lat={selected.lat} lng={selected.lng} />
        </div>
      )}
    </div>
  )
}