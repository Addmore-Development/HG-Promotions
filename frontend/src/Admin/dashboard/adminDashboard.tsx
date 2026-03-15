import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../AdminLayout'
import { AdminChatTab } from '../ChatSystem'

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
const GM = '#221C0A'

const BB  = 'rgba(212,136,10,0.16)'
const BB2 = 'rgba(212,136,10,0.06)'

const W   = '#FAF3E8'
const W85 = 'rgba(250,243,232,0.85)'
const W55 = 'rgba(250,243,232,0.55)'
const W28 = 'rgba(250,243,232,0.28)'

const C_ACTIVE   = '#C07818'
const C_PENDING  = '#E8A820'
const C_REJECTED = '#E8D5A8'
const C_NEW      = '#F0C050'
const C_INACTIVE = '#E8D5A8'

const FD   = "'Playfair Display', Georgia, serif"
const MONO = "'DM Mono', 'Courier New', monospace"

// ─── Client Categories & Specs ────────────────────────────────────────────────
const CLIENT_CATEGORIES = [
  'FMCG / Beverages', 'FMCG / Food', 'Retail', 'Telecoms', 'Automotive',
  'Financial Services', 'Healthcare / Pharma', 'Fitness & Wellness',
  'Fashion & Beauty', 'Quick Service Restaurant', 'Events & Entertainment',
  'Technology', 'Government / NGO', 'Real Estate', 'Education', 'Other',
]

type SpecField = { key: string; label: string; type: 'text' | 'select' | 'number'; options?: string[]; placeholder?: string; hint?: string }

const CATEGORY_SPECS: Record<string, SpecField[]> = {
  'FMCG / Beverages': [
    { key: 'minAge',     label: 'Minimum Promoter Age',        type: 'number',  placeholder: '21', hint: 'Mandatory 21+ for alcohol brands' },
    { key: 'alcohol',    label: 'Alcohol Brand',               type: 'select',  options: ['Yes — Age verification required', 'No'] },
    { key: 'foodSafety', label: 'Food Safety Certificate',     type: 'select',  options: ['Required', 'Preferred', 'Not Required'] },
    { key: 'languages',  label: 'Languages Required',          type: 'text',    placeholder: 'English, Zulu, Afrikaans' },
    { key: 'uniform',    label: 'Uniform',                     type: 'select',  options: ['Provided by Client', 'Smart Casual', 'Brand Specific'] },
    { key: 'gender',     label: 'Gender Preference',           type: 'select',  options: ['Any Gender', 'Female', 'Male'] },
  ],
  'FMCG / Food': [
    { key: 'foodHandle', label: 'Food Handling Certificate',   type: 'select',  options: ['Required', 'Preferred', 'Not Required'] },
    { key: 'allergen',   label: 'Allergen Awareness',          type: 'select',  options: ['Training Required', 'Briefing on Shift', 'Not Required'] },
    { key: 'cookingExp', label: 'Cooking Experience',          type: 'select',  options: ['Not Required', 'Basic Kitchen', 'Intermediate', 'Advanced'] },
    { key: 'hygiene',    label: 'Hygiene Standard',            type: 'select',  options: ['Standard', 'HACCP Awareness', 'Full HACCP Required'] },
    { key: 'uniform',    label: 'Uniform / Apron',             type: 'select',  options: ['Provided', 'Smart Casual', 'Brand Specific'] },
    { key: 'tools',      label: 'Cooking Tools Knowledge',     type: 'select',  options: ['Not Required', 'Basic', 'Intermediate', 'Advanced'] },
  ],
  'Fitness & Wellness': [
    { key: 'minHeight',    label: 'Minimum Height (cm)',       type: 'number',  placeholder: '165' },
    { key: 'maxWeight',    label: 'Maximum Weight (kg)',       type: 'number',  placeholder: '75', hint: '0 = no restriction' },
    { key: 'fitnessLevel', label: 'Fitness Level Required',   type: 'select',  options: ['Any', 'Active Lifestyle', 'Athletic Build', 'Competitive Athlete'] },
    { key: 'cert',         label: 'Fitness Certification',    type: 'select',  options: ['Not Required', 'Preferred', 'Required'] },
    { key: 'gender',       label: 'Gender Preference',        type: 'select',  options: ['Any Gender', 'Female', 'Male', 'Non-binary Inclusive'] },
    { key: 'raceSpec',     label: 'Ethnicity Specification',  type: 'select',  options: ['No Specification', 'Campaign Specific — See Notes'], hint: 'Must be legally justified' },
    { key: 'raceNote',     label: 'Ethnicity Detail',         type: 'text',    placeholder: 'Only if legally required', hint: 'POPIA compliance required' },
  ],
  'Fashion & Beauty': [
    { key: 'minHeight',  label: 'Minimum Height (cm)',         type: 'number',  placeholder: '168' },
    { key: 'gender',     label: 'Gender Preference',           type: 'select',  options: ['Any Gender', 'Female', 'Male', 'Non-binary Inclusive'] },
    { key: 'lookReq',    label: 'Appearance Standard',         type: 'select',  options: ['Smart Casual', 'Formal', 'High Fashion', 'Brand Specific'] },
    { key: 'beautyExp',  label: 'Makeup/Beauty Experience',    type: 'select',  options: ['Not Required', 'Preferred', 'Required'] },
    { key: 'portfolio',  label: 'Portfolio Required',           type: 'select',  options: ['No', 'Optional', 'Required'] },
    { key: 'skinNote',   label: 'Skin Tone Spec (if any)',     type: 'text',    placeholder: 'Only if required by brief', hint: 'Must be legally justified' },
  ],
  'Financial Services': [
    { key: 'fais',       label: 'FAIS Certificate',            type: 'select',  options: ['Not Required', 'Preferred', 'Required'] },
    { key: 'nca',        label: 'NCA Compliance',              type: 'select',  options: ['Briefing on Shift', 'Prior Knowledge Required'] },
    { key: 'look',       label: 'Appearance Standard',         type: 'select',  options: ['Business Casual', 'Business Formal', 'Brand Uniform'] },
    { key: 'advice',     label: 'Financial Advice Prohibition', type: 'select', options: ['Yes — Directional Only', 'Scripted Info Only'] },
    { key: 'bgCheck',    label: 'Background Check',            type: 'select',  options: ['Not Required', 'Credit Check', 'Full Background Check'] },
    { key: 'languages',  label: 'Languages Required',          type: 'text',    placeholder: 'English, Afrikaans' },
  ],
  'Healthcare / Pharma': [
    { key: 'healthCert', label: 'Health Cert Required',        type: 'select',  options: ['Not Required', 'Preferred', 'Required'] },
    { key: 'mhcComp',    label: 'MHC Act Compliance',          type: 'select',  options: ['Briefing Required', 'Prior Knowledge'] },
    { key: 'medAdvProh', label: 'Medical Advice Prohibition',  type: 'select',  options: ['Yes — Directional Only', 'Approved Script Only'] },
    { key: 'hygiene',    label: 'Hygiene Requirement',         type: 'select',  options: ['Standard', 'Clinical Standard'] },
    { key: 'gender',     label: 'Gender Preference',           type: 'select',  options: ['Any Gender', 'Female', 'Male'] },
  ],
  'Quick Service Restaurant': [
    { key: 'foodHandle', label: 'Food Handling Certificate',   type: 'select',  options: ['Required', 'Preferred', 'Not Required'] },
    { key: 'cookTools',  label: 'Cooking Tool Knowledge',      type: 'select',  options: ['Not Required', 'Basic', 'Intermediate', 'Advanced'] },
    { key: 'hygiene',    label: 'Hygiene Training',            type: 'select',  options: ['On-shift Briefing', 'Prior Certificate'] },
    { key: 'uniform',    label: 'Uniform',                     type: 'select',  options: ['Provided', 'Smart Casual', 'Brand Specific'] },
    { key: 'allergen',   label: 'Allergen Training',           type: 'select',  options: ['Required', 'Preferred', 'Not Required'] },
  ],
  'Telecoms': [
    { key: 'techLevel',  label: 'Tech Savviness Required',     type: 'select',  options: ['Basic', 'Intermediate', 'Advanced'] },
    { key: 'briefing',   label: 'Mandatory Product Briefing',  type: 'select',  options: ['Yes', 'No'] },
    { key: 'rica',       label: 'RICA / SIM Sales',            type: 'select',  options: ['Not Required', 'RICA Training Required'] },
    { key: 'deviceLiab', label: 'Device Handling Liability',   type: 'select',  options: ['Promoter Liable for Negligence', 'Client Assumes Risk'] },
    { key: 'languages',  label: 'Languages Required',          type: 'text',    placeholder: 'English' },
  ],
  'Automotive': [
    { key: 'driverLic',  label: "Driver's Licence",            type: 'select',  options: ['Not Required', 'Code 8', 'Code 10'] },
    { key: 'autoKnow',   label: 'Automotive Knowledge',        type: 'select',  options: ['Not Required', 'General', 'Brand Specific'] },
    { key: 'look',       label: 'Appearance Standard',         type: 'select',  options: ['Smart Casual', 'Business Formal', 'Brand Uniform'] },
    { key: 'safetyBrief', label: 'Vehicle Proximity Safety',   type: 'select',  options: ['Briefing Required on Shift'] },
    { key: 'gender',     label: 'Gender Preference',           type: 'select',  options: ['Any Gender', 'Female', 'Male'] },
  ],
}

