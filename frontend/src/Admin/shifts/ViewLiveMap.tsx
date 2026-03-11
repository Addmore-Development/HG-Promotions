import { useState, useEffect } from 'react'
import { AdminLayout } from '../AdminLayout'

const G  = '#C4973A'
const B  = '#080808'
const BC = '#161616'
const BB = 'rgba(255,255,255,0.07)'
const W  = '#F4EFE6'
const WM = 'rgba(244,239,230,0.55)'
const WD = 'rgba(244,239,230,0.22)'
const FB = "'DM Sans', system-ui, sans-serif"
const FD = "'Playfair Display', Georgia, serif"

type CheckStatus = 'checked-in' | 'late' | 'absent' | 'completed'

interface Promoter {
  id:      string
  name:    string
  job:     string
  venue:   string
  city:    string
  status:  CheckStatus
  time:    string
  lat:     number
  lng:     number
}

const MOCK: Promoter[] = [
  { id: 'P01', name: 'Ayanda Dlamini',  job: 'Red Bull — Sandton',     venue: 'Sandton City',    city: 'Johannesburg', status: 'checked-in', time: '09:02', lat: 52,  lng: 140 },
  { id: 'P02', name: 'Thabo Nkosi',     job: 'Red Bull — Sandton',     venue: 'Sandton City',    city: 'Johannesburg', status: 'checked-in', time: '09:05', lat: 65,  lng: 155 },
  { id: 'P03', name: 'Nomsa Zulu',      job: 'Castle Lite — V&A',      venue: 'V&A Waterfront',  city: 'Cape Town',    status: 'late',       time: '—',     lat: 210, lng: 90  },
  { id: 'P04', name: 'Sipho Mhlongo',   job: 'Nike — Mall of Africa',  venue: 'Mall of Africa',  city: 'Johannesburg', status: 'checked-in', time: '10:01', lat: 90,  lng: 200 },
  { id: 'P05', name: 'Lerato Mokoena',  job: 'Vodacom — Greenacres',   venue: 'Greenacres Mall', city: 'Gqeberha',     status: 'absent',     time: '—',     lat: 160, lng: 310 },
  { id: 'P06', name: 'Bongani Khumalo', job: 'Savanna — Gateway',      venue: 'Gateway',         city: 'Durban',       status: 'completed',  time: '16:00', lat: 300, lng: 240 },
  { id: 'P07', name: 'Zanele Motha',    job: 'Nike — Mall of Africa',  venue: 'Mall of Africa',  city: 'Johannesburg', status: 'checked-in', time: '10:03', lat: 105, lng: 185 },
  { id: 'P08', name: 'Musa Dube',       job: 'Savanna — Gateway',      venue: 'Gateway',         city: 'Durban',       status: 'late',       time: '—',     lat: 285, lng: 255 },
]

const STATUS_COLOR: Record<CheckStatus, string> = {
  'checked-in': '#22C55E',
  'late':       '#F59E0B',
  'absent':     '#EF4444',
  'completed':  '#3A7BD5',
}

const STATUS_LABEL: Record<CheckStatus, string> = {
  'checked-in': 'Checked In',
  'late':       'Late',
  'absent':     'Absent',
  'completed':  'Completed',
}

