import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── DESIGN TOKENS — exact LoginPage palette ──────────────────────────────────
const BLACK       = '#080808'
const BLACK_CARD  = '#161616'
const GOLD        = '#C4973A'
const GOLD_LIGHT  = '#DDB55A'
const GOLD_DIM    = 'rgba(196,151,58,0.55)'
const GOLD_PALE   = 'rgba(196,151,58,0.28)'
const GOLD_FAINT  = 'rgba(196,151,58,0.10)'
const GOLD_GLOW   = 'rgba(196,151,58,0.06)'
const AMBER       = '#B8820A'
const BROWN       = '#7A5C1E'
const WHITE       = '#F4EFE6'
const WHITE_MUTED = 'rgba(244,239,230,0.55)'
const WHITE_DIM   = 'rgba(244,239,230,0.22)'
const FD          = "'Playfair Display', Georgia, serif"
const FB          = "'DM Sans', system-ui, sans-serif"

// ─── Status colours — all within the gold/amber/brown family ─────────────────
type CheckStatus = 'checked-in' | 'late' | 'absent' | 'completed'

const STATUS_COLOR: Record<CheckStatus, string> = {
  'checked-in': GOLD_LIGHT,
  'late':       '#F0C050',
  'absent':     '#A07840',
  'completed':  AMBER,
}
const STATUS_BG: Record<CheckStatus, string> = {
  'checked-in': 'rgba(221,181,90,0.12)',
  'late':       'rgba(240,192,80,0.12)',
  'absent':     'rgba(160,120,64,0.18)',
  'completed':  'rgba(184,130,10,0.12)',
}
const STATUS_BORDER: Record<CheckStatus, string> = {
  'checked-in': 'rgba(221,181,90,0.48)',
  'late':       'rgba(240,192,80,0.45)',
  'absent':     'rgba(160,120,64,0.45)',
  'completed':  'rgba(184,130,10,0.48)',
}
const STATUS_LABEL: Record<CheckStatus, string> = {
  'checked-in': 'Checked In',
  'late':       'Late',
  'absent':     'Absent',
  'completed':  'Completed',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
interface LivePromoter {
  id: string; name: string; job: string; venue: string
  city: string; status: CheckStatus; time: string
  lat: number; lng: number
}

const MOCK_LIVE_PROMOTERS: LivePromoter[] = [
  { id:'P001', name:'Ayanda Dlamini',  job:'Castle Lager Launch',           venue:'Sandton City',               city:'Johannesburg', status:'checked-in', time:'08:12', lat:-26.1073, lng:28.0560 },
  { id:'P002', name:'Thabo Nkosi',     job:'MTN Brand Ambassador',           venue:'Maponya Mall, Soweto',       city:'Johannesburg', status:'checked-in', time:'08:05', lat:-26.2678, lng:27.8546 },
  { id:'P003', name:'Zanele Motha',    job:'Absolut Vodka Night',            venue:'Rosebank Mall',              city:'Johannesburg', status:'late',       time:'—',     lat:-26.1452, lng:28.0408 },
  { id:'P004', name:'Bongani Khumalo', job:"Nando's In-Store Tasting",       venue:'Fourways Mall',              city:'Johannesburg', status:'checked-in', time:'09:00', lat:-26.0154, lng:28.0103 },
  { id:'P005', name:'Sipho Mhlongo',   job:'Listerine Sampling',             venue:'Noord Taxi Rank',            city:'Johannesburg', status:'absent',     time:'—',     lat:-26.2008, lng:28.0436 },
  { id:'P006', name:'Lerato Mokoena',  job:'Distell Premium Wines',          venue:'Sandton Convention Centre',  city:'Johannesburg', status:'completed',  time:'07:45', lat:-26.1076, lng:28.0567 },
  { id:'P007', name:'Marco van Wyk',   job:'Red Bull Sampling',              venue:'V&A Waterfront',             city:'Cape Town',    status:'checked-in', time:'08:30', lat:-33.9030, lng:18.4185 },
  { id:'P008', name:'Mia Louw',        job:'Woolworths Food Tasting',        venue:'Cavendish Square',           city:'Cape Town',    status:'checked-in', time:'08:22', lat:-33.9878, lng:18.4695 },
  { id:'P009', name:'Lungelo Mgqibi',  job:'Coca-Cola Spaza Activation',     venue:'Khayelitsha',                city:'Cape Town',    status:'late',       time:'—',     lat:-34.0350, lng:18.6732 },
  { id:'P010', name:'Chanel Botha',    job:'Vodacom Product Demo',           venue:'Canal Walk',                 city:'Cape Town',    status:'completed',  time:'07:55', lat:-33.8668, lng:18.5102 },
  { id:'P011', name:'Nomsa Zulu',      job:"Jack Daniel's Whisky Night",     venue:'uShaka Marine World',        city:'Durban',       status:'checked-in', time:'08:10', lat:-29.8625, lng:31.0452 },
  { id:'P012', name:'Priya Naidoo',    job:'Dove Beauty Sampling',           venue:'Gateway Theatre of Shopping',city:'Durban',       status:'checked-in', time:'08:35', lat:-29.7280, lng:31.0670 },
  { id:'P013', name:'Sibusiso Vilak',  job:'Pick n Pay Smart Shopper',       venue:'Pavilion Shopping Centre',   city:'Durban',       status:'absent',     time:'—',     lat:-29.8728, lng:30.9648 },
  { id:'P014', name:'Ruan Kotze',      job:'FreshBrands In-Store',           venue:'Musgrave Centre',            city:'Durban',       status:'late',       time:'—',     lat:-29.8618, lng:31.0026 },
  { id:'P015', name:'Pieter Joubert',  job:'Menlyn Fashion Night',           venue:'Menlyn Mall',                city:'Pretoria',     status:'checked-in', time:'09:05', lat:-25.7823, lng:28.2773 },
  { id:'P016', name:'Andile Nxumalo',  job:'Hyundai Test Drive',             venue:'Menlyn Park',                city:'Pretoria',     status:'completed',  time:'07:50', lat:-25.7820, lng:28.2755 },
  { id:'P017', name:'Tebogo Radebe',   job:'Shoprite Easter Promos',         venue:'Woodlands Boulevard',        city:'Pretoria',     status:'checked-in', time:'08:48', lat:-25.8099, lng:28.2826 },
  { id:'P018', name:'Kagiso Motsepe',  job:'Standard Bank Career Expo',      venue:'Hatfield Plaza',             city:'Pretoria',     status:'absent',     time:'—',     lat:-25.7503, lng:28.2328 },
]

// ─── Google Maps ──────────────────────────────────────────────────────────────
declare global { interface Window { google: any; initHGMap: () => void } }
const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const MAP_ID   = 'hg-live-map'

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.marker) { resolve(); return }
    if (document.getElementById('hg-gmaps-script')) {
      const iv = setInterval(() => { if (window.google?.maps?.marker) { clearInterval(iv); resolve() } }, 100)
      return
    }
    window.initHGMap = () => resolve()
    const s = document.createElement('script')
    s.id = 'hg-gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&libraries=marker&loading=async&callback=initHGMap`
    s.async = true; s.defer = true
    s.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(s)
  })
}

