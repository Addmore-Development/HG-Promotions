import { useState } from 'react'
import { AdminLayout } from '../AdminLayout'

// ─── Warm palette ─────────────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'

const B  = '#0C0A07'
const D1 = '#0E0C06'
const D2 = '#151209'
const D3 = '#1C1709'

const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'

const W   = '#FAF3E8'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'

const FD = "'Playfair Display', Georgia, serif"

function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

type Role   = 'promoter' | 'client' | 'admin'
type Status = 'active' | 'inactive' | 'suspended'

interface User {
  id: string; name: string; email: string; phone: string
  role: Role; status: Status; city: string; joined: string
  jobs: number; payouts: number
}

const MOCK_USERS: User[] = [
  { id: 'U001', name: 'Ayanda Dlamini',  email: 'ayanda@email.com',  phone: '+27 71 234 5678', role: 'promoter', status: 'active',    city: 'Johannesburg', joined: '2025-11-12', jobs: 24, payouts: 28800 },
  { id: 'U002', name: 'Thabo Nkosi',     email: 'thabo@email.com',   phone: '+27 82 345 6789', role: 'promoter', status: 'active',    city: 'Johannesburg', joined: '2025-10-04', jobs: 18, payouts: 21600 },
  { id: 'U003', name: 'Lerato Mokoena',  email: 'lerato@email.com',  phone: '+27 63 456 7890', role: 'client',   status: 'active',    city: 'Cape Town',    joined: '2025-09-20', jobs: 42, payouts: 0 },
  { id: 'U004', name: 'Sipho Mhlongo',   email: 'sipho@email.com',   phone: '+27 74 567 8901', role: 'promoter', status: 'suspended', city: 'Durban',       joined: '2026-01-08', jobs: 3,  payouts: 2700 },
  { id: 'U005', name: 'Nomsa Zulu',      email: 'nomsa@email.com',   phone: '+27 83 678 9012', role: 'promoter', status: 'active',    city: 'Pretoria',     joined: '2025-12-01', jobs: 9,  payouts: 10350 },
  { id: 'U006', name: 'Bongani Khumalo', email: 'bongani@email.com', phone: '+27 61 789 0123', role: 'promoter', status: 'inactive',  city: 'Durban',       joined: '2025-08-15', jobs: 31, payouts: 37200 },
  { id: 'U007', name: 'Zanele Motha',    email: 'zanele@email.com',  phone: '+27 79 890 1234', role: 'promoter', status: 'active',    city: 'Johannesburg', joined: '2026-02-10', jobs: 6,  payouts: 8100 },
  { id: 'U008', name: 'Musa Dube',       email: 'musa@email.com',    phone: '+27 72 901 2345', role: 'client',   status: 'active',    city: 'Cape Town',    joined: '2025-07-22', jobs: 55, payouts: 0 },
]

// ── Role colors ───────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<Role, string> = {
  promoter: GL,   // bright gold
  client:   G3,   // mid amber
  admin:    G4,   // pale gold
}

// ── Status colors — inactive & suspended always legible on dark backgrounds ───
const STATUS_CLR: Record<Status, string> = {
  active:    G3,          // mid amber
  inactive:  '#E8D5A8',   // warm cream — VISIBLE on dark bg
  suspended: G4,          // pale gold — distinct, warm
}
const STATUS_BG: Record<Status, string> = {
  active:    hex2rgba(G3, 0.12),
  inactive:  hex2rgba('#6B4020', 0.35),   // darker bg so cream text pops
  suspended: hex2rgba(G4, 0.10),
}
const STATUS_BORDER: Record<Status, string> = {
  active:    hex2rgba(G3, 0.45),
  inactive:  hex2rgba('#8B6040', 0.60),   // stronger border for inactive
  suspended: hex2rgba(G4, 0.42),
}

const EMPTY: Omit<User, 'id' | 'jobs' | 'payouts'> = { name: '', email: '', phone: '', role: 'promoter', status: 'active', city: '', joined: '' }

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FD, color, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 3 }}>{label}</span>
  )
}

// ── FilterBtn — always uses hex2rgba(), never appends hex suffix ──────────────
function FilterBtn({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  // Guard: only pass valid hex strings to hex2rgba
  const safeColor = color.startsWith('#') ? color : GL
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px',
      border: `1px solid ${active ? safeColor : 'rgba(212,136,10,0.22)'}`,
      cursor: 'pointer', fontFamily: FD, fontSize: 10, fontWeight: active ? 700 : 400,
      textTransform: 'capitalize' as const, borderRadius: 3,
      background: active ? hex2rgba(safeColor, 0.18) : 'transparent',
      color: active ? safeColor : W55,
      transition: 'all 0.18s',
    }}>{label}</button>
  )
}

