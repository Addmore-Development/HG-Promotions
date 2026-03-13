import { useState, useEffect } from 'react'
import { getBusinessJobs, upsertJob, seedMockApplicants, calcHours, calcPayout, type Job, type Applicant } from './jobsStore'

const BLACK        = '#080808'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.18)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

/* ─── SHARED INPUT ─────────────────────────────────────────── */
function FInput({ label, type = 'text', placeholder, value, onChange, hint, min, required }: {
  label: string; type?: string; placeholder?: string; value: string | number
  onChange: (v: string) => void; hint?: string; min?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'flex', gap: 4, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: focused ? GOLD : WHITE_MUTED, marginBottom: 8, transition: 'color 0.2s' }}>
        {label}{required && <span style={{ color: GOLD }}>*</span>}
      </label>
      <input
        type={type} placeholder={placeholder} value={value} min={min}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${focused ? GOLD : BLACK_BORDER}`, padding: '13px 16px', fontFamily: FB, fontSize: 14, color: WHITE, outline: 'none', transition: 'border-color 0.2s', boxShadow: focused ? `0 0 0 3px rgba(196,151,58,0.1)` : 'none' }}
      />
      {hint && <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_DIM, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

function FTextarea({ label, placeholder, value, onChange, required }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'flex', gap: 4, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: focused ? GOLD : WHITE_MUTED, marginBottom: 8, transition: 'color 0.2s' }}>
        {label}{required && <span style={{ color: GOLD }}>*</span>}
      </label>
      <textarea
        placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        rows={4}
        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${focused ? GOLD : BLACK_BORDER}`, padding: '13px 16px', fontFamily: FB, fontSize: 14, color: WHITE, outline: 'none', transition: 'border-color 0.2s', resize: 'vertical', boxShadow: focused ? `0 0 0 3px rgba(196,151,58,0.1)` : 'none' }}
      />
    </div>
  )
}

