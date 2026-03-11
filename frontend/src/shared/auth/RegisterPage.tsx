import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── DESIGN TOKENS (mirrored from LandingPage) ──────────────── */
const BLACK        = '#080808'
const BLACK_SOFT   = '#0e0e0e'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(255,255,255,0.07)'
const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const WHITE_DIM    = 'rgba(244,239,230,0.22)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

type Role = 'promoter' | 'business'

/* ─── SA VALIDATION HELPERS ─────────────────────────────────── */
const validateSAID = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false
  // Luhn check
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let n = parseInt(id[i])
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9 }
    sum += n
  }
  return sum % 10 === 0
}

const validateSAPhone = (phone: string): boolean =>
  /^(\+27|0)[6-8][0-9]{8}$/.test(phone.replace(/\s/g, ''))

const formatSAPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('27') && digits.length >= 2) {
    const local = digits.slice(2)
    if (local.length <= 2) return `+27 ${local}`
    if (local.length <= 5) return `+27 ${local.slice(0, 2)} ${local.slice(2)}`
    if (local.length <= 9) return `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
    return `+27 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`
  }
  return raw
}

const validateCIPC = (reg: string): boolean =>
  /^\d{4}\/\d{6}\/\d{2}$/.test(reg)

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validatePassword = (pw: string): {
  length: boolean; upper: boolean; lower: boolean; digit: boolean; special: boolean
} => ({
  length:  pw.length >= 8,
  upper:   /[A-Z]/.test(pw),
  lower:   /[a-z]/.test(pw),
  digit:   /[0-9]/.test(pw),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
})

/* ─── FILE-TO-BASE64 ─────────────────────────────────────────── */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res(r.result as string)
    r.onerror = () => rej(new Error('File read failed'))
    r.readAsDataURL(file)
  })

/* ─── FIELD INPUT ─────────────────────────────────────────────── */
function Field({
  label, type = 'text', placeholder, value, onChange,
  focused, onFocus, onBlur, error, hint,
}: {
  label: string; type?: string; placeholder: string; value: string
  onChange: (v: string) => void; focused: boolean
  onFocus: () => void; onBlur: () => void
  error?: string | null; hint?: string
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: FB, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: focused ? GOLD : WHITE_MUTED,
        marginBottom: 8, transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${error ? '#ff6b6b66' : focused ? GOLD : BLACK_BORDER}`,
          padding: '13px 16px',
          fontFamily: FB, fontSize: 14, color: WHITE,
          outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 3px ${GOLD}10` : 'none',
        }}
      />
      {error && <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b', marginTop: 5 }}>{error}</p>}
      {hint && !error && <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

/* ─── FILE UPLOAD ZONE ───────────────────────────────────────── */
function FileUploadZone({
  label, accept, file, onChange, hint, required,
}: {
  label: string; accept: string; file: File | null
  onChange: (f: File) => void; hint?: string; required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onChange(f)
  }

  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: FB, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: WHITE_MUTED, marginBottom: 8,
      }}>
        {label}
        {required && <span style={{ color: GOLD, fontSize: 12 }}>*</span>}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: `1px dashed ${dragging ? GOLD : file ? `${GOLD}55` : BLACK_BORDER}`,
          background: dragging ? 'rgba(196,151,58,0.06)' : file ? 'rgba(196,151,58,0.04)' : 'rgba(255,255,255,0.02)',
          padding: '22px 20px',
          cursor: 'pointer', transition: 'all 0.25s', textAlign: 'center',
        }}
      >
        <input
          ref={inputRef} type="file" accept={accept}
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: 20, marginBottom: 6 }}>
              {file.type.startsWith('image/') ? '🖼️' : '📄'}
            </div>
            <p style={{ fontFamily: FB, fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 2 }}>
              {file.name}
            </p>
            <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM }}>
              {(file.size / 1024).toFixed(0)} KB · Click to replace
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 22, marginBottom: 8, color: WHITE_DIM }}>↑</div>
            <p style={{ fontFamily: FB, fontSize: 13, color: WHITE_MUTED, marginBottom: 4 }}>
              Drop file here or <span style={{ color: GOLD }}>browse</span>
            </p>
            {hint && <p style={{ fontFamily: FB, fontSize: 11, color: WHITE_DIM }}>{hint}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── IMAGE UPLOAD (ID photos) ───────────────────────────────── */
function IDPhotoUpload({
  label, file, onChange,
}: {
  label: string; file: File | null; onChange: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (f: File) => {
    onChange(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: FB, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: WHITE_MUTED, marginBottom: 8,
      }}>
        {label} <span style={{ color: GOLD, fontSize: 12 }}>*</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed ${file ? `${GOLD}55` : BLACK_BORDER}`,
          background: file ? 'rgba(196,151,58,0.04)' : 'rgba(255,255,255,0.02)',
          cursor: 'pointer', transition: 'all 0.25s',
          overflow: 'hidden', position: 'relative',
          height: preview ? 'auto' : 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        {preview ? (
          <div style={{ width: '100%' }}>
            <img src={preview} alt={label} style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }} />
            <div style={{ padding: '8px 12px', background: 'rgba(196,151,58,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FB, fontSize: 11, color: GOLD }}>✓ {file?.name}</span>
              <span style={{ fontFamily: FB, fontSize: 10, color: WHITE_DIM }}>Click to replace</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
            <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED, marginBottom: 2 }}>
              Upload <span style={{ color: GOLD }}>photo</span>
            </p>
            <p style={{ fontFamily: FB, fontSize: 10, color: WHITE_DIM }}>JPG, PNG or WEBP · Max 5 MB</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── PASSWORD STRENGTH ───────────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const rules = validatePassword(password)
  const items = [
    { key: 'length',  label: 'At least 8 characters' },
    { key: 'upper',   label: 'Uppercase letter' },
    { key: 'lower',   label: 'Lowercase letter' },
    { key: 'digit',   label: 'Number' },
    { key: 'special', label: 'Special character' },
  ]
  if (!password) return null
  const score = Object.values(rules).filter(Boolean).length
  const barColor = score <= 2 ? '#ff6b6b' : score <= 3 ? '#f0a500' : GOLD

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3,
            background: i <= score ? barColor : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        {items.map(item => (
          <span key={item.key} style={{
            fontFamily: FB, fontSize: 10,
            color: rules[item.key as keyof typeof rules] ? GOLD : WHITE_DIM,
            transition: 'color 0.2s',
          }}>
            {rules[item.key as keyof typeof rules] ? '✓' : '○'} {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── SECTION DIVIDER ─────────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: BLACK_BORDER }} />
      <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: BLACK_BORDER }} />
    </div>
  )
}

