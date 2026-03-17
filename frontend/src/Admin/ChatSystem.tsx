// ─────────────────────────────────────────────────────────────────────────────
// ChatSystem.tsx
// Contains:
//   1. AdminChatTab   — full chat panel for the admin dashboard (Messages tab replacement)
//   2. FloatingChat   — floating chat bubble for promoter & client dashboards
//
// Usage:
//   In adminDashboard.tsx: replace {tab==='messages' && <MessagesTab .../>}
//   with {tab==='messages' && <AdminChatTab />}
//
//   In PromoterDashboard / BusinessDashboard: <FloatingChat role="promoter" name="Ayanda" />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const G   = '#D4880A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#C07818'
const G4  = '#F0C050'
const G5  = '#6B3F10'
const B   = '#0C0A07'
const D1  = '#0E0C06'
const D2  = '#151209'
const D3  = '#1C1709'
const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'
const W   = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"
const FB  = "'DM Sans', system-ui, sans-serif"

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'hg_chat_messages'

interface ChatMessage {
  id:        string
  thread:    string          // thread ID = "role:name" of the non-admin participant
  from:      string          // 'admin' | user name
  fromRole:  'admin' | 'promoter' | 'business'
  text:      string
  timestamp: string          // ISO
  read:      boolean
}

interface Thread {
  id:       string           // e.g. "promoter:Ayanda Dlamini"
  name:     string
  role:     'promoter' | 'business'
  lastMsg:  string
  lastTime: string
  unread:   number
}

function loadMessages(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveMessages(msgs: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs))
  window.dispatchEvent(new Event('storage'))
}