/* ─── JOB FORM MODAL ───────────────────────────────────────── */
function JobFormModal({ existing, onClose, onSave, businessEmail }: {
  existing?: Job; onClose: () => void; onSave: (j: Job) => void; businessEmail: string
}) {
  const [title,            setTitle]            = useState(existing?.title            || '')
  const [promotersNeeded,  setPromotersNeeded]  = useState(String(existing?.promotersNeeded || ''))
  const [location,         setLocation]         = useState(existing?.location         || '')
  const [terms,            setTerms]            = useState(existing?.terms            || '')
  const [ratePerHour,      setRatePerHour]      = useState(String(existing?.ratePerHour || ''))
  // ── CHANGE: startDate field added ──
  const [startDate,        setStartDate]        = useState(existing?.startDate?.slice(0,10) || '')
  const [endDate,          setEndDate]          = useState(existing?.endDate?.slice(0,10) || '')
  const [error,            setError]            = useState<string | null>(null)

  const handleSave = () => {
    if (!title || !promotersNeeded || !location || !terms || !ratePerHour || !startDate || !endDate) {
      setError('Please fill in all required fields.'); return
    }
    if (isNaN(Number(promotersNeeded)) || Number(promotersNeeded) < 1) {
      setError('Promoters needed must be a positive number.'); return
    }
    if (isNaN(Number(ratePerHour)) || Number(ratePerHour) < 1) {
      setError('Rate per hour must be a valid amount.'); return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.'); return
    }
    const job: Job = {
      id:              existing?.id || `job-${Date.now()}`,
      businessEmail,
      title:           title.trim(),
      promotersNeeded: Number(promotersNeeded),
      location:        location.trim(),
      terms:           terms.trim(),
      ratePerHour:     Number(ratePerHour),
      startDate,
      endDate,
      status:          existing?.status || 'active',
      createdAt:       existing?.createdAt || new Date().toISOString(),
      applicants:      existing?.applicants || [],
    }
    onSave(job)
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: '#141414', border: `1px solid ${BLACK_BORDER}`, padding: '48px 44px', width: '100%', maxWidth: 560, position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: WHITE_MUTED, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
          onMouseLeave={e => (e.currentTarget.style.color = WHITE_MUTED)}
        >✕</button>

        <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
          {existing ? 'Edit Job' : 'New Job'}
        </p>
        <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: WHITE, marginBottom: 32 }}>
          {existing ? 'Update Promotion Job' : 'Create Promotion Job'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FInput label="Job Title" placeholder="Brand Activations – Sandton City" value={title} onChange={setTitle} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FInput label="Promoters Needed" type="number" placeholder="5" value={promotersNeeded} onChange={setPromotersNeeded} min="1" required />
            <FInput label="Rate per Hour (ZAR)" type="number" placeholder="85" value={ratePerHour} onChange={setRatePerHour} min="1" hint="e.g. R 85/hr" required />
          </div>

          <FInput label="Location" placeholder="Sandton City Mall, Sandton, 2196" value={location} onChange={setLocation} required />

          {/* ── CHANGE: Start Date and End Date side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FInput label="Start Date" type="date" value={startDate} onChange={setStartDate} required />
            <FInput label="End Date" type="date" value={endDate} onChange={setEndDate} required />
          </div>

          <FTextarea label="Terms & Conditions" placeholder="Describe dress code, duties, expectations…" value={terms} onChange={setTerms} required />
        </div>

        {error && (
          <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', fontFamily: FB, fontSize: 12, color: '#ff6b6b' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '14px 0', background: 'transparent', border: `1px solid ${BLACK_BORDER}`, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED }}
          >Cancel</button>
          <button onClick={handleSave}
            style={{ flex: 2, padding: '14px 0', background: GOLD, border: 'none', fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: BLACK, cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT }}
            onMouseLeave={e => { e.currentTarget.style.background = GOLD }}
          >{existing ? 'Save Changes' : 'Create Job'}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── APPLICANT ROW (for team panel inside job card) ───────── */
function ApplicantRow({ applicant, ratePerHour, isCancelled }: { applicant: Applicant; ratePerHour: number; isCancelled: boolean }) {
  const [open, setOpen] = useState(false)
  const hours   = calcHours(applicant.shifts)
  const payout  = calcPayout(applicant.shifts, ratePerHour)
  // ── CHANGE: treat live shifts as not-live on cancelled jobs ──
  const isLive  = !isCancelled && applicant.shifts.some(s => !s.checkOut)

  return (
    <div style={{ border: `1px solid ${BLACK_BORDER}`, marginBottom: 8 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', background: open ? 'rgba(196,151,58,0.05)' : 'transparent', transition: 'background 0.2s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FD, fontSize: 14, color: GOLD, flexShrink: 0 }}>
            {applicant.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: WHITE, marginBottom: 2 }}>{applicant.fullName}</p>
            <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>{applicant.email}</p>
          </div>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', padding: '3px 10px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: '#4ade80' }}>LIVE</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED, marginBottom: 2 }}>{hours.toFixed(2)} hrs</p>
            <p style={{ fontFamily: FD, fontSize: 15, fontWeight: 700, color: GOLD }}>R {payout.toFixed(2)}</p>
          </div>
          <span style={{ color: WHITE_DIM, fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: WHITE_MUTED, marginBottom: 12, marginTop: 14 }}>Shift History</p>
          {applicant.shifts.length === 0 ? (
            <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_DIM }}>No shifts recorded yet.</p>
          ) : (
            applicant.shifts.map(shift => {
              const shiftHours = shift.checkOut
                ? ((new Date(shift.checkOut).getTime() - new Date(shift.checkIn).getTime()) / 3600000)
                : null
              // ── CHANGE: on cancelled jobs, all shifts show as completed (no "in progress") ──
              const isActive = !isCancelled && !shift.checkOut
              return (
                <div key={shift.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isActive ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? 'rgba(74,222,128,0.2)' : BLACK_BORDER}`, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Check In</p>
                      <p style={{ fontFamily: FB, fontSize: 12, color: WHITE }}>{new Date(shift.checkIn).toLocaleString('en-ZA')}</p>
                    </div>
                    <div>
                      <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Check Out</p>
                      <p style={{ fontFamily: FB, fontSize: 12, color: isActive ? '#4ade80' : WHITE }}>
                        {isActive ? 'In progress…' : shift.checkOut ? new Date(shift.checkOut).toLocaleString('en-ZA') : '—'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {shiftHours !== null ? (
                      <>
                        <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED, marginBottom: 2 }}>{shiftHours.toFixed(2)} hrs</p>
                        <p style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: GOLD }}>R {(shiftHours * ratePerHour).toFixed(2)}</p>
                      </>
                    ) : isActive ? (
                      <p style={{ fontFamily: FB, fontSize: 11, color: '#4ade80' }}>Live</p>
                    ) : (
                      <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM }}>—</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {applicant.shifts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${BLACK_BORDER}`, paddingTop: 12, marginTop: 6, gap: 24 }}>
              <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>Total: <strong style={{ color: WHITE }}>{hours.toFixed(2)} hrs</strong></p>
              <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>Payout: <strong style={{ color: GOLD }}>R {payout.toFixed(2)}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── JOB DETAIL POPUP ─────────────────────────────────────── */
// ── CHANGE: full floating popup with all job details ──
function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const isCancelled = job.status === 'cancelled'
  const isExpired = new Date(job.endDate) < new Date()
  const totalHours = job.applicants.reduce((acc, ap) => acc + calcHours(ap.shifts), 0)
  const totalPayout = job.applicants.reduce((acc, ap) => acc + calcPayout(ap.shifts, job.ratePerHour), 0)
  const liveCount = !isCancelled ? job.applicants.filter(ap => ap.shifts.some(s => !s.checkOut)).length : 0

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: '#141414', border: `1px solid ${BLACK_BORDER}`, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }}>
        {/* Top accent */}
        <div style={{ height: 3, background: isCancelled ? '#ff6b6b' : isExpired ? '#f0a500' : GOLD }} />

        {/* Header */}
        <div style={{ padding: '32px 36px 24px', borderBottom: `1px solid ${BLACK_BORDER}` }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: WHITE_MUTED, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={e => (e.currentTarget.style.color = WHITE_MUTED)}
          >✕</button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, paddingRight: 32 }}>
            <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, color: WHITE, lineHeight: 1.2 }}>{job.title}</h2>
            <span style={{
              flexShrink: 0, marginLeft: 16,
              fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: isCancelled ? '#ff6b6b' : isExpired ? '#f0a500' : '#4ade80',
              background: isCancelled ? 'rgba(255,107,107,0.1)' : isExpired ? 'rgba(240,165,0,0.1)' : 'rgba(74,222,128,0.1)',
              padding: '5px 12px',
            }}>
              {isCancelled ? 'Cancelled' : isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
          <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED }}>📍 {job.location}</p>
        </div>

        {/* Details grid */}
        <div style={{ padding: '24px 36px', borderBottom: `1px solid ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>Job Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Rate per Hour', value: `R ${job.ratePerHour}/hr`, accent: GOLD },
              { label: 'Promoters Needed', value: `${job.applicants.length} / ${job.promotersNeeded}` },
              { label: 'Start Date', value: job.startDate ? new Date(job.startDate).toLocaleDateString('en-ZA') : '—' },
              { label: 'End Date', value: new Date(job.endDate).toLocaleDateString('en-ZA') },
              { label: 'Total Hours', value: `${totalHours.toFixed(2)} hrs` },
              { label: 'Total Payout', value: `R ${totalPayout.toFixed(2)}`, accent: GOLD },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BLACK_BORDER}`, padding: '14px 16px' }}>
                <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: item.accent || WHITE }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Live badge */}
          {liveCount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', padding: '8px 16px', marginBottom: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: '#4ade80' }}>{liveCount} promoter{liveCount !== 1 ? 's' : ''} currently on shift</span>
            </div>
          )}

          {/* Fill bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM }}>Slots Filled</p>
              <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_MUTED }}>{job.applicants.length} of {job.promotersNeeded}</p>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${Math.min((job.applicants.length / job.promotersNeeded) * 100, 100)}%`, background: GOLD, borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div style={{ padding: '24px 36px', borderBottom: `1px solid ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>Terms & Conditions</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.terms || 'No terms specified.'}</p>
        </div>

        {/* Team */}
        <div style={{ padding: '24px 36px' }}>
          <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>
            Team — {job.applicants.length} Promoter{job.applicants.length !== 1 ? 's' : ''}
          </p>
          {job.applicants.length === 0 ? (
            <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>No promoters have applied yet.</p>
          ) : (
            job.applicants.map(ap => (
              <ApplicantRow key={ap.email} applicant={ap} ratePerHour={job.ratePerHour} isCancelled={isCancelled} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── JOB CARD ─────────────────────────────────────────────── */
function JobCard({ job, onEdit, onCancel, onViewDetails }: {
  job: Job; onEdit: () => void; onCancel: () => void; onViewDetails: () => void
}) {
  const isCancelled = job.status === 'cancelled'
  const isExpired = new Date(job.endDate) < new Date()
  const filledSlots = job.applicants.length

  return (
    <div className="biz-page" style={{
      background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`,
      position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      {/* Status bar */}
      <div style={{ height: 3, background: isCancelled ? '#ff6b6b' : isExpired ? '#f0a500' : GOLD }} />

      <div style={{ padding: '22px 24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.title}
            </h3>
            <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>📍 {job.location}</p>
          </div>
          <span style={{
            marginLeft: 12, flexShrink: 0,
            fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: isCancelled ? '#ff6b6b' : isExpired ? '#f0a500' : '#4ade80',
            background: isCancelled ? 'rgba(255,107,107,0.1)' : isExpired ? 'rgba(240,165,0,0.1)' : 'rgba(74,222,128,0.1)',
            padding: '4px 10px',
          }}>
            {isCancelled ? 'Cancelled' : isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Rate</p>
            <p style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: GOLD }}>R {job.ratePerHour}/hr</p>
          </div>
          <div>
            <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Promoters</p>
            <p style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: WHITE }}>{filledSlots} / {job.promotersNeeded}</p>
          </div>
          {job.startDate && (
            <div>
              <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>Start Date</p>
              <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED }}>{new Date(job.startDate).toLocaleDateString('en-ZA')}</p>
            </div>
          )}
          <div>
            <p style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: WHITE_DIM, marginBottom: 3 }}>End Date</p>
            <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED }}>{new Date(job.endDate).toLocaleDateString('en-ZA')}</p>
          </div>
        </div>

        {/* Promoter fill bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${Math.min((filledSlots / job.promotersNeeded) * 100, 100)}%`, background: GOLD, borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* ── CHANGE: "View Details" replaces "View Team" and opens floating popup ── */}
          <button onClick={onViewDetails}
            style={{ flex: 2, padding: '9px 0', background: 'rgba(196,151,58,0.08)', border: `1px solid ${GOLD}44`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,151,58,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,151,58,0.08)' }}
          >
            View Details
          </button>
          {job.status === 'active' && (
            <>
              <button onClick={onEdit}
                style={{ flex: 1, padding: '9px 0', background: 'transparent', border: `1px solid ${BLACK_BORDER}`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED }}
              >Edit</button>
              <button onClick={onCancel}
                style={{ flex: 1, padding: '9px 0', background: 'transparent', border: '1px solid rgba(255,107,107,0.25)', fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,107,107,0.7)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; e.currentTarget.style.color = '#ff6b6b' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,107,107,0.7)' }}
              >Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── CONFIRM CANCEL MODAL ─────────────────────────────────── */
function CancelModal({ job, onConfirm, onClose }: { job: Job; onConfirm: () => void; onClose: () => void }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ background: '#141414', border: `1px solid rgba(255,107,107,0.25)`, padding: '44px 40px', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#ff6b6b' }} />
        <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: '#ff6b6b', marginBottom: 10 }}>Confirm Cancel</p>
        <h2 style={{ fontFamily: FD, fontSize: 24, color: WHITE, marginBottom: 12 }}>Cancel this job?</h2>
        <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, lineHeight: 1.7, marginBottom: 28 }}>
          "<strong style={{ color: WHITE }}>{job.title}</strong>" will be marked as cancelled. This cannot be undone. Promoters who applied will be notified.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px 0', background: 'transparent', border: `1px solid ${BLACK_BORDER}`, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED }}
          >Keep Job</button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '13px 0', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.4)', fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ff6b6b', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.12)' }}
          >Yes, Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN JOBS PAGE ───────────────────────────────────────── */
export default function BusinessJobs() {
  const [jobs,        setJobs]        = useState<Job[]>([])
  const [session,     setSession]     = useState<Record<string,string> | null>(null)
  const [showForm,    setShowForm]    = useState(false)
  const [editJob,     setEditJob]     = useState<Job | undefined>(undefined)
  const [cancelJob,   setCancelJob]   = useState<Job | undefined>(undefined)
  const [detailJob,   setDetailJob]   = useState<Job | undefined>(undefined)  // ── CHANGE
  const [filter,      setFilter]      = useState<'all' | 'active' | 'cancelled'>('all')

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      const bizJobs = getBusinessJobs(parsed.email)
      setJobs(bizJobs)
      // Seed mock data for demo
      seedMockApplicants(parsed.email)
      setJobs(getBusinessJobs(parsed.email))
    }
  }, [])

  const reload = () => {
    if (session) setJobs(getBusinessJobs(session.email))
  }

  const handleSave = (job: Job) => {
    upsertJob(job)
    reload()
    setShowForm(false)
    setEditJob(undefined)
  }

  const handleCancel = (job: Job) => {
    const updated = { ...job, status: 'cancelled' as const }
    upsertJob(updated)
    reload()
    setCancelJob(undefined)
  }

  const filtered = jobs.filter(j => filter === 'all' ? true : j.status === filter)

  // Keep detailJob in sync after reload
  const syncedDetailJob = detailJob ? jobs.find(j => j.id === detailJob.id) : undefined

  return (
    <div>
      {/* Page header */}
      <div className="biz-page" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Promotion Jobs</p>
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>
            Manage your jobs
          </h1>
        </div>
        <button onClick={() => { setEditJob(undefined); setShowForm(true) }}
          style={{ marginTop: 4, fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '14px 28px', cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)' }}
        >+ New Job</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {(['all', 'active', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '9px 20px', background: filter === f ? 'rgba(196,151,58,0.12)' : 'transparent', border: `1px solid ${filter === f ? `${GOLD}55` : BLACK_BORDER}`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: filter === f ? GOLD : WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {f} {f === 'all' ? `(${jobs.length})` : f === 'active' ? `(${jobs.filter(j => j.status === 'active').length})` : `(${jobs.filter(j => j.status === 'cancelled').length})`}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', border: `1px dashed ${BLACK_BORDER}` }}>
          <p style={{ fontFamily: FD, fontSize: 24, color: WHITE_MUTED, marginBottom: 8 }}>No jobs found</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM, marginBottom: 24 }}>
            {filter === 'all' ? "You haven't created any jobs yet." : `No ${filter} jobs.`}
          </p>
          {filter === 'all' && (
            <button onClick={() => { setEditJob(undefined); setShowForm(true) }}
              style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: GOLD, color: BLACK, border: 'none', padding: '13px 32px', cursor: 'pointer' }}
            >Create First Job</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 16 }}>
          {filtered.map(job => (
            <JobCard
              key={job.id} job={job}
              onViewDetails={() => setDetailJob(job)}
              onEdit={() => { setEditJob(job); setShowForm(true) }}
              onCancel={() => setCancelJob(job)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <JobFormModal
          existing={editJob}
          businessEmail={session?.email || ''}
          onClose={() => { setShowForm(false); setEditJob(undefined) }}
          onSave={handleSave}
        />
      )}
      {cancelJob && (
        <CancelModal
          job={cancelJob}
          onClose={() => setCancelJob(undefined)}
          onConfirm={() => handleCancel(cancelJob)}
        />
      )}
      {/* ── CHANGE: job detail popup ── */}
      {syncedDetailJob && (
        <JobDetailModal
          job={syncedDetailJob}
          onClose={() => setDetailJob(undefined)}
        />
      )}
    </div>
  )
}