const MAP_STYLES = [
  { elementType: 'geometry',                stylers: [{ color: '#0C0907' }] },
  { elementType: 'labels.text.stroke',      stylers: [{ color: '#0C0907' }] },
  { elementType: 'labels.text.fill',        stylers: [{ color: '#5A4015' }] },
  { featureType: 'administrative',          elementType: 'geometry',         stylers: [{ color: '#181005' }] },
  { featureType: 'administrative.country',  elementType: 'labels.text.fill', stylers: [{ color: '#8A7040' }] },
  { featureType: 'administrative.province', elementType: 'labels.text.fill', stylers: [{ color: '#6A5228' }] },
  { featureType: 'landscape',               stylers: [{ color: '#0E0B05' }] },
  { featureType: 'poi',                     stylers: [{ visibility: 'off' }] },
  { featureType: 'road',                    elementType: 'geometry',         stylers: [{ color: '#1A1205' }] },
  { featureType: 'road',                    elementType: 'geometry.stroke',  stylers: [{ color: '#0E0B05' }] },
  { featureType: 'road',                    elementType: 'labels.text.fill', stylers: [{ color: '#4A3510' }] },
  { featureType: 'road.highway',            elementType: 'geometry',         stylers: [{ color: '#261A05' }] },
  { featureType: 'road.highway',            elementType: 'geometry.stroke',  stylers: [{ color: '#160F03' }] },
  { featureType: 'road.highway',            elementType: 'labels.text.fill', stylers: [{ color: '#C4973A' }] },
  { featureType: 'transit',                 stylers: [{ visibility: 'off' }] },
  { featureType: 'water',                   elementType: 'geometry',         stylers: [{ color: '#040300' }] },
  { featureType: 'water',                   elementType: 'labels.text.fill', stylers: [{ color: '#1E1505' }] },
]