const DEFAULT_SPECS: SpecField[] = [
  { key: 'minAge',    label: 'Minimum Age',            type: 'number', placeholder: '18' },
  { key: 'languages', label: 'Languages Required',     type: 'text',   placeholder: 'English' },
  { key: 'expReq',    label: 'Experience Requirement', type: 'select', options: ['None', '6 months+', '1 year+', '2+ years'] },
  { key: 'uniform',   label: 'Attire / Uniform',       type: 'select', options: ['Provided by Client', 'Smart Casual', 'Formal', 'Brand Specific'] },
  { key: 'gender',    label: 'Gender Preference',      type: 'select', options: ['Any Gender', 'Female', 'Male'] },
]

const CATEGORY_REGS: Record<string, string[]> = {
  'FMCG / Beverages': [
    'No alcohol product may be served to anyone under 18 — promoter is legally liable for age verification.',
    'Promoter must not consume any alcohol during the shift — immediate breach of contract if violated.',
    'Responsible Liquor Service training briefing is mandatory before the shift commences.',
    'Honey Group and the client are not liable for promoter negligence in alcohol distribution.',
  ],
  'Fitness & Wellness': [
    'All physical attribute requirements (height, weight) must be legally justified by the campaign brief.',
    'Ethnicity specifications are only permissible where brand authenticity is demonstrably required and documented.',
    'POPIA — all promoter personal data collected during this campaign is subject to full compliance.',
    'Promoters must not represent medical or health claims beyond the approved product script.',
  ],
  'Financial Services': [
    'Promoters may NOT provide financial advice under any circumstances — FAIS Act compliance required.',
    'All scripted product information must be pre-approved by the client compliance team before the shift.',
    'Any promoter who provides financial advice does so at their own legal liability — not Honey Group.',
    'Background checks may be required at the client\'s discretion and with promoter consent under POPIA.',
  ],
  'Healthcare / Pharma': [
    'Promoters may NOT provide medical advice — Medicines and Related Substances Act compliance mandatory.',
    'All product claims must strictly follow the approved product monograph provided at briefing.',
    'Personal health data of consumers must not be collected without explicit POPIA-compliant consent.',
  ],
  'Quick Service Restaurant': [
    'All promoters must comply with Regulation 638 (Food Safety) of the Health Act.',
    'Any signs of illness must be reported to the supervisor before the shift — no exceptions.',
    'Allergen information must be communicated accurately to all consumers as briefed.',
  ],
  'default': [
    'All engagements are governed by the Honey Group Standard Promoter Terms & Conditions.',
    'POPIA compliance is mandatory for all personal data collected during activations.',
    'Promoters are independent contractors — not employees of the client or Honey Group.',
    'Cancellations with less than 24 hours notice will result in a reliability score penalty.',
    'Honey Group reserves the right to remove any promoter from a campaign without prior notice.',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hex2rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function statusColor(s: string): string {
  if (s === 'approved' || s === 'active')       return C_ACTIVE
  if (s === 'rejected')                          return C_REJECTED
  if (s === 'inactive')                          return C_INACTIVE
  if (s === 'pending' || s === 'pending_review') return C_PENDING
  if (s === 'new')                               return C_NEW
  return W28
}
function statusBg(s: string): string {
  if (s === 'approved' || s === 'active')          return hex2rgba('#C07818', 0.12)
  if (s === 'rejected' || s === 'inactive')        return hex2rgba('#6B4020', 0.35)
  if (s === 'pending' || s === 'pending_review')   return hex2rgba('#E8A820', 0.12)
  if (s === 'new')                                 return hex2rgba('#F0C050', 0.10)
  return 'transparent'
}
function statusBorder(s: string): string {
  if (s === 'approved' || s === 'active')          return hex2rgba('#C07818', 0.45)
  if (s === 'rejected' || s === 'inactive')        return hex2rgba('#8B6040', 0.60)
  if (s === 'pending' || s === 'pending_review')   return hex2rgba('#E8A820', 0.45)
  if (s === 'new')                                 return hex2rgba('#F0C050', 0.42)
  return BB
}
function normalizeStatus(s: string) { return s === 'pending_review' ? 'pending' : s || 'pending' }
function isPending(s: string)       { return s === 'pending' || s === 'pending_review' }

function loadRealRegistrations() {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    return stored.map((u: any, idx: number) => ({
      id: `LIVE-${idx + 1}`,
      name: u.fullName || u.contactName || u.companyName || u.email,
      email: u.email, role: u.role as string,
      date: u.createdAt ? String(u.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: normalizeStatus(String(u.status || 'pending')),
      city: u.city || u.location || (u.address ? u.address.split(',').pop()?.trim() : '') || 'Not specified',
      phone: u.phone || u.contactPhone || 'Not provided',
      source: 'real', _rawStatus: u.status || 'pending',
      details: u.role === 'promoter'
        ? { gender: u.gender || 'N/A', height: u.height || 'N/A', idNumber: u.idNumber || 'N/A', experience: u.experience || 'N/A' }
        : { regNumber: u.regNumber || 'N/A', industry: u.industry || 'N/A', website: u.website || 'N/A', contactPerson: u.contactName || u.fullName || 'N/A', companyName: u.companyName || 'N/A' },
    }))
  } catch { return [] }
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LOGINS = [
  { id:'L001', name:'Ayanda Dlamini', email:'ayanda@email.com', role:'promoter', time:'2026-03-11T08:02:00', ip:'196.25.1.4'  },
  { id:'L002', name:'Thabo Nkosi',    email:'thabo@email.com',  role:'promoter', time:'2026-03-11T08:14:00', ip:'196.25.1.7'  },
  { id:'L003', name:'Acme Corp',      email:'acme@corp.co.za',  role:'business', time:'2026-03-11T09:01:00', ip:'41.13.22.9'  },
  { id:'L004', name:'Lerato Mokoena', email:'lerato@email.com', role:'promoter', time:'2026-03-10T17:30:00', ip:'196.25.1.12' },
  { id:'L005', name:'RedBull SA',     email:'rb@redbull.co.za', role:'business', time:'2026-03-10T14:22:00', ip:'41.13.55.3'  },
  { id:'L006', name:'Sipho Mhlongo',  email:'sipho@email.com',  role:'promoter', time:'2026-03-09T11:45:00', ip:'196.25.1.9'  },
]

const MOCK_REGISTRATIONS = [
  { id:'R001', name:'Zanele Motha',    email:'zanele@email.com',  role:'promoter', date:'2026-03-11', status:'pending',  city:'Johannesburg', phone:'+27 79 111 2222', source:'mock', details:{ gender:'Female', height:'1.70m', idNumber:'9801010001088', experience:'2 years brand activation' } },
  { id:'R002', name:'Musa Dube',       email:'musa@email.com',    role:'promoter', date:'2026-03-10', status:'pending',  city:'Cape Town',    phone:'+27 72 333 4444', source:'mock', details:{ gender:'Male',   height:'1.82m', idNumber:'9505050002083', experience:'1 year events' } },
  { id:'R003', name:'FreshBrands Ltd', email:'fresh@brands.co.za',role:'business', date:'2026-03-10', status:'pending',  city:'Durban',       phone:'+27 31 555 6666', source:'mock', details:{ regNumber:'2022/123456/07', industry:'FMCG', website:'freshbrands.co.za', contactPerson:'Jane Dlamini' } },
  { id:'R004', name:'Nomsa Zulu',      email:'nomsa@email.com',   role:'promoter', date:'2026-03-09', status:'approved', city:'Pretoria',     phone:'+27 83 777 8888', source:'mock', details:{ gender:'Female', height:'1.65m', idNumber:'0002020003081', experience:'3 years retail promotions' } },
  { id:'R005', name:'PromoNation',     email:'promo@nation.co.za',role:'business', date:'2026-03-08', status:'rejected', city:'Johannesburg', phone:'+27 11 999 0000', source:'mock', details:{ regNumber:'2019/654321/07', industry:'Events', website:'promonation.co.za', contactPerson:'Bob Smith' } },
  { id:'R006', name:'Bongani Khumalo', email:'bong@email.com',    role:'promoter', date:'2026-03-08', status:'approved', city:'Durban',       phone:'+27 61 222 3333', source:'mock', details:{ gender:'Male',   height:'1.78m', idNumber:'9811110004086', experience:'4 years field marketing' } },
]

const INITIAL_MOCK_CLIENTS = [
  { id:'C001', name:'RedBull South Africa',  contact:'James Mokoena',  email:'rb@redbull.co.za',     phone:'+27 11 555 0001', industry:'FMCG / Beverages',      city:'Johannesburg', registeredDate:'2024-01-12', activeSince:'2024-01', jobsRun:14, totalHours:312, status:'active',   budget:'R 48,000',  website:'redbull.com/za',     regNumber:'2005/098765/07', description:'Energy drink brand activation & sampling campaigns across Gauteng.' },
  { id:'C002', name:'Acme Corp',             contact:'Priya Nair',     email:'acme@corp.co.za',      phone:'+27 21 555 0002', industry:'Retail',                 city:'Cape Town',    registeredDate:'2023-06-03', activeSince:'2023-06', jobsRun:9,  totalHours:204, status:'active',   budget:'R 32,000',  website:'acmecorp.co.za',     regNumber:'2010/112233/07', description:'Multi-category retail promotions and in-store activations.' },
  { id:'C003', name:'FreshBrands Ltd',       contact:'Jane Dlamini',   email:'fresh@brands.co.za',   phone:'+27 31 555 6666', industry:'FMCG / Food',           city:'Durban',       registeredDate:'2025-11-20', activeSince:'2025-11', jobsRun:3,  totalHours:48,  status:'new',      budget:'R 8,400',   website:'freshbrands.co.za',  regNumber:'2022/123456/07', description:'New FMCG client specialising in health and wellness product launches.' },
  { id:'C004', name:'Castle Lager SA',       contact:'Sipho Mahlangu', email:'castle@sab.co.za',     phone:'+27 11 555 0004', industry:'FMCG / Beverages',      city:'Johannesburg', registeredDate:'2022-03-08', activeSince:'2022-03', jobsRun:28, totalHours:680, status:'active',   budget:'R 112,000', website:'castlelager.co.za',  regNumber:'1998/003344/07', description:'Beer brand activations, stadium events, and trade promotions nationwide.' },
  { id:'C005', name:'PromoNation',           contact:'Bob Smith',      email:'promo@nation.co.za',   phone:'+27 11 999 0000', industry:'Events & Entertainment', city:'Johannesburg', registeredDate:'2024-08-15', activeSince:'2024-08', jobsRun:2,  totalHours:16,  status:'inactive', budget:'R 2,800',   website:'promonation.co.za',  regNumber:'2019/654321/07', description:'Event production company with limited recent activity.' },
  { id:'C006', name:'Standard Bank Promos', contact:'Lerato Sithole', email:'promos@stdbank.co.za', phone:'+27 11 555 0006', industry:'Financial Services',     city:'Pretoria',     registeredDate:'2023-09-01', activeSince:'2023-09', jobsRun:7,  totalHours:168, status:'active',   budget:'R 29,400',  website:'standardbank.co.za', regNumber:'1969/017128/06', description:'Consumer banking product promotions and financial literacy activations.' },
  { id:'C007', name:"Nando's Marketing",    contact:'Thandi Khumalo', email:'mktg@nandos.co.za',    phone:'+27 11 555 0007', industry:'Quick Service Restaurant', city:'Johannesburg', registeredDate:'2025-02-10', activeSince:'2025-02', jobsRun:5, totalHours:88,  status:'active',   budget:'R 15,600',  website:'nandos.co.za',       regNumber:'1990/004499/07', description:'Brand activation and loyalty campaign promoters for restaurant launches.' },
  { id:'C008', name:'Vodacom Business',     contact:'Amahle Ndaba',   email:'biz@vodacom.co.za',    phone:'+27 11 555 0008', industry:'Telecoms',               city:'Midrand',      registeredDate:'2023-03-15', activeSince:'2023-03', jobsRun:11, totalHours:256, status:'active',   budget:'R 44,800',  website:'vodacom.co.za',       regNumber:'1993/003367/07', description:'Telco product launches, bundle promotions, and retail point-of-sale activations.' },
]

const INIT_MESSAGES = [
  { id:'M001', from:'RedBull SA',     fromRole:'business', to:'Admin',         subject:'Complaint: Promoter no-show',     body:'Ayanda Dlamini did not show up for the Sandton shift on March 8th. This is the second time.', date:'2026-03-11', read:false, type:'complaint', regardingName:'Ayanda Dlamini' },
  { id:'M002', from:'Ayanda Dlamini', fromRole:'promoter', to:'Admin',         subject:'Review: RedBull event was great', body:'The event at Sandton City was well organised. The client was professional.',                 date:'2026-03-10', read:true,  type:'review',    regardingName:'RedBull SA'      },
  { id:'M003', from:'FreshBrands',    fromRole:'business', to:'Admin',         subject:'Review: Excellent promoter team', body:'The promoters provided for our launch event were outstanding.',                             date:'2026-03-09', read:false, type:'review',    regardingName:'Lerato Mokoena'  },
  { id:'M004', from:'Thabo Nkosi',    fromRole:'promoter', to:'Admin',         subject:'Complaint: Client was rude',      body:'During the Castle Lager event the client was dismissive and unprofessional.',               date:'2026-03-09', read:true,  type:'complaint', regardingName:'SABMiller'       },
  { id:'M005', from:'Acme Corp',      fromRole:'business', to:'Sipho Mhlongo', subject:'Job opportunity',                 body:'We have an upcoming activation in Pretoria on March 20th. Would you be available?',         date:'2026-03-08', read:true,  type:'message',   regardingName:''                },
]

const ACTIVITY = [
  { time:'2m ago',  msg:'Ayanda Dlamini checked in at Sandton City',  type:'checkin' },
  { time:'8m ago',  msg:'New registration: Zanele Motha — Promoter',  type:'apply'   },
  { time:'14m ago', msg:'Job #JB-204 filled — 8/8 slots taken',       type:'job'     },
  { time:'22m ago', msg:'Sipho Mhlongo submitted ID document',         type:'doc'     },
  { time:'31m ago', msg:'Payroll batch calculated — R12,400',          type:'payment' },
  { time:'45m ago', msg:'Lerato Mokoena flagged late — Rosebank Mall', type:'flag'    },
]

const TYPE_CLR: Record<string,string> = { checkin:GL, apply:G3, job:G4, doc:G2, payment:GL, flag:'#8B5A1A' }

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, border }: { label:string; color:string; bg?:string; border?:string }) {
  return <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:FD, color, background:bg??statusBg(label), border:`1px solid ${border??statusBorder(label)}`, padding:'3px 10px', borderRadius:3 }}>{label}</span>
}

