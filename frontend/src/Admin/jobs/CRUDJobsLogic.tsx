import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../AdminLayout';

const G    = '#D4880A';
const GL   = '#E8A820';
const G2   = '#8B5A1A';
const G3   = '#6B3F10';
const B    = '#0C0A07';
const BC   = '#141008';
const D2   = '#1A1508';
const D3   = '#221C0C';
const BB   = 'rgba(212,136,10,0.14)';
const W    = '#FAF3E8';
const WM   = 'rgba(250,243,232,0.65)';
const WD   = 'rgba(250,243,232,0.28)';
const FD   = "'Playfair Display', Georgia, serif";
const FB   = "'DM Sans', system-ui, sans-serif";
const TEAL  = '#4AABB8';
const CORAL = '#C4614A';
const GREEN = '#4ade80';
const AMBER = '#E8A820';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function selfieUrl(p?: string | null): string | null {
  if (!p) return null;
  return p.startsWith('http') ? p : BACKEND + p;
}

function authHdr() {
  const t = localStorage.getItem('hg_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface Job {
  id: string; title: string; client: string; clientId?: string; brand: string;
  venue: string;
  streetNumber?: string; streetName?: string; suburb?: string; city?: string; postalCode?: string;
  address?: string; lat?: number; lng?: number;
  date: string; endDate?: string; startTime: string; endTime: string;
  hourlyRate: number; totalSlots: number; filledSlots: number;
  status: string; filters?: any; termsAndConditions?: string;
  applications?: any[]; createdAt?: string;
}

interface Client { id?: string; name: string; email?: string; }

const EMPTY_FORM = {
  title: '', client: '', clientId: '',
  brand: '', venue: '',
  streetNumber: '', streetName: '', suburb: '', city: '', postalCode: '',
  date: '', endDate: '', startTime: '09:00', endTime: '17:00',
  hourlyRate: '', totalSlots: '4', filledSlots: '0',
  status: 'OPEN', filters: {} as any, termsAndConditions: '',
};

const STATUS_OPTS = ['OPEN', 'FILLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const CATEGORY_OPTS = ['Brand Activation','Promotions','Events','Retail','Corporate','Exhibitions','Other'];

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(250,243,232,0.05)',
  border: `1px solid ${BB}`, padding: '10px 14px',
  color: W, fontFamily: FB, fontSize: 13, outline: 'none', borderRadius: 2, boxSizing: 'border-box' as any,
};
const lbl: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
  textTransform: 'uppercase' as any, color: WM, display: 'block', marginBottom: 7,
};
const sel: React.CSSProperties = { ...inp, background: D3, cursor: 'pointer' };

// ── JobViewModal ──────────────────────────────────────────────────────────────
interface JobViewModalProps {
  job: Job;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  displayAddress: (j: Job) => string;
  statusColor: (s: string) => string;
}

