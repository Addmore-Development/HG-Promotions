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

type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled'

interface Job {
  id:          string
  title:       string
  client:      string
  venue:       string
  date:        string
  startTime:   string
  endTime:     string
  hourlyRate:  number
  totalSlots:  number
  filledSlots: number
  status:      JobStatus
  city:        string
}

const MOCK_JOBS: Job[] = [
  { id: 'JB-201', title: 'Brand Ambassador — Red Bull',    client: 'Red Bull SA',      venue: 'Sandton City',       date: '2026-03-15', startTime: '09:00', endTime: '17:00', hourlyRate: 120, totalSlots: 6,  filledSlots: 6,  status: 'filled',    city: 'Johannesburg' },
  { id: 'JB-202', title: 'Promoter — Castle Lite',         client: 'AB InBev',         venue: 'V&A Waterfront',     date: '2026-03-16', startTime: '12:00', endTime: '20:00', hourlyRate: 110, totalSlots: 4,  filledSlots: 2,  status: 'open',      city: 'Cape Town'    },
  { id: 'JB-203', title: 'Brand Rep — Nike Launch',        client: 'Nike SA',          venue: 'Mall of Africa',     date: '2026-03-17', startTime: '10:00', endTime: '18:00', hourlyRate: 135, totalSlots: 8,  filledSlots: 3,  status: 'open',      city: 'Johannesburg' },
  { id: 'JB-204', title: 'Event Staff — Vodacom',          client: 'Vodacom',          venue: 'Greenacres Mall',    date: '2026-03-12', startTime: '08:00', endTime: '16:00', hourlyRate: 100, totalSlots: 8,  filledSlots: 8,  status: 'filled',    city: 'Port Elizabeth'},
  { id: 'JB-205', title: 'Hostess — Nedbank Golf Day',     client: 'Nedbank',          venue: 'Gary Player CC',     date: '2026-03-10', startTime: '07:00', endTime: '15:00', hourlyRate: 150, totalSlots: 12, filledSlots: 12, status: 'completed', city: 'Sun City'     },
  { id: 'JB-206', title: 'Promoter — Savanna',             client: 'Distell',          venue: 'Gateway Theatre',    date: '2026-03-18', startTime: '14:00', endTime: '22:00', hourlyRate: 115, totalSlots: 3,  filledSlots: 0,  status: 'open',      city: 'Durban'       },
]

const STATUS_COLOR: Record<JobStatus, string> = { open: '#22C55E', filled: G, completed: '#3A7BD5', cancelled: '#EF4444' }

const EMPTY_JOB: Omit<Job, 'id'> = { title: '', client: '', venue: '', date: '', startTime: '09:00', endTime: '17:00', hourlyRate: 100, totalSlots: 4, filledSlots: 0, status: 'open', city: '' }

