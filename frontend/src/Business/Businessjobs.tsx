import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

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
const BB    = 'rgba(212,136,10,0.16)'
const BB2   = 'rgba(212,136,10,0.08)'
const W     = '#FAF3E8'
const W8    = 'rgba(250,243,232,0.85)'
const W7    = 'rgba(250,243,232,0.70)'
const W4    = 'rgba(250,243,232,0.40)'
const W2    = 'rgba(250,243,232,0.20)'
const FD    = "'Playfair Display', Georgia, serif"
const FB    = "'DM Sans', system-ui, sans-serif"

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
function authHdr(): Record<string, string> {
  const t = localStorage.getItem('hg_token')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}
function hex2rgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

interface ApiJob {
  id: string; title: string; client: string; venue: string; address: string
  date: string; startTime: string; endTime: string; hourlyRate: number
  totalSlots: number; filledSlots: number; status: string; filters?: any
  applications?: any[]
}

interface Promoter {
  id: string; fullName: string; email: string; phone?: string
  city?: string; reliabilityScore?: number
  profilePhotoUrl?: string; headshotUrl?: string; fullBodyPhotoUrl?: string
  height?: number; clothingSize?: string; gender?: string
  appStatus?: string | null; appId?: string
}

// ─── Promoter Profile Modal ───────────────────────────────────────────────────
function PromoterModal({ promoter, onClose, onSelect, isSelected, canSelect }: {
  promoter: Promoter; onClose: () => void
  onSelect: () => void; isSelected: boolean; canSelect: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BLK2, border: `1px solid ${BB}`, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: 4 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GD3}, ${GL}, ${GD3})` }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 18 }}>✕</button>

        <div style={{ padding: '32px 32px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 16 }}>Promoter Profile</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            {/* Headshot */}
            <div style={{ flexShrink: 0 }}>
              {promoter.headshotUrl ? (
                <img src={promoter.headshotUrl} alt="Headshot" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GL}` }} />
              ) : (
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: hex2rgba(GL, 0.12), border: `2px solid ${BB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: GL, fontFamily: FD, fontWeight: 700 }}>
                  {promoter.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: W, marginBottom: 4 }}>{promoter.fullName}</div>
              <div style={{ fontSize: 12, color: W4, fontFamily: FB, marginBottom: 8 }}>{promoter.email}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {promoter.city && (
                  <span style={{ fontSize: 10, color: GL, background: BB, padding: '3px 10px', borderRadius: 2, fontFamily: FD, fontWeight: 700 }}>📍 {promoter.city}</span>
                )}
                {(promoter.reliabilityScore ?? 0) > 0 && (
                  <span style={{ fontSize: 10, color: GL2, background: hex2rgba(GL2, 0.1), padding: '3px 10px', borderRadius: 2, fontFamily: FD, fontWeight: 700 }}>⭐ {(promoter.reliabilityScore ?? 0).toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Photos row */}
          {(promoter.headshotUrl || promoter.fullBodyPhotoUrl || promoter.profilePhotoUrl) && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 12 }}>Photos</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {promoter.headshotUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: W4, fontFamily: FB, marginBottom: 6, letterSpacing: '0.1em' }}>HEADSHOT</div>
                    <img src={promoter.headshotUrl} alt="Headshot" style={{ width: '100%', height: 160, objectFit: 'cover', objectPosition: 'top', border: `1px solid ${BB}` }} />
                  </div>
                )}
                {promoter.fullBodyPhotoUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: W4, fontFamily: FB, marginBottom: 6, letterSpacing: '0.1em' }}>FULL BODY</div>
                    <img src={promoter.fullBodyPhotoUrl} alt="Full Body" style={{ width: '100%', height: 160, objectFit: 'cover', objectPosition: 'top', border: `1px solid ${BB}` }} />
                  </div>
                )}
                {!promoter.headshotUrl && !promoter.fullBodyPhotoUrl && promoter.profilePhotoUrl && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: W4, fontFamily: FB, marginBottom: 6, letterSpacing: '0.1em' }}>PROFILE PHOTO</div>
                    <img src={promoter.profilePhotoUrl} alt="Profile" style={{ width: '100%', height: 160, objectFit: 'cover', border: `1px solid ${BB}` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div style={{ marginBottom: 24 }}>
            {[
              { label: 'Phone',     value: promoter.phone || '—' },
              { label: 'Gender',    value: promoter.gender || '—' },
              { label: 'Height',    value: promoter.height ? `${promoter.height} cm` : '—' },
              { label: 'Clothing',  value: promoter.clothingSize || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BB}` }}>
                <span style={{ fontSize: 12, color: W4, fontFamily: FD }}>{row.label}</span>
                <span style={{ fontSize: 12, color: W, fontWeight: 700, fontFamily: FD }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {isSelected ? (
            <div style={{ padding: '12px 16px', background: hex2rgba(GL, 0.08), border: `1px solid ${hex2rgba(GL, 0.4)}`, fontSize: 12, color: GL, fontFamily: FD, textAlign: 'center' }}>
              ✓ Selected for this job
            </div>
          ) : canSelect ? (
            <button onClick={() => { onSelect(); onClose() }}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: BLK, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ✓ Select for This Job
            </button>
          ) : (
            <div style={{ padding: '12px 16px', background: BB, border: `1px solid ${BB}`, fontSize: 12, color: W4, fontFamily: FD, textAlign: 'center' }}>
              Job slots are full
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onOpen }: { job: ApiJob; onOpen: () => void }) {
  const isFull = job.filledSlots >= job.totalSlots
  const statusColor = job.status === 'OPEN' ? GL : job.status === 'FILLED' ? GD : W4
  const pct = job.totalSlots > 0 ? Math.round((job.filledSlots / job.totalSlots) * 100) : 0

  return (
    <div onClick={onOpen}
      style={{ background: BLK2, border: `1px solid ${BB}`, padding: '22px 24px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', borderRadius: 3 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hex2rgba(GL, 0.4); (e.currentTarget as HTMLElement).style.background = BLK3 }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BB; (e.currentTarget as HTMLElement).style.background = BLK2 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GD3}, ${statusColor}, ${GD3})` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
          <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>📍 {job.venue || job.address}</div>
        </div>
        <span style={{ flexShrink: 0, marginLeft: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: statusColor, background: hex2rgba(statusColor, 0.1), border: `1px solid ${hex2rgba(statusColor, 0.4)}`, padding: '3px 10px', borderRadius: 2, fontFamily: FD }}>
          {job.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, color: W2, fontFamily: FB, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>Rate</div>
          <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: GL }}>R{job.hourlyRate}/hr</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: W2, fontFamily: FB, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>Slots</div>
          <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: W }}>{job.filledSlots}/{job.totalSlots}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: W2, fontFamily: FB, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>Date</div>
          <div style={{ fontSize: 12, color: W7, fontFamily: FB }}>
            {job.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: W2, fontFamily: FB, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 3 }}>Time</div>
          <div style={{ fontSize: 12, color: W7, fontFamily: FB }}>{job.startTime}–{job.endTime}</div>
        </div>
      </div>

      {/* Fill bar */}
      <div style={{ height: 3, background: BB, borderRadius: 2, marginBottom: 14 }}>
        <div style={{ height: '100%', borderRadius: 2, background: isFull ? GD : GL, width: `${pct}%`, transition: 'width 0.4s' }} />
      </div>

      <button style={{ width: '100%', padding: '10px', background: BB, border: `1px solid ${BB}`, color: GL, fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = hex2rgba(GL, 0.14); e.currentTarget.style.borderColor = hex2rgba(GL, 0.4) }}
        onMouseLeave={e => { e.currentTarget.style.background = BB; e.currentTarget.style.borderColor = BB }}>
        View Details & Select Promoters →
      </button>
    </div>
  )
}

// ─── Job Detail + Promoter Selection Panel ────────────────────────────────────
function JobDetailPanel({ job, onClose }: { job: ApiJob; onClose: () => void }) {
  const [promoters,     setPromoters]     = useState<Promoter[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Set<string>>(new Set())
  const [saving,        setSaving]        = useState(false)
  const [savedMsg,      setSavedMsg]      = useState('')
  const [viewPromoter,  setViewPromoter]  = useState<Promoter | null>(null)
  const [cityFilter,    setCityFilter]    = useState('all')

  // Load eligible promoters + existing applications
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [promoRes, appRes] = await Promise.all([
          fetch(`${API}/users/promoters/eligible?jobId=${job.id}`, { headers: authHdr() as any }),
          fetch(`${API}/applications/job/${job.id}`, { headers: authHdr() as any }),
        ])
        const promos: any[] = promoRes.ok ? await promoRes.json() : []
        const apps:   any[] = appRes.ok   ? await appRes.json()   : []
        const appMap = new Map(apps.map((a: any) => [a.promoterId, a]))

        const merged: Promoter[] = promos.map(p => ({
          id:               p.id,
          fullName:         p.fullName,
          email:            p.email,
          phone:            p.phone,
          city:             p.city,
          reliabilityScore: p.reliabilityScore || 0,
          profilePhotoUrl:  p.profilePhotoUrl,
          headshotUrl:      p.headshotUrl,
          fullBodyPhotoUrl: p.fullBodyPhotoUrl,
          height:           p.height,
          clothingSize:     p.clothingSize,
          gender:           p.gender,
          appStatus:        appMap.get(p.id)?.status || null,
          appId:            appMap.get(p.id)?.id,
        }))

        setPromoters(merged)
        // Pre-select already allocated
        const alreadySelected = new Set(
          merged.filter(p => p.appStatus === 'ALLOCATED').map(p => p.id)
        )
        setSelected(alreadySelected)
      } catch (e) {
        console.error('Load eligible promoters failed', e)
      }
      setLoading(false)
    }
    load()
  }, [job.id])

  const slotsAvailable = job.totalSlots - job.filledSlots
  const canSelectMore  = selected.size < job.totalSlots

  const toggleSelect = (promoterId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(promoterId)) next.delete(promoterId)
      else if (next.size < job.totalSlots) next.add(promoterId)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSavedMsg('')
    try {
      // For each selected, create application if not existing
      for (const pid of selected) {
        const promo = promoters.find(p => p.id === pid)
        if (!promo) continue
        if (promo.appId && promo.appStatus === 'ALLOCATED') continue // already done
        if (promo.appId) {
          // Update existing to ALLOCATED
          await fetch(`${API}/applications/${promo.appId}/status`, {
            method: 'PUT', headers: authHdr() as any,
            body: JSON.stringify({ status: 'ALLOCATED' }),
          })
        } else {
          // Create new application
          await fetch(`${API}/applications`, {
            method: 'POST', headers: authHdr() as any,
            body: JSON.stringify({ jobId: job.id, promoterId: pid }),
          })
        }
      }
      setSavedMsg('✓ Selection saved successfully')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (e) {
      setSavedMsg('Failed to save — please try again')
    }
    setSaving(false)
  }

  const cities = ['all', ...Array.from(new Set(promoters.map(p => p.city).filter(Boolean)))]
  const filtered = promoters.filter(p => cityFilter === 'all' || p.city === cityFilter)

  // Job venue city for highlighting
  const jobCity = job.address?.split(',')[0]?.trim()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 9000 }}>
      <div style={{ background: BLK1, borderLeft: `1px solid ${BB}`, width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${BB}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: GL, fontFamily: FD, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 6 }}>Job Details</div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: W }}>{job.title}</div>
              <div style={{ fontSize: 12, color: W4, fontFamily: FB, marginTop: 4 }}>📍 {job.venue || job.address} · R{job.hourlyRate}/hr · {job.totalSlots} slots</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 20 }}>✕</button>
          </div>

          {/* Slot progress */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ flex: 1, height: 4, background: BB, borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${GD3}, ${GL})`, width: `${Math.round(selected.size / job.totalSlots * 100)}%`, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, color: GL, fontFamily: FD, fontWeight: 700, flexShrink: 0 }}>{selected.size}/{job.totalSlots} selected</span>
          </div>

          {/* City filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cities.map(c => (
              <button key={c} onClick={() => setCityFilter(c)}
                style={{ padding: '4px 12px', background: cityFilter === c ? hex2rgba(GL, 0.16) : 'transparent', border: `1px solid ${cityFilter === c ? GL : BB}`, color: cityFilter === c ? GL : W4, fontFamily: FD, fontSize: 9, fontWeight: cityFilter === c ? 700 : 400, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s', letterSpacing: '0.1em' }}>
                {c === 'all' ? 'All Cities' : c}
                {c !== 'all' && c === jobCity && <span style={{ marginLeft: 4, color: GL2 }}>●</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Promoter list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>Loading promoters…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>No approved promoters found.</div>
          ) : (
            <>
              <div style={{ padding: '12px 28px 8px', fontSize: 9, color: W2, fontFamily: FD, letterSpacing: '0.2em', textTransform: 'uppercase', borderBottom: `1px solid ${BB}` }}>
                {filtered.length} promoter{filtered.length !== 1 ? 's' : ''} · sorted by location match then reliability
              </div>
              {filtered.map((p, i) => {
                const isSel     = selected.has(p.id)
                const isAlready = p.appStatus === 'ALLOCATED'
                const cityMatch = jobCity && p.city?.toLowerCase().includes(jobCity.toLowerCase())
                const accent    = isSel ? GL : isAlready ? GD : W4

                return (
                  <div key={p.id}
                    style={{ padding: '16px 28px', borderBottom: `1px solid ${BB}`, background: isSel ? hex2rgba(GL, 0.04) : 'transparent', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.18s' }}
                    onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = BB }}
                    onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

                    {/* Avatar / headshot */}
                    <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${hex2rgba(accent, 0.5)}`, cursor: 'pointer' }}
                      onClick={() => setViewPromoter(p)}>
                      {p.headshotUrl || p.profilePhotoUrl ? (
                        <img src={p.headshotUrl || p.profilePhotoUrl} alt={p.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: hex2rgba(GL, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: GL, fontFamily: FD }}>
                          {p.fullName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD }}>{p.fullName}</span>
                        {cityMatch && <span style={{ fontSize: 9, color: GL2, background: hex2rgba(GL2, 0.1), padding: '2px 7px', borderRadius: 2, fontFamily: FD, fontWeight: 700 }}>LOCAL</span>}
                        {isAlready && <span style={{ fontSize: 9, color: GD, background: hex2rgba(GD, 0.1), padding: '2px 7px', borderRadius: 2, fontFamily: FD, fontWeight: 700 }}>ALLOCATED</span>}
                      </div>
                      <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>
                        {p.city || '—'}
                        {(p.reliabilityScore ?? 0) > 0 && <span style={{ marginLeft: 10, color: GL }}>⭐ {(p.reliabilityScore ?? 0).toFixed(1)}</span>}
                        {p.height && <span style={{ marginLeft: 10, color: W2 }}>{p.height}cm</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      <button onClick={() => setViewPromoter(p)}
                        style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${BB}`, color: W4, fontFamily: FD, fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = GL; e.currentTarget.style.color = GL }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = W4 }}>
                        View
                      </button>
                      <button onClick={() => toggleSelect(p.id)}
                        style={{ padding: '6px 14px', background: isSel ? `linear-gradient(135deg, ${GL}, ${GD})` : 'transparent', border: `1px solid ${isSel ? GL : hex2rgba(GL, 0.35)}`, color: isSel ? BLK : GL, fontFamily: FD, fontSize: 9, fontWeight: 700, cursor: (canSelectMore || isSel) ? 'pointer' : 'not-allowed', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.2s', opacity: (!canSelectMore && !isSel) ? 0.4 : 1 }}
                        disabled={!canSelectMore && !isSel}>
                        {isSel ? '✓ Selected' : '+ Select'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer save */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${BB}`, flexShrink: 0, background: BLK, display: 'flex', gap: 12, alignItems: 'center' }}>
          {savedMsg && <span style={{ flex: 1, fontSize: 12, color: savedMsg.startsWith('✓') ? GL : GD2, fontFamily: FD }}>{savedMsg}</span>}
          {!savedMsg && <span style={{ flex: 1, fontSize: 11, color: W2, fontFamily: FB }}>{selected.size} of {job.totalSlots} slots filled</span>}
          <button onClick={handleSave} disabled={saving || selected.size === 0}
            style={{ padding: '11px 28px', background: selected.size > 0 ? `linear-gradient(135deg, ${GL}, ${GD})` : BB, border: 'none', color: selected.size > 0 ? BLK : W4, fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: selected.size > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {saving ? 'Saving…' : 'Save Selection'}
          </button>
        </div>
      </div>

      {viewPromoter && (
        <PromoterModal
          promoter={viewPromoter}
          onClose={() => setViewPromoter(null)}
          onSelect={() => toggleSelect(viewPromoter.id)}
          isSelected={selected.has(viewPromoter.id)}
          canSelect={canSelectMore || selected.has(viewPromoter.id)}
        />
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BusinessJobs() {
  const navigate  = useNavigate()
  const [jobs,     setJobs]     = useState<ApiJob[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | 'OPEN' | 'FILLED' | 'COMPLETED' | 'CANCELLED'>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<ApiJob | null>(null)
  const [session,  setSession]  = useState<any>(null)

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) setSession(JSON.parse(s))
  }, [])

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/jobs?status=all`, { headers: authHdr() as any })
      if (res.ok) {
        const data: ApiJob[] = await res.json()
        setJobs(data)
      }
    } catch (e) {
      console.error('Failed to load jobs', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadJobs() }, [loadJobs])

  const filtered = jobs.filter(j => {
    const sm = filter === 'all' || j.status === filter
    const qm = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.client?.toLowerCase().includes(search.toLowerCase())
    return sm && qm
  })

  const counts = {
    all:       jobs.length,
    OPEN:      jobs.filter(j => j.status === 'OPEN').length,
    FILLED:    jobs.filter(j => j.status === 'FILLED').length,
    COMPLETED: jobs.filter(j => j.status === 'COMPLETED').length,
    CANCELLED: jobs.filter(j => j.status === 'CANCELLED').length,
  }

  const statusColor = (s: string) => s === 'OPEN' ? GL : s === 'FILLED' ? GD : s === 'COMPLETED' ? GD2 : W4

  return (
    <div>
      <div className="biz-page" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Operations · Jobs</div>
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: W, lineHeight: 1.1 }}>Campaign Jobs</h1>
        <p style={{ fontSize: 13, color: W4, marginTop: 6, fontFamily: FB }}>
          Jobs posted for your business. Select eligible promoters for each campaign.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 28 }}>
        {[
          { label: 'Total Jobs',  value: counts.all,       color: GL },
          { label: 'Open',        value: counts.OPEN,      color: GL },
          { label: 'Filled',      value: counts.FILLED,    color: GD },
          { label: 'Completed',   value: counts.COMPLETED, color: GD2 },
        ].map((s, i) => (
          <div key={i} className="biz-page" style={{ background: BLK2, padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, ${hex2rgba(s.color, 0.3)})` }} />
            <div style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: W4, marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FD }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'OPEN', 'FILLED', 'COMPLETED', 'CANCELLED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', background: filter === f ? hex2rgba(f === 'all' ? GL : statusColor(f), 0.14) : 'transparent', border: `1px solid ${filter === f ? (f === 'all' ? GL : statusColor(f)) : BB}`, color: filter === f ? (f === 'all' ? GL : statusColor(f)) : W4, fontFamily: FD, fontSize: 9, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.18s' }}>
              {f === 'all' ? `All (${counts.all})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${counts[f]})`}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: W2, fontSize: 12, pointerEvents: 'none' }}>⌕</span>
          <input placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: BLK2, border: `1px solid ${BB}`, padding: '7px 14px 7px 30px', color: W, fontFamily: FB, fontSize: 11, outline: 'none', borderRadius: 2, width: 200 }}
            onFocus={e => e.currentTarget.style.borderColor = GL}
            onBlur={e => e.currentTarget.style.borderColor = BB} />
        </div>
      </div>

      {/* Jobs grid */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: W4, fontFamily: FD }}>Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: `1px dashed ${BB}` }}>
          <p style={{ fontFamily: FD, fontSize: 20, color: W4, marginBottom: 8 }}>No jobs found</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>
            {jobs.length === 0 ? 'No jobs have been posted for your business yet. Contact your Honey Group account manager.' : 'No jobs match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {filtered.map(job => (
            <JobCard key={job.id} job={job} onOpen={() => setSelected(job)} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: W2, fontFamily: FB }}>
        Showing <strong style={{ color: W4 }}>{filtered.length}</strong> of <strong style={{ color: W4 }}>{jobs.length}</strong> jobs
      </div>

      {selected && (
        <JobDetailPanel job={selected} onClose={() => { setSelected(null); loadJobs() }} />
      )}
    </div>
  )
}