function Btn({ children, onClick, outline=false, small=false, color=G, disabled=false }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small?'6px 14px':'10px 22px',
      background: disabled?'rgba(255,255,255,0.05)': outline?'transparent':`linear-gradient(135deg,${color},${hex2rgba(color,0.8)})`,
      border:`1px solid ${disabled?BB:color}`, color:disabled?W28:outline?color:B,
      fontFamily:FD, fontSize:small?10:11, fontWeight:700, letterSpacing:'0.08em',
      cursor:disabled?'not-allowed':'pointer', textTransform:'uppercase' as const,
      transition:'all 0.2s', borderRadius:3,
      boxShadow:outline||disabled?'none':`0 2px 12px ${hex2rgba(color,0.35)}`,
    }}
      onMouseEnter={e=>{if(!disabled){e.currentTarget.style.opacity='0.82';e.currentTarget.style.transform='translateY(-1px)'}}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'}}
    >{children}</button>
  )
}

function FilterBtn({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  const safeColor = color.startsWith('#') ? color : GL
  return (
    <button onClick={onClick} style={{
      padding:'6px 16px', border:`1px solid ${active?safeColor:'rgba(212,136,10,0.22)'}`,
      cursor:'pointer', fontFamily:FD, fontSize:10, fontWeight:active?700:400,
      textTransform:'capitalize' as const, borderRadius:3,
      background:active?hex2rgba(safeColor,0.18):'transparent',
      color:active?safeColor:W55, transition:'all 0.18s',
    }}>{label}</button>
  )
}

function StatCard({ label, value, sub, color }: { label:string; value:any; sub?:string; color:string }) {
  return (
    <div style={{ background:'rgba(20,16,5,0.6)', padding:'24px 22px', position:'relative', overflow:'hidden', borderRadius:2, backdropFilter:'blur(4px)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},${hex2rgba(color,0.4)})` }} />
      <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:W55, marginBottom:10, fontFamily:FD }}>{label}</div>
      <div style={{ fontFamily:FD, fontSize:38, fontWeight:700, color:W, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color, marginTop:8, fontWeight:700, fontFamily:FD }}>{sub}</div>}
    </div>
  )
}

