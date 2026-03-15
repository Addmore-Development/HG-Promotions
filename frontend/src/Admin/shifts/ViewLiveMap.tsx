import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Palette (unchanged) ──────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const B   = '#0C0A07'
const D1  = '#0E0C06'
const D2  = '#151209'
const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'
const W   = '#FAF3E8'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type CheckStatus = 'checked-in' | 'late' | 'absent' | 'completed'

interface LivePromoter {
  id: string; name: string; job: string; venue: string
  city: string; status: CheckStatus; time: string
  lat: number; lng: number
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  'checked-in': GL,
  'late':       G4,
  'absent':     '#E8D5A8',
  'completed':  G3,
}
const STATUS_BG: Record<CheckStatus, string> = {
  'checked-in': hex2rgba(GL, 0.12),
  'late':       hex2rgba(G4, 0.12),
  'absent':     hex2rgba('#8B6840', 0.22),
  'completed':  hex2rgba(G3, 0.12),
}
const STATUS_BORDER: Record<CheckStatus, string> = {
  'checked-in': hex2rgba(GL, 0.45),
  'late':       hex2rgba(G4, 0.42),
  'absent':     hex2rgba('#8B6840', 0.55),
  'completed':  hex2rgba(G3, 0.45),
}
const STATUS_LABEL: Record<CheckStatus, string> = {
  'checked-in': 'Checked In',
  'late':       'Late',
  'absent':     'Absent',
  'completed':  'Completed',
}

function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color:STATUS_COLOR[status], background:STATUS_BG[status], border:`1px solid ${STATUS_BORDER[status]}`, padding:'3px 8px', borderRadius:3 }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function StatCard({ count, label, status, active, onClick }: { count:number; label:string; status:CheckStatus; active:boolean; onClick:()=>void }) {
  const color = STATUS_COLOR[status]
  return (
    <div onClick={onClick}
      style={{ background:'rgba(20,16,5,0.6)', padding:'18px 20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'all 0.2s', borderRadius:2, border:`1px solid ${active?color:BB}` }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${hex2rgba(color,0.3)})` }} />
      <div style={{ fontFamily:FD, fontSize:32, fontWeight:700, color, lineHeight:1 }}>{count}</div>
      <div style={{ fontSize:9, color:W55, marginTop:8, letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:FD }}>{label}</div>
    </div>
  )
}

// ─── Google Maps loader ───────────────────────────────────────────────────────
declare global {
  interface Window {
    google: any
    initHGMap: () => void
  }
}

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    if (document.getElementById('hg-gmaps-script')) {
      // Already loading — wait
      const interval = setInterval(() => {
        if (window.google?.maps) { clearInterval(interval); resolve() }
      }, 100)
      return
    }
    window.initHGMap = () => resolve()
    const script = document.createElement('script')
    script.id  = 'hg-gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&callback=initHGMap`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Google Maps failed to load'))
    document.head.appendChild(script)
  })
}

// ─── Map styles — dark gold theme ─────────────────────────────────────────────
const MAP_STYLES = [
  { elementType:'geometry',       stylers:[{ color:'#0C0A07' }] },
  { elementType:'labels.text.stroke', stylers:[{ color:'#0C0A07' }] },
  { elementType:'labels.text.fill',   stylers:[{ color:'#6B4F1A' }] },
  { featureType:'administrative',     elementType:'geometry', stylers:[{ color:'#1C1709' }] },
  { featureType:'administrative.country', elementType:'labels.text.fill', stylers:[{ color:'#9D8A5A' }] },
  { featureType:'administrative.province', elementType:'labels.text.fill', stylers:[{ color:'#7A6535' }] },
  { featureType:'landscape',      stylers:[{ color:'#0E0C06' }] },
  { featureType:'poi',            stylers:[{ visibility:'off' }] },
  { featureType:'road',           elementType:'geometry', stylers:[{ color:'#1C1709' }] },
  { featureType:'road',           elementType:'geometry.stroke', stylers:[{ color:'#0E0C06' }] },
  { featureType:'road',           elementType:'labels.text.fill', stylers:[{ color:'#5A4520' }] },
  { featureType:'road.highway',   elementType:'geometry', stylers:[{ color:'#2A1F08' }] },
  { featureType:'road.highway',   elementType:'geometry.stroke', stylers:[{ color:'#1A1305' }] },
  { featureType:'road.highway',   elementType:'labels.text.fill', stylers:[{ color:'#D4880A' }] },
  { featureType:'transit',        stylers:[{ visibility:'off' }] },
  { featureType:'water',          elementType:'geometry', stylers:[{ color:'#040503' }] },
  { featureType:'water',          elementType:'labels.text.fill', stylers:[{ color:'#2A2008' }] },
]

