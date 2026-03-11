import { useState, useEffect } from 'react'
import { getBusinessJobs, calcHours, calcPayout, type Job } from './jobsStore'

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

interface PayrollRow {
  promoterName:  string
  promoterEmail: string
  jobTitle:      string
  jobId:         string
  totalHours:    number
  ratePerHour:   number
  totalPayout:   number
  shiftsCount:   number
  lastShift?:    string
}

export default function BusinessPayroll() {
  const [jobs,    setJobs]    = useState<Job[]>([])
  const [session, setSession] = useState<Record<string,string> | null>(null)
  const [filterJob, setFilterJob] = useState<string>('all')
  const [sortBy,    setSortBy]    = useState<'payout' | 'hours' | 'name'>('payout')

  useEffect(() => {
    const s = localStorage.getItem('hg_session')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      setJobs(getBusinessJobs(parsed.email))
    }
  }, [])

  // Build payroll rows
  const allRows: PayrollRow[] = jobs.flatMap(job =>
    (job.applicants || []).map(ap => {
      const completedShifts = ap.shifts.filter(s => s.checkOut)
      const lastShift = completedShifts.length > 0
        ? completedShifts.reduce((a, b) => new Date(a.checkOut!) > new Date(b.checkOut!) ? a : b).checkOut
        : undefined
      return {
        promoterName:  ap.fullName,
        promoterEmail: ap.email,
        jobTitle:      job.title,
        jobId:         job.id,
        totalHours:    calcHours(ap.shifts),
        ratePerHour:   job.ratePerHour,
        totalPayout:   calcPayout(ap.shifts, job.ratePerHour),
        shiftsCount:   completedShifts.length,
        lastShift,
      }
    })
  )

  const filtered = allRows.filter(r => filterJob === 'all' || r.jobId === filterJob)
  const sorted   = [...filtered].sort((a, b) => {
    if (sortBy === 'payout') return b.totalPayout - a.totalPayout
    if (sortBy === 'hours')  return b.totalHours  - a.totalHours
    return a.promoterName.localeCompare(b.promoterName)
  })

  const grandTotal    = sorted.reduce((acc, r) => acc + r.totalPayout, 0)
  const grandHours    = sorted.reduce((acc, r) => acc + r.totalHours, 0)
  const uniquePromoters = new Set(sorted.map(r => r.promoterEmail)).size

  return (
    <div>
      {/* Header */}
      <div className="biz-page" style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Payroll</p>
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: WHITE, lineHeight: 1.1 }}>Earnings Summary</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Payout', value: `R ${grandTotal.toFixed(2)}`, sub: 'Across all jobs', accent: GOLD },
          { label: 'Total Hours',  value: grandHours.toFixed(1) + ' hrs', sub: 'Completed shifts', accent: '#3A7BD5' },
          { label: 'Promoters',   value: uniquePromoters, sub: 'With recorded hours', accent: '#8B5CF6' },
        ].map(stat => (
          <div key={stat.label} className="biz-page" style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, padding: '26px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.accent }} />
            <p style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: stat.accent, marginBottom: 12 }}>{stat.label}</p>
            <p style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, color: WHITE, lineHeight: 1, marginBottom: 6 }}>{stat.value}</p>
            <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="biz-page" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 22 }}>
        {/* Job filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setFilterJob('all')}
            style={{ padding: '8px 16px', background: filterJob === 'all' ? 'rgba(196,151,58,0.1)' : 'transparent', border: `1px solid ${filterJob === 'all' ? `${GOLD}44` : BLACK_BORDER}`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: filterJob === 'all' ? GOLD : WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
          >All Jobs</button>
          {jobs.map(j => (
            <button key={j.id} onClick={() => setFilterJob(j.id)}
              style={{ padding: '8px 16px', background: filterJob === j.id ? 'rgba(196,151,58,0.1)' : 'transparent', border: `1px solid ${filterJob === j.id ? `${GOLD}44` : BLACK_BORDER}`, fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: filterJob === j.id ? GOLD : WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >{j.title}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['payout', 'hours', 'name'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ padding: '8px 14px', background: sortBy === s ? 'rgba(196,151,58,0.08)' : 'transparent', border: `1px solid ${sortBy === s ? `${GOLD}33` : BLACK_BORDER}`, fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: sortBy === s ? GOLD : WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s' }}
            >Sort: {s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="biz-page" style={{ background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`, overflow: 'hidden' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '60px 28px', textAlign: 'center' }}>
            <p style={{ fontFamily: FD, fontSize: 22, color: WHITE_MUTED, marginBottom: 8 }}>No payroll data</p>
            <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_DIM }}>Payroll is generated once promoters complete shifts.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BLACK_BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Promoter', 'Job', 'Shifts', 'Hours Worked', 'Rate / hr', 'Total Payout', 'Last Shift'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: WHITE_MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={`${row.promoterEmail}-${row.jobId}`}
                  style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${BLACK_BORDER}` : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FD, fontSize: 11, color: GOLD, flexShrink: 0 }}>
                        {row.promoterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: WHITE, marginBottom: 1 }}>{row.promoterName}</p>
                        <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_MUTED }}>{row.promoterEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: FB, fontSize: 12, color: WHITE_MUTED, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.jobTitle}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: FB, fontSize: 13, color: WHITE, textAlign: 'center' }}>
                    {row.shiftsCount}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: FD, fontSize: 15, fontWeight: 700, color: WHITE }}>
                    {row.totalHours.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>
                    R {row.ratePerHour}/hr
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: row.totalPayout > 0 ? GOLD : WHITE_MUTED }}>
                      R {row.totalPayout.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>
                    {row.lastShift ? new Date(row.lastShift).toLocaleDateString('en-ZA') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Grand total row */}
            <tfoot>
              <tr style={{ borderTop: `2px solid ${BLACK_BORDER}`, background: 'rgba(196,151,58,0.04)' }}>
                <td colSpan={3} style={{ padding: '16px 20px', fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>
                  Grand Total
                </td>
                <td style={{ padding: '16px 20px', fontFamily: FD, fontSize: 16, fontWeight: 700, color: WHITE }}>
                  {grandHours.toFixed(2)} hrs
                </td>
                <td style={{ padding: '16px 20px' }} />
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ fontFamily: FD, fontSize: 18, fontWeight: 700, color: GOLD }}>R {grandTotal.toFixed(2)}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Export note */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 16, padding: '12px 18px', border: `1px solid ${BLACK_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_MUTED }}>
            Payroll export (Paystack EFT) available in the Admin panel once shifts are approved.
          </p>
          <button
            onClick={() => {
              const csv = [
                ['Promoter', 'Email', 'Job', 'Shifts', 'Hours', 'Rate', 'Payout', 'Last Shift'],
                ...sorted.map(r => [r.promoterName, r.promoterEmail, r.jobTitle, r.shiftsCount, r.totalHours.toFixed(2), r.ratePerHour, r.totalPayout.toFixed(2), r.lastShift ? new Date(r.lastShift).toLocaleDateString('en-ZA') : '']),
              ].map(row => row.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'honey-group-payroll.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'transparent', border: `1px solid ${GOLD}44`, color: GOLD, padding: '9px 20px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,151,58,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >↓ Export CSV</button>
        </div>
      )}
    </div>
  )
}