// ─── ADD CLIENT MODAL ─────────────────────────────────────────────────────────
function AddClientModal({ onClose, onSave }: { onClose: ()=>void; onSave: (c: any)=>void }) {
  const [step, setStep]     = useState<'info'|'specs'|'regs'>('info')
  const [form, setForm]     = useState({ name:'', contact:'', email:'', phone:'', city:'', website:'', regNumber:'', vatNumber:'', category:'', customCategory:'', description:'' })
  const [specs, setSpecs]   = useState<Record<string,string>>({})
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)

  const cat       = form.category === 'Other' ? (form.customCategory || 'Other') : form.category
  const specFields = CATEGORY_SPECS[cat] || DEFAULT_SPECS
  const regs       = CATEGORY_REGS[cat]  || CATEGORY_REGS['default']

  const F  = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const S  = (k: string, v: string) => setSpecs(p => ({ ...p, [k]: v }))

  const canProceedInfo = form.name && form.contact && form.email && form.phone && form.category

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      onSave({
        id: `C${Date.now().toString().slice(-5)}`,
        name: form.name, contact: form.contact, email: form.email,
        phone: form.phone, city: form.city || 'Not specified',
        website: form.website, regNumber: form.regNumber, vatNumber: form.vatNumber || null,
        industry: cat, description: form.description,
        registeredDate: new Date().toISOString().slice(0,10),
        activeSince: new Date().toISOString().slice(0,7),
        jobsRun: 0, totalHours: 0, status: 'new', budget: 'R 0',
        categorySpecs: specs, regulations: regs,
      })
      setSaving(false)
      onClose()
    }, 600)
  }

  const inp: React.CSSProperties = { width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'11px 16px', color:W, fontFamily:FD, fontSize:13, outline:'none', borderRadius:3 }
  const lbl: React.CSSProperties = { fontSize:9, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }

  const steps = [['info','01 · Business Info'],['specs','02 · Category Specs'],['regs','03 · Regulations']]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, width:'100%', maxWidth:620, maxHeight:'92vh', overflowY:'auto', position:'relative', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G5},${GL},${G})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>

        {/* Header */}
        <div style={{ padding:'32px 36px 20px' }}>
          <div style={{ fontSize:9, letterSpacing:'0.32em', textTransform:'uppercase', color:GL, marginBottom:6, fontWeight:700, fontFamily:FD }}>Client Onboarding</div>
          <h2 style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:20 }}>Add New Client</h2>

          {/* Step tabs */}
          <div style={{ display:'flex', gap:0, border:`1px solid ${BB}`, borderRadius:3, overflow:'hidden' }}>
            {steps.map(([id,label],i) => (
              <button key={id} onClick={() => step !== 'info' || id === 'info' ? setStep(id as any) : null}
                style={{ flex:1, padding:'10px 8px', background:step===id?hex2rgba(GL,0.14):'transparent', border:'none', borderRight:i<2?`1px solid ${BB}`:'none', color:step===id?GL:W55, fontFamily:FD, fontSize:10, fontWeight:step===id?700:400, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase', transition:'all 0.2s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'0 36px 36px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* ── STEP 1: Business Info ── */}
          {step === 'info' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  {k:'name',      l:'Company Name *',           ph:'Acme Promotions (Pty) Ltd'},
                  {k:'contact',   l:'Contact Person *',         ph:'Jane Smith'},
                  {k:'email',     l:'Business Email *',         ph:'jane@acme.co.za'},
                  {k:'phone',     l:'Business Phone *',         ph:'+27 11 000 0000'},
                  {k:'city',      l:'City',                     ph:'Johannesburg'},
                  {k:'website',   l:'Website',                  ph:'acme.co.za'},
                  {k:'regNumber', l:'CIPC Reg Number',          ph:'2024/000000/07'},
                  {k:'vatNumber', l:'VAT Number (optional)',    ph:'4410000000'},
                ].map(({k,l,ph}) => (
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input value={(form as any)[k]} onChange={e => F(k, e.target.value)} placeholder={ph}
                      style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  </div>
                ))}
              </div>

              <div>
                <label style={lbl}>Industry Category *</label>
                <select value={form.category} onChange={e => { F('category', e.target.value); setSpecs({}) }}
                  style={{ ...inp, background:D3, cursor:'pointer' }}>
                  <option value="">-- Select Category --</option>
                  {CLIENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {form.category === 'Other' && (
                <div>
                  <label style={lbl}>Specify Category</label>
                  <input value={form.customCategory} onChange={e => F('customCategory', e.target.value)}
                    placeholder="Describe the business category in detail"
                    style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                </div>
              )}

              <div>
                <label style={lbl}>Brief Company Description</label>
                <textarea value={form.description} onChange={e => F('description', e.target.value)} rows={3}
                  placeholder="Describe what this client does and the type of promotions they typically run..."
                  style={{ ...inp, resize:'vertical' as const }}
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>

              <Btn onClick={() => setStep('specs')} color={GL} disabled={!canProceedInfo}>
                {canProceedInfo ? 'Continue to Promoter Specs →' : 'Fill required fields to continue'}
              </Btn>
            </>
          )}

          {/* ── STEP 2: Category Specs ── */}
          {step === 'specs' && (
            <>
              <div style={{ padding:'12px 16px', background:hex2rgba(GL,0.06), border:`1px solid ${hex2rgba(GL,0.28)}`, borderRadius:3 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:GL, marginBottom:4, fontFamily:FD }}>
                  {cat} — Promoter Requirements
                </div>
                <p style={{ fontSize:12, color:W55, fontFamily:FD, lineHeight:1.6 }}>
                  These specs will be used for smart promoter matching and displayed on all job listings for this client.
                </p>
              </div>

              {specFields.map((f) => (
                <div key={f.key}>
                  <label style={lbl}>
                    {f.label}
                    {f.hint && <span style={{ color:W28, fontWeight:400, marginLeft:6, fontSize:9 }}>— {f.hint}</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select value={specs[f.key] || ''} onChange={e => S(f.key, e.target.value)}
                      style={{ ...inp, background:D3, cursor:'pointer' }}>
                      <option value="">Select...</option>
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type === 'number' ? 'number' : 'text'} value={specs[f.key] || ''} onChange={e => S(f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      style={inp} onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
                  )}
                </div>
              ))}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setStep('info')} style={{ flex:1, padding:'11px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:11, cursor:'pointer', borderRadius:3 }}>← Back</button>
                <Btn onClick={()=>setStep('regs')} color={GL}>Continue to Regulations →</Btn>
              </div>
            </>
          )}

          {/* ── STEP 3: Regulations ── */}
          {step === 'regs' && (
            <>
              <div style={{ padding:'16px 20px', background:hex2rgba(G2,0.12), border:`1px solid ${hex2rgba(G2,0.4)}`, borderRadius:3 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:GL, marginBottom:14, fontFamily:FD }}>
                  Platform Regulations & Compliance — {cat}
                </div>
                {regs.map((r, i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:12 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:GL, marginTop:5, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:W, lineHeight:1.7, fontFamily:FD }}>{r}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:'14px 18px', background:hex2rgba(GL,0.05), border:`1px solid ${hex2rgba(GL,0.22)}`, borderRadius:3 }}>
                <p style={{ fontSize:12, color:W55, lineHeight:1.75, fontFamily:FD }}>
                  By registering this client, Honey Group confirms that all promoter engagements for this account will comply with the Labour Relations Act, Basic Conditions of Employment Act, POPIA, and all category-specific legislation listed above.
                </p>
              </div>

              <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', padding:'14px 16px', background:BB2, border:`1px solid ${BB}`, borderRadius:3 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop:2, accentColor:GL, width:16, height:16, flexShrink:0 }} />
                <span style={{ fontSize:12, color:WM, lineHeight:1.6, fontFamily:FD }}>
                  I confirm that this client account complies with all regulations above, that the business details provided are accurate, and that I have authority to onboard this client onto the Honey Group platform.
                </span>
              </label>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setStep('specs')} style={{ flex:1, padding:'11px', background:'transparent', border:`1px solid ${BB}`, color:W55, fontFamily:FD, fontSize:11, cursor:'pointer', borderRadius:3 }}>← Back</button>
                <button onClick={handleSave} disabled={!agreed||saving}
                  style={{ flex:2, padding:'11px', background:agreed&&!saving?`linear-gradient(135deg,${GL},${G})`:'rgba(255,255,255,0.05)', border:`1px solid ${agreed&&!saving?GL:BB}`, color:agreed&&!saving?B:W28, fontFamily:FD, fontSize:11, fontWeight:700, letterSpacing:'0.1em', cursor:agreed&&!saving?'pointer':'not-allowed', borderRadius:3, transition:'all 0.2s' }}>
                  {saving ? 'Saving…' : agreed ? '✓ Save Client Account' : 'Accept Regulations to Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onApprove, onReject }: { item:any; onClose:()=>void; onApprove:()=>void; onReject:()=>void }) {
  const isPromoter = item.role === 'promoter'
  const pending    = isPending(item.status)
  const accent     = isPromoter ? G3 : GL
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:520, position:'relative', maxHeight:'90vh', overflowY:'auto', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${G5})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18, fontFamily:FD }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>{isPromoter?'Promoter Application':'Business Application'}</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:8 }}>{item.name}</div>
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <Badge label={item.status} color={statusColor(item.status)} bg={statusBg(item.status)} border={statusBorder(item.status)} />
          {item.source==='real' && <span style={{ fontSize:10, color:GL, fontWeight:700, fontFamily:FD }}>● Live</span>}
        </div>
        {[{label:'Email',value:item.email},{label:'Phone',value:item.phone},{label:'City',value:item.city},{label:'Applied',value:item.date}].map((r:any)=>(
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55, fontFamily:FD }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>{r.value}</span>
          </div>
        ))}
        <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, marginTop:20, marginBottom:12, fontWeight:700, fontFamily:FD }}>{isPromoter?'Promoter Profile':'Business Profile'}</div>
        {Object.entries(item.details).map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55, textTransform:'capitalize', fontFamily:FD }}>{k.replace(/([A-Z])/g,' $1')}</span>
            <span style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>{String(v)}</span>
          </div>
        ))}
        {pending && <div style={{ display:'flex', gap:12, marginTop:28 }}><Btn onClick={onApprove} color={C_ACTIVE}>✓ Approve</Btn><Btn onClick={onReject} color={G2} outline>✗ Reject</Btn></div>}
        {!pending && item.status==='approved' && <div style={{ marginTop:28, padding:'12px 16px', background:hex2rgba(C_ACTIVE,0.08), border:`1px solid ${hex2rgba(C_ACTIVE,0.35)}`, fontSize:12, color:GL, fontFamily:FD, borderRadius:3 }}>✓ This account has been approved.</div>}
        {!pending && item.status==='rejected' && <div style={{ marginTop:28, padding:'12px 16px', background:hex2rgba(G5,0.4), border:`1px solid ${hex2rgba(G2,0.35)}`, fontSize:12, color:C_REJECTED, fontFamily:FD, borderRadius:3 }}>✗ This account has been rejected.</div>}
      </div>
    </div>
  )
}

