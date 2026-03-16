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
function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BLK2, border: `1px solid ${BB}`, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: 4 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GD3}, ${GL}, ${GD3})` }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 18 }}>✕</button>
        <div style={{ padding: '32px 32px 0' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 16 }}>Promoter Profile</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
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
                {promoter.city && <span style={{ fontSize: 10, color: W7, background: BB, padding: '3px 10px', borderRadius: 2, fontFamily: FB }}>📍 {promoter.city}</span>}
                {(promoter.reliabilityScore ?? 0) > 0 && <span style={{ fontSize: 10, color: GL, background: hex2rgba(GL, 0.1), padding: '3px 10px', borderRadius: 2, fontFamily: FB }}>⭐ {(promoter.reliabilityScore ?? 0).toFixed(1)}</span>}
              </div>
            </div>
          </div>
          {promoter.fullBodyPhotoUrl && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: W4, fontFamily: FD, marginBottom: 8 }}>Full Body Photo</div>
              <img src={promoter.fullBodyPhotoUrl} alt="Full body" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', objectPosition: 'top', borderRadius: 3, border: `1px solid ${BB}` }} />
            </div>
          )}
          <div style={{ borderTop: `1px solid ${BB}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, fontFamily: FD, marginBottom: 14, fontWeight: 700 }}>Details</div>
            {[
              { label: 'Phone',    value: promoter.phone },
              { label: 'Height',   value: promoter.height ? `${promoter.height}cm` : null },
              { label: 'Gender',   value: promoter.gender },
              { label: 'Clothing', value: promoter.clothingSize },
            ].filter(r => r.value).map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BB}` }}>
                <span style={{ fontSize: 12, color: W4, fontFamily: FB }}>{r.label}</span>
                <span style={{ fontSize: 12, color: W, fontWeight: 600, fontFamily: FB }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 32px 32px' }}>
          {isSelected ? (
            <div style={{ padding: '12px 16px', background: hex2rgba(GL, 0.08), border: `1px solid ${hex2rgba(GL, 0.4)}`, fontSize: 12, color: GL, fontFamily: FD, textAlign: 'center' }}>✓ Selected for this job</div>
          ) : canSelect ? (
            <button onClick={() => { onSelect(); onClose() }}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: BLK, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              ✓ Select for This Job
            </button>
          ) : (
            <div style={{ padding: '12px 16px', background: BB, border: `1px solid ${BB}`, fontSize: 12, color: W4, fontFamily: FD, textAlign: 'center' }}>Job slots are full</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onOpen }: { job: ApiJob; onOpen: () => void }) {
  const isFull      = job.filledSlots >= job.totalSlots
  const statusColor = job.status === 'OPEN' ? GL : job.status === 'FILLED' ? GD : W4
  const pct         = job.totalSlots > 0 ? Math.round((job.filledSlots / job.totalSlots) * 100) : 0
  const tags: string[] = job.filters?.tags || []
  const category    = job.filters?.category || ''

  return (
    <div onClick={onOpen}
      style={{ background: BLK2, border: `1px solid ${BB}`, padding: '22px 24px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', borderRadius: 3 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hex2rgba(GL, 0.4); (e.currentTarget as HTMLElement).style.background = BLK3 }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BB; (e.currentTarget as HTMLElement).style.background = BLK2 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GD3}, ${statusColor}, ${GD3})` }} />

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: W, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
          {category && <div style={{ fontSize: 10, color: GL, fontFamily: FD, marginBottom: 3, fontWeight: 600 }}>{category}</div>}
          <div style={{ fontSize: 11, color: W4, fontFamily: FB }}>📍 {job.venue || job.address?.split(',')[0]}</div>
        </div>
        <span style={{ flexShrink: 0, marginLeft: 12, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: statusColor, background: hex2rgba(statusColor, 0.1), border: `1px solid ${hex2rgba(statusColor, 0.4)}`, padding: '3px 10px', borderRadius: 2, fontFamily: FD }}>
          {job.status}
        </span>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12, marginTop: 10 }}>
        {[
          { label: 'Rate',  value: `R${job.hourlyRate}/hr`, color: GL },
          { label: 'Slots', value: `${job.filledSlots}/${job.totalSlots}`, color: W },
          { label: 'Date',  value: job.date ? new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—', color: W7 },
          { label: 'Time',  value: `${job.startTime}–${job.endTime}`, color: W7 },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 8, color: W2, fontFamily: FB, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: FD }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {tags.slice(0, 4).map((t, i) => (
            <span key={i} style={{ fontSize: 9, color: GL, background: hex2rgba(GL, 0.08), border: `1px solid ${hex2rgba(GL, 0.22)}`, padding: '2px 8px', borderRadius: 2, fontFamily: FD }}>{t}</span>
          ))}
          {tags.length > 4 && <span style={{ fontSize: 9, color: W4, fontFamily: FD }}>+{tags.length - 4} more</span>}
        </div>
      )}

      {/* Fill bar */}
      <div style={{ height: 3, background: BB, borderRadius: 2, marginBottom: 12 }}>
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