function Btn({ children, onClick, outline = false, color = GL }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '11px 24px',
      background: outline ? 'transparent' : `linear-gradient(135deg,${color},${hex2rgba(color, 0.8)})`,
      border: `1px solid ${color}`, color: outline ? color : B,
      fontFamily: FD, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' as const,
      transition: 'all 0.2s', borderRadius: 3,
      boxShadow: outline ? 'none' : `0 2px 12px ${hex2rgba(color, 0.35)}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
    >{children}</button>
  )
}

export default function FullCRUDUsers() {
  const [users,    setUsers   ] = useState<User[]>(MOCK_USERS)
  const [modal,    setModal   ] = useState<'create' | 'edit' | 'view' | null>(null)
  const [editing,  setEditing ] = useState<User | null>(null)
  const [form,     setForm    ] = useState<Omit<User, 'id' | 'jobs' | 'payouts'>>(EMPTY)
  const [search,   setSearch  ] = useState('')
  const [roleF,    setRoleF   ] = useState<Role | 'all'>('all')
  const [statusF,  setStatusF ] = useState<Status | 'all'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const roleMatch   = roleF   === 'all' || u.role   === roleF
    const statusMatch = statusF === 'all' || u.status === statusF
    const searchMatch = search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return roleMatch && statusMatch && searchMatch
  })

  const openCreate = () => { setForm(EMPTY); setEditing(null); setModal('create') }
  const openEdit   = (u: User) => { setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, city: u.city, joined: u.joined }); setEditing(u); setModal('edit') }
  const openView   = (u: User) => { setEditing(u); setModal('view') }
  const closeModal = () => { setModal(null); setEditing(null) }

  const save = () => {
    if (modal === 'create') { setUsers(prev => [{ ...form, id: `U${String(users.length + 1).padStart(3, '0')}`, jobs: 0, payouts: 0 }, ...prev]) }
    else if (editing)       { setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } : u)) }
    closeModal()
  }
  const deleteUser = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); setDeleting(null); if (modal) closeModal() }
  const F = (key: keyof typeof form, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const inputStyle: React.CSSProperties = { width: '100%', background: BB2, border: `1px solid ${BB}`, padding: '12px 16px', fontFamily: FD, fontSize: 13, color: W, outline: 'none', borderRadius: 3 }
  const labelStyle: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: W55, display: 'block', marginBottom: 7, fontFamily: FD }

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AdminLayout>
      <div style={{ padding: '40px 48px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>People · Users</div>
            <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>Manage Users</h1>
            <p style={{ fontSize: 13, color: W55, marginTop: 6, fontFamily: FD }}>{users.length} registered users on the platform.</p>
          </div>
          <Btn onClick={openCreate}>+ Add User</Btn>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: D2, border: `1px solid ${BB}`, padding: '9px 16px', color: W, fontFamily: FD, fontSize: 12, outline: 'none', width: 240, borderRadius: 3 }}
            onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />

          {/* Role filters */}
          <div style={{ display: 'flex', gap: 5 }}>
            {(['all', 'promoter', 'client', 'admin'] as const).map(r => (
              <FilterBtn key={r} label={r === 'all' ? 'All Roles' : r} active={roleF === r} color={r === 'all' ? GL : ROLE_COLOR[r]} onClick={() => setRoleF(r)} />
            ))}
          </div>

          {/* Status filters — inactive & suspended use visible warm colors */}
          <div style={{ display: 'flex', gap: 5 }}>
            {(['all', 'active', 'inactive', 'suspended'] as const).map(s => (
              <FilterBtn key={s} label={s === 'all' ? 'All Status' : s} active={statusF === s} color={s === 'all' ? GL : STATUS_CLR[s]} onClick={() => setStatusF(s)} />
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: D2, border: `1px solid ${BB}`, borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BB}`, background: D1 }}>
                {['User', 'Role', 'City', 'Joined', 'Jobs', 'Payout', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: W28, fontFamily: FD }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BB}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = BB2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => openView(u)}>

                  {/* Avatar + name */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(145deg,${G5}CC,${hex2rgba(ROLE_COLOR[u.role], 0.28)})`, border: `1px solid ${hex2rgba(ROLE_COLOR[u.role], 0.35)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: ROLE_COLOR[u.role], fontWeight: 700, fontFamily: FD }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: W55, fontFamily: FD }}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td style={{ padding: '14px 18px' }}>
                    <Badge label={u.role} color={ROLE_COLOR[u.role]} bg={hex2rgba(ROLE_COLOR[u.role], 0.12)} border={hex2rgba(ROLE_COLOR[u.role], 0.4)} />
                  </td>

                  <td style={{ padding: '14px 18px', fontSize: 12, color: W55, fontFamily: FD }}>{u.city}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: W55, fontFamily: FD, whiteSpace: 'nowrap' }}>
                    {new Date(u.joined).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: W, fontWeight: 700, fontFamily: FD }}>{u.jobs}</td>

                  {/* Payout — promoters only */}
                  <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, fontFamily: FD, color: u.role === 'promoter' ? GL : W28 }}>
                    {u.role === 'promoter' ? `R${u.payouts.toLocaleString('en-ZA')}` : '—'}
                  </td>

                  {/* Status badge */}
                  <td style={{ padding: '14px 18px' }}>
                    <Badge label={u.status} color={STATUS_CLR[u.status]} bg={STATUS_BG[u.status]} border={STATUS_BORDER[u.status]} />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => openEdit(u)} style={{ fontSize: 11, color: GL, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FD, fontWeight: 700 }}>Edit</button>
                      <span style={{ color: W28 }}>·</span>
                      <button onClick={() => setDeleting(u.id)} style={{ fontSize: 11, color: '#C8A888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FD }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: W28, fontSize: 13, fontFamily: FD }}>No users match your filters.</div>}
        </div>

        {/* DELETE CONFIRM */}
        {deleting && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
            <div style={{ background: D2, border: `1px solid ${hex2rgba(G2, 0.7)}`, padding: '36px 40px', maxWidth: 380, width: '100%', position: 'relative', borderRadius: 4 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: G2, borderRadius: '4px 4px 0 0' }} />
              <h3 style={{ fontFamily: FD, fontSize: 22, color: W, marginBottom: 12 }}>Delete User?</h3>
              <p style={{ fontSize: 13, color: W55, marginBottom: 28, lineHeight: 1.7, fontFamily: FD }}>This will permanently remove the user and all their data from the platform.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleting(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${BB}`, color: W55, fontFamily: FD, fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>Cancel</button>
                <button onClick={() => deleteUser(deleting)} style={{ flex: 1, padding: '12px', background: hex2rgba(G2, 0.25), border: `1px solid ${G2}`, color: '#E8D5A8', fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 3 }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODAL */}
        {(modal === 'create' || modal === 'edit') && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <div style={{ background: D2, border: `1px solid ${BB}`, padding: '40px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: 4 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${GL},${G5})`, borderRadius: '4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: W28, fontSize: 18 }}>✕</button>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>{modal === 'create' ? 'New User' : 'Edit User'}</div>
              <h2 style={{ fontFamily: FD, fontSize: 24, fontWeight: 700, color: W, marginBottom: 28 }}>{modal === 'create' ? 'Add a New User' : `Editing ${editing?.name}`}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Full Name', key: 'name',  placeholder: 'Ayanda Dlamini'   },
                  { label: 'Email',     key: 'email', placeholder: 'ayanda@email.com' },
                  { label: 'Phone',     key: 'phone', placeholder: '+27 71 000 0000'  },
                  { label: 'City',      key: 'city',  placeholder: 'Johannesburg'     },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input type="text" placeholder={placeholder} value={(form as any)[key]} onChange={e => F(key as any, e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select value={form.role} onChange={e => F('role', e.target.value)} style={{ ...inputStyle, background: D3, cursor: 'pointer' }}>
                      <option value="promoter">Promoter</option>
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={form.status} onChange={e => F('status', e.target.value)} style={{ ...inputStyle, background: D3, cursor: 'pointer' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <Btn onClick={save}>{modal === 'create' ? 'Create User' : 'Save Changes'}</Btn>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {modal === 'view' && editing && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}
            onClick={e => e.target === e.currentTarget && closeModal()}>
            <div style={{ background: D2, border: `1px solid ${BB}`, padding: '40px', width: '100%', maxWidth: 460, position: 'relative', borderRadius: 4 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${ROLE_COLOR[editing.role]},${G5})`, borderRadius: '4px 4px 0 0' }} />
              <button onClick={closeModal} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: W28, fontSize: 18 }}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(145deg,${G5}CC,${hex2rgba(ROLE_COLOR[editing.role], 0.32)})`, border: `1px solid ${hex2rgba(ROLE_COLOR[editing.role], 0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: ROLE_COLOR[editing.role], fontWeight: 700, fontFamily: FD }}>
                  {initials(editing.name)}
                </div>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: W }}>{editing.name}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={editing.role} color={ROLE_COLOR[editing.role]} bg={hex2rgba(ROLE_COLOR[editing.role], 0.12)} border={hex2rgba(ROLE_COLOR[editing.role], 0.38)} />
                    <Badge label={editing.status} color={STATUS_CLR[editing.status]} bg={STATUS_BG[editing.status]} border={STATUS_BORDER[editing.status]} />
                  </div>
                </div>
              </div>

              {[
                { label: 'Email',  value: editing.email },
                { label: 'Phone',  value: editing.phone },
                { label: 'City',   value: editing.city },
                { label: 'Joined', value: new Date(editing.joined).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Jobs',   value: String(editing.jobs) },
                ...(editing.role === 'promoter' ? [{ label: 'Payout Total', value: `R${editing.payouts.toLocaleString('en-ZA')}` }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${BB}` }}>
                  <span style={{ fontSize: 12, color: W55, fontFamily: FD }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: W, fontWeight: 700, fontFamily: FD }}>{row.value}</span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button onClick={() => { closeModal(); openEdit(editing) }}
                  style={{ flex: 2, padding: '12px', background: `linear-gradient(135deg,${GL},${G3})`, border: 'none', color: B, fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 3, boxShadow: `0 2px 12px ${hex2rgba(GL, 0.35)}` }}>
                  Edit User
                </button>
                <button onClick={() => { closeModal(); setDeleting(editing.id) }}
                  style={{ flex: 1, padding: '12px', background: hex2rgba(G2, 0.18), border: `1px solid ${hex2rgba(G2, 0.5)}`, color: '#E8D5A8', fontFamily: FD, fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 3 }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}