export default function ViewLiveMap() {
  const [selected,    setSelected]    = useState<Promoter | null>(null)
  const [filterCity,  setFilterCity]  = useState<string>('all')
  const [filterStatus,setFilterStatus]= useState<CheckStatus | 'all'>('all')
  const [pulse,       setPulse]       = useState(true)

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500)
    return () => clearInterval(t)
  }, [])

  const cities  = ['all', ...Array.from(new Set(MOCK.map(p => p.city)))]
  const filtered = MOCK.filter(p =>
    (filterCity   === 'all' || p.city   === filterCity) &&
    (filterStatus === 'all' || p.status === filterStatus)
  )

  const counts = {
    'checked-in': MOCK.filter(p => p.status === 'checked-in').length,
    'late':       MOCK.filter(p => p.status === 'late').length,
    'absent':     MOCK.filter(p => p.status === 'absent').length,
    'completed':  MOCK.filter(p => p.status === 'completed').length,
  }

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>Operations</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Live Operations Map</h1>
            <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Real-time attendance across all active shifts.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', opacity: pulse ? 1 : 0.3, transition: 'opacity 0.5s' }} />
            <span style={{ fontSize: 11, color: WM }}>Live · Updated just now</span>
          </div>
        </div>

        {/* STATUS SUMMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          {(Object.keys(counts) as CheckStatus[]).map(s => (
            <div key={s} style={{ background: BC, border: `1px solid ${BB}`, padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              onMouseEnter={e => e.currentTarget.style.borderColor = STATUS_COLOR[s]}
              onMouseLeave={e => e.currentTarget.style.borderColor = filterStatus === s ? STATUS_COLOR[s] : BB}
              style={{ background: BC, border: `1px solid ${filterStatus === s ? STATUS_COLOR[s] : BB}`, padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: STATUS_COLOR[s] }} />
              <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: STATUS_COLOR[s], lineHeight: 1 }}>{counts[s]}</div>
              <div style={{ fontSize: 10, color: WM, marginTop: 6, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{STATUS_LABEL[s]}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* MAP PLACEHOLDER */}
          <div style={{ background: BC, border: `1px solid ${BB}`, position: 'relative', overflow: 'hidden', minHeight: 500 }}>

            {/* Map grid background */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(196,151,58,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,151,58,0.04) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            {/* SA outline suggestion */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 11, color: WD, letterSpacing: '0.3em', textTransform: 'uppercase' }}>South Africa · Live View</div>
            </div>

            {/* Promoter dots */}
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => setSelected(selected?.id === p.id ? null : p)}
                style={{ position: 'absolute', left: p.lng, top: p.lat, cursor: 'pointer', transform: 'translate(-50%,-50%)' }}
              >
                {/* Pulse ring for checked-in */}
                {p.status === 'checked-in' && (
                  <div style={{
                    position: 'absolute', inset: -8, borderRadius: '50%',
                    border: `1px solid ${STATUS_COLOR[p.status]}`,
                    opacity: pulse ? 0.6 : 0.1, transition: 'opacity 0.5s',
                  }} />
                )}
                <div style={{
                  width: selected?.id === p.id ? 16 : 12,
                  height: selected?.id === p.id ? 16 : 12,
                  borderRadius: '50%',
                  background: STATUS_COLOR[p.status],
                  border: `2px solid ${B}`,
                  transition: 'all 0.2s',
                  boxShadow: selected?.id === p.id ? `0 0 0 3px ${STATUS_COLOR[p.status]}44` : 'none',
                }} />
                {selected?.id === p.id && (
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: BC, border: `1px solid ${BB}`, padding: '6px 10px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: W }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: WM }}>{p.venue}</div>
                  </div>
                )}
              </div>
            ))}

            {/* City filter overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6 }}>
              {cities.map(c => (
                <button key={c} onClick={() => setFilterCity(c)} style={{
                  padding: '5px 12px', background: filterCity === c ? G : 'rgba(8,8,8,0.8)',
                  border: `1px solid ${filterCity === c ? G : BB}`,
                  color: filterCity === c ? B : WM, fontFamily: FB, fontSize: 10,
                  fontWeight: 600, cursor: 'pointer', letterSpacing: '0.08em',
                  textTransform: 'capitalize',
                }}>
                  {c === 'all' ? 'All Cities' : c}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(8,8,8,0.88)', border: `1px solid ${BB}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(Object.keys(STATUS_COLOR) as CheckStatus[]).map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[s] }} />
                  <span style={{ fontSize: 10, color: WM, letterSpacing: '0.05em' }}>{STATUS_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PROMOTER LIST */}
          <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${BB}` }}>
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: G }}>Active Promoters</div>
              <div style={{ fontSize: 12, color: WM, marginTop: 4 }}>{filtered.length} showing</div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.map((p, i) => (
                <div key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  style={{
                    padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${BB}` : 'none',
                    cursor: 'pointer', background: selected?.id === p.id ? 'rgba(196,151,58,0.07)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== p.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (selected?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: W }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: WM, marginTop: 2 }}>{p.venue}</div>
                      <div style={{ fontSize: 10, color: WD, marginTop: 2 }}>{p.job}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[p.status], background: `${STATUS_COLOR[p.status]}18`, padding: '3px 8px', borderRadius: 2 }}>
                        {STATUS_LABEL[p.status]}
                      </span>
                      {p.time !== '—' && <div style={{ fontSize: 10, color: WD, marginTop: 5 }}>In at {p.time}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}