// ─── Job Detail Panel — CENTERED MODAL ───────────────────────────────────────
function JobDetailPanel({ job, onClose }: { job: ApiJob; onClose: () => void }) {
  const [promoters,    setPromoters]    = useState<Promoter[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [saving,       setSaving]       = useState(false)
  const [savedMsg,     setSavedMsg]     = useState('')
  const [viewPromoter, setViewPromoter] = useState<Promoter | null>(null)
  const [cityFilter,   setCityFilter]   = useState('all')
  const [tab,          setTab]          = useState<'info' | 'promoters'>('info')

  const filters      = job.filters || {}
  const tags: string[] = filters.tags || []
  const category     = filters.category || ''
  const gender       = filters.gender || ''
  const languages    = filters.languages || ''
  const minHeight    = filters.minHeight || ''
  const minAge       = filters.minAge || ''
  const experience   = filters.experience || ''
  const attire       = filters.attire || ''
  const termsText    = filters.termsAndConditions || ''

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [promoRes, appRes] = await Promise.all([
          fetch(`${API}/users/promoters/eligible?jobId=${job.id}`, { headers: authHdr() as any }),
          fetch(`${API}/applications/job/${job.id}`, { headers: authHdr() as any }),
        ])

        let promos: any[] = promoRes.ok ? await promoRes.json() : []

        // Fallback: if eligible returns empty, fetch all approved promoters
        if (promos.length === 0) {
          const fallRes = await fetch(`${API}/users?role=PROMOTER&status=approved`, { headers: authHdr() as any })
          if (fallRes.ok) promos = await fallRes.json()
        }

        const apps: any[]  = appRes.ok ? await appRes.json() : []
        const appMap = new Map(apps.map((a: any) => [a.promoterId, a]))

        const merged: Promoter[] = promos.map((p: any) => ({
          id: p.id, fullName: p.fullName, email: p.email, phone: p.phone,
          city: p.city, reliabilityScore: p.reliabilityScore || 0,
          profilePhotoUrl: p.profilePhotoUrl, headshotUrl: p.headshotUrl,
          fullBodyPhotoUrl: p.fullBodyPhotoUrl, height: p.height,
          clothingSize: p.clothingSize, gender: p.gender,
          appStatus: appMap.get(p.id)?.status || null,
          appId:     appMap.get(p.id)?.id,
        }))

        setPromoters(merged)
        setSelected(new Set(merged.filter(p => p.appStatus === 'ALLOCATED').map(p => p.id)))
      } catch (e) { console.error('Load promoters failed', e) }
      setLoading(false)
    }
    load()
  }, [job.id])

  const canSelectMore = selected.size < job.totalSlots

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < job.totalSlots) next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true); setSavedMsg('')
    try {
      for (const pid of selected) {
        const promo = promoters.find(p => p.id === pid)
        if (!promo || (promo.appId && promo.appStatus === 'ALLOCATED')) continue
        if (promo.appId) {
          await fetch(`${API}/applications/${promo.appId}/status`, { method: 'PUT', headers: authHdr() as any, body: JSON.stringify({ status: 'ALLOCATED' }) })
        } else {
          await fetch(`${API}/applications`, { method: 'POST', headers: authHdr() as any, body: JSON.stringify({ jobId: job.id, promoterId: pid }) })
        }
      }
      setSavedMsg('✓ Selection saved successfully')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch { setSavedMsg('Failed to save — please try again') }
    setSaving(false)
  }

  const cities   = ['all', ...Array.from(new Set(promoters.map(p => p.city).filter(Boolean) as string[]))]
  const filtered = promoters.filter(p => cityFilter === 'all' || p.city === cityFilter)
  const jobCity  = job.address?.split(',')[0]?.trim() || job.venue

  const reqRows = [
    { label: 'Gender',     value: gender,                      show: !!gender && gender !== 'Any Gender' },
    { label: 'Languages',  value: languages,                   show: !!languages },
    { label: 'Min Height', value: minHeight ? `${minHeight}cm` : '', show: !!minHeight },
    { label: 'Min Age',    value: minAge ? `${minAge}+` : '',  show: !!minAge },
    { label: 'Experience', value: experience,                  show: !!experience && experience !== 'None' },
    { label: 'Attire',     value: attire,                      show: !!attire && attire !== 'Smart Casual' },
  ].filter(r => r.show)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: BLK1, border: `1px solid ${BB}`, width: '100%', maxWidth: 800, maxHeight: '92vh', display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GD3}, ${GL}, ${GD3})` }} />

        {/* Header */}
        <div style={{ padding: '26px 32px 18px', borderBottom: `1px solid ${BB}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: GL, fontFamily: FD, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 5 }}>Job Details</div>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: W, marginBottom: 6 }}>{job.title}</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: W4, fontFamily: FB }}>
                {job.client   && <span>🏢 {job.client}</span>}
                {(job.venue || job.address) && <span>📍 {job.venue || job.address?.split(',')[0]}</span>}
                {job.date     && <span>📅 {fmtDate(job.date)}</span>}
                <span>🕐 {job.startTime} – {job.endTime}</span>
                <span style={{ color: GL, fontWeight: 700 }}>R{job.hourlyRate}/hr · {job.totalSlots} slots</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W4, fontSize: 20, flexShrink: 0, marginLeft: 16, padding: 4 }}>✕</button>
          </div>

          {/* Slot progress */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1, height: 4, background: BB, borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${GD3}, ${GL})`, width: `${Math.round(selected.size / Math.max(job.totalSlots,1) * 100)}%`, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, color: GL, fontFamily: FD, fontWeight: 700, flexShrink: 0 }}>{selected.size}/{job.totalSlots} selected</span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${BB}`, borderRadius: 3, overflow: 'hidden' }}>
            {(['info', 'promoters'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '9px', background: tab === t ? hex2rgba(GL, 0.14) : 'transparent', border: 'none', color: tab === t ? GL : W4, fontFamily: FD, fontSize: 10, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', letterSpacing: '0.12em', textTransform: 'uppercase', transition: 'all 0.18s' }}>
                {t === 'info' ? '📋  Job Info & Requirements' : `👥  Select Promoters ${loading ? '' : `(${promoters.length})`}`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Key details grid */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', color: GL, fontFamily: FD, fontWeight: 700, marginBottom: 12 }}>Job Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Client',      value: job.client || '—' },
                    { label: 'Category',    value: category   || 'General' },
                    { label: 'Venue',       value: job.venue  || job.address?.split(',')[0] || '—' },
                    { label: 'Date',        value: fmtDate(job.date) },
                    { label: 'Start Time',  value: job.startTime },
                    { label: 'End Time',    value: job.endTime },
                    { label: 'Hourly Rate', value: `R${job.hourlyRate}/hr` },
                    { label: 'Total Slots', value: `${job.totalSlots} promoters needed` },
                    { label: 'Status',      value: job.status },
                  ].map(r => (
                    <div key={r.label} style={{ background: BB2, border: `1px solid ${BB}`, padding: '11px 14px', borderRadius: 3 }}>
                      <div style={{ fontSize: 9, color: W4, fontFamily: FD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: W, fontFamily: FD, fontWeight: 600 }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {(reqRows.length > 0 || tags.length > 0) && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', color: GL, fontFamily: FD, fontWeight: 700, marginBottom: 12 }}>Promoter Requirements</div>
                  {reqRows.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {reqRows.map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: BB2, border: `1px solid ${BB}`, borderRadius: 3 }}>
                          <span style={{ fontSize: 11, color: W4, fontFamily: FB }}>{r.label}</span>
                          <span style={{ fontSize: 12, color: W, fontWeight: 600, fontFamily: FB }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {tags.map((t, i) => (
                        <span key={i} style={{ fontSize: 11, color: GL, background: hex2rgba(GL, 0.1), border: `1px solid ${hex2rgba(GL, 0.3)}`, padding: '5px 14px', borderRadius: 3, fontFamily: FD }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* T&Cs */}
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', color: GL, fontFamily: FD, fontWeight: 700, marginBottom: 12 }}>Terms & Conditions</div>
                <div style={{ padding: '14px 16px', background: hex2rgba(GD3, 0.3), border: `1px solid ${hex2rgba(GD2, 0.4)}`, borderRadius: 3, marginBottom: termsText ? 10 : 0 }}>
                  <p style={{ fontSize: 12, color: W7, fontFamily: FB, lineHeight: 1.75, margin: 0 }}>
                    Standard Honey Group Terms & Conditions apply to all promoters. Promoters are independent contractors — not employees of the client or Honey Group. Cancellations within 24 hours will result in a reliability score penalty.
                  </p>
                </div>
                {termsText && (
                  <div style={{ padding: '14px 16px', background: BB2, border: `1px solid ${BB}`, borderRadius: 3 }}>
                    <div style={{ fontSize: 9, color: GL, fontFamily: FD, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>Campaign-Specific Terms</div>
                    <p style={{ fontSize: 12, color: W7, fontFamily: FB, lineHeight: 1.75, margin: 0 }}>{termsText}</p>
                  </div>
                )}
              </div>

              <button onClick={() => setTab('promoters')}
                style={{ padding: '13px', background: `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: BLK, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Select Promoters for This Job →
              </button>
            </div>
          )}

          {/* ── PROMOTERS TAB ── */}
          {tab === 'promoters' && (
            <>
              {cities.length > 2 && (
                <div style={{ padding: '10px 32px', borderBottom: `1px solid ${BB}`, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {cities.map(c => (
                    <button key={c} onClick={() => setCityFilter(c)}
                      style={{ padding: '4px 12px', background: cityFilter === c ? hex2rgba(GL, 0.16) : 'transparent', border: `1px solid ${cityFilter === c ? GL : BB}`, color: cityFilter === c ? GL : W4, fontFamily: FD, fontSize: 9, fontWeight: cityFilter === c ? 700 : 400, cursor: 'pointer', borderRadius: 2, transition: 'all 0.18s', letterSpacing: '0.1em' }}>
                      {c === 'all' ? 'All Cities' : c}
                      {c !== 'all' && c?.toLowerCase() === jobCity?.toLowerCase() && <span style={{ marginLeft: 4, color: GL2 }}>●</span>}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: W4, fontFamily: FD }}>Loading promoters…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, color: W4, fontFamily: FD, marginBottom: 8 }}>No approved promoters found</div>
                  <div style={{ fontSize: 12, color: W2, fontFamily: FB }}>Promoters need to register and be approved by admin before appearing here.</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 32px 8px', fontSize: 9, color: W2, fontFamily: FD, letterSpacing: '0.2em', textTransform: 'uppercase', borderBottom: `1px solid ${BB}` }}>
                    {filtered.length} promoter{filtered.length !== 1 ? 's' : ''} · sorted by location then reliability
                  </div>
                  {filtered.map((p) => {
                    const isSel     = selected.has(p.id)
                    const isAlready = p.appStatus === 'ALLOCATED'
                    const cityMatch = jobCity && p.city?.toLowerCase().includes(jobCity.toLowerCase())
                    const accent    = isSel ? GL : isAlready ? GD : W4

                    return (
                      <div key={p.id}
                        style={{ padding: '14px 32px', borderBottom: `1px solid ${BB}`, background: isSel ? hex2rgba(GL, 0.04) : 'transparent', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.18s' }}
                        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = BB }}
                        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

                        <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: `2px solid ${hex2rgba(accent, 0.5)}`, cursor: 'pointer' }}
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
                            {p.gender && <span style={{ marginLeft: 10, color: W2 }}>{p.gender}</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 32px', borderTop: `1px solid ${BB}`, flexShrink: 0, background: BLK, display: 'flex', gap: 12, alignItems: 'center' }}>
          {savedMsg ? (
            <span style={{ flex: 1, fontSize: 12, color: savedMsg.startsWith('✓') ? GL : GD2, fontFamily: FD }}>{savedMsg}</span>
          ) : (
            <span style={{ flex: 1, fontSize: 11, color: W2, fontFamily: FB }}>{selected.size} of {job.totalSlots} slots filled</span>
          )}
          {tab === 'promoters' && (
            <button onClick={handleSave} disabled={saving || selected.size === 0}
              style={{ padding: '11px 28px', background: selected.size > 0 ? `linear-gradient(135deg, ${GL}, ${GD})` : BB, border: 'none', color: selected.size > 0 ? BLK : W4, fontFamily: FD, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: selected.size > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', borderRadius: 3 }}>
              {saving ? 'Saving…' : 'Save Selection'}
            </button>
          )}
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

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/jobs`, { headers: authHdr() as any })
      if (res.ok) {
        const data: ApiJob[] = await res.json()
        setJobs(data)
      }
    } catch (e) { console.error('Failed to load jobs', e) }
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
          Jobs posted for your business. Click a job to view details and select promoters.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 28 }}>
        {[
          { label: 'Total Jobs',  value: counts.all,       color: GL  },
          { label: 'Open',        value: counts.OPEN,      color: GL  },
          { label: 'Filled',      value: counts.FILLED,    color: GD  },
          { label: 'Completed',   value: counts.COMPLETED, color: GD2 },
        ].map((s, i) => (
          <div key={i} className="biz-page" style={{ background: BLK2, padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, ${hex2rgba(s.color, 0.3)})` }} />
            <div style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: W4, marginTop: 6, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FD }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
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
        <div style={{ padding: '60px 20px', textAlign: 'center', border: `1px dashed ${BB}`, borderRadius: 3 }}>
          <p style={{ fontFamily: FD, fontSize: 20, color: W4, marginBottom: 8 }}>No jobs found</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: W2 }}>
            {jobs.length === 0
              ? 'No jobs have been posted for your business yet. Contact your Honey Group account manager.'
              : 'No jobs match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
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