function buildThreads(messages: ChatMessage[]): Thread[] {
  const map = new Map<string, Thread>()
  messages.forEach(m => {
    const tid = m.thread
    const existing = map.get(tid)
    const parts = tid.split(':')
    const role = parts[0] as 'promoter' | 'business'
    const name = parts.slice(1).join(':')
    const adminUnread = m.fromRole !== 'admin' && !m.read ? 1 : 0
    if (!existing) {
      map.set(tid, { id: tid, name, role, lastMsg: m.text, lastTime: m.timestamp, unread: adminUnread })
    } else {
      if (new Date(m.timestamp) > new Date(existing.lastTime)) {
        existing.lastMsg  = m.text
        existing.lastTime = m.timestamp
      }
      existing.unread += adminUnread
    }
  })
  return Array.from(map.values()).sort((a,b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1)   return 'Just now'
  if (diffMin < 60)  return `${diffMin}m ago`
  if (diffMin < 1440) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// Seed some demo messages if none exist
function seedDemoMessages() {
  const existing = loadMessages()
  if (existing.length > 0) return
  const demo: ChatMessage[] = [
    { id:'dm1', thread:'promoter:Ayanda Dlamini', from:'Ayanda Dlamini', fromRole:'promoter', text:'Hi Admin, I wanted to confirm my check-in time for the Sandton City shift tomorrow.', timestamp:new Date(Date.now()-3600000*2).toISOString(), read:false },
    { id:'dm2', thread:'promoter:Ayanda Dlamini', from:'admin', fromRole:'admin', text:"Hi Ayanda! Your shift starts at 09:00. Please arrive 15 minutes early for the briefing. See you then!", timestamp:new Date(Date.now()-3600000*1.5).toISOString(), read:true },
    { id:'dm3', thread:'business:RedBull SA', from:'RedBull SA', fromRole:'business', text:'We need 2 extra promoters for our Cape Town activation this Saturday. Can you help?', timestamp:new Date(Date.now()-3600000*5).toISOString(), read:false },
    { id:'dm4', thread:'promoter:Thabo Nkosi', from:'Thabo Nkosi', fromRole:'promoter', text:'When will my payment for the last shift be processed?', timestamp:new Date(Date.now()-3600000*8).toISOString(), read:true },
    { id:'dm5', thread:'promoter:Thabo Nkosi', from:'admin', fromRole:'admin', text:'Hi Thabo, payments are processed within 5 business days of shift completion. Yours should clear by Thursday.', timestamp:new Date(Date.now()-3600000*7).toISOString(), read:true },
    { id:'dm6', thread:'business:Acme Events Corp', from:'Acme Events Corp', fromRole:'business', text:"We'd like to book 4 hostesses for our Menlyn event on March 21st. Are they still available?", timestamp:new Date(Date.now()-3600000*24).toISOString(), read:true },
  ]
  saveMessages(demo)
}

// ─── ADMIN CHAT TAB ───────────────────────────────────────────────────────────
// Mock registered users — in production these would come from the API
const REGISTERED_PROMOTERS = [
  'Ayanda Dlamini', 'Thabo Nkosi', 'Sipho Mhlongo', 'Zanele Motha',
  'Bongani Khumalo', 'Lerato Mokoena', 'Nomsa Zulu', 'Lebo Sithole',
  'Thandeka Mahlangu', 'Sifiso Dube', 'Naledi Khumalo', 'Mpho Mokoena',
  'Kagiso Radebe', 'Dineo Nkosi', 'Sibusiso Zulu', 'Precious Molefe',
]
const REGISTERED_BUSINESSES = [
  'Red Bull SA', 'Castle Lager SA', 'AB InBev', 'Heineken SA', 'Distell',
  'Nike SA', 'Vodacom', 'MTN SA', 'Nedbank', 'Standard Bank SA',
  'Acme Events Corp', 'FreshBrands Ltd', 'SABMiller SA', 'Tiger Brands',
  'Coca-Cola SA', 'KFC South Africa', 'Old Mutual SA', 'Shoprite Holdings',
]

export function AdminChatTab() {
  const [messages,       setMessages      ] = useState<ChatMessage[]>([])
  const [threads,        setThreads       ] = useState<Thread[]>([])
  const [activeThread,   setActiveThread  ] = useState<string | null>(null)
  const [draft,          setDraft         ] = useState('')
  const [search,         setSearch        ] = useState('')
  const [filterRole,     setFilterRole    ] = useState<'all'|'promoter'|'business'>('all')
  const [newThreadName,  setNewThreadName ] = useState('')
  const [newThreadRole,  setNewThreadRole ] = useState<'promoter'|'business'>('promoter')
  const [showNewThread,  setShowNewThread ] = useState(false)
  const [showDropdown,   setShowDropdown  ] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const reload = () => {
    seedDemoMessages()
    const msgs = loadMessages()
    setMessages(msgs)
    setThreads(buildThreads(msgs))
  }

  useEffect(() => {
    reload()
    const handler = () => reload()
    window.addEventListener('storage', handler)
    const interval = setInterval(reload, 3000)
    return () => { window.removeEventListener('storage', handler); clearInterval(interval) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread, messages.length])

  const activeMessages = messages.filter(m => m.thread === activeThread)
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const activeThreadObj = threads.find(t => t.id === activeThread)

  const markRead = (threadId: string) => {
    const updated = loadMessages().map(m => m.thread === threadId && m.fromRole !== 'admin' ? { ...m, read: true } : m)
    saveMessages(updated)
    reload()
  }

  const selectThread = (tid: string) => {
    setActiveThread(tid)
    markRead(tid)
    setDraft('')
  }

  const sendMessage = () => {
    if (!draft.trim() || !activeThread) return
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`, thread: activeThread,
      from: 'Admin', fromRole: 'admin', text: draft.trim(),
      timestamp: new Date().toISOString(), read: true,
    }
    const updated = [...loadMessages(), newMsg]
    saveMessages(updated)
    setDraft('')
    reload()
  }

  const startNewThread = () => {
    if (!newThreadName.trim()) return
    const tid = `${newThreadRole}:${newThreadName.trim()}`
    setActiveThread(tid)
    setShowNewThread(false)
    setNewThreadName('')
    markRead(tid)
  }

  const filteredThreads = threads
    .filter(t => filterRole === 'all' || t.role === filterRole)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  const inp: React.CSSProperties = { background: BB2, border: `1px solid ${BB}`, padding: '10px 14px', color: W, fontFamily: FB, fontSize: 13, outline: 'none', borderRadius: 3 }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700, fontFamily: FD }}>Comms · Chat</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W }}>
              Messages
              {totalUnread > 0 && <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 700, color: B, background: GL, padding: '2px 10px', borderRadius: 20 }}>{totalUnread}</span>}
            </h1>
            <p style={{ fontSize: 13, color: W55, marginTop: 4, fontFamily: FD }}>Chat with promoters and business clients in real-time.</p>
          </div>
          <button onClick={() => setShowNewThread(true)}
            style={{ padding: '10px 22px', background: `linear-gradient(135deg,${GL},${G})`, border: 'none', color: B, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3 }}>
            + New Chat
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, border: `1px solid ${BB}`, borderRadius: 4, overflow: 'hidden', height: 'calc(100vh - 260px)', minHeight: 500 }}>

        {/* ── LEFT: Thread list ── */}
        <div style={{ background: D2, borderRight: `1px solid ${BB}`, display: 'flex', flexDirection: 'column' }}>
          {/* Search + filter */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BB}`, flexShrink: 0 }}>
            <input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inp, width: '100%', marginBottom: 10, fontSize: 12 }}
              onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all','promoter','business'] as const).map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  style={{ flex: 1, padding: '5px', border: `1px solid ${filterRole===r?GL:BB}`, background: filterRole===r ? `rgba(232,168,32,0.14)` : 'transparent', color: filterRole===r ? GL : W55, fontFamily: FD, fontSize: 9, fontWeight: filterRole===r?700:400, letterSpacing: '0.12em', textTransform: 'capitalize', cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s' }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Threads */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: W28, fontSize: 12, fontFamily: FD }}>No conversations yet.</div>
            )}
            {filteredThreads.map(t => (
              <div key={t.id} onClick={() => selectThread(t.id)}
                style={{ padding: '14px 16px', cursor: 'pointer', background: activeThread===t.id ? `rgba(232,168,32,0.08)` : 'transparent', borderBottom: `1px solid ${BB}`, borderLeft: `3px solid ${activeThread===t.id ? GL : 'transparent'}`, transition: 'all 0.18s' }}
                onMouseEnter={e => { if (activeThread!==t.id) e.currentTarget.style.background = BB2 }}
                onMouseLeave={e => { if (activeThread!==t.id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Avatar */}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.role==='promoter' ? `rgba(212,136,10,0.2)` : `rgba(232,168,32,0.2)`, border: `1px solid ${t.role==='promoter'?G3:GL}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.role==='promoter'?G3:GL, flexShrink: 0, fontFamily: FD }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: W, fontFamily: FD, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.name}
                        {t.unread > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: GL, display: 'inline-block' }} />}
                      </div>
                      <div style={{ fontSize: 9, color: t.role==='promoter'?G3:GL, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FD }}>{t.role}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: W28, fontFamily: FD, flexShrink: 0 }}>{formatTime(t.lastTime)}</span>
                </div>
                <div style={{ fontSize: 11, color: t.unread>0 ? W55 : W28, fontFamily: FD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 40 }}>
                  {t.lastMsg}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Active conversation ── */}
        <div style={{ background: D1, display: 'flex', flexDirection: 'column' }}>
          {!activeThread ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 32, color: W28 }}>◆</div>
              <div style={{ fontFamily: FD, fontSize: 18, color: W55 }}>Select a conversation</div>
              <div style={{ fontSize: 12, color: W28, fontFamily: FD }}>or start a new chat with a promoter or client</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BB}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, background: D2 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeThreadObj?.role==='promoter'?`rgba(212,136,10,0.2)`:`rgba(232,168,32,0.2)`, border:`1px solid ${activeThreadObj?.role==='promoter'?G3:GL}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:activeThreadObj?.role==='promoter'?G3:GL, fontFamily:FD }}>
                  {activeThreadObj?.name.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: W, fontFamily: FD }}>{activeThreadObj?.name}</div>
                  <div style={{ fontSize: 10, color: activeThreadObj?.role==='promoter'?G3:GL, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FD }}>{activeThreadObj?.role}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeMessages.length === 0 && (
                  <div style={{ textAlign: 'center', color: W28, fontSize: 12, fontFamily: FD, marginTop: 40 }}>No messages yet. Start the conversation.</div>
                )}
                {activeMessages.map(m => {
                  const isAdmin = m.fromRole === 'admin'
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: isAdmin ? `linear-gradient(135deg, ${G5}, ${G2})` : D2,
                        border: isAdmin ? 'none' : `1px solid ${BB}`,
                      }}>
                        {!isAdmin && <div style={{ fontSize: 9, fontWeight: 700, color: G3, marginBottom: 4, letterSpacing: '0.1em', fontFamily: FD }}>{m.from}</div>}
                        <div style={{ fontSize: 13, color: W, lineHeight: 1.6, fontFamily: FB }}>{m.text}</div>
                        <div style={{ fontSize: 9, color: isAdmin ? 'rgba(250,243,232,0.5)' : W28, marginTop: 4, textAlign: 'right', fontFamily: FD }}>{formatTime(m.timestamp)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '14px 24px', borderTop: `1px solid ${BB}`, display: 'flex', gap: 10, flexShrink: 0, background: D2 }}>
                <input
                  value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message ${activeThreadObj?.name || ''}…`}
                  style={{ ...inp, flex: 1, fontSize: 13 }}
                  onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />
                <button onClick={sendMessage} disabled={!draft.trim()}
                  style={{ padding: '10px 20px', background: draft.trim() ? `linear-gradient(135deg,${GL},${G})` : BB, border: 'none', color: draft.trim() ? B : W28, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: draft.trim() ? 'pointer' : 'default', borderRadius: 3, transition: 'all 0.2s', letterSpacing: '0.08em' }}>
                  Send ↑
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowNewThread(false)}>
          <div style={{ background: D2, border: `1px solid ${BB}`, padding: '36px 40px', width: '100%', maxWidth: 420, position: 'relative', borderRadius: 4 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${G5},${GL},${G})` }} />
            <button onClick={() => setShowNewThread(false)} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: W28, fontSize: 18 }}>✕</button>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontFamily: FD, fontWeight: 700 }}>New Conversation</div>
            <h3 style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: W, marginBottom: 24 }}>Start a Chat</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: W55, display: 'block', marginBottom: 7, fontFamily: FD }}>Role</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['promoter','business'] as const).map(r => (
                  <button key={r} onClick={() => setNewThreadRole(r)}
                    style={{ flex: 1, padding: '9px', border: `1px solid ${newThreadRole===r?GL:BB}`, background: newThreadRole===r?`rgba(232,168,32,0.12)`:'transparent', color: newThreadRole===r?GL:W55, fontFamily: FD, fontSize: 11, fontWeight: newThreadRole===r?700:400, textTransform: 'capitalize', cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s' }}>
                    {r === 'promoter' ? '◉ Promoter' : '◈ Business'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: W55, display: 'block', marginBottom: 7, fontFamily: FD }}>Name</label>
              <div style={{ position: 'relative' }}>
                <input value={newThreadName}
                  onChange={e => { setNewThreadName(e.target.value); setShowDropdown(true) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { startNewThread(); setShowDropdown(false) }
                    if (e.key === 'Escape') setShowDropdown(false)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={newThreadRole === 'promoter' ? 'Search promoter name…' : 'Search business name…'}
                  style={{ ...inp, width: '100%' }}
                  autoComplete="off"
                />
                {showDropdown && (() => {
                  const allNames = newThreadRole === 'promoter' ? REGISTERED_PROMOTERS : REGISTERED_BUSINESSES
                  const q = newThreadName.toLowerCase()
                  const filtered = allNames.filter(n => !q || n.toLowerCase().includes(q))
                  if (filtered.length === 0) return null
                  return (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: D3, border: `1px solid ${BB}`, borderTop: 'none', borderRadius: '0 0 3px 3px', maxHeight: 200, overflowY: 'auto', zIndex: 999 }}>
                      {filtered.map(name => (
                        <div key={name}
                          onMouseDown={e => { e.preventDefault(); setNewThreadName(name); setShowDropdown(false) }}
                          style={{ padding: '10px 14px', fontSize: 13, color: W55, fontFamily: FD, cursor: 'pointer', borderBottom: `1px solid ${BB}`, transition: 'all 0.12s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = BB2; e.currentTarget.style.color = W }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = W55 }}>
                          {name}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
            <button onClick={startNewThread} disabled={!newThreadName.trim()}
              style={{ width: '100%', padding: '12px', background: newThreadName.trim()?`linear-gradient(135deg,${GL},${G})`:'rgba(255,255,255,0.05)', border: 'none', color: newThreadName.trim()?B:W28, fontFamily: FD, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: newThreadName.trim()?'pointer':'default', borderRadius: 3, transition: 'all 0.2s' }}>
              Open Conversation →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FLOATING CHAT WIDGET ─────────────────────────────────────────────────────
// Drop this into PromoterDashboard or BusinessDashboard
// <FloatingChat role="promoter" name="Ayanda Dlamini" />

interface FloatingChatProps {
  role: 'promoter' | 'business'
  name: string
}

export function FloatingChat({ role, name }: FloatingChatProps) {
  const threadId = `${role}:${name}`
  const [open,     setOpen    ] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft,    setDraft   ] = useState('')
  const [unread,   setUnread  ] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const reload = () => {
    seedDemoMessages()
    const all = loadMessages()
    const mine = all.filter(m => m.thread === threadId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    setMessages(mine)
    setUnread(mine.filter(m => m.fromRole === 'admin' && !m.read).length)
  }

  useEffect(() => {
    reload()
    const handler = () => reload()
    window.addEventListener('storage', handler)
    const interval = setInterval(reload, 3000)
    return () => { window.removeEventListener('storage', handler); clearInterval(interval) }
  }, [])

  useEffect(() => {
    if (open) {
      // Mark admin messages as read when chat is opened
      const all = loadMessages()
      const updated = all.map(m => m.thread === threadId && m.fromRole === 'admin' ? { ...m, read: true } : m)
      saveMessages(updated)
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages.length])

  const send = () => {
    if (!draft.trim()) return
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`, thread: threadId,
      from: name, fromRole: role, text: draft.trim(),
      timestamp: new Date().toISOString(), read: false,
    }
    saveMessages([...loadMessages(), newMsg])
    setDraft('')
    reload()
  }

  return (
    <>
      <style>{`
        @keyframes hg-chat-pop { from { opacity:0; transform: scale(0.85) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes hg-badge-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
      `}</style>

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 28, width: 360, height: 500,
          background: D2, border: `1px solid ${BB}`, borderRadius: 12,
          boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(232,168,32,0.08)`,
          display: 'flex', flexDirection: 'column', zIndex: 9998,
          animation: 'hg-chat-pop 0.3s cubic-bezier(0.22,1,0.36,1)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', background: `linear-gradient(135deg, ${G5}, #2A1E06)`, borderBottom: `1px solid ${BB}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GL }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: W, fontFamily: FD }}>Admin Support</div>
                <div style={{ fontSize: 10, color: GL, fontFamily: FD }}>Honey Group</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: W55, fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: W28, fontSize: 12, fontFamily: FD, marginTop: 60 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>◆</div>
                Send a message to the Honey Group admin team.
              </div>
            )}
            {messages.map(m => {
              const isMe = m.fromRole !== 'admin'
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '9px 13px',
                    borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    background: isMe ? `linear-gradient(135deg, ${G5}, ${G2})` : D3,
                    border: isMe ? 'none' : `1px solid ${BB}`,
                  }}>
                    {!isMe && <div style={{ fontSize: 9, color: GL, marginBottom: 3, fontFamily: FD, fontWeight: 700 }}>Admin</div>}
                    <div style={{ fontSize: 13, color: W, lineHeight: 1.55, fontFamily: FB }}>{m.text}</div>
                    <div style={{ fontSize: 9, color: 'rgba(250,243,232,0.35)', marginTop: 3, textAlign: 'right' }}>{formatTime(m.timestamp)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${BB}`, display: 'flex', gap: 8, flexShrink: 0, background: D3 }}>
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a message…"
              style={{ flex: 1, background: BB2, border: `1px solid ${BB}`, padding: '9px 12px', color: W, fontFamily: FB, fontSize: 13, outline: 'none', borderRadius: 20 }}
              onFocus={e => e.currentTarget.style.borderColor = GL} onBlur={e => e.currentTarget.style.borderColor = BB} />
            <button onClick={send} disabled={!draft.trim()}
              style={{ width: 36, height: 36, borderRadius: '50%', background: draft.trim() ? `linear-gradient(135deg,${GL},${G})` : BB, border: 'none', cursor: draft.trim() ? 'pointer' : 'default', color: draft.trim() ? B : W28, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? D2 : `linear-gradient(135deg, ${GL}, ${G})`,
          border: open ? `1px solid ${BB}` : 'none',
          cursor: 'pointer', zIndex: 9999,
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(232,168,32,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: open ? GL : B,
          transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
          transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
        }}>
        {open ? '✕' : '◆'}
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 18, height: 18, borderRadius: '50%',
            background: GL, color: B, fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'hg-badge-pulse 1.5s ease-in-out infinite',
            border: `2px solid ${B}`,
          }}>{unread > 9 ? '9+' : unread}</div>
        )}
      </button>
    </>
  )
}