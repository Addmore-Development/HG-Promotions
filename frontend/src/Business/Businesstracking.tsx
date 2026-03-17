import { useState, useEffect, useCallback } from 'react'

const BLK2  = '#100C05'
const BLK3  = '#181206'
const GL    = '#E8A820'
const GD    = '#C07818'
const GD2   = '#8B5A1A'
const BB    = 'rgba(212,136,10,0.16)'
const BB2   = 'rgba(212,136,10,0.08)'
const W     = '#FAF3E8'
const W4    = 'rgba(250,243,232,0.40)'
const W2    = 'rgba(250,243,232,0.20)'
const FD    = "'Playfair Display', Georgia, serif"
const FB    = "'DM Sans', system-ui, sans-serif"
const GREEN = '#4ade80'

// Pre-computed style values — never compute inside JSX
const GL_08   = 'rgba(232,168,32,0.08)'
const GL_015  = 'rgba(232,168,32,0.15)'
const GL_03   = 'rgba(232,168,32,0.3)'
const GL_012  = 'rgba(232,168,32,0.12)'
const GL_04   = 'rgba(232,168,32,0.4)'
const GL_006  = 'rgba(232,168,32,0.06)'
const GL_028  = 'rgba(232,168,32,0.28)'
const GL_03b  = '1px solid rgba(232,168,32,0.3)'
const GREEN_008 = 'rgba(74,222,128,0.08)'
const GREEN_025 = 'rgba(74,222,128,0.25)'
const GD_03   = 'rgba(192,120,24,0.3)'
const GD2_03  = 'rgba(139,90,26,0.3)'
const BB_1px  = '1px solid rgba(212,136,10,0.16)'

// Safe emoji string constants
const PIN_EMOJI = '\uD83D\uDCCD'
const MAP_EMOJI = '\uD83D\uDDFA'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHdr(): Record<string, string> {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: 'Bearer ' + t } : {}
}