function MessageModal({ msg, onClose }: { msg:any; onClose:()=>void }) {
  const [reply, setReply] = useState('')
  const tcBright = (t:string) => t==='complaint'?G4:t==='review'?GL:G4
  const tc       = (t:string) => t==='complaint'?G5:t==='review'?G:G3
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:540, position:'relative', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${tc(msg.type)},${G5})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:tcBright(msg.type), marginBottom:8, fontFamily:FD, fontWeight:700 }}>{msg.type} · from {msg.fromRole}</div>
        <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:4 }}>{msg.subject}</div>
        <div style={{ fontSize:12, color:W55, marginBottom:24, fontFamily:FD }}>From: {msg.from} · {msg.date}</div>
        {msg.regardingName && <div style={{ padding:'8px 14px', background:hex2rgba(GL,0.06), border:`1px solid ${hex2rgba(GL,0.22)}`, marginBottom:20, fontSize:12, color:GL, fontFamily:FD }}>Regarding: <strong>{msg.regardingName}</strong></div>}
        <div style={{ fontSize:14, color:W, lineHeight:1.8, marginBottom:28, padding:16, background:BB2, border:`1px solid ${BB}`, fontFamily:FD }}>{msg.body}</div>
        <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Type your response..."
          style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FD, fontSize:13, resize:'none', outline:'none', marginBottom:14 }}
          onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
        <div style={{ display:'flex', gap:10 }}>
          <Btn onClick={onClose}>Send Reply</Btn>
          <Btn onClick={onClose} outline color={W55}>Close</Btn>
        </div>
      </div>
    </div>
  )
}

