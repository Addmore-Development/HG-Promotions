import { useState } from 'react'
import { AdminLayout } from '../AdminLayout'

const G  = '#C4973A'
const GL = '#DDB55A'
const B  = '#080808'
const BC = '#161616'
const BB = 'rgba(255,255,255,0.07)'
const W  = '#F4EFE6'
const WM = 'rgba(244,239,230,0.55)'
const WD = 'rgba(244,239,230,0.22)'
const FB = "'DM Sans', system-ui, sans-serif"
const FD = "'Playfair Display', Georgia, serif"

type DocStatus = 'pending' | 'approved' | 'rejected'

interface Applicant {
  id:       string
  name:     string
  email:    string
  phone:    string
  role:     string
  joined:   string
  status:   DocStatus
  docs: {
    id:          DocStatus
    bankDetails: DocStatus
    contract:    DocStatus
    selfie:      DocStatus
  }
  notes: string
}

const MOCK: Applicant[] = [
  { id: 'A001', name: 'Ayanda Dlamini',  email: 'ayanda@email.com',  phone: '+27 71 234 5678', role: 'Promoter',   joined: '2026-03-08', status: 'pending',  docs: { id: 'pending',  bankDetails: 'pending',  contract: 'approved', selfie: 'approved' }, notes: '' },
  { id: 'A002', name: 'Thabo Nkosi',     email: 'thabo@email.com',   phone: '+27 82 345 6789', role: 'Promoter',   joined: '2026-03-07', status: 'pending',  docs: { id: 'approved', bankDetails: 'pending',  contract: 'pending',  selfie: 'approved' }, notes: '' },
  { id: 'A003', name: 'Lerato Mokoena',  email: 'lerato@email.com',  phone: '+27 63 456 7890', role: 'Supervisor', joined: '2026-03-06', status: 'approved', docs: { id: 'approved', bankDetails: 'approved', contract: 'approved', selfie: 'approved' }, notes: '' },
  { id: 'A004', name: 'Sipho Mhlongo',   email: 'sipho@email.com',   phone: '+27 74 567 8901', role: 'Promoter',   joined: '2026-03-05', status: 'rejected', docs: { id: 'rejected', bankDetails: 'approved', contract: 'approved', selfie: 'approved' }, notes: 'ID document unclear' },
  { id: 'A005', name: 'Nomsa Zulu',      email: 'nomsa@email.com',   phone: '+27 83 678 9012', role: 'Promoter',   joined: '2026-03-04', status: 'pending',  docs: { id: 'approved', bankDetails: 'approved', contract: 'pending',  selfie: 'pending'  }, notes: '' },
]

const STATUS_COLOR: Record<DocStatus, string> = { pending: '#F59E0B', approved: '#22C55E', rejected: '#EF4444' }
const STATUS_BG:    Record<DocStatus, string> = { pending: 'rgba(245,158,11,0.1)', approved: 'rgba(34,197,94,0.1)', rejected: 'rgba(239,68,68,0.1)' }

function Badge({ status }: { status: DocStatus }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[status], background: STATUS_BG[status], padding: '3px 10px', borderRadius: 2 }}>
      {status}
    </span>
  )
}

