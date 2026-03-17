// shared/jobs/JobDetailPage.tsx
// ✓ Terms & Conditions shown in full
// ✓ Apply button sticky on right-hand side
// ✓ Non-promoter users (business/admin/not-logged-in) see a popup explaining they need a promoter account
// ✓ Fallback to jobsData when backend is offline

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllJobsWithAdminJobs } from './jobsData';

// ─── Design tokens ────────────────────────────────────────────────────────────
const G   = '#C4973A'
const GL  = '#E8A820'
const G2  = '#8B5A1A'
const G3  = '#D4880A'
const G5  = '#6B3F10'
const B   = '#080808'
const BC  = '#111008'
const BC2 = '#161209'
const BB  = 'rgba(212,136,10,0.14)'
const W   = '#FAF3E8'
const WM  = 'rgba(250,243,232,0.65)'
const WD  = 'rgba(250,243,232,0.28)'
const FD  = "'Playfair Display', Georgia, serif"
const FB  = "'DM Sans', system-ui, sans-serif"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── Role popup ───────────────────────────────────────────────────────────────
function NotPromoterPopup({ onClose, onNavigate }: { onClose: ()=>void; onNavigate: (path:string)=>void }) {
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:BC2, border:`1px solid rgba(212,136,10,0.28)`, width:'100%', maxWidth:480, position:'relative', overflow:'hidden', borderRadius:4 }}>
        {/* gold top bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${G},${GL},${G},${G5})` }} />

        <div style={{ padding:'36px 40px' }}>
          <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:WD, fontSize:18, lineHeight:1 }}>✕</button>

          {/* Icon */}
          <div style={{ width:56, height:56, borderRadius:'50%', background:`rgba(196,151,58,0.12)`, border:`2px solid rgba(196,151,58,0.35)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:20 }}>
            🚫
          </div>

          <div style={{ fontSize:9, letterSpacing:'0.32em', textTransform:'uppercase', color:G, fontWeight:700, fontFamily:FD, marginBottom:8 }}>Promoters Only</div>
          <h2 style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:12, lineHeight:1.3 }}>
            You need a Promoter account to apply for jobs
          </h2>
          <p style={{ fontSize:13, color:WM, lineHeight:1.75, marginBottom:28, fontFamily:FB }}>
            Only registered promoters can apply for shifts on the Honey Group platform. Business accounts and admin accounts are not eligible to apply for jobs.
          </p>
          <p style={{ fontSize:13, color:WM, lineHeight:1.75, marginBottom:28, fontFamily:FB }}>
            If you're a promoter, please log in to your promoter account. If you haven't registered yet, create a promoter account — it's free.
          </p>

          <div style={{ display:'flex', gap:12 }}>
            <button
              onClick={()=>{ onClose(); onNavigate('/login') }}
              style={{ flex:1, padding:'13px', background:`linear-gradient(135deg,${G},${GL})`, border:'none', color:B, fontFamily:FB, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', borderRadius:3, transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              Log In as Promoter
            </button>
            <button
              onClick={()=>{ onClose(); onNavigate('/register') }}
              style={{ flex:1, padding:'13px', background:'transparent', border:`1px solid rgba(196,151,58,0.45)`, color:G, fontFamily:FB, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', borderRadius:3, transition:'all 0.2s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(196,151,58,0.10)'; e.currentTarget.style.borderColor=G }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(196,151,58,0.45)' }}>
              Register as Promoter
            </button>
          </div>

          <p style={{ marginTop:16, fontSize:11, color:WD, textAlign:'center', fontFamily:FB }}>
            Already a promoter? <button onClick={()=>{ onClose(); onNavigate('/login') }} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, fontFamily:FB, textDecoration:'underline' }}>Log in here</button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate  = useNavigate()
  const [job,          setJob         ] = useState<any>(null)
  const [loading,      setLoading     ] = useState(true)
  const [notFound,     setNotFound    ] = useState(false)
  const [showRolePopup,setShowRolePopup] = useState(false)

  // Get session
  const session = (() => { try { return JSON.parse(localStorage.getItem('hg_session')||'null') } catch { return null } })()
  const userRole = (session?.role || '').toLowerCase() // 'promoter' | 'business' | 'admin' | ''

  useEffect(()=>{
    if (!jobId) return
    const local = getAllJobsWithAdminJobs().find(j=>j.id===jobId)
    if (local) setJob(local)

    fetch(`${API_URL}/jobs/${jobId}`)
      .then(async r => { if(r.ok) { setJob(await r.json()); setLoading(false) } else { if(!local) setNotFound(true); setLoading(false) } })
      .catch(()=>{ if(!local) setNotFound(true); setLoading(false) })
  },[jobId])

  const handleApplyClick = () => {
    // Not logged in OR not a promoter → show popup
    if (!session || userRole !== 'promoter') {
      setShowRolePopup(true)
      return
    }
    navigate('/promoter/jobs')
  }

  if (loading && !job) return (
    <div style={{ minHeight:'100vh', background:B, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FB }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:32, color:G, marginBottom:16 }}>◎</div><div style={{ fontSize:14, color:WM }}>Loading job details…</div></div>
    </div>
  )

  if (notFound||!job) return (
    <div style={{ minHeight:'100vh', background:B, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FB }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontFamily:FD, fontSize:64, color:WD, marginBottom:16 }}>◎</div>
        <div style={{ fontFamily:FD, fontSize:28, color:W, marginBottom:12 }}>Job Not Found</div>
        <p style={{ fontSize:14, color:WM, marginBottom:28 }}>This job may have expired or been removed.</p>
        <button onClick={()=>navigate('/jobs')} style={{ padding:'12px 28px', background:G, border:'none', color:B, fontFamily:FB, fontSize:13, fontWeight:700, cursor:'pointer' }}>← Back to All Jobs</button>
      </div>
    </div>
  )

  // Normalise fields for both API + jobsData shapes
  const title     = job.title || ''
  const company   = job.company || job.client || ''
  const location  = job.location || (job.venue ? `${job.venue}${job.city?', '+job.city:''}` : '')
  const pay       = job.pay || (job.hourlyRate ? `R ${Number(job.hourlyRate).toLocaleString('en-ZA')}` : '')
  const payPer    = job.payPer || 'per shift'
  const date      = job.date || job.jobDate || ''
  const duration  = job.duration || (job.startTime&&job.endTime ? `${job.startTime}–${job.endTime}` : '')
  const slots     = job.slots ?? job.totalSlots ?? 0
  const slotsLeft = job.slotsLeft !== undefined ? job.slotsLeft : ((job.totalSlots??0)-(job.filledSlots??0))
  const tags      = job.tags || job.filters?.tags || []
  const terms     = job.terms || job.termsAndConditions || job.filters?.termsAndConditions || ''
  const status    = (job.status||'open').toLowerCase()
  const type      = job.type || job.category || ''
  const isOpen    = ['open','filling fast'].includes(status)

  // Contact details
  const contactPerson = job.contactPerson || ''
  const contactEmail  = job.contactEmail  || ''
  const contactPhone  = job.contactPhone  || ''
  const companyReg    = job.companyReg    || ''
  const address       = job.address       || location

  return (
    <div style={{ minHeight:'100vh', background:B, fontFamily:FB, color:W }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${B};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${G};}
      `}</style>

      {/* NAV */}
      <nav style={{ padding:'18px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${BB}`, background:BC, position:'sticky', top:0, zIndex:50 }}>
        <button onClick={()=>navigate('/jobs')} style={{ background:'none', border:'none', color:WM, cursor:'pointer', fontFamily:FB, fontSize:13, display:'flex', alignItems:'center', gap:6 }} onMouseEnter={e=>e.currentTarget.style.color=W} onMouseLeave={e=>e.currentTarget.style.color=WM}>
          ← Back to Jobs
        </button>
        <div style={{ fontFamily:FD, fontSize:16, fontWeight:700 }}><span style={{ color:G }}>HONEY</span><span style={{ color:W }}> GROUP</span></div>
        <div>
          {session ? (
            <span style={{ fontSize:12, color:WM, fontFamily:FB }}>
              Logged in as <strong style={{ color:G }}>{session.name||session.role}</strong>
            </span>
          ) : (
            <button onClick={()=>navigate('/login')} style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:11, cursor:'pointer' }}>Log In</button>
          )}
        </div>
      </nav>

      {/* MAIN LAYOUT — two-column on wide screens */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'48px 24px 80px', display:'grid', gridTemplateColumns:'1fr 320px', gap:32, alignItems:'start' }}>

        {/* ── LEFT COLUMN: all job info ── */}
        <div>
          {/* Breadcrumb */}
          <div style={{ fontSize:11, color:WD, marginBottom:8 }}>{company}{company&&location?' · ':''}{location}</div>

          {/* Title + type badge */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:24 }}>
            <h1 style={{ fontFamily:FD, fontSize:'clamp(24px,4vw,40px)', fontWeight:700, color:W, lineHeight:1.2 }}>{title}</h1>
            {type&&<span style={{ flexShrink:0, fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:GL, background:'rgba(232,168,32,0.10)', border:`1px solid rgba(232,168,32,0.28)`, padding:'5px 12px', borderRadius:2, marginTop:6 }}>{type}</span>}
          </div>

          {/* Key stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:BB, marginBottom:28 }}>
            {[
              {label:'Rate',  value:pay,                  sub:payPer},
              {label:'Date',  value:date,                 sub:duration},
              {label:'Slots', value:`${slotsLeft} left`,  sub:`of ${slots} total`},
            ].map((r,i)=>(
              <div key={i} style={{ background:BC2, padding:'18px 20px' }}>
                <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:WD, marginBottom:6 }}>{r.label}</div>
                <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:G }}>{r.value}</div>
                {r.sub&&<div style={{ fontSize:11, color:WD, marginTop:3 }}>{r.sub}</div>}
              </div>
            ))}
          </div>

          {/* Status warning */}
          {!isOpen&&<div style={{ padding:'12px 18px', background:'rgba(139,90,26,0.18)', border:`1px solid rgba(139,90,26,0.5)`, borderRadius:3, marginBottom:24, fontSize:13, color:'#E8D5A8' }}>⚠ This job is currently {status} — applications may not be accepted.</div>}

          {/* Requirements / tags */}
          {tags.length>0&&(
            <div style={{ marginBottom:24, padding:'20px 24px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:14, fontWeight:700 }}>Requirements</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {tags.map((tag:string,i:number)=><span key={i} style={{ fontSize:11, color:WM, background:'rgba(255,255,255,0.05)', border:`1px solid ${BB}`, padding:'5px 12px', borderRadius:2 }}>{tag}</span>)}
              </div>
            </div>
          )}

          {/* Terms & Conditions — always shown if they exist */}
          {terms ? (
            <div style={{ marginBottom:24, padding:'20px 24px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:14, fontWeight:700 }}>Terms & Conditions</div>
              <div style={{ fontSize:13, color:WM, lineHeight:1.9, whiteSpace:'pre-line', fontFamily:FB }}>
                {terms}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom:24, padding:'16px 20px', background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.06)`, borderRadius:3 }}>
              <div style={{ fontSize:12, color:WD, fontFamily:FB }}>Standard Honey Group Promoter Terms & Conditions apply to this engagement. Promoter is engaged as an independent contractor. Payment within 5 business days of shift completion. POPIA compliance required.</div>
            </div>
          )}

          {/* Job Details table */}
          <div style={{ marginBottom:24, padding:'20px 24px', background:BC2, border:`1px solid ${BB}`, borderRadius:3 }}>
            <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:G, marginBottom:14, fontWeight:700 }}>Job Details</div>
            {[
              ['Company',         company],
              ['Location',        location],
              ['Date',            date],
              ['Duration',        duration],
              ['Pay',             `${pay} ${payPer}`],
              ['Slots Available', `${slotsLeft} of ${slots}`],
              ...(contactPerson ? [['Contact Person', contactPerson]] : []),
              ...(contactPhone  ? [['Contact Phone',  contactPhone ]] : []),
              ...(contactEmail  ? [['Contact Email',  contactEmail ]] : []),
              ...(companyReg    ? [['Company Reg.',   companyReg   ]] : []),
            ].filter(([,v])=>v).map(([label,value],i,arr)=>(
              <div key={String(label)} style={{ display:'flex', gap:16, padding:'10px 0', borderBottom:i<arr.length-1?`1px solid ${BB}`:'none' }}>
                <span style={{ fontSize:12, color:WD, minWidth:140, flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:13, color:W, fontWeight:600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Mobile CTA (hidden on desktop via media query — see below) */}
          <div className="mobile-cta" style={{ display:'none' }}>
            <button onClick={handleApplyClick}
              style={{ width:'100%', padding:'16px', background:isOpen?G:'rgba(255,255,255,0.06)', border:'none', color:isOpen?B:WM, fontFamily:FB, fontSize:14, fontWeight:700, cursor:isOpen?'pointer':'not-allowed', letterSpacing:'0.06em', marginBottom:12 }}>
              {isOpen ? (userRole==='promoter'?'Apply for This Job →':'Apply for This Job →') : 'Job Closed'}
            </button>
            <button onClick={()=>navigate('/jobs')} style={{ width:'100%', padding:'14px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:13, cursor:'pointer' }}>← All Jobs</button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: sticky apply panel ── */}
        <div style={{ position:'sticky', top:88, alignSelf:'start' }}>
          <div style={{ background:BC2, border:`1px solid rgba(212,136,10,0.28)`, borderRadius:4, overflow:'hidden' }}>
            {/* Gold top accent */}
            <div style={{ height:3, background:`linear-gradient(90deg,${G5},${G},${GL})` }} />

            <div style={{ padding:'28px 24px' }}>
              <div style={{ fontFamily:FD, fontSize:26, fontWeight:700, color:G, lineHeight:1 }}>{pay}</div>
              <div style={{ fontSize:12, color:WD, marginTop:4, marginBottom:16 }}>{payPer}</div>

              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  {icon:'📅', text:date},
                  {icon:'⏱', text:duration},
                  {icon:'📍', text:location},
                  {icon:'👥', text:`${slotsLeft} slots remaining`},
                ].filter(m=>m.text).map((m,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span style={{ fontSize:13, flexShrink:0 }}>{m.icon}</span>
                    <span style={{ fontSize:12, color:WM, lineHeight:1.4 }}>{m.text}</span>
                  </div>
                ))}
              </div>

              {/* Slot bar */}
              {slots>0&&(
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:10, color:WD, letterSpacing:'0.1em', textTransform:'uppercase' }}>Slots Filled</span>
                    <span style={{ fontSize:10, color:G, fontWeight:700 }}>{slots-slotsLeft}/{slots}</span>
                  </div>
                  <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${Math.min(((slots-slotsLeft)/slots)*100,100)}%`, background:`linear-gradient(90deg,${G2},${G})`, borderRadius:3, transition:'width 0.4s' }} />
                  </div>
                </div>
              )}

              {/* Status badge */}
              <div style={{ marginBottom:20 }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:isOpen?GL:'rgba(250,243,232,0.40)', background:isOpen?'rgba(232,168,32,0.12)':'rgba(255,255,255,0.05)', border:`1px solid ${isOpen?'rgba(232,168,32,0.35)':'rgba(255,255,255,0.12)'}`, padding:'4px 12px', borderRadius:2 }}>
                  {status}
                </span>
              </div>

              {/* APPLY BUTTON */}
              <button
                onClick={handleApplyClick}
                disabled={!isOpen}
                style={{ width:'100%', padding:'15px', background:isOpen?`linear-gradient(135deg,${G},${GL})`:'rgba(255,255,255,0.05)', border:'none', color:isOpen?B:WM, fontFamily:FB, fontSize:13, fontWeight:700, cursor:isOpen?'pointer':'not-allowed', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10, borderRadius:3, transition:'all 0.2s', boxShadow:isOpen?`0 4px 20px rgba(196,151,58,0.35)`:'none' }}
                onMouseEnter={e=>{ if(isOpen) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 8px 28px rgba(196,151,58,0.5)` }}}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=isOpen?`0 4px 20px rgba(196,151,58,0.35)`:'none' }}>
                {isOpen ? 'Apply for This Job →' : 'Job Closed'}
              </button>

              <button onClick={()=>navigate('/jobs')}
                style={{ width:'100%', padding:'12px', background:'transparent', border:`1px solid ${BB}`, color:WM, fontFamily:FB, fontSize:12, cursor:'pointer', borderRadius:3, transition:'all 0.2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=BB; e.currentTarget.style.color=WM }}>
                ← All Jobs
              </button>

              {/* Role hint for non-promoters */}
              {session && userRole !== 'promoter' && (
                <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(139,90,26,0.15)', border:`1px solid rgba(139,90,26,0.4)`, borderRadius:3, fontSize:11, color:'#E8D5A8', lineHeight:1.6, fontFamily:FB }}>
                  ⚠ Only promoter accounts can apply. You are logged in as <strong>{userRole}</strong>.
                </div>
              )}

              {!session && (
                <div style={{ marginTop:14, padding:'10px 14px', background:BB, border:`1px solid rgba(196,151,58,0.22)`, borderRadius:3, fontSize:11, color:WD, lineHeight:1.6, fontFamily:FB, textAlign:'center' }}>
                  <button onClick={()=>navigate('/login')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, fontFamily:FB, textDecoration:'underline' }}>Log in</button> or <button onClick={()=>navigate('/register')} style={{ background:'none', border:'none', color:G, cursor:'pointer', fontSize:11, fontFamily:FB, textDecoration:'underline' }}>register as promoter</button> to apply
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Role popup */}
      {showRolePopup && (
        <NotPromoterPopup
          onClose={()=>setShowRolePopup(false)}
          onNavigate={path=>{ setShowRolePopup(false); navigate(path) }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-cta { display: block !important; }
        }
      `}</style>
    </div>
  )
}