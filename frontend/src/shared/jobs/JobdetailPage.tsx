// shared/jobs/JobDetailPage.tsx — fully mobile responsive
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllJobsWithAdminJobs } from './jobsData';

const G   = '#C4973A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#D4880A'
const G5  = '#6B3F10'
const B   = '#080808'
const BC  = '#111008'
const BC2 = '#161209'
const BB  = 'rgba(212,136,10,0.14)'
const W   = '#CEC5B2'
const WM  = 'rgba(200,188,168,0.88)'
const WD  = 'rgba(168,152,130,0.55)'
const FD  = "'Playfair Display', Georgia, serif"
const FB  = "'DM Sans', system-ui, sans-serif"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Inject responsive styles once ────────────────────────────────────────────
function injectJobDetailStyles() {
  if (document.getElementById('hg-jd-styles')) return
  const el = document.createElement('style')
  el.id = 'hg-jd-styles'
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #080808; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #C4973A; }

    .jd-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px 80px;
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 28px;
      align-items: start;
    }
    .jd-sticky-card {
      position: sticky;
      top: 80px;
      align-self: start;
    }
    .jd-stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      margin-bottom: 24px;
    }
    .jd-nav {
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(212,136,10,0.14);
      background: #111008;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    /* ── TABLET ── */
    @media (max-width: 900px) {
      .jd-layout {
        grid-template-columns: 1fr;
        padding: 24px 16px 60px;
        gap: 0;
      }
      .jd-sticky-card {
        position: static;
        margin-bottom: 24px;
        /* Show apply card at top on mobile */
        order: -1;
      }
      .jd-main-content { order: 1; }
      .jd-stat-grid { grid-template-columns: repeat(3, 1fr); }
      .jd-nav { padding: 14px 16px; }
    }

    /* ── PHONE ── */
    @media (max-width: 600px) {
      .jd-layout { padding: 16px 12px 48px; }
      .jd-stat-grid { grid-template-columns: 1fr 1fr; }
      .jd-stat-grid > *:last-child { grid-column: 1 / -1; }
      .jd-section-pad { padding: 16px 14px !important; }
      .jd-title { font-size: clamp(20px, 6vw, 32px) !important; }
      .jd-nav-back { font-size: 12px !important; }
      .jd-apply-btn { font-size: 14px !important; padding: 14px !important; }
      .jd-detail-row { flex-direction: column !important; gap: 2px !important; }
      .jd-detail-label { min-width: unset !important; font-size: 9px !important; }
      .jd-detail-val { font-size: 12px !important; }
    }
  `
  document.head.appendChild(el)
}

function NotPromoterPopup({ onClose, onNavigate }: { onClose:()=>void; onNavigate:(path:string)=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:BC2, border:`1px solid rgba(212,136,10,0.28)`, width:'100%', maxWidth:460, position:'relative', overflow:'hidden', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${G},${GL},${G},${G5})` }} />
        <div style={{ padding:'28px 24px' }}>
          <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', cursor:'pointer', color:WD, fontSize:18 }}>✕</button>
          <div style={{ fontSize:9, letterSpacing:'0.32em', textTransform:'uppercase', color:G, fontWeight:700, fontFamily:FD, marginBottom:8 }}>Promoters Only</div>
          <h2 style={{ fontFamily:FD, fontSize:20, fontWeight:700, color:W, marginBottom:10, lineHeight:1.3 }}>You need a Promoter account to apply</h2>
          <p style={{ fontSize:13, color:WM, lineHeight:1.7, marginBottom:20, fontFamily:FB }}>Only registered promoters can apply for shifts. Business and admin accounts are not eligible.</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>{onClose();onNavigate('/login')}} style={{ flex:1, padding:'12px', background:`linear-gradient(135deg,${G},${GL})`, border:'none', color:B, fontFamily:FB, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>Log In as Promoter</button>
            <button onClick={()=>{onClose();onNavigate('/register')}} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid rgba(196,151,58,0.45)`, color:G, fontFamily:FB, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:3 }}>Register</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId:string }>()
  const navigate  = useNavigate()
  const [job,           setJob          ] = useState<any>(null)
  const [loading,       setLoading      ] = useState(true)
  const [notFound,      setNotFound     ] = useState(false)
  const [showRolePopup, setShowRolePopup] = useState(false)

  useEffect(() => { injectJobDetailStyles() }, [])

  const session  = (() => { try { return JSON.parse(localStorage.getItem('hg_session')||'null') } catch { return null } })()
  const userRole = (session?.role||'').toLowerCase()

  useEffect(()=>{
    if(!jobId) return
    const local=getAllJobsWithAdminJobs().find(j=>j.id===jobId)
    if(local) { setJob(local); setLoading(false) }
    fetch(`${API_URL}/jobs/${jobId}`)
      .then(async r=>{if(r.ok){setJob(await r.json());setLoading(false)}else{if(!local){setNotFound(true);setLoading(false)}}})
      .catch(()=>{if(!local){setNotFound(true);setLoading(false)}})
  },[jobId])

  const handleApplyClick=()=>{
    if(!session||userRole!=='promoter'){setShowRolePopup(true);return}
    navigate('/promoter/jobs')
  }

  if(loading&&!job) return (
    <div style={{ minHeight:'100vh', background:B, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32, color:G, marginBottom:16 }}>◎</div><div style={{ fontSize:14, color:WM, fontFamily:FB }}>Loading job details…</div></div>
    </div>
  )
  if(notFound||!job) return (
    <div style={{ minHeight:'100vh', background:B, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:FD, fontSize:56, color:WD, marginBottom:16 }}>◎</div>
        <div style={{ fontFamily:FD, fontSize:24, color:W, marginBottom:10 }}>Job Not Found</div>
        <p style={{ fontSize:14, color:WM, marginBottom:24, fontFamily:FB }}>This job may have expired or been removed.</p>
        <button onClick={()=>navigate('/jobs')} style={{ padding:'12px 28px', background:G, border:'none', color:B, fontFamily:FB, fontSize:13, fontWeight:700, cursor:'pointer', borderRadius:3 }}>← Back to All Jobs</button>
      </div>
    </div>
  )

  const title     = job.title||''
  const company   = job.company||job.client||''
  const location  = job.location||(job.venue?`${job.venue}${job.city?', '+job.city:''}` : '')
  const pay       = job.pay||(job.hourlyRate?`R ${Number(job.hourlyRate).toLocaleString('en-ZA')}`:'')
  const payPer    = job.payPer||'per shift'
  const date      = job.date||job.jobDate||''
  const duration  = job.duration||(job.startTime&&job.endTime?`${job.startTime}–${job.endTime}`:'')
  const slots     = job.slots??job.totalSlots??0
  const slotsLeft = job.slotsLeft!==undefined?job.slotsLeft:((job.totalSlots??0)-(job.filledSlots??0))
  const tags      = job.tags||job.filters?.tags||[]
  const terms     = job.terms||job.termsAndConditions||job.filters?.termsAndConditions||''
  const status    = (job.status||'open').toLowerCase()
  const type      = job.type||job.category||''
  const isOpen    = ['open','filling fast'].includes(status)

  // ── Apply card (shared between mobile-top and desktop-sticky) ───────────────
  const ApplyCard = () => (
    <div style={{ background:BC2, border:`1px solid rgba(212,136,10,0.28)`, borderRadius:4, overflow:'hidden' }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${G5},${G},${GL})` }} />
      <div style={{ padding:'22px 20px' }}>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:G, lineHeight:1 }}>{pay}</div>
        <div style={{ fontSize:12, color:WM, marginTop:4, marginBottom:14, fontFamily:FB }}>{payPer}</div>

        {/* Quick info row */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
          {[{icon:'📅',text:date},{icon:'⏱',text:duration},{icon:'📍',text:location},{icon:'👥',text:`${slotsLeft} of ${slots} slots remaining`}].filter(m=>m.text).map((m,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
              <span style={{ fontSize:12, flexShrink:0 }}>{m.icon}</span>
              <span style={{ fontSize:12, color:WM, lineHeight:1.4, fontFamily:FB }}>{m.text}</span>
            </div>
          ))}
        </div>

        {/* Slot bar */}
        {slots>0&&(
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:10, color:WD, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:FB }}>Slots Filled</span>
              <span style={{ fontSize:10, color:G, fontWeight:700, fontFamily:FB }}>{slots-slotsLeft}/{slots}</span>
            </div>
            <div style={{ height:4, background:'rgba(206,197,178,0.08)', borderRadius:3 }}>
              <div style={{ height:'100%', width:`${Math.min(((slots-slotsLeft)/slots)*100,100)}%`, background:`linear-gradient(90deg,${G2},${G})`, borderRadius:3 }} />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div style={{ marginBottom:16 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:isOpen?GL:WD, background:isOpen?'rgba(232,168,32,0.12)':'rgba(206,197,178,0.05)', border:`1px solid ${isOpen?'rgba(232,168,32,0.35)':'rgba(206,197,178,0.12)'}`, padding:'4px 12px', borderRadius:2, fontFamily:FB }}>
            {status}
          </span>
        </div>

        {/* Apply button */}
        <button className="jd-apply-btn" onClick={handleApplyClick} disabled={!isOpen}
          style={{ width:'100%', padding:'13px', background:isOpen?`linear-gradient(135deg,${G},${GL})`:'rgba(206,197,178,0.05)', border:'none', color:isOpen?B:WM, fontFamily:FB, fontSize:13, fontWeight:700, cursor:isOpen?'pointer':'not-allowed', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10, borderRadius:3, transition:'all 0.2s', boxShadow:isOpen?`0 4px 20px rgba(196,151,58,0.35)`:'none' }}
          onMouseEnter={e=>{if(isOpen){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 8px 28px rgba(196,151,58,0.5)`}}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=isOpen?`0 4px 20px rgba(196,151,58,0.35)`:'none'}}>
          {isOpen?'Apply for This Job →':'Job Closed'}
        </button>

        <button onClick={()=>navigate('/jobs')} style={{ width:'100%', padding:'11px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:12, cursor:'pointer', borderRadius:3, transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=G;e.currentTarget.style.color=G}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=BB;e.currentTarget.style.color=WM}}>
          ← All Jobs
        </button>

        {session&&userRole!=='promoter'&&(
          <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(139,90,26,0.15)', border:`1px solid rgba(139,90,26,0.4)`, borderRadius:3, fontSize:11, color:'#C8B898', lineHeight:1.6, fontFamily:FB }}>
            ⚠ Only promoter accounts can apply. Logged in as <strong>{userRole}</strong>.
          </div>
        )}
        {!session&&(
          <div style={{ marginTop:12, padding:'10px 12px', background:BB, border:`1px solid rgba(196,151,58,0.22)`, borderRadius:3, fontSize:11, color:WD, lineHeight:1.6, fontFamily:FB, textAlign:'center' }}>
            <button onClick={()=>navigate('/login')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, fontFamily:FB, textDecoration:'underline' }}>Log in</button>
            {' '}or{' '}
            <button onClick={()=>navigate('/register')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, fontFamily:FB, textDecoration:'underline' }}>register</button>
            {' '}to apply
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:B, color:W }}>

      {/* Nav */}
      <nav className="jd-nav">
        <button className="jd-nav-back" onClick={()=>navigate('/jobs')} style={{ background:'none', border:'none', color:WM, cursor:'pointer', fontFamily:FB, fontSize:13, display:'flex', alignItems:'center', gap:6 }}
          onMouseEnter={e=>e.currentTarget.style.color=W} onMouseLeave={e=>e.currentTarget.style.color=WM}>
          ← Jobs
        </button>
        <div style={{ fontFamily:FD, fontSize:15, fontWeight:700 }}><span style={{ color:G }}>HONEY</span><span style={{ color:W }}> GROUP</span></div>
        {session
          ? <span style={{ fontSize:11, color:WM, fontFamily:FB, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{session.name}</span>
          : <button onClick={()=>navigate('/login')} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:11, cursor:'pointer', borderRadius:3 }}>Log In</button>
        }
      </nav>

      <div className="jd-layout">

        {/* ── Apply card — shows at top on mobile (order: -1) ── */}
        <div className="jd-sticky-card">
          <ApplyCard />
        </div>

        {/* ── Main content ── */}
        <div className="jd-main-content">

          {/* Breadcrumb */}
          <div style={{ fontSize:11, color:WD, marginBottom:10, fontFamily:FB }}>
            {company}{company&&location?' · ':''}{location}
          </div>

          {/* Title row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <h1 className="jd-title" style={{ fontFamily:FD, fontSize:'clamp(22px,4vw,38px)', fontWeight:700, color:W, lineHeight:1.2, flex:1, minWidth:0 }}>{title}</h1>
            {type&&<span style={{ flexShrink:0, fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:GL, background:'rgba(232,168,32,0.10)', border:`1px solid rgba(232,168,32,0.28)`, padding:'5px 12px', borderRadius:2, marginTop:4 }}>{type}</span>}
          </div>

          {/* Stat grid */}
          <div className="jd-stat-grid" style={{ background:BB, marginBottom:20 }}>
            {[{label:'Rate',value:pay,sub:payPer},{label:'Date',value:date,sub:duration},{label:'Slots',value:`${slotsLeft} left`,sub:`of ${slots} total`}].map((r,i)=>(
              <div key={i} style={{ background:BC2, padding:'14px 16px' }}>
                <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, marginBottom:5, fontFamily:FB }}>{r.label}</div>
                <div style={{ fontFamily:FD, fontSize:18, fontWeight:700, color:G }}>{r.value}</div>
                {r.sub&&<div style={{ fontSize:10, color:WM, marginTop:3, fontFamily:FB }}>{r.sub}</div>}
              </div>
            ))}
          </div>

          {!isOpen&&<div style={{ padding:'12px 14px', background:'rgba(139,90,26,0.18)', border:`1px solid rgba(139,90,26,0.5)`, borderRadius:3, marginBottom:18, fontSize:13, color:'#C8B898', fontFamily:FB }}>⚠ This job is currently {status}.</div>}

          {/* Requirements */}
          {tags.length>0&&(
            <div className="jd-section-pad" style={{ marginBottom:16, padding:'18px 20px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:12, fontWeight:700, fontFamily:FB }}>Requirements</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {tags.map((tag:string,i:number)=><span key={i} style={{ fontSize:11, color:WM, background:'rgba(255,255,255,0.05)', border:`1px solid ${BB}`, padding:'5px 10px', borderRadius:2, fontFamily:FB }}>{tag}</span>)}
              </div>
            </div>
          )}

          {/* Terms */}
          {terms&&(
            <div className="jd-section-pad" style={{ marginBottom:16, padding:'18px 20px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:12, fontWeight:700, fontFamily:FB }}>Terms & Conditions</div>
              <div style={{ fontSize:13, color:WM, lineHeight:1.9, whiteSpace:'pre-line', fontFamily:FB }}>{terms}</div>
            </div>
          )}

          {/* Job detail rows */}
          <div className="jd-section-pad" style={{ padding:'18px 20px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
            <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:12, fontWeight:700, fontFamily:FB }}>Job Details</div>
            {[
              ['Company',    company],
              ['Location',   location],
              ['Date',       date],
              ['Duration',   duration],
              ['Pay',        `${pay} ${payPer}`],
              ['Slots',      `${slotsLeft} of ${slots} available`],
              ...(job.contactPerson?[['Contact',  job.contactPerson]]:[]),
              ...(job.contactPhone ?[['Phone',    job.contactPhone ]]:[]),
              ...(job.contactEmail ?[['Email',    job.contactEmail ]]:[]),
              ...(job.companyReg   ?[['Reg No.',  job.companyReg   ]]:[]),
            ].filter(([,v])=>v).map(([label,value],i,arr)=>(
              <div key={String(label)} className="jd-detail-row" style={{ display:'flex', gap:12, padding:'9px 0', borderBottom:i<arr.length-1?`1px solid ${BB}`:'none', alignItems:'flex-start' }}>
                <span className="jd-detail-label" style={{ fontSize:11, color:WD, minWidth:120, flexShrink:0, fontFamily:FB }}>{label}</span>
                <span className="jd-detail-val" style={{ fontSize:13, color:W, fontWeight:600, fontFamily:FB, wordBreak:'break-word' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showRolePopup&&<NotPromoterPopup onClose={()=>setShowRolePopup(false)} onNavigate={path=>{setShowRolePopup(false);navigate(path)}} />}
    </div>
  )
}