export default function ReviewApproveDocs() {
  const [applicants, setApplicants] = useState<Applicant[]>(MOCK)
  const [selected,   setSelected]   = useState<Applicant | null>(null)
  const [filter,     setFilter]     = useState<DocStatus | 'all'>('all')
  const [note,       setNote]       = useState('')

  const filtered = applicants.filter(a => filter === 'all' || a.status === filter)

  const updateStatus = (id: string, status: DocStatus) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status, notes: note || a.notes } : a))
    setSelected(prev => prev ? { ...prev, status, notes: note || prev.notes } : null)
    setNote('')
  }

  const updateDoc = (applicantId: string, doc: keyof Applicant['docs'], status: DocStatus) => {
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, docs: { ...a.docs, [doc]: status } } : a))
    setSelected(prev => prev ? { ...prev, docs: { ...prev.docs, [doc]: status } } : null)
  }

  const docLabels: Record<keyof Applicant['docs'], string> = {
    id: 'ID Document', bankDetails: 'Bank Details', contract: 'Signed Contract', selfie: 'Profile Selfie'
  }

  const counts = { all: applicants.length, pending: applicants.filter(a => a.status === 'pending').length, approved: applicants.filter(a => a.status === 'approved').length, rejected: applicants.filter(a => a.status === 'rejected').length }

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>Onboarding</div>
          <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Review & Approve Documents</h1>
          <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Verify applicant documents before granting platform access.</p>
        </div>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FB,
              fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'capitalize',
              background: filter === f ? G : 'rgba(255,255,255,0.05)',
              color: filter === f ? B : WM, transition: 'all 0.2s',
            }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 24 }}>

          {/* TABLE */}
          <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BB}` }}>
                  {['Applicant', 'Role', 'Applied', 'Documents', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, fontFamily: FB }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const docsComplete = Object.values(a.docs).every(d => d === 'approved')
                  return (
                    <tr key={a.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BB}` : 'none', background: selected?.id === a.id ? 'rgba(196,151,58,0.06)' : 'transparent', transition: 'background 0.2s', cursor: 'pointer' }}
                      onClick={() => setSelected(selected?.id === a.id ? null : a)}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: W }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: WM, marginTop: 2 }}>{a.email}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 12, color: WM }}>{a.role}</td>
                      <td style={{ padding: '16px 20px', fontSize: 12, color: WM }}>{new Date(a.joined).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {Object.values(a.docs).map((d, j) => (
                            <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[d] }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: WD, marginTop: 4 }}>
                          {Object.values(a.docs).filter(d => d === 'approved').length}/4 verified
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}><Badge status={a.status} /></td>
                      <td style={{ padding: '16px 20px' }}>
                        <button style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB }}>
                          Review →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* DETAIL PANEL */}
          {selected && (
            <div style={{ background: BC, border: `1px solid ${BB}`, padding: '28px', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: W }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: WM, marginTop: 4 }}>{selected.email} · {selected.phone}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WM, fontSize: 18 }}>✕</button>
              </div>

              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: G, marginBottom: 14 }}>Document Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {(Object.keys(selected.docs) as Array<keyof typeof selected.docs>).map(doc => (
                  <div key={doc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BB}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: W, fontWeight: 500 }}>{docLabels[doc]}</div>
                      <Badge status={selected.docs[doc]} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['approved', 'rejected'] as DocStatus[]).map(s => (
                        <button key={s} onClick={() => updateDoc(selected.id, doc, s)} style={{
                          padding: '5px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          background: selected.docs[doc] === s ? STATUS_COLOR[s] : 'transparent',
                          border: `1px solid ${STATUS_COLOR[s]}`,
                          color: selected.docs[doc] === s ? B : STATUS_COLOR[s],
                          fontFamily: FB, borderRadius: 2, transition: 'all 0.2s',
                        }}>{s === 'approved' ? '✓' : '✗'}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 8 }}>Notes (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note for this applicant..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '10px 14px', color: W, fontFamily: FB, fontSize: 13, resize: 'none', outline: 'none' }}
                  onFocus={e => e.currentTarget.style.borderColor = G}
                  onBlur={e => e.currentTarget.style.borderColor = BB}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => updateStatus(selected.id, 'approved')} style={{
                  flex: 1, padding: '13px', background: 'rgba(34,197,94,0.15)', border: '1px solid #22C55E',
                  color: '#22C55E', fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
                >✓ Approve</button>
                <button onClick={() => updateStatus(selected.id, 'rejected')} style={{
                  flex: 1, padding: '13px', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444',
                  color: '#EF4444', fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                >✗ Reject</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}