function hoverIn(el: HTMLElement, bg: string, border?: string) {
  el.style.background = bg
  if (border !== undefined) el.style.borderColor = border
}
function hoverOut(el: HTMLElement, bg: string, border?: string) {
  el.style.background = bg
  if (border !== undefined) el.style.borderColor = border
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
  const timerStyle = { fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: GREEN }
  return (
    <span style={timerStyle}>
      {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

// ── Stat box ──────────────────────────────────────────────────────────────────
function StatBox(props: { label: string; value: string | number; color: string }) {
  const barBg = 'linear-gradient(90deg, ' + props.color + ', ' + props.color + '44)'
  return (
    <div className="biz-page" style={{ background: BLK2, padding: '20px 22px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: barBg }} />
      <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, lineHeight: 1 }}>{props.value}</div>
      <div style={{ fontSize: 9, color: W4, marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase' as const, fontFamily: FD }}>{props.label}</div>
    </div>
  )
}

// ─── Leaflet Map Component ───────────────────────────────────────────────────
function LiveMap({ promoters, selectedPromo, onSelectPromo }: { 
  promoters: LivePromoter[]; 
  selectedPromo: LivePromoter | null;
  onSelectPromo: (p: LivePromoter) => void;
}) {
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const mapRef = useCallback((node: HTMLDivElement) => {
    if (node && !map) {
      // Dynamically import Leaflet only when component mounts
      import('leaflet').then(L => {
        // Initialize map centered on South Africa
        const leafletMap = L.default.map(node).setView([-30.5595, 22.9375], 5)
        
        // Add tile layer (OpenStreetMap)
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(leafletMap)

        // Add SA border highlight
        L.default.polygon([
          [-22.125, 16.469], // Northern border approximate
          [-34.834, 19.999], // Southern tip
          [-27.000, 32.875], // Eastern border
        ], { color: GL, weight: 2, fillOpacity: 0.05 }).addTo(leafletMap)

        setMap(leafletMap)
      })
    }
  }, [map])

  // Update markers when promoters change
  useEffect(() => {
    if (!map) return

    import('leaflet').then(L => {
      // Clear existing markers
      markers.forEach(m => m.remove())
      
      // Create new markers
      const newMarkers = promoters.map(p => {
        const isSelected = selectedPromo?.userId === p.userId
        const isStale = (Date.now() - p.timestamp) > 120000 // 2 minutes
        
        // Create custom icon
        const icon = L.default.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: ${isSelected ? '20px' : '16px'};
              height: ${isSelected ? '20px' : '16px'};
              background: ${isStale ? GD : GREEN};
              border: 3px solid ${isSelected ? GL : 'white'};
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              transition: all 0.2s;
              cursor: pointer;
            "></div>
          `,
          iconSize: [isSelected ? 20 : 16, isSelected ? 20 : 16],
          iconAnchor: [isSelected ? 10 : 8, isSelected ? 10 : 8],
        })

        const marker = L.default.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .on('click', () => onSelectPromo(p))

        // Add popup with promoter info
        const popupContent = `
          <div style="font-family: ${FD}; padding: 8px;">
            <strong style="color: ${GL};">${p.promoterName || 'Unknown'}</strong><br/>
            <span style="font-size: 11px;">${p.jobTitle || 'On shift'}</span><br/>
            <span style="font-size: 10px; color: ${GD};">📍 ${p.venue || 'No venue'}</span>
          </div>
        `
        marker.bindPopup(popupContent)

        return marker
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers if there are any
      if (newMarkers.length > 0) {
        const group = L.default.featureGroup(newMarkers)
        map.fitBounds(group.getBounds().pad(0.1))
      }
    })

    return () => {
      markers.forEach(m => m.remove())
    }
  }, [promoters, selectedPromo, map])

  return (
    <div style={{ marginBottom: 24, borderRadius: 4, overflow: 'hidden', border: `1px solid ${BB}` }}>
      <div 
        ref={mapRef}
        style={{ height: '400px', width: '100%', background: '#1a1a1a' }}
      />
      <style>{`
        .leaflet-container {
          background: #1a1a1a !important;
        }
        .leaflet-tile {
          filter: brightness(0.8) contrast(1.2) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.7) !important;
          color: ${W4} !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: ${GL} !important;
        }
        .leaflet-popup-content-wrapper {
          background: ${BLK2} !important;
          color: ${W} !important;
          border: 1px solid ${BB} !important;
          border-radius: 3px !important;
        }
        .leaflet-popup-tip {
          background: ${BLK2} !important;
          border: 1px solid ${BB} !important;
        }
        .leaflet-popup-close-button {
          color: ${W4} !important;
        }
      `}</style>
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow(props: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: BB2, border: BB_1px, padding: '10px 12px', borderRadius: 2 }}>
      <div style={{ fontSize: 9, color: W4, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4, fontFamily: FB }}>
        {props.label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: props.accent || W, fontFamily: FD }}>
        {props.value}
      </div>
    </div>
  )
}

// ── Maps button — extracted as its own component to isolate the anchor tag ────
function MapsButton(props: { lat: number; lng: number }) {
  const href = 'https://www.google.com/maps?q=' + props.lat + ',' + props.lng
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 18px',
    background: GL_08,
    border: GL_03b,
    borderRadius: 3,
    color: GL,
    fontSize: 11,
    fontFamily: FD,
    fontWeight: 700,
    textDecoration: 'none',
    transition: 'all 0.2s',
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={baseStyle}
      onMouseEnter={e => hoverIn(e.currentTarget, GL_015)}
      onMouseLeave={e => hoverOut(e.currentTarget, GL_08)}
    >
      {MAP_EMOJI + ' Open in Google Maps'}
    </a>
  )
}

// ── Promoter card ─────────────────────────────────────────────────────────────
function PromoterCard(props: { p: LivePromoter; isSelected: boolean; onClick: () => void }) {
  const { p, isSelected } = props
  const lastSeen = Math.round((Date.now() - p.timestamp) / 1000)
  const isStale  = lastSeen > 120

  const cardBg     = isSelected ? GL_006 : BLK2
  const cardBorder = '1px solid ' + (isSelected ? GL_04 : BB)
  const dotBg      = isStale ? GD2 : GREEN
  const barBg      = isStale ? GL_028 : GREEN
  const ringBorder = '2px solid ' + (isStale ? BB : GREEN)

  return (
    <div
      onClick={props.onClick}
      style={{ padding: '16px 20px', background: cardBg, border: cardBorder, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { if (!isSelected) hoverIn(e.currentTarget, BLK3, GL_028) }}
      onMouseLeave={e => { if (!isSelected) hoverOut(e.currentTarget, BLK2, BB) }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: barBg }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: ringBorder }}>
            {p.promoterPhoto
              ? <img src={p.promoterPhoto} alt={p.promoterName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              : <div style={{ width: '100%', height: '100%', background: GL_012, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: GL, fontFamily: FD }}>
                  {(p.promoterName || '?').charAt(0)}
                </div>
            }
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: dotBg, border: '2px solid ' + BLK2 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD, marginBottom: 2 }}>{p.promoterName || 'Unknown'}</div>
          <div style={{ fontSize: 11, color: W4, fontFamily: FB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.jobTitle || '\u2014'}</div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {(!isStale && p.checkInTime)
            ? <LiveTimer checkInTime={p.checkInTime} />
            : <span style={{ fontSize: 10, color: W4, fontFamily: FB }}>{lastSeen < 60 ? lastSeen + 's ago' : Math.floor(lastSeen / 60) + 'm ago'}</span>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: BB2, padding: '8px 10px', borderRadius: 2 }}>
          <div style={{ fontSize: 8, color: W2, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>Location</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: W, fontFamily: FD }}>{p.lat.toFixed(4) + ', ' + p.lng.toFixed(4)}</div>
        </div>
        <div style={{ background: BB2, padding: '8px 10px', borderRadius: 2 }}>
          <div style={{ fontSize: 8, color: W2, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>Hours</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: W, fontFamily: FD }}>{p.hoursWorked ? p.hoursWorked.toFixed(1) + 'h' : '\u2014'}</div>
        </div>
        <div style={{ background: BB2, padding: '8px 10px', borderRadius: 2 }}>
          <div style={{ fontSize: 8, color: W2, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 3, fontFamily: FB }}>Earnings</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: GL, fontFamily: FD }}>{p.currentEarnings ? 'R' + p.currentEarnings : '\u2014'}</div>
        </div>
      </div>

      {p.venue && (
        <div style={{ marginTop: 8, fontSize: 10, color: W4, fontFamily: FB }}>{PIN_EMOJI + ' ' + p.venue}</div>
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
        fetch(API + '/shifts/live-locations', { headers: authHdr() as any }),
        fetch(API + '/jobs',                  { headers: authHdr() as any }),
      ])
      if (locRes.ok)  setLivePromoters(await locRes.json())
      if (jobsRes.ok) {
        const jj: any[] = await jobsRes.json()
        setJobs(jj.filter((j: any) => ['OPEN','FILLED','IN_PROGRESS'].includes(j.status)))
      }
    } catch (e) { console.error('[BusinessTracking] load error:', e) }
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => { loadData(); forceUpdate(n => n + 1) }, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  const filteredPromoters = livePromoters.filter(p => selectedJob === 'all' || p.jobId === selectedJob)
  const totalEarningsLive = filteredPromoters.reduce((sum, p) => sum + (p.currentEarnings || 0), 0)
  const liveCount         = filteredPromoters.length
  const activeJobCount    = new Set(livePromoters.map(p => p.jobId)).size

  const liveIndicatorStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 7,
    background: GREEN_008, border: '1px solid ' + GREEN_025,
    padding: '7px 14px', borderRadius: 3,
  }

  return (
    <div>
      <style>{'@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }'}</style>
      {/* Add Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>

      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase' as const, color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>
              Operations &middot; Live
            </div>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W }}>Live Tracking</h1>
            <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
              Real-time location of promoters on your active campaigns. Updates every 15 seconds.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {livePromoters.length > 0 && (
              <div style={liveIndicatorStyle}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: FD, fontSize: 11, fontWeight: 700, color: GREEN }}>{liveCount} live on shift</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: W4, fontFamily: FB }}>
              {'Updated ' + lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button
              onClick={loadData}
              style={{ padding: '5px 12px', background: 'transparent', border: BB_1px, color: W4, fontFamily: FB, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}
              onMouseEnter={e => hoverIn(e.currentTarget, 'transparent', GL)}
              onMouseLeave={e => hoverOut(e.currentTarget, 'transparent', BB)}
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: BB, marginBottom: 24 }}>
        <StatBox label="Promoters On Shift" value={liveCount}        color={GREEN} />
        <StatBox label="Live Cost So Far"   value={'R' + totalEarningsLive} color={GL}    />
        <StatBox label="Active Jobs"        value={activeJobCount}   color={GD}    />
      </div>

      {/* Live Map */}
      <LiveMap 
        promoters={filteredPromoters} 
        selectedPromo={selectedPromo}
        onSelectPromo={setSelectedPromo}
      />

      {/* Job filter */}
      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
          <button
            onClick={() => setSelectedJob('all')}
            style={{ padding: '6px 14px', border: '1px solid ' + (selectedJob === 'all' ? GL : BB), background: selectedJob === 'all' ? GL_012 : 'transparent', color: selectedJob === 'all' ? GL : W4, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}
          >
            All Jobs
          </button>
          {jobs.map(job => {
            const count      = livePromoters.filter(p => p.jobId === job.id).length
            const isActive   = selectedJob === job.id
            const btnBorder  = '1px solid ' + (isActive ? GL : BB)
            const btnBg      = isActive ? GL_012 : 'transparent'
            const btnColor   = isActive ? GL : W4
            return (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                style={{ padding: '6px 14px', border: btnBorder, background: btnBg, color: btnColor, fontFamily: FD, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}
              >
                {job.title}
                {count > 0 && <span style={{ marginLeft: 6, fontSize: 9, color: GREEN }}>{count}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>Loading...</div>
      ) : filteredPromoters.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed ' + BB, borderRadius: 3 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{PIN_EMOJI}</div>
          <p style={{ fontFamily: FD, fontSize: 20, color: W4, marginBottom: 8 }}>No promoters on shift right now</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>
            When a promoter checks in, their live location will appear here and update every 15 seconds.
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

      {/* Detail panel */}
      {selectedPromo && (
        <div style={{ marginTop: 20, padding: 24, background: BLK2, border: '1px solid ' + GL_03, borderRadius: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD }}>
              {'Location Detail \u2014 ' + selectedPromo.promoterName}
            </div>
            <button onClick={() => setSelectedPromo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 16 }}>
              &times;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <DetailRow label="Latitude"      value={selectedPromo.lat.toFixed(6)} />
            <DetailRow label="Longitude"     value={selectedPromo.lng.toFixed(6)} />
            <DetailRow label="Job"           value={selectedPromo.jobTitle || '\u2014'} />
            <DetailRow label="Venue"         value={selectedPromo.venue    || '\u2014'} />
            <DetailRow
              label="Check-in Time"
              value={selectedPromo.checkInTime
                ? new Date(selectedPromo.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                : '\u2014'}
            />
            <DetailRow label="Hours Worked"  value={selectedPromo.hoursWorked     ? selectedPromo.hoursWorked.toFixed(2) + 'h'  : '\u2014'} />
            <DetailRow label="Rate"          value={selectedPromo.hourlyRate       ? 'R' + selectedPromo.hourlyRate + '/hr'       : '\u2014'} />
            <DetailRow label="Earned"        value={selectedPromo.currentEarnings  ? 'R' + selectedPromo.currentEarnings         : '\u2014'} accent={GL} />
            <DetailRow label="Last Ping"     value={Math.round((Date.now() - selectedPromo.timestamp) / 1000) + 's ago'} />
          </div>

          <div style={{ marginTop: 14 }}>
            <MapsButton lat={selectedPromo.lat} lng={selectedPromo.lng} />
          </div>
        </div>
      )}
    </div>
  )
}