function makePinElement(color: string): HTMLElement {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22S28 23.63 28 14C28 6.27 21.73 0 14 0z"
          fill="${color}" stroke="#080808" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5" fill="#080808" opacity="0.55"/>
  </svg>`
  const div = document.createElement('div')
  div.innerHTML = svg.trim()
  div.style.cursor = 'pointer'
  return div
}

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  .hg-lm * { box-sizing: border-box; }
  .hg-pill { transition: all 0.25s; cursor: pointer; border: none; }
  .hg-pill:hover { opacity: 0.80; }
  .hg-pcard { transition: background 0.18s; cursor: pointer; }
  .hg-pcard:hover { background: rgba(196,151,58,0.07) !important; }
  .hg-pcard.sel { background: rgba(196,151,58,0.11) !important; box-shadow: inset 0 0 0 1px rgba(196,151,58,0.28); }
  .hg-gs::-webkit-scrollbar { width: 4px; }
  .hg-gs::-webkit-scrollbar-track { background: rgba(196,151,58,0.04); }
  .hg-gs::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#DDB55A,#7A5C1E); border-radius:4px; }
  @keyframes hg-pulse2 { 0%,100%{opacity:1} 50%{opacity:0.15} }
  .hg-dot { animation: hg-pulse2 2s ease-in-out infinite; }
  @keyframes hg-fu { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .hg-fu { animation: hg-fu 0.3s ease both; }
`
function injectCSS() {
  if (document.getElementById('hg-lm-css2')) return
  const el = document.createElement('style'); el.id = 'hg-lm-css2'; el.textContent = PAGE_CSS
  document.head.appendChild(el)
}

// ─── Components ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
      fontFamily: FB, color: STATUS_COLOR[status],
      background: STATUS_BG[status], border: `1px solid ${STATUS_BORDER[status]}`,
      padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function StatPill({ count, label, color, active, onClick }: {
  count: number; label: string; color: string; active: boolean; onClick: () => void
}) {
  return (
    <div onClick={onClick} className="hg-pill" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px',
      background: active ? `${color}14` : 'transparent',
      border: `1px solid ${active ? `${color}55` : 'rgba(196,151,58,0.12)'}`,
      cursor: 'pointer', transition: 'all 0.25s',
    }}>
      <span style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: 9, color: active ? color : GOLD_DIM, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FB }}>
        {label}
      </span>
    </div>
  )
}