function JobViewModal({ job, onClose, onEdit, onDelete, displayAddress, statusColor }: JobViewModalProps) {
  const [shifts,        setShifts       ] = React.useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = React.useState(true);
  const [selectedShift, setSelectedShift] = React.useState<any>(null);
  const [tab,           setTab          ] = React.useState<'info'|'promoters'>('info');
  const [allPromoters,  setAllPromoters ] = React.useState<any[]>([]);
  const [loadingPromos, setLoadingPromos] = React.useState(false);
  const [selected,      setSelected     ] = React.useState<Set<string>>(new Set());
  const [savingAlloc,   setSavingAlloc  ] = React.useState(false);
  const [allocMsg,      setAllocMsg     ] = React.useState('');
  const [promoSearch,   setPromoSearch  ] = React.useState('');

  // Load existing shifts for this job
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/shifts/all`, { headers: authHdr() as any });
        if (res.ok) {
          const all: any[] = await res.json();
          const jobShifts = all.filter(s => s.jobId === job.id);
          setShifts(jobShifts);
          setSelected(new Set(jobShifts.map((s: any) => s.promoterId)));
        }
      } catch {}
      setLoadingShifts(false);
    };
    load();
  }, [job.id]);

  // Load all approved promoters when promoters tab opens
  React.useEffect(() => {
    if (tab !== 'promoters' || allPromoters.length > 0) return;
    setLoadingPromos(true);
    fetch(`${API}/users?role=PROMOTER`, { headers: authHdr() as any })
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setAllPromoters(data))
      .catch(() => {})
      .finally(() => setLoadingPromos(false));
  }, [tab, allPromoters.length]);

  const allocatedIds = new Set(shifts.map(s => s.promoterId));

  const togglePromoter = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveAllocations = async () => {
    setSavingAlloc(true); setAllocMsg('');
    try {
      const toAdd    = [...selected].filter(id => !allocatedIds.has(id));
      const toRemove = shifts.filter(s => !selected.has(s.promoterId));

      await Promise.all(toAdd.map(promoterId =>
        fetch(`${API}/shifts`, {
          method: 'POST',
          headers: { ...authHdr(), 'Content-Type': 'application/json' } as any,
          body: JSON.stringify({ jobId: job.id, promoterId, status: 'SCHEDULED' }),
        })
      ));
      await Promise.all(toRemove.map(s =>
        fetch(`${API}/shifts/${s.id}`, { method: 'DELETE', headers: authHdr() as any })
      ));

      // Reload
      const res = await fetch(`${API}/shifts/all`, { headers: authHdr() as any });
      if (res.ok) {
        const all: any[] = await res.json();
        const updated = all.filter(s => s.jobId === job.id);
        setShifts(updated);
        setSelected(new Set(updated.map(s => s.promoterId)));
      }
      setAllocMsg(`✓ Saved — ${toAdd.length} added, ${toRemove.length} removed`);
      setTimeout(() => setAllocMsg(''), 3000);
    } catch { setAllocMsg('Error saving — please retry'); }
    setSavingAlloc(false);
  };

  const sc = statusColor(job.status);
  const shiftStatusColor = (s: string) => {
    if (s === 'CHECKED_IN')                    return GREEN;
    if (s === 'COMPLETED' || s === 'APPROVED') return TEAL;
    if (s === 'NO_SHOW')                       return CORAL;
    return WM;
  };

  const confirmed   = shifts.length;
  const newCount    = [...selected].filter(id => !allocatedIds.has(id)).length;
  const filteredP   = allPromoters.filter(p =>
    !promoSearch || p.fullName?.toLowerCase().includes(promoSearch.toLowerCase()) || p.city?.toLowerCase().includes(promoSearch.toLowerCase())
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:BC, border:`1px solid ${BB}`, width:'100%', maxWidth:820, maxHeight:'92vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G3},${GL},${G3})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:20, zIndex:10 }}>✕</button>

        {/* Header */}
        <div style={{ padding:'28px 36px 0' }}>
          <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:6, fontWeight:700 }}>Job Details</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:6 }}>{job.title}</h2>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:WM }}>
                <span>🏢 {job.client}</span>
                {job.venue && <span>📍 {job.venue}</span>}
                {job.date && <span>📅 {new Date(job.date).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>}
                {job.startTime && <span>🕐 {job.startTime} – {job.endTime}</span>}
                <span style={{ color:GL, fontWeight:700 }}>R{job.hourlyRate}/hr · {job.totalSlots} slots</span>
              </div>
            </div>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:sc, background:`${sc}18`, border:`1px solid ${sc}44`, padding:'3px 10px', borderRadius:2, flexShrink:0 }}>{job.status}</span>
          </div>
          {/* Slot bar */}
          <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, marginBottom:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${job.totalSlots>0?(confirmed/job.totalSlots)*100:0}%`, background:`linear-gradient(90deg,${GL},${G})`, borderRadius:2 }} />
          </div>
          <div style={{ fontSize:10, color:WD, marginBottom:16 }}>{confirmed} confirmed · {job.totalSlots} total slots</div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${BB}` }}>
            <button onClick={()=>setTab('info')}
              style={{ padding:'10px 24px', background:'none', border:'none', borderBottom:tab==='info'?`2px solid ${GL}`:'2px solid transparent', color:tab==='info'?GL:WD, fontFamily:FD, fontSize:11, fontWeight:tab==='info'?700:400, cursor:'pointer', letterSpacing:'0.1em' }}>
              📋 Job Info
            </button>
            <button onClick={()=>setTab('promoters')}
              style={{ padding:'10px 24px', background:'none', border:'none', borderBottom:tab==='promoters'?`2px solid ${GL}`:'2px solid transparent', color:tab==='promoters'?GL:WD, fontFamily:FD, fontSize:11, fontWeight:tab==='promoters'?700:400, cursor:'pointer', letterSpacing:'0.1em' }}>
              👥 Select Promoters ({selected.size} selected)
            </button>
          </div>
        </div>

        {/* ── TAB: Job Info ── */}
        {tab === 'info' && (
          <div style={{ padding:'24px 36px 32px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB, marginBottom:24 }}>
              {[
                { label:'Client',       value:job.client },
                { label:'Brand',        value:job.brand  },
                { label:'Venue',        value:job.venue  },
                { label:'Full Address', value:displayAddress(job) },
                { label:'Date',         value:job.date ? new Date(job.date).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'long',year:'numeric'}) : '—' },
                { label:'Time',         value:`${job.startTime} – ${job.endTime}` },
                { label:'Rate',         value:`R${job.hourlyRate}/hr` },
                { label:'Slots',        value:`${job.filledSlots} filled of ${job.totalSlots}` },
                { label:'Status',       value:job.status },
                { label:'Coordinates',  value:job.lat ? `${job.lat.toFixed(4)}, ${job.lng?.toFixed(4)}` : 'Not geocoded' },
              ].filter(r=>r.value).map(r=>(
                <div key={r.label} style={{ background:D2, padding:'12px 16px' }}>
                  <div style={{ fontSize:9, color:WD, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>{r.label}</div>
                  <div style={{ fontSize:13, color:W, fontWeight:600 }}>{r.value||'—'}</div>
                </div>
              ))}
            </div>

            {job.lat && job.lng && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, marginBottom:8 }}>Venue Location</div>
                <iframe width="100%" height="180" style={{ border:0, borderRadius:6, display:'block' }} loading="lazy" allowFullScreen
                  src={`https://www.google.com/maps?q=${job.lat},${job.lng}&z=16&output=embed`} />
                <a href={`https://www.google.com/maps?q=${job.lat},${job.lng}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-block', marginTop:6, fontSize:11, color:GL, textDecoration:'none' }}>Open in Google Maps →</a>
              </div>
            )}

            <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, marginBottom:12 }}>
              Promoters on This Job ({shifts.length})
            </div>
            {loadingShifts ? (
              <div style={{ padding:'16px', textAlign:'center', color:WD, fontSize:12 }}>Loading shifts…</div>
            ) : shifts.length === 0 ? (
              <div style={{ padding:'14px 16px', background:D2, border:`1px solid ${BB}`, borderRadius:3, fontSize:12, color:WD, marginBottom:16 }}>
                No promoters allocated yet. Use the <strong style={{color:GL}}>Select Promoters</strong> tab to add some.
              </div>
            ) : shifts.map(shift => {
              const sc2      = shiftStatusColor(shift.status);
              const inSelfie = selfieUrl(shift.selfieInUrl  || shift.checkInSelfieUrl);
              const outSelfie= selfieUrl(shift.selfieOutUrl || shift.checkOutSelfieUrl);
              const isLate   = shift.issueReport?.startsWith('LATE_CHECK_IN:');
              const lateMin  = isLate ? shift.issueReport.replace('LATE_CHECK_IN:','') : null;
              const isExp    = selectedShift?.id === shift.id;
              return (
                <div key={shift.id} style={{ marginBottom:8, border:`1px solid ${isExp?GL:BB}`, borderRadius:3, overflow:'hidden' }}>
                  <div onClick={()=>setSelectedShift(isExp?null:shift)}
                    style={{ padding:'12px 16px', background:isExp?'rgba(232,168,32,0.06)':D2, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseEnter={e=>{if(!isExp)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}}
                    onMouseLeave={e=>{if(!isExp)(e.currentTarget as HTMLElement).style.background=D2}}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', border:`2px solid ${sc2}`, flexShrink:0 }}>
                        {(inSelfie||shift.promoter?.profilePhotoUrl||shift.promoter?.headshotUrl)
                          ? <img src={inSelfie||shift.promoter?.profilePhotoUrl||shift.promoter?.headshotUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.target as HTMLImageElement).style.display='none'} />
                          : <div style={{ width:'100%', height:'100%', background:'rgba(232,168,32,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:GL, fontFamily:FD }}>{(shift.promoter?.fullName||'?').charAt(0)}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{shift.promoter?.fullName||'Unknown'}</div>
                        <div style={{ fontSize:10, color:WM }}>{shift.promoter?.email}</div>
                        {isLate && <div style={{ fontSize:9, color:AMBER, fontWeight:700 }}>Late {lateMin} min</div>}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {shift.checkInTime && <div style={{ textAlign:'right' }}><div style={{ fontSize:9, color:WD, textTransform:'uppercase' }}>Check-in</div><div style={{ fontSize:11, color:W, fontWeight:600 }}>{new Date(shift.checkInTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div></div>}
                      {shift.totalHours!=null && <div style={{ textAlign:'right' }}><div style={{ fontSize:9, color:WD, textTransform:'uppercase' }}>Hours</div><div style={{ fontSize:11, color:GL, fontWeight:700 }}>{shift.totalHours.toFixed(2)}h</div></div>}
                      <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', color:sc2, background:`${sc2}18`, border:`1px solid ${sc2}44`, padding:'3px 8px', borderRadius:2 }}>{shift.status}</span>
                      <span style={{ color:isExp?GL:WD, fontSize:11 }}>{isExp?'▲':'▼'}</span>
                    </div>
                  </div>
                  {isExp && (
                    <div style={{ padding:'16px 18px', background:'rgba(20,16,5,0.6)', borderTop:`1px solid ${BB}` }}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                        {[
                          {label:'Check-in',  value:shift.checkInTime  ?new Date(shift.checkInTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}):'—'},
                          {label:'Check-out', value:shift.checkOutTime ?new Date(shift.checkOutTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'}):'—'},
                          {label:'Hours',     value:shift.totalHours!=null?shift.totalHours.toFixed(2)+'h':'—'},
                          {label:'Earnings',  value:shift.totalHours&&job.hourlyRate?`R${(shift.totalHours*job.hourlyRate).toFixed(2)}`:'—', accent:GL},
                        ].map(r=>(
                          <div key={r.label} style={{ background:'rgba(212,136,10,0.05)', border:`1px solid ${BB}`, padding:'9px 11px', borderRadius:3 }}>
                            <div style={{ fontSize:8, color:WD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:2 }}>{r.label}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:(r as any).accent||W, fontFamily:FD }}>{r.value}</div>
                          </div>
                        ))}
                      </div>
                      {shift.checkInLat && shift.checkInLng && (
                        <div style={{ fontSize:11, color:WD, marginBottom:12 }}>
                          Check-in: {shift.checkInLat.toFixed(5)}, {shift.checkInLng.toFixed(5)}
                          <a href={`https://www.google.com/maps?q=${shift.checkInLat},${shift.checkInLng}`} target="_blank" rel="noopener noreferrer" style={{ color:GL, marginLeft:8, fontSize:10 }}>Map →</a>
                        </div>
                      )}
                      {(inSelfie||outSelfie) && (
                        <div style={{ display:'grid', gridTemplateColumns:inSelfie&&outSelfie?'1fr 1fr':'1fr', gap:12 }}>
                          {inSelfie && <div><div style={{ fontSize:9, color:GREEN, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Check-in selfie</div><img src={inSelfie} alt="" style={{ width:'100%', height:160, objectFit:'cover', borderRadius:6, border:'1px solid rgba(74,222,128,0.3)' }} onError={e=>(e.target as HTMLImageElement).style.display='none'} />{shift.checkInTime&&<div style={{ fontSize:10, color:WD, marginTop:4 }}>{new Date(shift.checkInTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}{isLate&&<span style={{ color:AMBER, marginLeft:8 }}>· {lateMin} min late</span>}</div>}</div>}
                          {outSelfie && <div><div style={{ fontSize:9, color:CORAL, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Check-out selfie</div><img src={outSelfie} alt="" style={{ width:'100%', height:160, objectFit:'cover', borderRadius:6, border:'1px solid rgba(196,97,74,0.4)' }} onError={e=>(e.target as HTMLImageElement).style.display='none'} />{shift.checkOutTime&&<div style={{ fontSize:10, color:WD, marginTop:4 }}>{new Date(shift.checkOutTime).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>}</div>}
                        </div>
                      )}
                      {!inSelfie && !outSelfie && <div style={{ fontSize:11, color:WD, padding:'8px 0' }}>No selfies uploaded yet.</div>}
                    </div>
                  )}
                </div>
              );
            })}

            {job.termsAndConditions && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, fontWeight:700, marginBottom:8 }}>Terms & Conditions</div>
                <div style={{ padding:'12px 14px', background:D2, border:`1px solid ${BB}`, borderRadius:3, fontSize:12, color:WM, lineHeight:1.7 }}>{job.termsAndConditions}</div>
              </div>
            )}

            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button onClick={onEdit} style={{ flex:2, padding:'12px', background:`linear-gradient(135deg,${GL},${G})`, border:'none', color:B, fontFamily:FD, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:2 }}>Edit Job</button>
              <button onClick={onDelete} style={{ flex:1, padding:'12px', background:`${CORAL}18`, border:`1px solid ${CORAL}`, color:CORAL, fontFamily:FB, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:2 }}>Delete</button>
            </div>
          </div>
        )}

        {/* ── TAB: Select Promoters ── */}
        {tab === 'promoters' && (
          <div style={{ padding:'24px 36px 32px' }}>
            <p style={{ fontSize:13, color:WM, marginBottom:16, fontFamily:FB }}>
              Select approved promoters to allocate to this job. Click a card to toggle selection, then save.
            </p>

            {allocMsg && (
              <div style={{ padding:'10px 14px', background:allocMsg.startsWith('✓')?'rgba(74,222,128,0.1)':'rgba(196,97,74,0.1)', border:`1px solid ${allocMsg.startsWith('✓')?'rgba(74,222,128,0.4)':'rgba(196,97,74,0.4)'}`, borderRadius:3, fontSize:12, color:allocMsg.startsWith('✓')?GREEN:CORAL, marginBottom:16 }}>
                {allocMsg}
              </div>
            )}

            {/* Search */}
            <input placeholder="Search by name or city…" value={promoSearch} onChange={e=>setPromoSearch(e.target.value)}
              style={{ ...inp, marginBottom:16, maxWidth:320 }}
              onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />

            {loadingPromos ? (
              <div style={{ padding:'40px', textAlign:'center', color:WD, fontSize:13 }}>Loading promoters…</div>
            ) : allPromoters.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:WD, fontSize:13 }}>No approved promoters found yet.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:24 }}>
                {filteredP.map(p => {
                  const isSel   = selected.has(p.id);
                  const isAlloc = allocatedIds.has(p.id);
                  const photo   = p.headshotUrl || p.profilePhotoUrl;
                  return (
                    <div key={p.id} onClick={()=>togglePromoter(p.id)}
                      style={{ padding:'14px', background:isSel?'rgba(232,168,32,0.08)':D2, border:`2px solid ${isSel?GL:BB}`, borderRadius:3, cursor:'pointer', transition:'all 0.18s', position:'relative' }}
                      onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}}
                      onMouseLeave={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background=D2}}>
                      {/* Tick */}
                      <div style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:'50%', background:isSel?GL:'transparent', border:`2px solid ${isSel?GL:BB}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:B, fontWeight:800, transition:'all 0.18s' }}>
                        {isSel&&'✓'}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', border:`2px solid ${isSel?GL:BB}`, flexShrink:0 }}>
                          {photo
                            ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>(e.target as HTMLImageElement).style.display='none'} />
                            : <div style={{ width:'100%', height:'100%', background:'rgba(232,168,32,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:GL, fontFamily:FD }}>{(p.fullName||'?').charAt(0)}</div>
                          }
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:W, fontFamily:FD, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{p.fullName}</div>
                          <div style={{ fontSize:10, color:WD }}>{p.city||'—'}</div>
                        </div>
                      </div>
                      {isAlloc && isSel  && <div style={{ fontSize:9, color:TEAL,  fontWeight:700 }}>✓ Already allocated</div>}
                      {isAlloc && !isSel && <div style={{ fontSize:9, color:CORAL, fontWeight:700 }}>Will be removed</div>}
                      {!isAlloc && isSel && <div style={{ fontSize:9, color:GREEN, fontWeight:700 }}>+ Will be added</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:`1px solid ${BB}` }}>
              <div style={{ fontSize:12, color:WM }}>
                {confirmed} confirmed · {newCount>0?`+${newCount} new`:' no new'} · {job.totalSlots} total slots
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={onClose} style={{ padding:'10px 18px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:12, cursor:'pointer', borderRadius:2 }}>Close</button>
                <button onClick={saveAllocations} disabled={savingAlloc}
                  style={{ padding:'10px 24px', background:savingAlloc?BB:`linear-gradient(135deg,${GL},${G})`, border:'none', color:savingAlloc?WD:B, fontFamily:FD, fontSize:12, fontWeight:700, cursor:savingAlloc?'not-allowed':'pointer', borderRadius:2 }}>
                  {savingAlloc?'Saving…':'Save Allocations'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inner page content ────────────────────────────────────────────────────────
const JobsPageContent: React.FC = () => {
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<'create'|'edit'|'view'|null>(null);
  const [editing,  setEditing]  = useState<Job|null>(null);
  const [form,     setForm]     = useState({...EMPTY_FORM});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [clients,  setClients]  = useState<Client[]>([]);
  const [deleting, setDeleting] = useState<string|null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/jobs`, { headers: authHdr() as any });
      if (res.ok) setJobs(await res.json());
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  const loadClients = async () => {
    try {
      const res = await fetch(`${API}/users?role=BUSINESS`, { headers: authHdr() as any });
      if (res.ok) {
        const data = await res.json();
        setClients(data.map((u:any) => ({ id: u.id, name: u.fullName, email: u.email })));
      }
    } catch(e){ console.error(e); }
  };

  useEffect(() => { loadJobs(); loadClients(); }, []);

  const F = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const buildAddress = (f: typeof form) => {
    const parts = [
      f.streetNumber && f.streetName ? `${f.streetNumber} ${f.streetName}` : f.streetName || '',
      f.suburb, f.city, f.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const geocodeAddress = async (address: string): Promise<{lat:number;lng:number}|null> => {
    try {
      const q = encodeURIComponent(`${address}, South Africa`);
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
      if (!r.ok) return null;
      const d = await r.json();
      if (d[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
    } catch { /* silent */ }
    return null;
  };

  const openCreate = () => {
    setForm({...EMPTY_FORM}); setEditing(null); setError(''); setModal('create');
  };

  const openEdit = (job: Job) => {
    setForm({
      title: job.title, client: job.client, clientId: job.clientId || '',
      brand: job.brand || '', venue: job.venue || '',
      streetNumber: job.streetNumber || '', streetName: job.streetName || '',
      suburb: job.suburb || '', city: job.city || '', postalCode: job.postalCode || '',
      date:    job.date    ? job.date.slice(0,10)    : '',
      endDate: job.endDate ? job.endDate.slice(0,10) : '',
      startTime: job.startTime || '09:00', endTime: job.endTime || '17:00',
      hourlyRate: String(job.hourlyRate||''), totalSlots: String(job.totalSlots||4),
      filledSlots: String(job.filledSlots||0), status: job.status||'OPEN',
      filters: job.filters||{}, termsAndConditions: job.termsAndConditions||'',
    });
    setEditing(job); setError(''); setModal('edit');
  };

  const save = async () => {
    if (!form.title || !form.client || !form.date) { setError('Title, client and date are required.'); return; }
    if (!form.hourlyRate || Number(form.hourlyRate) <= 0) { setError('Hourly rate is required and must be greater than 0.'); return; }
    setSaving(true); setError('');

    let clientId = form.clientId || '';
    const selectedClient = clients.find(c => c.name === form.client);
    if (selectedClient?.email) clientId = selectedClient.id || '';

    const fullAddress = buildAddress(form);
    let lat = -26.2041, lng = 28.0473;
    if (fullAddress) {
      const geo = await geocodeAddress(fullAddress);
      if (geo) { lat = geo.lat; lng = geo.lng; }
    }

    const body: any = {
      title:   form.title,
      client:  selectedClient?.name || form.client,
      brand:   form.brand || form.client,
      venue:   form.venue,
      streetNumber: form.streetNumber,
      streetName:   form.streetName,
      suburb:       form.suburb,
      city:         form.city,
      postalCode:   form.postalCode,
      address: fullAddress,
      lat, lng,
      date:        form.date,
      endDate:     form.endDate || undefined,
      startTime:   form.startTime,
      endTime:     form.endTime,
      hourlyRate:  Number(form.hourlyRate)||0,
      totalSlots:  Number(form.totalSlots)||1,
      filledSlots: Number(form.filledSlots)||0,
      status:  form.status,
      filters: form.filters||{},
      termsAndConditions: form.termsAndConditions,
    };
    if (clientId) body.clientId = clientId;

    try {
      const method = modal==='edit' && editing ? 'PUT' : 'POST';
      const url    = modal==='edit' && editing ? `${API}/jobs/${editing.id}` : `${API}/jobs`;
      const res = await fetch(url, {
        method,
        headers: { ...authHdr(), 'Content-Type': 'application/json' } as any,
        body: JSON.stringify(body),
      });
      if (res.ok) { await loadJobs(); setModal(null); }
      else { const d = await res.json(); setError(d.error || 'Failed to save job.'); }
    } catch { setError('Network error — please try again.'); }
    setSaving(false);
  };

  const deleteJob = async (id: string) => {
    try {
      await fetch(`${API}/jobs/${id}`, { method:'DELETE', headers: authHdr() as any });
      await loadJobs(); setDeleting(null);
      if (modal) setModal(null);
    } catch { setError('Failed to delete job.'); }
  };

  const filtered = jobs.filter(j => {
    const sm = statusF==='all' || j.status===statusF;
    const qm = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.client.toLowerCase().includes(search.toLowerCase());
    return sm && qm;
  });

  const statusColor = (s: string) =>
    s==='OPEN' ? GL : s==='FILLED' ? G : s==='IN_PROGRESS' ? TEAL : s==='CANCELLED' ? CORAL : WD;

  const displayAddress = (job: Job) => {
    const parts = [
      job.streetNumber && job.streetName ? `${job.streetNumber} ${job.streetName}` : job.streetName || '',
      job.suburb, job.city, job.postalCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (job.address || job.venue || '—');
  };

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>Operations</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Manage Jobs</h1>
          <p style={{ fontSize:13, color:WM, marginTop:4 }}>{jobs.length} total · {jobs.filter(j=>j.status==='OPEN').length} open</p>
        </div>
        <button onClick={openCreate} style={{ padding:'11px 24px', background:`linear-gradient(135deg,${GL},${G})`, border:'none', color:B, fontFamily:FD, fontSize:11, fontWeight:700, cursor:'pointer', borderRadius:3, letterSpacing:'0.08em' }}>
          New Job
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:BB, marginBottom:28 }}>
        {[
          { label:'Total',       value:jobs.length,                                    color:GL },
          { label:'Open',        value:jobs.filter(j=>j.status==='OPEN').length,        color:GL },
          { label:'Filled',      value:jobs.filter(j=>j.status==='FILLED').length,      color:G },
          { label:'In Progress', value:jobs.filter(j=>j.status==='IN_PROGRESS').length, color:TEAL },
          { label:'Cancelled',   value:jobs.filter(j=>j.status==='CANCELLED').length,   color:CORAL },
        ].map(s => (
          <div key={s.label} style={{ background:D2, padding:'16px 20px', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${s.color},${s.color}44)` }} />
            <div style={{ fontFamily:FD, fontSize:26, fontWeight:700, color:W }}>{s.value}</div>
            <div style={{ fontSize:9, color:WM, marginTop:4, letterSpacing:'0.16em', textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <input placeholder="Search jobs or client…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inp, width:260 }}
          onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
        <div style={{ display:'flex', gap:4 }}>
          {['all','OPEN','FILLED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s => (
            <button key={s} onClick={()=>setStatusF(s)}
              style={{ padding:'6px 13px', border:`1px solid ${statusF===s ? GL : BB}`, background:statusF===s ? 'rgba(232,168,32,0.12)' : 'transparent', color:statusF===s ? GL : WM, fontFamily:FB, fontSize:10, cursor:'pointer', borderRadius:2 }}>
              {s==='all' ? 'All' : s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:2, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:WD }}>Loading jobs…</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BB}` }}>
                {['ID','Title / Client','Venue & Address','Date','Rate','Slots','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:WD }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, i) => (
                <tr key={job.id}
                  style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                  onClick={()=>{ setEditing(job); setModal('view'); }}>
                  <td style={{ padding:'13px 16px', fontSize:10, color:WD }}>{job.id.slice(0,8)}…</td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:W }}>{job.title}</div>
                    <div style={{ fontSize:11, color:WM }}>{job.client}</div>
                    {job.clientId && <div style={{ fontSize:9, color:TEAL, marginTop:2 }}>✓ Registered client</div>}
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontSize:12, color:W }}>{job.venue||'—'}</div>
                    <div style={{ fontSize:10, color:WD, marginTop:2 }}>{displayAddress(job)}</div>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:WM, whiteSpace:'nowrap' }}>
                    {job.date ? new Date(job.date).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'2-digit'}) : '—'}
                    <div style={{ fontSize:10, color:WD }}>{job.startTime}–{job.endTime}</div>
                  </td>
                  <td style={{ padding:'13px 16px', fontSize:13, color:GL, fontWeight:700 }}>R{job.hourlyRate}/hr</td>
                  <td style={{ padding:'13px 16px', fontSize:12, color:W }}>{job.filledSlots}/{job.totalSlots}</td>
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:statusColor(job.status), background:`${statusColor(job.status)}18`, padding:'3px 10px', borderRadius:2 }}>{job.status}</span>
                  </td>
                  <td style={{ padding:'13px 16px' }} onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={()=>openEdit(job)} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer' }}>Edit</button>
                      <span style={{ color:WD }}>·</span>
                      <button onClick={()=>setDeleting(job.id)} style={{ fontSize:11, color:CORAL, background:'none', border:'none', cursor:'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length===0 && (
          <div style={{ padding:48, textAlign:'center', color:WD, fontSize:13 }}>No jobs match your filters.</div>
        )}
      </div>

      {/* Delete confirm */}
      {deleting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:400 }}>
          <div style={{ background:BC, border:`1px solid ${CORAL}`, padding:'36px 40px', maxWidth:380, width:'100%', borderRadius:3 }}>
            <h3 style={{ fontFamily:FD, fontSize:22, color:W, marginBottom:12 }}>Delete Job?</h3>
            <p style={{ fontSize:13, color:WM, marginBottom:28 }}>This will permanently remove the job and all its applications.</p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={()=>setDeleting(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:12, cursor:'pointer', borderRadius:2 }}>Cancel</button>
              <button onClick={()=>deleteJob(deleting)} style={{ flex:1, padding:'12px', background:CORAL, border:'none', color:W, fontFamily:FB, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:2 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal==='view' && editing && (
        <JobViewModal
          job={editing}
          onClose={()=>setModal(null)}
          onEdit={()=>openEdit(editing)}
          onDelete={()=>{ setModal(null); setDeleting(editing.id); }}
          displayAddress={displayAddress}
          statusColor={statusColor}
        />
      )}

      {/* Create / Edit modal */}
      {(modal==='create'||modal==='edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{ background:BC, border:`1px solid ${BB}`, padding:'40px', width:'100%', maxWidth:640, maxHeight:'92vh', overflowY:'auto', position:'relative', borderRadius:3 }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G3},${GL},${G3})` }} />
            <button onClick={()=>setModal(null)} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WM, fontSize:18 }}>✕</button>
            <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700 }}>{modal==='create' ? 'New Job' : 'Edit Job'}</div>
            <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:28 }}>{modal==='create' ? 'Create a New Job' : `Editing: ${editing?.title}`}</h2>

            {error && <div style={{ padding:'10px 14px', background:`${CORAL}12`, border:`1px solid ${CORAL}44`, marginBottom:20, fontSize:12, color:CORAL, borderRadius:2 }}>{error}</div>}

            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {/* Title */}
              <div>
                <label style={lbl}>Job Title *</label>
                <input style={inp} value={form.title} onChange={e=>F('title',e.target.value)} placeholder="e.g. Brand Ambassador – Pick n Pay"
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>

              {/* Client */}
              <div>
                <label style={lbl}>Client *</label>
                <select style={sel} value={form.client} onChange={e=>{
                  const name = e.target.value;
                  const found = clients.find(c=>c.name===name);
                  setForm(f=>({...f, client:name, clientId:found?.id||''}));
                }}>
                  <option value="">— Select client —</option>
                  <optgroup label="Registered Clients">
                    {clients.map(c=><option key={c.id} value={c.name}>{c.name} ✓</option>)}
                  </optgroup>
                  <optgroup label="Other / Manual">
                    {['Shoprite','Checkers','Pick n Pay','Woolworths','Dis-Chem','Clicks','Vodacom','MTN','SAB','Tiger Brands','Other'].map(n=>(
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </optgroup>
                </select>
                {form.clientId && <div style={{ fontSize:10, color:TEAL, marginTop:5 }}>✓ Registered business — jobs will appear in their dashboard</div>}
                {form.client && !form.clientId && (
                  <input style={{ ...inp, marginTop:8 }} value={form.client} onChange={e=>F('client',e.target.value)} placeholder="Or type client name manually"
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                )}
              </div>

              {/* Brand & Category */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Brand</label>
                  <input style={inp} value={form.brand} onChange={e=>F('brand',e.target.value)} placeholder="e.g. Coca-Cola"
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={sel} value={form.filters?.category||''} onChange={e=>F('filters',{...form.filters,category:e.target.value})}>
                    <option value="">— Select —</option>
                    {CATEGORY_OPTS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label style={lbl}>Venue Name</label>
                <input style={inp} value={form.venue} onChange={e=>F('venue',e.target.value)} placeholder="e.g. Sandton City Mall, Main Entrance"
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>

              {/* SA Address block */}
              <div style={{ background:'rgba(212,136,10,0.04)', border:`1px solid ${BB}`, borderRadius:3, padding:'18px 16px' }}>
                <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:16, fontWeight:700 }}>
                  📍 Venue Address — SA Format
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Street Number</label>
                    <input style={inp} value={form.streetNumber} onChange={e=>F('streetNumber',e.target.value)} placeholder="12"
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={lbl}>Street Name</label>
                    <input style={inp} value={form.streetName} onChange={e=>F('streetName',e.target.value)} placeholder="Rivonia Road"
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12 }}>
                  <div>
                    <label style={lbl}>Suburb</label>
                    <input style={inp} value={form.suburb} onChange={e=>F('suburb',e.target.value)} placeholder="Sandton"
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={lbl}>City</label>
                    <input style={inp} value={form.city} onChange={e=>F('city',e.target.value)} placeholder="Johannesburg"
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                  <div>
                    <label style={lbl}>Postal Code</label>
                    <input style={inp} value={form.postalCode}
                      onChange={e=>F('postalCode', e.target.value.replace(/\D/g,'').slice(0,4))}
                      placeholder="2196" maxLength={4}
                      onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                </div>
                {buildAddress(form) && (
                  <div style={{ marginTop:10, fontSize:11, color:WM, background:'rgba(212,136,10,0.06)', padding:'8px 12px', borderRadius:2 }}>
                    📌 <strong style={{ color:GL }}>{buildAddress(form)}</strong>
                    <span style={{ color:WD, marginLeft:8 }}>— auto-geocoded for check-in validation</span>
                  </div>
                )}
              </div>

              {/* Dates & Times — END DATE IS NOW ENABLED */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Start Date *</label>
                  <input type="date" style={inp} value={form.date} onChange={e=>F('date',e.target.value)}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>End Date</label>
                  <input type="date" style={inp} value={form.endDate} onChange={e=>F('endDate',e.target.value)}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>Start Time</label>
                  <input type="time" style={inp} value={form.startTime} onChange={e=>F('startTime',e.target.value)}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>End Time</label>
                  <input type="time" style={inp} value={form.endTime} onChange={e=>F('endTime',e.target.value)}
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
              </div>

              {/* Rate & Slots */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Hourly Rate (R)</label>
                  <input type="number" style={inp} value={form.hourlyRate} onChange={e=>F('hourlyRate',e.target.value)} placeholder="125"
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>Total Slots</label>
                  <input type="number" style={inp} value={form.totalSlots} onChange={e=>F('totalSlots',e.target.value)} placeholder="4"
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={lbl}>Status</label>
                <select style={sel} value={form.status} onChange={e=>F('status',e.target.value)}>
                  {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Filters */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}>Gender</label>
                  <select style={sel} value={form.filters?.gender||''} onChange={e=>F('filters',{...form.filters,gender:e.target.value})}>
                    {['Any Gender','Female','Male','Non-binary'].map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Min Height (cm)</label>
                  <input type="number" style={inp} value={form.filters?.minHeight||''} onChange={e=>F('filters',{...form.filters,minHeight:e.target.value})} placeholder="160"
                    onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
                <div>
                  <label style={lbl}>Language</label>
                  <select style={sel} value={form.filters?.languages||''} onChange={e=>F('filters',{...form.filters,languages:e.target.value})}>
                    {['Any','English','Zulu','Xhosa','Sotho','Tswana','Afrikaans','Venda','Tsonga'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label style={lbl}>Terms & Conditions</label>
                <textarea style={{ ...inp, minHeight:80, resize:'vertical' } as any} value={form.termsAndConditions} onChange={e=>F('termsAndConditions',e.target.value)} placeholder="Optional: dress code, expectations, requirements…"
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>

              <button onClick={save} disabled={saving}
                style={{ padding:'15px', background:saving ? BB : `linear-gradient(135deg,${GL},${G})`, border:'none', color:saving ? WM : B, fontFamily:FD, fontSize:12, fontWeight:700, cursor:saving?'not-allowed':'pointer', letterSpacing:'0.08em', borderRadius:2, marginTop:4 }}>
                {saving ? 'Saving & geocoding…' : modal==='create' ? 'Create Job' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CRUDJobsLogic: React.FC = () => (
  <AdminLayout>
    <JobsPageContent />
  </AdminLayout>
);

export { CRUDJobsLogic };
export default CRUDJobsLogic;