export default function CRUDJobsLogic() {
  const [jobs,      setJobs]      = useState<Job[]>(MOCK_JOBS)
  const [modal,     setModal]     = useState<'create' | 'edit' | null>(null)
  const [editing,   setEditing]   = useState<Job | null>(null)
  const [form,      setForm]      = useState<Omit<Job, 'id'>>(EMPTY_JOB)
  const [filter,    setFilter]    = useState<JobStatus | 'all'>('all')
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const filtered = jobs.filter(j => filter === 'all' || j.status === filter)

  const openCreate = () => { setForm(EMPTY_JOB); setEditing(null); setModal('create') }
  const openEdit   = (job: Job) => { setForm({ ...job }); setEditing(job); setModal('edit') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const save = () => {
    if (modal === 'create') {
      const newJob: Job = { ...form, id: `JB-${Math.floor(Math.random() * 900 + 100)}` }
      setJobs(prev => [newJob, ...prev])
    } else if (editing) {
      setJobs(prev => prev.map(j => j.id === editing.id ? { ...form, id: editing.id } : j))
    }
    closeModal()
  }

  const deleteJob = (id: string) => { setJobs(prev => prev.filter(j => j.id !== id)); setDeleting(null) }

  const F = (key: keyof typeof form, value: string | number) => setForm(prev => ({ ...prev, [key]: value }))

  const counts = { all: jobs.length, open: jobs.filter(j => j.status === 'open').length, filled: jobs.filter(j => j.status === 'filled').length, completed: jobs.filter(j => j.status === 'completed').length, cancelled: jobs.filter(j => j.status === 'cancelled').length }

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>Jobs Management</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Manage Jobs</h1>
            <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>{jobs.length} total jobs across all cities.</p>
          </div>
          <button onClick={openCreate} style={{
            padding: '12px 28px', background: G, border: 'none', color: B,
            fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = GL}
            onMouseLeave={e => e.currentTarget.style.background = G}
          >+ New Job</button>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'open', 'filled', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FB,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'capitalize',
              background: filter === f ? G : 'rgba(255,255,255,0.05)',
              color: filter === f ? B : WM, transition: 'all 0.2s',
            }}>
              {f === 'all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BB}` }}>
                {['ID', 'Title', 'Client', 'City / Venue', 'Date', 'Rate', 'Slots', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, fontFamily: FB, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, i) => (
                <tr key={job.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BB}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 18px', fontSize: 11, color: WD, fontFamily: FB }}>{job.id}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: W }}>{job.title}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM }}>{job.client}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: W }}>{job.city}</div>
                    <div style={{ fontSize: 11, color: WD }}>{job.venue}</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: WM, whiteSpace: 'nowrap' }}>
                    {new Date(job.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}<br />
                    <span style={{ fontSize: 10, color: WD }}>{job.startTime}–{job.endTime}</span>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: G, fontWeight: 700 }}>R{job.hourlyRate}/hr</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: W }}>{job.filledSlots}/{job.totalSlots}</div>
                    <div style={{ marginTop: 4, height: 3, background: BB, borderRadius: 2, width: 48 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: STATUS_COLOR[job.status], width: `${(job.filledSlots / job.totalSlots) * 100}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[job.status], background: `${STATUS_COLOR[job.status]}18`, padding: '3px 10px', borderRadius: 2 }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(job)} style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, padding: 0 }}>Edit</button>
                      <span style={{ color: WD }}>·</span>
                      <button onClick={() => setDeleting(job.id)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, padding: 0 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DELETE CONFIRM */}
        {deleting && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
            <div style={{ background: BC, border: `1px solid #EF4444`, padding: '36px 40px', maxWidth: 380, width: '100%' }}>
              <h3 style={{ fontFamily: FD, fontSize: 22, color: W, marginBottom: 12 }}>Delete Job?</h3>
              <p style={{ fontSize: 13, color: WM, marginBottom: 28 }}>This action cannot be undone. The job and all associated shifts will be permanently removed.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleting(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: WM, fontFamily: FB, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => deleteJob(deleting)} style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', color: W, fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE/EDIT MODAL */}
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
            onClick={e => e.target === e.currentTarget && closeModal()}
          >
            <div style={{ background: '#141414', border: `1px solid ${BB}`, padding: '40px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: G }} />
              <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: WM, fontSize: 18 }}>✕</button>

              <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>{modal === 'create' ? 'New Job' : 'Edit Job'}</div>
              <h2 style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: W, marginBottom: 28 }}>{modal === 'create' ? 'Create a New Job' : `Editing ${editing?.id}`}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {([
                  { label: 'Job Title',    key: 'title',      type: 'text',   placeholder: 'Brand Ambassador — Red Bull' },
                  { label: 'Client',       key: 'client',     type: 'text',   placeholder: 'Red Bull SA'                  },
                  { label: 'Venue',        key: 'venue',      type: 'text',   placeholder: 'Sandton City'                 },
                  { label: 'City',         key: 'city',       type: 'text',   placeholder: 'Johannesburg'                 },
                  { label: 'Date',         key: 'date',       type: 'date',   placeholder: ''                             },
                ] as const).map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>{label}</label>
                    <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => F(key, e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '12px 16px', fontFamily: FB, fontSize: 14, color: W, outline: 'none' }}
                      onFocus={e => e.currentTarget.style.borderColor = G}
                      onBlur={e => e.currentTarget.style.borderColor = BB}
                    />
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Start Time', key: 'startTime', type: 'time' },
                    { label: 'End Time',   key: 'endTime',   type: 'time' },
                    { label: 'Hourly Rate (R)', key: 'hourlyRate', type: 'number' },
                    { label: 'Total Slots',     key: 'totalSlots', type: 'number' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>{label}</label>
                      <input type={type} value={(form as any)[key]} onChange={e => F(key as any, type === 'number' ? +e.target.value : e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`, padding: '12px 16px', fontFamily: FB, fontSize: 14, color: W, outline: 'none' }}
                        onFocus={e => e.currentTarget.style.borderColor = G}
                        onBlur={e => e.currentTarget.style.borderColor = BB}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7 }}>Status</label>
                  <select value={form.status} onChange={e => F('status', e.target.value)}
                    style={{ width: '100%', background: '#0e0e0e', border: `1px solid ${BB}`, padding: '12px 16px', fontFamily: FB, fontSize: 14, color: W, outline: 'none' }}>
                    {['open', 'filled', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>

                <button onClick={save} style={{
                  padding: '15px', background: G, border: 'none', color: B,
                  fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', cursor: 'pointer', marginTop: 8, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = GL}
                  onMouseLeave={e => e.currentTarget.style.background = G}
                >{modal === 'create' ? 'Create Job' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}