export default function ViewLiveMap() {
  const mapRef        = useRef<HTMLDivElement>(null)
  const mapInstance   = useRef<any>(null)
  const markersRef    = useRef<Map<string, any>>(new Map())
  const infoWindowRef = useRef<any>(null)

  const [promoters,    setPromoters   ] = useState<LivePromoter[]>([])
  const [selected,     setSelected    ] = useState<LivePromoter | null>(null)
  const [filterStatus, setFilterStatus] = useState<CheckStatus | 'all'>('all')
  const [mapReady,     setMapReady    ] = useState(false)
  const [mapError,     setMapError    ] = useState('')
  const [pulse,        setPulse       ] = useState(true)
  const [lastUpdated,  setLastUpdated ] = useState<Date>(new Date())

  // ── Pulse animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  // ── Load promoter data from API ───────────────────────────────────────────────
  const loadPromoters = useCallback(async () => {
    try {
      const token = localStorage.getItem('hg_token')
      const [shiftsRes, usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shifts/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shifts/live-locations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const shifts: any[] = shiftsRes.ok ? await shiftsRes.json() : []
      const liveLocations: any[] = usersRes.ok ? await usersRes.json() : []

      // Build a map of userId → live location
      const locMap = new Map(liveLocations.map((l: any) => [l.userId, l]))

      // Today's date for late/absent logic
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const today = shifts.filter((s: any) => {
        const jobDate = s.job?.date ? new Date(s.job.date) : null
        return jobDate && jobDate >= todayStart
      })

      const result: LivePromoter[] = today.map((s: any) => {
        const loc = locMap.get(s.promoterId)
        const rawStatus = s.status?.toLowerCase() || ''

        let checkStatus: CheckStatus = 'absent'
        if (rawStatus === 'checked_in' || rawStatus === 'checked-in') checkStatus = 'checked-in'
        else if (rawStatus === 'approved' || rawStatus === 'pending_approval') checkStatus = 'completed'
        else if (rawStatus === 'scheduled') {
          // Check if they're late (job start time passed by > 15 min)
          const jobDate = s.job?.date ? new Date(s.job.date) : null
          const startTime = s.job?.startTime || '09:00'
          if (jobDate) {
            const [h, m] = startTime.split(':').map(Number)
            const jobStart = new Date(jobDate)
            jobStart.setHours(h, m, 0, 0)
            const nowMs = Date.now()
            checkStatus = nowMs - jobStart.getTime() > 15 * 60 * 1000 ? 'late' : 'absent'
          }
        }

        return {
          id:     s.promoterId,
          name:   s.promoter?.fullName || 'Unknown Promoter',
          job:    s.job?.title  || 'Unknown Job',
          venue:  s.job?.venue  || 'Unknown Venue',
          city:   s.job?.address?.split(',')[0] || '',
          status: checkStatus,
          time:   s.checkInTime
            ? new Date(s.checkInTime).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })
            : '—',
          lat: loc?.lat ?? s.job?.lat ?? -26.2041,
          lng: loc?.lng ?? s.job?.lng ?? 28.0473,
        }
      })

      setPromoters(result)
      setLastUpdated(new Date())
    } catch (e) {
      console.warn('Live map: using offline data', e)
    }
  }, [])

  useEffect(() => {
    loadPromoters()
    const interval = setInterval(loadPromoters, 30_000) // refresh every 30s
    return () => clearInterval(interval)
  }, [loadPromoters])

  // ── Init Google Map ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center:            { lat: -29.0, lng: 25.0 }, // Centre of SA
          zoom:              6,
          styles:            MAP_STYLES,
          disableDefaultUI:  false,
          zoomControl:       true,
          mapTypeControl:    false,
          streetViewControl: false,
          fullscreenControl: true,
        })
        infoWindowRef.current = new window.google.maps.InfoWindow()
        setMapReady(true)
      })
      .catch(() => setMapError('Google Maps unavailable. Set VITE_GOOGLE_MAPS_KEY in your .env'))
  }, [])

  // ── Update markers whenever promoters or filter change ────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    const filtered = promoters.filter(p =>
      filterStatus === 'all' || p.status === filterStatus
    )

    // Remove old markers not in filtered set
    const filteredIds = new Set(filtered.map(p => p.id))
    markersRef.current.forEach((marker, id) => {
      if (!filteredIds.has(id)) { marker.setMap(null); markersRef.current.delete(id) }
    })

    // Add / update markers
    filtered.forEach(p => {
      const color = STATUS_COLOR[p.status]
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22S28 23.63 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="#0C0A07" stroke-width="1.5"/>
          <circle cx="14" cy="14" r="5" fill="#0C0A07" opacity="0.6"/>
        </svg>
      `
      const icon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
        scaledSize: new window.google.maps.Size(28, 36),
        anchor:     new window.google.maps.Point(14, 36),
      }

      if (markersRef.current.has(p.id)) {
        const existing = markersRef.current.get(p.id)
        existing.setPosition({ lat: p.lat, lng: p.lng })
        existing.setIcon(icon)
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map:      mapInstance.current,
          icon,
          title:    p.name,
          animation: window.google.maps.Animation.DROP,
        })
        marker.addListener('click', () => {
          setSelected(p)
          infoWindowRef.current?.setContent(`
            <div style="background:#151209;color:#FAF3E8;padding:10px 14px;font-family:'DM Sans',sans-serif;min-width:160px;border-radius:4px;">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${p.name}</div>
              <div style="font-size:11px;color:#D4880A;margin-bottom:2px;">${p.venue}</div>
              <div style="font-size:10px;color:rgba(250,243,232,0.55);">${p.job}</div>
              <div style="font-size:10px;margin-top:6px;color:${color};font-weight:600;">${STATUS_LABEL[p.status]}${p.time !== '—' ? ' · In at ' + p.time : ''}</div>
            </div>
          `)
          infoWindowRef.current?.open(mapInstance.current, marker)
        })
        markersRef.current.set(p.id, marker)
      }
    })
  }, [promoters, filterStatus, mapReady])

  const filtered = promoters.filter(p => filterStatus === 'all' || p.status === filterStatus)
  const counts: Record<CheckStatus, number> = {
    'checked-in': promoters.filter(p => p.status === 'checked-in').length,
    'late':       promoters.filter(p => p.status === 'late').length,
    'absent':     promoters.filter(p => p.status === 'absent').length,
    'completed':  promoters.filter(p => p.status === 'completed').length,
  }

  return (
    <AdminLayout>
      <div style={{ padding:'40px 48px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Operations · Live</div>
            <h1 style={{ fontFamily:FD, fontSize:30, fontWeight:700, color:W }}>Live Operations Map</h1>
            <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Real-time attendance across all active shifts.</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:GL, opacity:pulse?1:0.25, transition:'opacity 0.5s' }} />
              <span style={{ fontSize:11, color:W55, fontFamily:FD }}>Live · {lastUpdated.toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            <button onClick={loadPromoters} style={{ fontSize:10, color:GL, background:'none', border:`1px solid ${BB}`, padding:'5px 12px', cursor:'pointer', fontFamily:FD, borderRadius:3 }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* STATUS SUMMARY CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:28 }}>
          {(Object.keys(counts) as CheckStatus[]).map(s => (
            <StatCard key={s} count={counts[s]} label={STATUS_LABEL[s]} status={s} active={filterStatus===s} onClick={()=>setFilterStatus(filterStatus===s?'all':s)} />
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>

          {/* MAP PANEL */}
          <div style={{ background:D2, border:`1px solid ${BB}`, position:'relative', overflow:'hidden', minHeight:520, borderRadius:4 }}>

            {/* Filter pills on top of map */}
            <div style={{ position:'absolute', top:14, left:14, zIndex:10, display:'flex', gap:6, flexWrap:'wrap' }}>
              {(['all','checked-in','late','absent','completed'] as const).map(s => (
                <button key={s} onClick={()=>setFilterStatus(s)}
                  style={{ padding:'5px 12px', background:filterStatus===s?hex2rgba(STATUS_COLOR[s as CheckStatus]||GL,0.22):'rgba(12,10,7,0.85)', border:`1px solid ${filterStatus===s?(STATUS_COLOR[s as CheckStatus]||GL):'rgba(212,136,10,0.22)'}`, color:filterStatus===s?(STATUS_COLOR[s as CheckStatus]||GL):W55, fontFamily:FD, fontSize:10, cursor:'pointer', letterSpacing:'0.08em', borderRadius:3 }}>
                  {s === 'all' ? 'All' : STATUS_LABEL[s as CheckStatus]}
                </button>
              ))}
            </div>

            {/* Google Map container */}
            <div ref={mapRef} style={{ width:'100%', height:'100%', minHeight:520 }} />

            {/* Error state */}
            {mapError && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:D2, gap:12 }}>
                <div style={{ fontSize:28 }}>🗺️</div>
                <div style={{ fontSize:13, color:W55, fontFamily:FD, textAlign:'center', maxWidth:300, lineHeight:1.6 }}>{mapError}</div>
                <div style={{ fontSize:10, color:W28, fontFamily:FD }}>Add VITE_GOOGLE_MAPS_KEY to frontend/.env</div>
              </div>
            )}

            {/* No promoters */}
            {!mapError && mapReady && promoters.length === 0 && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', gap:8 }}>
                <div style={{ fontSize:22, color:W28, fontFamily:FD }}>No active shifts today</div>
                <div style={{ fontSize:12, color:W28, fontFamily:FD }}>Promoters who check in will appear as pins on the map</div>
              </div>
            )}

            {/* Legend */}
            <div style={{ position:'absolute', bottom:14, right:14, background:'rgba(10,8,4,0.92)', border:`1px solid ${BB}`, padding:'12px 16px', display:'flex', flexDirection:'column', gap:7, borderRadius:3, zIndex:5 }}>
              {(Object.keys(STATUS_COLOR) as CheckStatus[]).map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[s], flexShrink:0 }} />
                  <span style={{ fontSize:10, color:W55, letterSpacing:'0.05em', fontFamily:FD }}>{STATUS_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PROMOTER LIST */}
          <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${BB}`, background:D1 }}>
              <div style={{ fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>Active Promoters</div>
              <div style={{ fontSize:12, color:W55, marginTop:4, fontFamily:FD }}>{filtered.length} showing</div>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {filtered.map((p, i) => (
                <div key={p.id}
                  onClick={() => {
                    setSelected(selected?.id===p.id ? null : p)
                    if (mapReady && mapInstance.current && p.lat && p.lng) {
                      mapInstance.current.panTo({ lat: p.lat, lng: p.lng })
                      mapInstance.current.setZoom(13)
                      markersRef.current.get(p.id)?.animateIdle?.()
                      window.google?.maps?.event?.trigger(markersRef.current.get(p.id), 'click')
                    }
                  }}
                  style={{ padding:'14px 20px', borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', cursor:'pointer', background:selected?.id===p.id?hex2rgba(GL,0.06):'transparent', transition:'background 0.18s' }}
                  onMouseEnter={e=>{ if(selected?.id!==p.id) e.currentTarget.style.background=BB2 }}
                  onMouseLeave={e=>{ if(selected?.id!==p.id) e.currentTarget.style.background='transparent' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{p.name}</div>
                      <div style={{ fontSize:11, color:W55, marginTop:2, fontFamily:FD }}>{p.venue}</div>
                      <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD }}>{p.job}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <StatusBadge status={p.status} />
                      {p.time !== '—' && <div style={{ fontSize:10, color:W28, marginTop:6, fontFamily:FD }}>In at {p.time}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding:40, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>
                  {promoters.length === 0 ? 'No active shifts today.' : 'No promoters match this filter.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}