function FilterPill({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button className="hg-pill" onClick={onClick} style={{
      padding: '4px 12px',
      background: active ? `${color}18` : 'rgba(8,8,8,0.90)',
      border: `1px solid ${active ? `${color}55` : 'rgba(196,151,58,0.18)'}`,
      color: active ? color : GOLD_DIM,
      fontFamily: FB, fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ViewLiveMap() {
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInstance   = useRef<any>(null)
  const markersRef    = useRef<Map<string, any>>(new Map())
  const infoWindowRef = useRef<any>(null)

  const [promoters,    setPromoters   ] = useState<LivePromoter[]>(MOCK_LIVE_PROMOTERS)
  const [selected,     setSelected    ] = useState<LivePromoter | null>(null)
  const [filterStatus, setFilterStatus] = useState<CheckStatus | 'all'>('all')
  const [filterCity,   setFilterCity  ] = useState<string>('all')
  const [mapReady,     setMapReady    ] = useState(false)
  const [mapError,     setMapError    ] = useState('')
  const [lastUpdated,  setLastUpdated ] = useState<Date>(new Date())
  const [showAll,      setShowAll     ] = useState(false)
  const PREVIEW = 6

  useEffect(() => { injectCSS() }, [])

  const loadPromoters = useCallback(async () => {
    try {
      const token = localStorage.getItem('hg_token')
      if (!token) { setLastUpdated(new Date()); return }
      const [shiftsRes, locRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shifts/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shifts/live-locations`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!shiftsRes.ok) { setLastUpdated(new Date()); return }
      const shifts: any[]        = await shiftsRes.json()
      const liveLocations: any[] = locRes.ok ? await locRes.json() : []
      const locMap               = new Map(liveLocations.map((l: any) => [l.userId, l]))
      const todayStart           = new Date(); todayStart.setHours(0, 0, 0, 0)
      const today                = shifts.filter((s: any) => { const d = s.job?.date ? new Date(s.job.date) : null; return d && d >= todayStart })
      if (today.length === 0) { setLastUpdated(new Date()); return }
      const result: LivePromoter[] = today.map((s: any) => {
        const loc = locMap.get(s.promoterId)
        const raw = s.status?.toLowerCase() || ''
        let st: CheckStatus = 'absent'
        if (raw === 'checked_in' || raw === 'checked-in') st = 'checked-in'
        else if (raw === 'approved' || raw === 'pending_approval') st = 'completed'
        else if (raw === 'scheduled') {
          const d = s.job?.date ? new Date(s.job.date) : null
          const [h, m] = (s.job?.startTime || '09:00').split(':').map(Number)
          if (d) { const start = new Date(d); start.setHours(h, m, 0, 0); st = Date.now() - start.getTime() > 15 * 60 * 1000 ? 'late' : 'absent' }
        }
        return {
          id: s.promoterId, name: s.promoter?.fullName || 'Unknown Promoter',
          job: s.job?.title || 'Unknown Job', venue: s.job?.venue || 'Unknown Venue',
          city: s.job?.address?.split(',')[0] || '', status: st,
          time: s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—',
          lat: loc?.lat ?? s.job?.lat ?? -26.2041, lng: loc?.lng ?? s.job?.lng ?? 28.0473,
        }
      })
      setPromoters(result); setLastUpdated(new Date())
    } catch { setLastUpdated(new Date()) }
  }, [])

  useEffect(() => { loadPromoters(); const iv = setInterval(loadPromoters, 30_000); return () => clearInterval(iv) }, [loadPromoters])

  useEffect(() => {
    if (!mapRef.current) return
    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: -28.7, lng: 25.5 }, zoom: 6, mapId: MAP_ID, styles: MAP_STYLES,
          disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        })
        infoWindowRef.current = new window.google.maps.InfoWindow()
        setMapReady(true)
      })
      .catch(() => setMapError('Google Maps unavailable — check VITE_GOOGLE_MAPS_KEY in your .env'))
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    const { AdvancedMarkerElement } = window.google.maps.marker
    const vis    = promoters.filter(p => (filterStatus === 'all' || p.status === filterStatus) && (filterCity === 'all' || p.city === filterCity))
    const visIds = new Set(vis.map(p => p.id))
    markersRef.current.forEach((m, id) => { if (!visIds.has(id)) { m.map = null; markersRef.current.delete(id) } })
    vis.forEach(p => {
      const color = STATUS_COLOR[p.status]
      if (markersRef.current.has(p.id)) {
        const mk = markersRef.current.get(p.id); mk.position = { lat: p.lat, lng: p.lng }; mk.content = makePinElement(color)
      } else {
        const mk = new AdvancedMarkerElement({ position: { lat: p.lat, lng: p.lng }, map: mapInstance.current, title: p.name, content: makePinElement(color) })
        mk.addListener('click', () => {
          setSelected(p)
          infoWindowRef.current?.setContent(`
            <div style="background:#161616;color:#F4EFE6;padding:12px 16px;font-family:'DM Sans',sans-serif;min-width:180px;border-top:2px solid ${color};">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;font-family:'Playfair Display',serif;color:#F4EFE6;">${p.name}</div>
              <div style="font-size:11px;color:${color};margin-bottom:2px;">${p.venue}</div>
              <div style="font-size:10px;color:rgba(244,239,230,0.55);margin-bottom:8px;">${p.job}</div>
              <div style="font-size:9px;color:${color};font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${STATUS_LABEL[p.status]}${p.time !== '—' ? ' · ' + p.time : ''}</div>
              <div style="font-size:9px;color:rgba(244,239,230,0.28);margin-top:2px;letter-spacing:0.1em;">${p.city.toUpperCase()}</div>
            </div>`)
          infoWindowRef.current?.open({ map: mapInstance.current, anchor: mk })
        })
        markersRef.current.set(p.id, mk)
      }
    })
  }, [promoters, filterStatus, filterCity, mapReady])

  const filtered = promoters.filter(p =>
    (filterStatus === 'all' || p.status === filterStatus) &&
    (filterCity   === 'all' || p.city   === filterCity)
  )

  const counts = {
    all: promoters.length,
    'checked-in': promoters.filter(p => p.status === 'checked-in').length,
    'late':       promoters.filter(p => p.status === 'late').length,
    'absent':     promoters.filter(p => p.status === 'absent').length,
    'completed':  promoters.filter(p => p.status === 'completed').length,
  }

  const cities = ['all', ...Array.from(new Set(promoters.map(p => p.city))).sort()]

  const panTo = (p: LivePromoter) => {
    setSelected(prev => prev?.id === p.id ? null : p)
    if (mapReady && mapInstance.current) {
      mapInstance.current.panTo({ lat: p.lat, lng: p.lng })
      mapInstance.current.setZoom(14)
      const mk = markersRef.current.get(p.id)
      if (mk) window.google?.maps?.event?.trigger(mk, 'click')
    }
  }

  const toggle = (current: CheckStatus | 'all', next: CheckStatus) => {
    setFilterStatus(current === next ? 'all' : next)
    setShowAll(false)
  }

  const visible = showAll ? filtered : filtered.slice(0, PREVIEW)

  return (
    <AdminLayout>
      <div className="hg-lm" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BLACK, fontFamily: FB, color: WHITE }}>

        {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '22px 36px',
          background: BLACK_CARD,
          borderBottom: `1px solid rgba(196,151,58,0.12)`,
          flexShrink: 0,
        }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Vertical gold rule — mirrors login card top bar concept */}
            <div style={{
              width: 3, height: 38, flexShrink: 0,
              background: `linear-gradient(180deg, ${BROWN}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, ${BROWN})`,
            }} />
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD_DIM, fontFamily: FB, fontWeight: 600, marginBottom: 4 }}>
                Operations · Live
              </div>
              <h1 style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: WHITE, lineHeight: 1 }}>
                Live Operations Map
              </h1>
            </div>
            {/* Live badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: GOLD_GLOW, border: `1px solid rgba(196,151,58,0.18)` }}>
              <div className="hg-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD_LIGHT, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: GOLD_DIM, fontFamily: FB, letterSpacing: '0.06em' }}>
                Live · {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 1, background: 'rgba(196,151,58,0.10)', flexWrap: 'wrap' }}>
            <StatPill count={counts.all}           label="Total"      color={GOLD}       active={filterStatus === 'all'}        onClick={() => setFilterStatus('all')} />
            <StatPill count={counts['checked-in']} label="Checked In" color={GOLD_LIGHT} active={filterStatus === 'checked-in'} onClick={() => toggle(filterStatus, 'checked-in')} />
            <StatPill count={counts.late}          label="Late"       color="#F0C050"    active={filterStatus === 'late'}       onClick={() => toggle(filterStatus, 'late')} />
            <StatPill count={counts.absent}        label="Absent"     color="#A07840"    active={filterStatus === 'absent'}     onClick={() => toggle(filterStatus, 'absent')} />
            <StatPill count={counts.completed}     label="Completed"  color={AMBER}      active={filterStatus === 'completed'}  onClick={() => toggle(filterStatus, 'completed')} />
          </div>

          {/* Refresh */}
          <button onClick={loadPromoters} style={{
            fontSize: 10, color: GOLD, background: 'none', border: `1px solid rgba(196,151,58,0.22)`,
            padding: '7px 18px', cursor: 'pointer', fontFamily: FB, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}88`; e.currentTarget.style.color = GOLD_LIGHT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,151,58,0.22)'; e.currentTarget.style.color = GOLD }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ══ MAP — full width ══════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', flexShrink: 0, height: '44vh', background: '#0C0907', borderBottom: `1px solid rgba(196,151,58,0.12)` }}>

          {/* Gold gradient top bar — same as login card */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10, pointerEvents: 'none',
            background: `linear-gradient(90deg, ${BROWN}, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, ${BROWN})`,
          }} />

          {/* Status filters — top left */}
          <div style={{ position: 'absolute', top: 16, left: 12, zIndex: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FilterPill label="All"        active={filterStatus === 'all'}        color={GOLD}       onClick={() => setFilterStatus('all')} />
            <FilterPill label="Checked In" active={filterStatus === 'checked-in'} color={GOLD_LIGHT} onClick={() => toggle(filterStatus, 'checked-in')} />
            <FilterPill label="Late"       active={filterStatus === 'late'}       color="#F0C050"    onClick={() => toggle(filterStatus, 'late')} />
            <FilterPill label="Absent"     active={filterStatus === 'absent'}     color="#A07840"    onClick={() => toggle(filterStatus, 'absent')} />
            <FilterPill label="Completed"  active={filterStatus === 'completed'}  color={AMBER}      onClick={() => toggle(filterStatus, 'completed')} />
          </div>

          {/* City filters — top right */}
          <div style={{ position: 'absolute', top: 16, right: 12, zIndex: 10, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {cities.map(c => (
              <FilterPill key={c} label={c === 'all' ? 'All Cities' : c} active={filterCity === c} color={GOLD} onClick={() => setFilterCity(c)} />
            ))}
          </div>

          {/* Legend — bottom left */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14, zIndex: 10,
            background: 'rgba(8,8,8,0.92)', border: `1px solid rgba(196,151,58,0.14)`,
            padding: '8px 14px', display: 'flex', gap: 16, alignItems: 'center',
          }}>
            {(Object.keys(STATUS_COLOR) as CheckStatus[]).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[s], flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: '0.06em', fontFamily: FB, whiteSpace: 'nowrap' }}>
                  {STATUS_LABEL[s]}
                </span>
              </div>
            ))}
          </div>

          {/* Map canvas */}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {mapError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0C0907' }}>
              <p style={{ fontSize: 11, color: GOLD_DIM, fontFamily: FB, textAlign: 'center', letterSpacing: '0.06em', maxWidth: 340, lineHeight: 1.7 }}>{mapError}</p>
            </div>
          )}
        </div>

        {/* ══ PROMOTER GRID ════════════════════════════════════════════════════ */}
        <div className="hg-gs" style={{ flex: 1, overflowY: 'auto', background: BLACK }}>

          {/* Sticky section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 36px', borderBottom: `1px solid rgba(196,151,58,0.12)`,
            background: BLACK_CARD, position: 'sticky', top: 0, zIndex: 5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Short gold rule — matches logo divider on login page */}
              <div style={{ width: 28, height: 1, background: GOLD }} />
              <span style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD_DIM, fontWeight: 600, fontFamily: FB }}>
                Active Promoters
              </span>
              <span style={{
                fontSize: 9, color: GOLD, fontFamily: FB, fontWeight: 600,
                background: GOLD_FAINT, border: `1px solid ${GOLD_PALE}`,
                padding: '2px 9px', letterSpacing: '0.08em',
              }}>
                {filtered.length} showing
              </span>
            </div>
            {selected && (
              <button onClick={() => setSelected(null)} style={{
                fontSize: 10, color: WHITE_MUTED, background: 'none',
                border: `1px solid rgba(196,151,58,0.15)`, padding: '4px 12px',
                cursor: 'pointer', fontFamily: FB, letterSpacing: '0.08em',
              }}
                onMouseEnter={e => e.currentTarget.style.color = GOLD}
                onMouseLeave={e => e.currentTarget.style.color = WHITE_MUTED}
              >
                ✕ Clear selection
              </button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: WHITE_DIM, fontSize: 13, fontFamily: FD }}>
              No promoters match this filter.
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
                gap: 1,
                background: 'rgba(196,151,58,0.10)',
                padding: 1,
              }}>
                {visible.map(p => {
                  const isSel = selected?.id === p.id
                  const color = STATUS_COLOR[p.status]
                  return (
                    <div
                      key={p.id}
                      className={`hg-pcard hg-fu${isSel ? ' sel' : ''}`}
                      onClick={() => panTo(p)}
                      style={{
                        background: isSel ? `${GOLD}0d` : BLACK_CARD,
                        padding: '14px 20px', position: 'relative',
                        borderTop: `2px solid ${isSel ? color : 'rgba(196,151,58,0.12)'}`,
                      }}
                    >
                      {/* Name + badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontFamily: FD, fontSize: 13, fontWeight: 700, color: WHITE, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                          {p.name}
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Venue chip */}
                      <div style={{
                        fontSize: 11, color, fontFamily: FB, fontWeight: 500, marginBottom: 4,
                        padding: '4px 8px',
                        background: `${color}0c`, border: `1px solid ${color}22`,
                        display: 'inline-block',
                      }}>
                        {p.venue}
                      </div>

                      {/* Job */}
                      <div style={{ fontSize: 10, color: WHITE_MUTED, fontFamily: FB, marginTop: 4, marginBottom: 8 }}>
                        {p.job}
                      </div>

                      {/* City + time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: WHITE_DIM, fontFamily: FB, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                          {p.city}
                        </span>
                        {p.time !== '—' && (
                          <span style={{ fontSize: 9, color: WHITE_DIM, fontFamily: FB }}>
                            In at <span style={{ color: GOLD_DIM, fontWeight: 600 }}>{p.time}</span>
                          </span>
                        )}
                      </div>

                      {isSel && (
                        <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: GOLD_PALE }}>◆</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Show more / Show less */}
              {filtered.length > PREVIEW && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '20px 32px', gap: 16,
                  borderTop: `1px solid rgba(196,151,58,0.12)`,
                  background: BLACK_CARD,
                }}>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, rgba(196,151,58,0.20))` }} />
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{
                      fontSize: 10, fontFamily: FB, fontWeight: 600,
                      letterSpacing: '0.20em', textTransform: 'uppercase',
                      color: GOLD, background: GOLD_FAINT,
                      border: `1px solid rgba(196,151,58,0.35)`,
                      padding: '9px 28px', cursor: 'pointer', transition: 'all 0.25s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,151,58,0.18)'; e.currentTarget.style.borderColor = `${GOLD}88` }}
                    onMouseLeave={e => { e.currentTarget.style.background = GOLD_FAINT; e.currentTarget.style.borderColor = 'rgba(196,151,58,0.35)' }}
                  >
                    {showAll
                      ? `↑ Show Less`
                      : `↓ Show More  (${filtered.length - PREVIEW} more)`}
                  </button>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, rgba(196,151,58,0.20), transparent)` }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}