function ClientModal({ client, onClose }: { client:any; onClose:()=>void }) {
  const accent = statusColor(client.status)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:560, position:'relative', maxHeight:'90vh', overflowY:'auto', borderRadius:4 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${G5})` }} />
        <button onClick={onClose} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
        <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Client Profile</div>
        <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, marginBottom:6 }}>{client.name}</div>
        <div style={{ marginBottom:20, display:'flex', gap:8, flexWrap:'wrap' }}>
          <Badge label={client.status} color={accent} bg={statusBg(client.status)} border={statusBorder(client.status)} />
          <Badge label={client.industry} color={G3} bg={hex2rgba(G3,0.12)} border={hex2rgba(G3,0.38)} />
        </div>
        {client.description && <div style={{ padding:'12px 16px', background:BB2, border:`1px solid ${BB}`, marginBottom:20, fontSize:13, color:W85, lineHeight:1.6, borderRadius:3, fontFamily:FD }}>{client.description}</div>}
        {[
          {label:'Contact',value:client.contact},{label:'Email',value:client.email},{label:'Phone',value:client.phone},
          {label:'City',value:client.city},{label:'Website',value:client.website},{label:'Reg. Number',value:client.regNumber},
          {label:'Registered',value:client.registeredDate},{label:'Active Since',value:client.activeSince},
          {label:'Campaigns',value:`${client.jobsRun} campaigns`},{label:'Total Hours',value:`${client.totalHours} hrs`},
          {label:'Campaign Spend',value:client.budget},
        ].map((r:any)=>(
          <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${BB}` }}>
            <span style={{ fontSize:12, color:W55, fontFamily:FD }}>{r.label}</span>
            <span style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>{r.value}</span>
          </div>
        ))}
        {/* Category Specs */}
        {client.categorySpecs && Object.keys(client.categorySpecs).length > 0 && (
          <>
            <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:GL, marginTop:20, marginBottom:12, fontWeight:700, fontFamily:FD }}>Promoter Specs</div>
            {Object.entries(client.categorySpecs).map(([k,v]:any)=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${BB}` }}>
                <span style={{ fontSize:12, color:W55, textTransform:'capitalize', fontFamily:FD }}>{k}</span>
                <span style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>{String(v)}</span>
              </div>
            ))}
          </>
        )}
        <div style={{ marginTop:28, display:'flex', gap:12 }}>
          <Btn onClick={onClose}>Message Client</Btn>
          <Btn onClick={onClose} outline>View Jobs</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ regs, msgs, time, onRoute }: { regs:any[]; msgs:any[]; time:Date; onRoute:(id:string)=>void }) {
  const h = time.getHours()
  const greeting = h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night'
  const unread = msgs.filter(m=>!m.read).length
  const stats = [
    { label:'Active Promoters',  value:regs.filter(r=>r.role==='promoter'&&r.status==='approved').length, color:G3, sub:'registered' },
    { label:'Pending Approvals', value:regs.filter(r=>isPending(r.status)).length,                        color:GL, sub:'need review' },
    { label:'Unread Messages',   value:unread,                                                             color:G2, sub:'complaints & reviews' },
    { label:'Active Clients',    value:INITIAL_MOCK_CLIENTS.filter(c=>c.status==='active').length,        color:G4, sub:'business clients' },
  ]
  const quickActions = [
    {label:'Registrations',icon:'▣',id:'registrations',color:GL},{label:'Messages',icon:'◆',id:'messages',color:G3},
    {label:'Live Map',     icon:'⊙',id:'map',          color:G2},{label:'Clients', icon:'◉',id:'clients', color:GL},
    {label:'Jobs',         icon:'◎',id:'jobs',          color:G4},{label:'Reports', icon:'▤',id:'reports', color:G3},
  ]
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:36 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Admin Dashboard</div>
          <h1 style={{ fontFamily:FD, fontSize:32, fontWeight:700, color:W }}>{greeting}, Admin.</h1>
          <p style={{ fontSize:13, color:W55, marginTop:6, fontFamily:FD }}>Here's what's happening across the platform today.</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:FD, fontSize:26, color:GL }}>{time.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}</div>
          <div style={{ fontSize:11, color:W55, marginTop:4, fontFamily:FD }}>{time.toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:32 }}>
        {stats.map((s,i)=><StatCard key={i} label={s.label} value={s.value} sub={s.sub} color={s.color} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
        <div style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, marginBottom:18, fontWeight:700, fontFamily:FD }}>Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
            {quickActions.map(a=>(
              <button key={a.id} onClick={()=>onRoute(a.id)}
                style={{ padding:'16px 14px', background:D3, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s', fontFamily:FD }}
                onMouseEnter={e=>{e.currentTarget.style.background=GM;e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=D3;e.currentTarget.style.transform='translateY(0)'}}>
                <span style={{ fontSize:15, color:a.color }}>{a.icon}</span>
                <span style={{ fontSize:12, color:W, fontWeight:700, fontFamily:FD }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>Live Activity</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:GL }} />
              <span style={{ fontSize:10, color:W55, fontFamily:FD }}>Live</span>
            </div>
          </div>
          {ACTIVITY.map((a,i)=>(
            <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:i<ACTIVITY.length-1?`1px solid ${BB}`:'none' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:TYPE_CLR[a.type], marginTop:4, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:12, color:W, lineHeight:1.4, fontFamily:FD }}>{a.msg}</div>
                <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Registrations Tab ────────────────────────────────────────────────────────
function RegistrationsTab({ regs, onDetail, onApprove, onReject }: { regs:any[]; onDetail:(r:any)=>void; onApprove:(id:string)=>void; onReject:(id:string)=>void }) {
  const [statusF, setStatusF] = useState('all')
  const [roleF,   setRoleF  ] = useState('all')
  const [dateF,   setDateF  ] = useState('all')
  const pendingCount = regs.filter(r=>isPending(r.status)).length
  const liveCount    = regs.filter(r=>r.source==='real').length
  const dates = ['all',...Array.from(new Set(regs.map(r=>r.date).filter(Boolean)))]
  const filtered = regs.filter(r=>{
    const sm = statusF==='all'||r.status===statusF
    const rm = roleF==='all'||r.role===roleF
    const dm = dateF==='all'||r.date===dateF
    return sm&&rm&&dm
  })
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>People · Registrations</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Registrations</h1>
          <p style={{ fontSize:13, color:W55, marginTop:4, fontFamily:FD }}>Review and approve promoter and business applications.</p>
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:W55, fontFamily:FD }}>
          <div><span style={{ color:GL, fontWeight:700 }}>{pendingCount}</span> pending</div>
          {liveCount>0&&<div style={{ marginTop:4 }}><span style={{ color:G3, fontWeight:700 }}>● {liveCount}</span> live</div>}
        </div>
      </div>
      {regs.filter(r=>r.source==='real'&&isPending(r.status)).length>0&&(
        <div style={{ padding:'12px 18px', background:hex2rgba(GL,0.06), border:`1px solid ${hex2rgba(GL,0.32)}`, marginBottom:16, fontSize:12, color:GL, display:'flex', alignItems:'center', gap:8, borderRadius:3, fontFamily:FD }}>
          <span>⚠</span><span><strong>{regs.filter(r=>r.source==='real'&&isPending(r.status)).length}</strong> live registration{regs.filter(r=>r.source==='real'&&isPending(r.status)).length>1?'s':''} awaiting approval</span>
        </div>
      )}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:4 }}>
          {(['all','pending','approved','rejected'] as const).map(f=><FilterBtn key={f} label={f} active={statusF===f} color={f==='all'?GL:statusColor(f)} onClick={()=>setStatusF(f)} />)}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {(['all','promoter','business'] as const).map(f=><FilterBtn key={f} label={f} active={roleF===f} color={G3} onClick={()=>setRoleF(f)} />)}
        </div>
        <select value={dateF} onChange={e=>setDateF(e.target.value)} style={{ background:D2, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FD, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
          {dates.map(d=><option key={d} value={d}>{d==='all'?'All Dates':d}</option>)}
        </select>
      </div>
      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
            {['Name','Role','City','Date','Status','Source','Actions'].map(h=>(
              <th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FD }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((r,i)=>(
              <tr key={r.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.background=BB2)} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {r.source==='real'&&isPending(r.status)&&<div style={{ width:5, height:5, borderRadius:'50%', background:GL, flexShrink:0 }} />}
                    <div><div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{r.name}</div><div style={{ fontSize:11, color:W55, fontFamily:FD }}>{r.email}</div></div>
                  </div>
                </td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.role} color={r.role==='promoter'?G3:GL} bg={hex2rgba(r.role==='promoter'?G3:GL,0.12)} border={hex2rgba(r.role==='promoter'?G3:GL,0.38)} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD }}>{r.city}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD }}>{r.date}</td>
                <td style={{ padding:'14px 18px' }}><Badge label={r.status} color={statusColor(r.status)} bg={statusBg(r.status)} border={statusBorder(r.status)} /></td>
                <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10, fontWeight:700, color:r.source==='real'?GL:W28, fontFamily:FD }}>{r.source==='real'?'● Live':'○ Demo'}</span></td>
                <td style={{ padding:'14px 18px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={()=>onDetail(r)} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700 }}>View →</button>
                    {isPending(r.status)&&<>
                      <span style={{ color:W28 }}>·</span>
                      <button onClick={()=>onApprove(r.id)} style={{ fontSize:10, color:'#0A0A07', background:G3, border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'3px 9px', borderRadius:3 }}>Approve</button>
                      <button onClick={()=>onReject(r.id)} style={{ fontSize:10, color:C_REJECTED, background:hex2rgba(G5,0.35), border:`1px solid ${hex2rgba(G2,0.45)}`, cursor:'pointer', fontFamily:FD, fontWeight:700, padding:'3px 9px', borderRadius:3 }}>Reject</button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{ padding:40, textAlign:'center', color:W28, fontSize:13, fontFamily:FD }}>No registrations match your filters.</div>}
      </div>
    </div>
  )
}

// ─── Clients Tab ──────────────────────────────────────────────────────────────
function ClientsTab() {
  const [statusF,  setStatusF ] = useState('all')
  const [cityF,    setCityF   ] = useState('all')
  const [search,   setSearch  ] = useState('')
  const [viewing,  setViewing ] = useState<any>(null)
  const [sortBy,   setSortBy  ] = useState<'name'|'jobsRun'|'totalHours'|'registeredDate'>('registeredDate')
  const [clients,  setClients ] = useState<any[]>(INITIAL_MOCK_CLIENTS)
  const [addOpen,  setAddOpen ] = useState(false)   // ← ADD CLIENT STATE

  const cities = ['all',...Array.from(new Set(clients.map(c=>c.city))).sort()]

  const filtered = clients.filter(c=>{
    const sm = statusF==='all'||c.status===statusF
    const cm = cityF==='all'||c.city===cityF
    const qm = search===''||c.name.toLowerCase().includes(search.toLowerCase())||c.contact.toLowerCase().includes(search.toLowerCase())||c.email.toLowerCase().includes(search.toLowerCase())
    return sm&&cm&&qm
  }).sort((a:any,b:any)=>{
    if(sortBy==='jobsRun')        return b.jobsRun-a.jobsRun
    if(sortBy==='totalHours')     return b.totalHours-a.totalHours
    if(sortBy==='registeredDate') return b.registeredDate.localeCompare(a.registeredDate)
    return a.name.localeCompare(b.name)
  })

  const totalJobs   = clients.reduce((a,c)=>a+c.jobsRun,0)
  const totalHours  = clients.reduce((a,c)=>a+c.totalHours,0)
  const activeCount = clients.filter(c=>c.status==='active').length
  const newCount    = clients.filter(c=>c.status==='new').length

  const avatarAccents = [GL,G3,G4,G2,C_NEW,G3,GL,G2]
  const COLS = '28fr 20fr 18fr 12fr 8fr 12fr 8fr'

  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>People · Clients</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Client Accounts</h1>
          <p style={{ fontSize:13, color:W55, marginTop:4, fontFamily:FD }}>Businesses registered on the platform who book promoters.</p>
        </div>
        {/* ← WORKING ADD CLIENT BUTTON */}
        <Btn onClick={()=>setAddOpen(true)}>+ Add Client</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:BB, marginBottom:32 }}>
        {[
          {label:'Active Clients',   value:activeCount,       color:GL,    sub:`of ${clients.length} total`},
          {label:'New This Quarter', value:newCount,           color:C_NEW, sub:'recently joined'},
          {label:'Total Campaigns',  value:totalJobs,          color:G3,   sub:'across all clients'},
          {label:'Total Hours',      value:`${totalHours}h`,  color:G2,   sub:'promoter hours booked'},
        ].map((s,i)=><StatCard key={i} label={s.label} value={s.value} sub={s.sub} color={s.color} />)}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {(['all','active','new','inactive'] as const).map(f=><FilterBtn key={f} label={f} active={statusF===f} color={f==='all'?GL:statusColor(f)} onClick={()=>setStatusF(f)} />)}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={cityF} onChange={e=>setCityF(e.target.value)} style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 12px', color:W, fontFamily:FD, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
            {cities.map(c=><option key={c} value={c}>{c==='all'?'All Cities':c}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 12px', color:W, fontFamily:FD, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3 }}>
            <option value="registeredDate">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="jobsRun">Most Campaigns</option>
            <option value="totalHours">Most Hours</option>
          </select>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:W28, fontSize:12, pointerEvents:'none' }}>⌕</span>
            <input placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ background:D2, border:`1px solid ${BB}`, padding:'7px 14px 7px 30px', color:W, fontFamily:FD, fontSize:11, outline:'none', borderRadius:3, width:200 }}
              onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
          </div>
        </div>
      </div>

      <div style={{ borderRadius:4, overflow:'hidden', border:`1px solid ${BB}` }}>
        <div style={{ display:'grid', gridTemplateColumns:COLS, background:D1, padding:'11px 24px', gap:0 }}>
          {['Business','Contact','Industry / City','Registered','Jobs','Status',''].map(h=>(
            <div key={h} style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:W28, fontFamily:FD, paddingRight:12 }}>{h}</div>
          ))}
        </div>
        {filtered.length===0&&<div style={{ padding:'48px 24px', textAlign:'center', color:W28, fontSize:13, background:D2, fontFamily:FD }}>No clients match your filters.</div>}
        {filtered.map((c,i)=>{
          const accent = avatarAccents[i%avatarAccents.length]
          return (
            <div key={c.id} onClick={()=>setViewing(c)}
              style={{ display:'grid', gridTemplateColumns:COLS, background:i%2===0?D2:D3, padding:'20px 24px', gap:0, alignItems:'center', cursor:'pointer', transition:'background 0.16s', borderTop:`1px solid ${BB}` }}
              onMouseEnter={e=>(e.currentTarget.style.background=GM)}
              onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?D2:D3)}>
              <div style={{ display:'flex', alignItems:'center', gap:12, paddingRight:16, minWidth:0 }}>
                <div style={{ width:40, height:40, borderRadius:8, flexShrink:0, background:`linear-gradient(145deg,${G5}CC,${hex2rgba(accent,0.28)})`, border:`1px solid ${hex2rgba(accent,0.32)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:accent, fontFamily:FD }}>{c.name.charAt(0)}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:W, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:FD }}>{c.name}</div>
                  <div style={{ fontSize:10.5, color:W28, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontFamily:FD }}>{c.email}</div>
                </div>
              </div>
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:12, color:W85, fontWeight:600, fontFamily:FD }}>{c.contact}</div>
                <div style={{ fontSize:10.5, color:W28, marginTop:2, fontFamily:FD }}>{c.phone}</div>
              </div>
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:10.5, color:GL, fontWeight:700, marginBottom:3, fontFamily:FD }}>{c.industry}</div>
                <div style={{ fontSize:11, color:W55, fontFamily:FD }}>{c.city}</div>
              </div>
              <div style={{ paddingRight:16 }}>
                <div style={{ fontSize:11, color:W55, fontFamily:FD }}>{c.registeredDate}</div>
                <div style={{ fontSize:10, color:W28, marginTop:2, fontFamily:FD }}>since {c.activeSince}</div>
              </div>
              <div style={{ paddingRight:16 }}>
                <div style={{ fontFamily:FD, fontSize:24, fontWeight:700, color:W, lineHeight:1 }}>{c.jobsRun}</div>
                <div style={{ fontSize:10, color:W28, marginTop:3, fontFamily:FD }}>{c.totalHours}h</div>
              </div>
              <div style={{ paddingRight:12 }}><Badge label={c.status} color={statusColor(c.status)} bg={statusBg(c.status)} border={statusBorder(c.status)} /></div>
              <div>
                <button onClick={e=>{e.stopPropagation();setViewing(c)}} style={{ fontSize:11, color:GL, background:'none', border:'none', cursor:'pointer', fontFamily:FD, fontWeight:700, padding:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color=W} onMouseLeave={e=>e.currentTarget.style.color=GL}>View →</button>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:12, fontSize:11, color:W28, fontFamily:FD }}>
        Showing <strong style={{ color:W55 }}>{filtered.length}</strong> of <strong style={{ color:W55 }}>{clients.length}</strong> clients
      </div>

      {viewing  && <ClientModal client={viewing} onClose={()=>setViewing(null)} />}
      {/* ← WORKING ADD CLIENT MODAL */}
      {addOpen  && <AddClientModal onClose={()=>setAddOpen(false)} onSave={c=>setClients(prev=>[c,...prev])} />}
    </div>
  )
}