/* ─── STEP INDICATOR ─────────────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 3, flex: 1,
          background: i < current ? GOLD : i === current ? `${GOLD}60` : 'rgba(255,255,255,0.08)',
          transition: 'background 0.4s',
        }} />
      ))}
    </div>
  )
}

/* ─── MAIN REGISTER PAGE ─────────────────────────────────────── */
export default function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('promoter')
  const [step, setStep] = useState(0) // 0 = personal, 1 = documents, 2 = account
  const [focused, setFocused] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  /* ── Promoter fields ── */
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [idNumber,     setIdNumber]     = useState('')
  const [address,      setAddress]      = useState('')
  const [bankName,     setBankName]     = useState('')
  const [accountNo,    setAccountNo]    = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPw,    setConfirmPw]    = useState('')

  /* ── Business fields ── */
  const [companyName,  setCompanyName]  = useState('')
  const [contactName,  setContactName]  = useState('')
  const [bizPhone,     setBizPhone]     = useState('')
  const [regNumber,    setRegNumber]    = useState('')
  const [vatNumber,    setVatNumber]    = useState('')
  const [bizAddress,   setBizAddress]   = useState('')
  const [bizEmail,     setBizEmail]     = useState('')
  const [bizPassword,  setBizPassword]  = useState('')
  const [bizConfirmPw, setBizConfirmPw] = useState('')

  /* ── Files ── */
  const [idFrontFile,  setIdFrontFile]  = useState<File | null>(null)
  const [idBackFile,   setIdBackFile]   = useState<File | null>(null)
  const [bankProof,    setBankProof]    = useState<File | null>(null)
  const [cipcDoc,      setCipcDoc]      = useState<File | null>(null)
  const [taxPin,       setTaxPin]       = useState<File | null>(null)
  const [bizBankProof, setBizBankProof] = useState<File | null>(null)

  const isPromoter = role === 'promoter'
  const TOTAL_STEPS = 3

  /* ── Validation per step ── */
  const validateStep = (): boolean => {
    const errs: Record<string, string> = {}

    if (isPromoter) {
      if (step === 0) {
        if (!firstName.trim()) errs.firstName = 'Required'
        if (!lastName.trim())  errs.lastName  = 'Required'
        if (!validateSAPhone(phone)) errs.phone = 'Enter a valid SA phone number e.g. +27 71 000 0000'
        if (!validateSAID(idNumber)) errs.idNumber = 'Enter a valid 13-digit SA ID number'
        if (!address.trim())   errs.address   = 'Required'
      }
      if (step === 1) {
        if (!idFrontFile) errs.idFront = 'ID front photo is required'
        if (!idBackFile)  errs.idBack  = 'ID back photo is required'
        if (!bankName.trim())   errs.bankName   = 'Required'
        if (!accountNo.trim())  errs.accountNo  = 'Required'
        if (!bankProof)   errs.bankProof = 'Bank proof document is required'
      }
      if (step === 2) {
        if (!validateEmail(email)) errs.email = 'Enter a valid email address'
        const pwCheck = validatePassword(password)
        if (!Object.values(pwCheck).every(Boolean)) errs.password = 'Password does not meet all requirements'
        if (password !== confirmPw) errs.confirmPw = 'Passwords do not match'
      }
    } else {
      // Business
      if (step === 0) {
        if (!companyName.trim()) errs.companyName = 'Required'
        if (!contactName.trim()) errs.contactName = 'Required'
        if (!validateSAPhone(bizPhone)) errs.bizPhone = 'Enter a valid SA phone number'
        if (!validateCIPC(regNumber)) errs.regNumber = 'Format: 2024/000000/07'
        if (!bizAddress.trim()) errs.bizAddress = 'Required'
      }
      if (step === 1) {
        if (!cipcDoc) errs.cipcDoc = 'CIPC registration document is required'
        if (!bizBankProof) errs.bizBankProof = 'Bank confirmation letter is required'
      }
      if (step === 2) {
        if (!validateEmail(bizEmail)) errs.bizEmail = 'Enter a valid email address'
        const pwCheck = validatePassword(bizPassword)
        if (!Object.values(pwCheck).every(Boolean)) errs.bizPassword = 'Password does not meet all requirements'
        if (bizPassword !== bizConfirmPw) errs.bizConfirmPw = 'Passwords do not match'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const prevStep = () => {
    setErrors({})
    setStep(s => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)

    // Serialize files to base64
    const toB64 = async (f: File | null) => f ? await fileToBase64(f) : null

    const baseRecord = {
      role,
      status: 'pending_review', // Promoter and Business are always pending until Admin approves
      createdAt: new Date().toISOString(),
    }

    const record = isPromoter ? {
      ...baseRecord,
      fullName:    `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone:       phone.replace(/\s/g, ''),
      idNumber,
      address,
      bankName,
      accountNo,
      email:       email.toLowerCase(),
      password,    // NOTE: In production use hashed passwords. This is frontend-only local storage.
      idFront:     await toB64(idFrontFile),
      idBack:      await toB64(idBackFile),
      bankProof:   await toB64(bankProof),
    } : {
      ...baseRecord,
      companyName,
      contactName,
      phone:       bizPhone.replace(/\s/g, ''),
      regNumber,
      vatNumber:   vatNumber || null,
      address:     bizAddress,
      email:       bizEmail.toLowerCase(),
      password:    bizPassword,
      cipcDoc:     await toB64(cipcDoc),
      taxPin:      await toB64(taxPin),
      bankProof:   await toB64(bizBankProof),
    }

    // Check for duplicate email
    const existing: Record<string, unknown>[] = JSON.parse(localStorage.getItem('hg_users') || '[]')
    const emailKey = isPromoter ? email.toLowerCase() : bizEmail.toLowerCase()
    if (existing.some(u => u.email === emailKey)) {
      setErrors({ [isPromoter ? 'email' : 'bizEmail']: 'An account with this email already exists.' })
      setSubmitting(false)
      return
    }

    existing.push(record)
    localStorage.setItem('hg_users', JSON.stringify(existing))

    // Auto-create session immediately after registration
    const sessionName  = isPromoter ? `${firstName} ${lastName}` : companyName
    const sessionEmail = isPromoter ? email.toLowerCase() : bizEmail.toLowerCase()
    const session = {
      role,
      email:    sessionEmail,
      name:     sessionName,
      loggedIn: true,
      status:   'pending_review',
    }
    localStorage.setItem('hg_session', JSON.stringify(session))

    await new Promise(r => setTimeout(r, 800))
    setDone(true)
    setSubmitting(false)

    // Business → redirect to dashboard (pending status is visible there)
    // Promoter → stay on success screen, button goes to /login
    if (!isPromoter) {
      setTimeout(() => navigate('/business/dashboard'), 1400)
    }
  }

  const switchRole = (r: Role) => {
    setRole(r); setStep(0); setErrors({})
  }

  const stepLabels = ['Personal Info', 'Documents', 'Account Setup']

  return (
    <div style={{
      minHeight: '100vh', background: BLACK,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      fontFamily: FB, padding: '60px 16px 80px', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; background: ${BLACK}; }
        input::placeholder { color: rgba(244,239,230,0.15); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0e0e0e inset !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        @keyframes hg-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hg-reg { animation: hg-fade-up 0.5s ease both; }
        select option { background: #161616; color: ${WHITE}; }
      `}</style>

      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.022,
        backgroundImage: `linear-gradient(${GOLD} 1px,transparent 1px),linear-gradient(90deg,${GOLD} 1px,transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 500, borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${GOLD}0a 0%, transparent 70%)`,
      }} />

      <div className="hg-reg" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: GOLD }}>HONEY</span>
            <span style={{ color: WHITE }}> GROUP</span>
          </div>
          <div style={{ width: 32, height: 1, background: GOLD, margin: '0 auto 16px' }} />
          <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: '0.38em', textTransform: 'uppercase', color: WHITE_MUTED }}>
            Create Account
          </p>
        </div>

        {/* ── SUCCESS STATE ── */}
        {done ? (
          <div style={{
            background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`,
            padding: '52px 40px', textAlign: 'center', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />

            {isPromoter ? (
              /* ── Promoter: pending review, go to login ── */
              <>
                <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
                <h2 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: WHITE, marginBottom: 12 }}>
                  Application Submitted
                </h2>
                <p style={{ fontFamily: FB, fontSize: 14, color: WHITE_MUTED, lineHeight: 1.7, marginBottom: 8 }}>
                  Your account is <span style={{ color: GOLD, fontWeight: 600 }}>pending review</span> by our admin team.
                  You will be notified once approved.
                </p>
                <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_DIM, marginBottom: 36 }}>
                  This typically takes 1–2 business days.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em',
                    textTransform: 'uppercase', background: GOLD, color: BLACK,
                    border: 'none', padding: '16px 44px', cursor: 'pointer', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  Go to Login
                </button>
              </>
            ) : (
              /* ── Business: auto-redirect to dashboard ── */
              <>
                <div style={{ fontSize: 40, marginBottom: 20 }}>◈</div>
                <h2 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: WHITE, marginBottom: 12 }}>
                  Welcome Aboard
                </h2>
                <p style={{ fontFamily: FB, fontSize: 14, color: WHITE_MUTED, lineHeight: 1.7, marginBottom: 8 }}>
                  Your business account has been created. Your account is{' '}
                  <span style={{ color: GOLD, fontWeight: 600 }}>pending admin approval</span> — you can still
                  explore your dashboard in the meantime.
                </p>
                <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_DIM, marginBottom: 36 }}>
                  Redirecting you to your dashboard…
                </p>
                <button
                  onClick={() => navigate('/business/dashboard')}
                  style={{
                    fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em',
                    textTransform: 'uppercase', background: GOLD, color: BLACK,
                    border: 'none', padding: '16px 44px', cursor: 'pointer', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  Go to Dashboard →
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Role toggle */}
            <div style={{
              display: 'flex', background: '#0d0d0d',
              border: `1px solid ${BLACK_BORDER}`, padding: 4, marginBottom: 24, gap: 4,
            }}>
              {(['promoter', 'business'] as Role[]).map(r => {
                const active = role === r
                return (
                  <button key={r} onClick={() => switchRole(r)}
                    style={{
                      flex: 1, padding: '11px 8px',
                      background: active ? 'rgba(196,151,58,0.1)' : 'transparent',
                      border: active ? `1px solid ${GOLD}44` : '1px solid transparent',
                      color: active ? GOLD : WHITE_DIM,
                      fontFamily: FB, fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.3s',
                    }}
                  >
                    {r === 'promoter' ? '◉ Promoter' : '◈ Business'}
                  </button>
                )
              })}
            </div>

            {/* Step navigation labels */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 6 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    fontFamily: FB, fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: i === step ? GOLD : i < step ? `${GOLD}77` : WHITE_DIM,
                    transition: 'color 0.3s',
                  }}>
                    {i + 1}. {label}
                  </span>
                </div>
              ))}
            </div>
            <StepBar current={step} total={TOTAL_STEPS} />

            {/* Card */}
            <div style={{
              background: BLACK_CARD, border: `1px solid ${BLACK_BORDER}`,
              padding: '40px 40px 36px', position: 'relative',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD }} />

              {/* ════════════════════════════════════════════════
                  PROMOTER STEPS
              ════════════════════════════════════════════════ */}
              {isPromoter && step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <SectionDivider label="Personal Details" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="First Name" placeholder="Ayanda" value={firstName}
                      onChange={setFirstName} focused={focused === 'firstName'}
                      onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)}
                      error={errors.firstName}
                    />
                    <Field label="Last Name" placeholder="Dlamini" value={lastName}
                      onChange={setLastName} focused={focused === 'lastName'}
                      onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)}
                      error={errors.lastName}
                    />
                  </div>
                  <Field
                    label="SA Phone Number" placeholder="+27 71 000 0000" value={phone}
                    onChange={v => setPhone(formatSAPhone(v))}
                    focused={focused === 'phone'} onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                    error={errors.phone} hint="South African mobile number"
                  />
                  <Field
                    label="SA ID Number" placeholder="8001015009087" value={idNumber}
                    onChange={setIdNumber} focused={focused === 'idNumber'}
                    onFocus={() => setFocused('idNumber')} onBlur={() => setFocused(null)}
                    error={errors.idNumber} hint="13-digit South African ID number"
                  />
                  <Field
                    label="Residential Address" placeholder="123 Main Street, Johannesburg, 2000" value={address}
                    onChange={setAddress} focused={focused === 'address'}
                    onFocus={() => setFocused('address')} onBlur={() => setFocused(null)}
                    error={errors.address}
                  />
                </div>
              )}

              {isPromoter && step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <SectionDivider label="ID Verification" />
                  <div style={{ background: 'rgba(196,151,58,0.05)', border: `1px solid ${GOLD}22`, padding: '12px 16px' }}>
                    <p style={{ fontFamily: FB, fontSize: 12, color: GOLD, lineHeight: 1.6 }}>
                      Your ID photos will be reviewed by our admin team before your account is approved.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <IDPhotoUpload label="SA ID — Front" file={idFrontFile} onChange={setIdFrontFile} />
                    <IDPhotoUpload label="SA ID — Back"  file={idBackFile}  onChange={setIdBackFile} />
                  </div>
                  {(errors.idFront || errors.idBack) && (
                    <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b' }}>
                      {errors.idFront || errors.idBack}
                    </p>
                  )}
                  <SectionDivider label="Banking Details" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{
                        display: 'block', fontFamily: FB, fontSize: 10, fontWeight: 600,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: focused === 'bankName' ? GOLD : WHITE_MUTED, marginBottom: 8, transition: 'color 0.2s',
                      }}>
                        Bank Name
                      </label>
                      <select
                        value={bankName} onChange={e => setBankName(e.target.value)}
                        onFocus={() => setFocused('bankName')} onBlur={() => setFocused(null)}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${errors.bankName ? '#ff6b6b66' : focused === 'bankName' ? GOLD : BLACK_BORDER}`,
                          padding: '13px 16px', fontFamily: FB, fontSize: 14, color: bankName ? WHITE : 'rgba(244,239,230,0.25)',
                          outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer',
                        }}
                      >
                        <option value="" disabled>Select bank</option>
                        {['ABSA', 'Standard Bank', 'FNB', 'Nedbank', 'Capitec', 'African Bank', 'TymeBank', 'Discovery Bank', 'Investec', 'Other'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {errors.bankName && <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b', marginTop: 5 }}>{errors.bankName}</p>}
                    </div>
                    <Field label="Account Number" placeholder="000 000 0000" value={accountNo}
                      onChange={setAccountNo} focused={focused === 'accountNo'}
                      onFocus={() => setFocused('accountNo')} onBlur={() => setFocused(null)}
                      error={errors.accountNo}
                    />
                  </div>
                  <FileUploadZone
                    label="Bank Statement / Proof of Account"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={bankProof}
                    onChange={setBankProof}
                    hint="PDF or image · Max 10 MB"
                    required
                  />
                  {errors.bankProof && <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b', marginTop: -14 }}>{errors.bankProof}</p>}
                </div>
              )}

              {isPromoter && step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <SectionDivider label="Login Credentials" />
                  <Field label="Email Address" type="email" placeholder="ayanda@email.com" value={email}
                    onChange={setEmail} focused={focused === 'email'}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    error={errors.email}
                  />
                  <div>
                    <Field label="Password" type="password" placeholder="Min. 8 characters" value={password}
                      onChange={setPassword} focused={focused === 'password'}
                      onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                      error={errors.password}
                    />
                    <PasswordStrength password={password} />
                  </div>
                  <Field label="Confirm Password" type="password" placeholder="••••••••" value={confirmPw}
                    onChange={setConfirmPw} focused={focused === 'confirmPw'}
                    onFocus={() => setFocused('confirmPw')} onBlur={() => setFocused(null)}
                    error={errors.confirmPw}
                  />
                  <div style={{
                    background: 'rgba(196,151,58,0.05)', border: `1px solid ${GOLD}22`,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED, lineHeight: 1.7 }}>
                      By creating an account you agree to Honey Group's Terms of Service and Privacy Policy.
                      Your account will be in <span style={{ color: GOLD }}>pending review</span> status until approved by an administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════
                  BUSINESS STEPS
              ════════════════════════════════════════════════ */}
              {!isPromoter && step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <SectionDivider label="Company Information" />
                  <Field label="Company Name" placeholder="Acme Promotions (Pty) Ltd" value={companyName}
                    onChange={setCompanyName} focused={focused === 'companyName'}
                    onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)}
                    error={errors.companyName}
                  />
                  <Field label="Contact Person" placeholder="Jane Smith" value={contactName}
                    onChange={setContactName} focused={focused === 'contactName'}
                    onFocus={() => setFocused('contactName')} onBlur={() => setFocused(null)}
                    error={errors.contactName}
                  />
                  <Field label="Business Phone" placeholder="+27 11 000 0000" value={bizPhone}
                    onChange={v => setBizPhone(formatSAPhone(v))}
                    focused={focused === 'bizPhone'} onFocus={() => setFocused('bizPhone')} onBlur={() => setFocused(null)}
                    error={errors.bizPhone} hint="SA landline or mobile"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="CIPC Reg Number" placeholder="2024/000000/07" value={regNumber}
                      onChange={setRegNumber} focused={focused === 'regNumber'}
                      onFocus={() => setFocused('regNumber')} onBlur={() => setFocused(null)}
                      error={errors.regNumber} hint="Format: YYYY/NNNNNN/NN"
                    />
                    <Field label="VAT Number (Optional)" placeholder="4410000000" value={vatNumber}
                      onChange={setVatNumber} focused={focused === 'vatNumber'}
                      onFocus={() => setFocused('vatNumber')} onBlur={() => setFocused(null)}
                    />
                  </div>
                  <Field label="Business Address" placeholder="1 Business Park, Sandton, 2196" value={bizAddress}
                    onChange={setBizAddress} focused={focused === 'bizAddress'}
                    onFocus={() => setFocused('bizAddress')} onBlur={() => setFocused(null)}
                    error={errors.bizAddress}
                  />
                </div>
              )}

              {!isPromoter && step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <SectionDivider label="Business Documents" />
                  <FileUploadZone
                    label="CIPC Registration Certificate"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={cipcDoc}
                    onChange={setCipcDoc}
                    hint="Official CIPC CoR14.3 or equivalent · PDF preferred"
                    required
                  />
                  {errors.cipcDoc && <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b', marginTop: -14 }}>{errors.cipcDoc}</p>}
                  <FileUploadZone
                    label="Tax Clearance / Tax PIN (Optional)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={taxPin}
                    onChange={setTaxPin}
                    hint="SARS Tax Clearance Certificate or Tax PIN letter"
                  />
                  <SectionDivider label="Banking" />
                  <FileUploadZone
                    label="Bank Confirmation Letter"
                    accept=".pdf,.jpg,.jpeg,.png"
                    file={bizBankProof}
                    onChange={setBizBankProof}
                    hint="Official bank letter on letterhead · PDF preferred"
                    required
                  />
                  {errors.bizBankProof && <p style={{ fontFamily: FB, fontSize: 11, color: '#ff6b6b', marginTop: -14 }}>{errors.bizBankProof}</p>}
                </div>
              )}

              {!isPromoter && step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <SectionDivider label="Login Credentials" />
                  <Field label="Business Email" type="email" placeholder="contact@company.co.za" value={bizEmail}
                    onChange={setBizEmail} focused={focused === 'bizEmail'}
                    onFocus={() => setFocused('bizEmail')} onBlur={() => setFocused(null)}
                    error={errors.bizEmail}
                  />
                  <div>
                    <Field label="Password" type="password" placeholder="Min. 8 characters" value={bizPassword}
                      onChange={setBizPassword} focused={focused === 'bizPassword'}
                      onFocus={() => setFocused('bizPassword')} onBlur={() => setFocused(null)}
                      error={errors.bizPassword}
                    />
                    <PasswordStrength password={bizPassword} />
                  </div>
                  <Field label="Confirm Password" type="password" placeholder="••••••••" value={bizConfirmPw}
                    onChange={setBizConfirmPw} focused={focused === 'bizConfirmPw'}
                    onFocus={() => setFocused('bizConfirmPw')} onBlur={() => setFocused(null)}
                    error={errors.bizConfirmPw}
                  />
                  <div style={{
                    background: 'rgba(196,151,58,0.05)', border: `1px solid ${GOLD}22`, padding: '14px 16px',
                  }}>
                    <p style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED, lineHeight: 1.7 }}>
                      Your business account will be in <span style={{ color: GOLD }}>pending review</span> status until verified by Honey Group administrators.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                {step > 0 && (
                  <button
                    onClick={prevStep}
                    style={{
                      flex: 1, padding: '15px 0',
                      background: 'transparent', border: `1px solid ${BLACK_BORDER}`,
                      fontFamily: FB, fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: WHITE_MUTED, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BLACK_BORDER; e.currentTarget.style.color = WHITE_MUTED }}
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={step < TOTAL_STEPS - 1 ? nextStep : handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 2, padding: '15px 0',
                    background: GOLD, border: 'none',
                    fontFamily: FB, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: BLACK, cursor: submitting ? 'wait' : 'pointer', transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = GOLD_LIGHT; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {submitting
                    ? 'Submitting…'
                    : step < TOTAL_STEPS - 1
                      ? `Continue →`
                      : 'Submit Application'}
                </button>
              </div>
            </div>

            {/* Sign in link */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontFamily: FB, fontSize: 12, color: WHITE_MUTED }}>Already have an account? </span>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 12, color: GOLD, fontWeight: 600, padding: 0 }}
              >
                Log In
              </button>
            </div>
            <p style={{ textAlign: 'center', marginTop: 12, fontFamily: FB, fontSize: 10, color: WHITE_DIM, letterSpacing: '0.14em' }}>
              ADMIN ACCOUNTS ARE CREATED BY INVITATION ONLY
            </p>
          </>
        )}

        {/* Back to home */}
        {!done && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 11, color: WHITE_DIM, letterSpacing: '0.16em', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = WHITE_DIM)}
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}