// ─── Logins Tab ───────────────────────────────────────────────────────────────
function LoginsTab() {
  const [roleF, setRoleF] = useState('all')
  const [dateF, setDateF] = useState('all')
  const dates = ['all',...Array.from(new Set(MOCK_LOGINS.map(l=>l.time.slice(0,10))))]
  const filtered = MOCK_LOGINS.filter(l=>{
    const rm = roleF==='all'||l.role===roleF
    const dm = dateF==='all'||l.time.startsWith(dateF)
    return rm&&dm
  })
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Comms · Activity</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Login Activity</h1>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:BB, marginBottom:24 }}>
        {[
          {label:'Logins Today',value:MOCK_LOGINS.filter(l=>l.time.startsWith('2026-03-11')).length,color:GL},
          {label:'Promoters',   value:MOCK_LOGINS.filter(l=>l.role==='promoter').length,            color:G3},
          {label:'Businesses',  value:MOCK_LOGINS.filter(l=>l.role==='business').length,            color:G2},
        ].map((s,i)=><StatCard key={i} label={s.label} value={s.value} color={s.color} />)}
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:16, alignItems:'center' }}>
        {(['all','promoter','business'] as const).map(f=><FilterBtn key={f} label={f} active={roleF===f} color={G3} onClick={()=>setRoleF(f)} />)}
        <select value={dateF} onChange={e=>setDateF(e.target.value)} style={{ background:D2, border:`1px solid ${BB}`, padding:'6px 12px', color:W, fontFamily:FD, fontSize:10, outline:'none', cursor:'pointer', borderRadius:3, marginLeft:6 }}>
          {dates.map(d=><option key={d} value={d}>{d==='all'?'All Dates':d}</option>)}
        </select>
      </div>
      <div style={{ background:D2, border:`1px solid ${BB}`, borderRadius:4 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:`1px solid ${BB}`, background:D1 }}>
            {['User','Role','Time','IP Address'].map(h=><th key={h} style={{ padding:'12px 18px', textAlign:'left', fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:W28, fontFamily:FD }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((l,i)=>(
              <tr key={l.id} style={{ borderBottom:i<filtered.length-1?`1px solid ${BB}`:'none', transition:'background 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.background=BB2)} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <td style={{ padding:'14px 18px' }}><div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{l.name}</div><div style={{ fontSize:11, color:W55, fontFamily:FD }}>{l.email}</div></td>
                <td style={{ padding:'14px 18px' }}><Badge label={l.role} color={l.role==='promoter'?G3:GL} bg={hex2rgba(l.role==='promoter'?G3:GL,0.12)} border={hex2rgba(l.role==='promoter'?G3:GL,0.38)} /></td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W55, fontFamily:FD }}>{new Date(l.time).toLocaleString('en-ZA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                <td style={{ padding:'14px 18px', fontSize:12, color:W28, fontFamily:MONO }}>{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────
function MessagesTab({ msgs, setMsgs }: { msgs:any[]; setMsgs:(fn:(p:any[])=>any[])=>void }) {
  const [filter,  setFilter ] = useState('all')
  const [compose, setCompose] = useState(false)
  const [viewing, setViewing] = useState<any>(null)
  const [to,      setTo     ] = useState('')
  const [subject, setSubject] = useState('')
  const [body,    setBody   ] = useState('')
  const filtered = msgs.filter(m=>filter==='all'||m.type===filter)
  const tcBright = (t:string) => t==='complaint'?G4:t==='review'?GL:G4
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>Comms · Messages</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Messages & Complaints</h1>
        </div>
        <Btn onClick={()=>setCompose(true)}>+ Compose</Btn>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:20 }}>
        {(['all','complaint','review','message'] as const).map(f=>(
          <FilterBtn key={f} label={f==='all'?`All (${msgs.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${msgs.filter(m=>m.type===f).length})`} active={filter===f} color={f==='all'?GL:tcBright(f)} onClick={()=>setFilter(f)} />
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {filtered.map(m=>(
          <div key={m.id} onClick={()=>{setViewing(m);setMsgs(p=>p.map(x=>x.id===m.id?{...x,read:true}:x))}}
            style={{ background:m.read?D2:D3, border:`1px solid ${m.read?BB:hex2rgba(GL,0.22)}`, padding:'18px 22px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, transition:'all 0.18s', borderRadius:3 }}
            onMouseEnter={e=>(e.currentTarget.style.background=GM)} onMouseLeave={e=>(e.currentTarget.style.background=m.read?D2:D3)}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:tcBright(m.type), marginTop:5, flexShrink:0 }} />
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{m.subject}</span>
                  {!m.read&&<span style={{ fontSize:8, fontWeight:700, background:`linear-gradient(135deg,${GL},${G})`, color:B, padding:'2px 7px', borderRadius:2, fontFamily:FD }}>NEW</span>}
                </div>
                <div style={{ fontSize:12, color:W55, fontFamily:FD }}>From: <strong style={{ color:W85 }}>{m.from}</strong> · {m.date}</div>
              </div>
            </div>
            <Badge label={m.type} color={tcBright(m.type)} bg={hex2rgba(tcBright(m.type),0.12)} border={hex2rgba(tcBright(m.type),0.38)} />
          </div>
        ))}
      </div>
      {viewing&&<MessageModal msg={viewing} onClose={()=>setViewing(null)} />}
      {compose&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setCompose(false)}>
          <div style={{ background:D2, border:`1px solid ${BB}`, padding:'44px', width:'100%', maxWidth:500, position:'relative', borderRadius:4 }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${GL},${G5})` }} />
            <button onClick={()=>setCompose(false)} style={{ position:'absolute', top:16, right:20, background:'none', border:'none', cursor:'pointer', color:W28, fontSize:18 }}>✕</button>
            <div style={{ fontFamily:FD, fontSize:22, fontWeight:700, color:W, marginBottom:24 }}>New Message</div>
            {[{label:'To',val:to,set:setTo,ph:'Recipient'},{label:'Subject',val:subject,set:setSubject,ph:'Subject'}].map(f=>(
              <div key={f.label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:W55, display:'block', marginBottom:7, fontFamily:FD }}>{f.label}</label>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FD, fontSize:13, outline:'none', borderRadius:3 }}
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>
            ))}
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} placeholder="Message..."
              style={{ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'12px 14px', color:W, fontFamily:FD, fontSize:13, resize:'none', outline:'none', marginBottom:16, borderRadius:3 }}
              onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            <div style={{ display:'flex', gap:10 }}>
              <Btn onClick={()=>{setMsgs(p=>[{id:`M${p.length+1}`,from:'Admin',fromRole:'admin',to,subject,body,date:new Date().toISOString().slice(0,10),read:true,type:'message',regardingName:''},...p]);setCompose(false);setTo('');setSubject('');setBody('')}}>Send</Btn>
              <Btn onClick={()=>setCompose(false)} outline color={W55}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ regs }: { regs:any[] }) {
  const [exportMsg,  setExportMsg ] = useState('')
  const [hourlyRate, setHourlyRate] = useState('120')
  const [hours,      setHours     ] = useState('8')
  const [numPromos,  setNumPromos ] = useState('6')
  const doExport = (t:string)=>{ setExportMsg(`${t} export initiated.`); setTimeout(()=>setExportMsg(''),3000) }
  const calcTotal = parseFloat(hourlyRate||'0')*parseFloat(hours||'0')*parseFloat(numPromos||'0')
  const cards = [
    {icon:'✦',color:G3,title:'Campaign Reports',   desc:'Automated PDF reports on campaign attendance for client delivery.',           btns:[['PDF','Campaign PDF'],['CSV','Campaign CSV']]},
    {icon:'▤',color:G2,title:'Promoter Roster',    desc:'Export of all active promoters with contact details and performance scores.', btns:[['CSV','Roster CSV'],['Excel','Roster Excel']]},
    {icon:'⬡',color:GL,title:'Attendance Log',     desc:'Geo-verified check-in/out records with timestamps for all shifts.',           btns:[['CSV','Attendance CSV'],['PDF','Attendance PDF']]},
    {icon:'◉',color:G4,title:'Promoter Payout',    desc:'Calculated payout amounts per promoter per campaign — for promoters only.',   btns:[['CSV','Payout CSV'],['Excel','Payout Excel']]},
  ]
  const summary = [
    {label:'Registered Promoters',       value:regs.filter(r=>r.role==='promoter').length},
    {label:'Active Promoters',           value:regs.filter(r=>r.role==='promoter'&&r.status==='approved').length},
    {label:'Active Clients',             value:INITIAL_MOCK_CLIENTS.filter(c=>c.status==='active').length},
    {label:'Pending Approvals',          value:regs.filter(r=>isPending(r.status)).length},
    {label:'Shifts This Month',          value:42},
    {label:'Est. Promoter Payout (Month)', value:'R 84,200'},
  ]
  const inputStyle:React.CSSProperties={ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FD, fontSize:13, outline:'none', borderRadius:3 }
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>System · Reporting</div>
        <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Reports & Exports</h1>
      </div>
      {exportMsg&&<div style={{ padding:'12px 18px', background:hex2rgba(GL,0.08), border:`1px solid ${hex2rgba(GL,0.35)}`, marginBottom:20, fontSize:13, color:GL, fontWeight:700, borderRadius:3, fontFamily:FD }}>✓ {exportMsg}</div>}
      <div style={{ background:'rgba(20,16,5,0.6)', border:`1px solid ${BB}`, padding:28, marginBottom:20, borderRadius:4 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <span style={{ fontSize:18, color:GL }}>◈</span>
          <div style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>Promoter Payout Calculator</div>
          <span style={{ fontSize:9, color:W28, marginLeft:8, padding:'2px 8px', border:`1px solid ${BB}`, letterSpacing:'0.1em', borderRadius:3, fontFamily:FD }}>Estimate only · Promoters</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, alignItems:'flex-end' }}>
          {[{label:'Hourly Rate (R)',val:hourlyRate,set:setHourlyRate},{label:'Hours per Shift',val:hours,set:setHours},{label:'No. of Promoters',val:numPromos,set:setNumPromos}].map(f=>(
            <div key={f.label}>
              <label style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:W55, display:'block', marginBottom:8, fontFamily:FD }}>{f.label}</label>
              <input type="number" value={f.val} onChange={e=>f.set(e.target.value)} style={inputStyle}
                onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
            </div>
          ))}
          <div style={{ background:hex2rgba(G5,0.5), border:`1px solid ${hex2rgba(GL,0.32)}`, padding:'10px 16px', borderRadius:3 }}>
            <div style={{ fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:W55, marginBottom:6, fontFamily:FD }}>Total Payout</div>
            <div style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:GL }}>R {calcTotal.toLocaleString('en-ZA',{minimumFractionDigits:0})}</div>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB, marginBottom:20 }}>
        {cards.map((c,i)=>(
          <div key={i} style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:18, color:c.color }}>{c.icon}</span>
              <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>{c.title}</div>
            </div>
            <p style={{ fontSize:13, color:W55, marginBottom:18, lineHeight:1.6, fontFamily:FD }}>{c.desc}</p>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={()=>doExport(c.btns[0][1])} small>{c.btns[0][0]}</Btn>
              <Btn onClick={()=>doExport(c.btns[1][1])} small outline>{c.btns[1][0]}</Btn>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(20,16,5,0.6)', border:`1px solid ${BB}`, borderRadius:4 }}>
        <div style={{ padding:'14px 22px', borderBottom:`1px solid ${BB}`, fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:GL, fontWeight:700, fontFamily:FD }}>Platform Summary</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <tbody>
            {summary.map((row,i)=>(
              <tr key={i} style={{ borderBottom:i<summary.length-1?`1px solid ${BB}`:'none', transition:'background 0.18s' }}
                onMouseEnter={e=>(e.currentTarget.style.background=BB2)} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <td style={{ padding:'14px 22px', fontSize:13, color:W55, fontFamily:FD }}>{row.label}</td>
                <td style={{ padding:'14px 22px', fontSize:14, fontWeight:700, color:GL, textAlign:'right', fontFamily:FD }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [saved,    setSaved   ] = useState(false)
  const [platName, setPlatName] = useState('Honey Group Promotions')
  const [email,    setEmail   ] = useState('admin@honeygroup.co.za')
  const [otp,      setOtp     ] = useState("Africa's Talking")
  const [payment,  setPayment ] = useState('Paystack')
  const [geoR,     setGeoR    ] = useState('5')
  const [jobR,     setJobR    ] = useState('20')
  const [notifs,   setNotifs  ] = useState(true)
  const [popia,    setPopia   ] = useState(true)
  const [maint,    setMaint   ] = useState(false)
  const save = ()=>{ setSaved(true); setTimeout(()=>setSaved(false),3000) }
  const inputStyle:React.CSSProperties={ width:'100%', background:BB2, border:`1px solid ${BB}`, padding:'10px 14px', color:W, fontFamily:FD, fontSize:13, outline:'none', borderRadius:3 }
  const labelStyle:React.CSSProperties={ fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase' as const, color:W55, display:'block', marginBottom:7, fontFamily:FD }
  const Toggle = ({ val, set }: { val:boolean; set:(v:boolean)=>void })=>(
    <div onClick={()=>set(!val)} style={{ width:40, height:22, borderRadius:11, background:val?`linear-gradient(135deg,${GL},${G})`:'rgba(42,34,16,0.8)', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0, border:`1px solid ${val?G:BB}` }}>
      <div style={{ position:'absolute', top:3, left:val?19:3, width:14, height:14, borderRadius:'50%', background:val?B:W55, transition:'left 0.25s' }} />
    </div>
  )
  return (
    <div style={{ padding:'40px 48px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', color:GL, marginBottom:8, fontWeight:700, fontFamily:FD }}>System · Config</div>
          <h1 style={{ fontFamily:FD, fontSize:28, fontWeight:700, color:W }}>Platform Settings</h1>
        </div>
        <Btn onClick={save}>{saved?'✓ Saved':'Save Changes'}</Btn>
      </div>
      {saved&&<div style={{ padding:'12px 18px', background:hex2rgba(G3,0.1), border:`1px solid ${hex2rgba(G3,0.35)}`, marginBottom:20, fontSize:13, color:GL, fontWeight:700, borderRadius:3, fontFamily:FD }}>✓ Settings saved successfully.</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:BB }}>
        {[
          {title:'General',fields:[{label:'Platform Name',value:platName,set:setPlatName,type:'text'},{label:'Support Email',value:email,set:setEmail,type:'email'}]},
          {title:'Geo & Radius',fields:[{label:'Check-in Radius (m)',value:geoR,set:setGeoR,type:'number'},{label:'Job Notification Radius (km)',value:jobR,set:setJobR,type:'number'}]},
        ].map(section=>(
          <div key={section.title} style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
            <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700, fontFamily:FD }}>{section.title}</div>
            {section.fields.map((f,i)=>(
              <div key={f.label} style={{ marginBottom:i<section.fields.length-1?18:0 }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e=>f.set(e.target.value)} style={inputStyle}
                  onFocus={e=>e.currentTarget.style.borderColor=GL} onBlur={e=>e.currentTarget.style.borderColor=BB} />
              </div>
            ))}
          </div>
        ))}
        <div style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700, fontFamily:FD }}>Integrations</div>
          <div style={{ marginBottom:18 }}>
            <label style={labelStyle}>OTP Provider</label>
            <select value={otp} onChange={e=>setOtp(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
              {["Africa's Talking",'Clickatell','Twilio'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment Reference Gateway</label>
            <select value={payment} onChange={e=>setPayment(e.target.value)} style={{ ...inputStyle, background:D3, cursor:'pointer' }}>
              {['Paystack Reference','PayFast Reference','Manual EFT'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background:'rgba(20,16,5,0.6)', padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:GL, marginBottom:20, fontWeight:700, fontFamily:FD }}>Feature Flags</div>
          {[
            {label:'Push Notifications',desc:'Send job alerts to promoters',val:notifs,set:setNotifs},
            {label:'POPIA Compliance',  desc:'Enforce data protection',     val:popia, set:setPopia },
            {label:'Maintenance Mode',  desc:'Block non-admin access',      val:maint, set:setMaint },
          ].map(row=>(
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${BB}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:W, fontFamily:FD }}>{row.label}</div>
                <div style={{ fontSize:11, color:W28, marginTop:2, fontFamily:FD }}>{row.desc}</div>
              </div>
              <Toggle val={row.val} set={row.set} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'dashboard'
  const [time,       setTime  ] = useState(new Date())
  const [regs,       setRegs  ] = useState<any[]>([])
  const [msgs,       setMsgs  ] = useState<any[]>(INIT_MESSAGES)
  const [detailItem, setDetail] = useState<any>(null)

  useEffect(()=>{
    const real = loadRealRegistrations()
    const realEmails = new Set(real.map((r:any)=>r.email))
    setRegs([...real,...MOCK_REGISTRATIONS.filter(m=>!realEmails.has(m.email))])
  },[])

  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date()),1000)
    return ()=>clearInterval(t)
  },[])

  const handleRoute = (id:string)=>{
    const external:Record<string,string> = {users:'/admin/users',jobs:'/admin/jobs',map:'/admin/map',payments:'/admin/payments',onboarding:'/admin/onboarding'}
    if(external[id]){ navigate(external[id]); return }
    navigate('/admin?tab='+id)
  }

  const updateStatus = (id:string, status:'approved'|'rejected')=>{
    setRegs(p=>p.map(r=>{
      if(r.id!==id) return r
      if(r.source==='real'){
        try{ const u:any[]=JSON.parse(localStorage.getItem('hg_users')||'[]'); localStorage.setItem('hg_users',JSON.stringify(u.map((x:any)=>x.email===r.email?{...x,status}:x))) }catch{}
      }
      return{...r,status}
    }))
    setDetail(null)
  }

  return (
    <AdminLayout>
      {tab==='dashboard'     && <DashboardTab     regs={regs} msgs={msgs} time={time} onRoute={handleRoute} />}
      {tab==='registrations' && <RegistrationsTab regs={regs} onDetail={setDetail} onApprove={id=>updateStatus(id,'approved')} onReject={id=>updateStatus(id,'rejected')} />}
      {tab==='clients'       && <ClientsTab />}
      {tab==='logins'        && <LoginsTab />}
      {tab==='messages'      && <AdminChatTab />}
      {tab==='reports'       && <ReportsTab regs={regs} />}
      {tab==='settings'      && <SettingsTab />}
      {detailItem && <DetailModal item={detailItem} onClose={()=>setDetail(null)} onApprove={()=>updateStatus(detailItem.id,'approved')} onReject={()=>updateStatus(detailItem.id,'rejected')} />}
    </AdminLayout>
  )
}