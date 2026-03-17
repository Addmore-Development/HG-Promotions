import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

// ─── Palette ──────────────────────────────────────────────────────────────────
const BLK  = '#050402'
const BLK1 = '#0A0804'
const BLK2 = '#100C05'
const GL   = '#E8A820'
const GD   = '#C07818'
const GD2  = '#8B5A1A'
const BB   = 'rgba(212,136,10,0.16)'
const BB2  = 'rgba(212,136,10,0.08)'
const W    = '#FAF3E8'
const W7   = 'rgba(250,243,232,0.70)'
const W4   = 'rgba(250,243,232,0.40)'
const W2   = 'rgba(250,243,232,0.20)'
const WD   = 'rgba(250,243,232,0.28)'
const CORAL = '#C4614A'
const TEAL  = '#4AABB8'
const FD   = "'Playfair Display', Georgia, serif"
const FB   = "'DM Sans', system-ui, sans-serif"

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function hex2rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`
}

const SOUTH_AFRICAN_CITIES = [
  'Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth',
  'Bloemfontein','East London','Nelspruit','Polokwane','Kimberley',
  'Pietermaritzburg','Rustenburg','George','Sandton','Randburg',
  'Roodepoort','Benoni','Boksburg','Germiston','Midrand','Centurion',
  'Hillbrow','Braamfontein','Rosebank','Fourways','Soweto','Alexandra',
  'Mitchells Plain','Khayelitsha','Bellville','Stellenbosch','Paarl',
  'Tygervalley','Vanderbijlpark','Springs','Ekurhuleni','Tshwane',
]

const PROVINCES = [
  'Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape',
  'Free State','Limpopo','Mpumalanga','North West','Northern Cape',
]

const CLOTHING_SIZES = ['XS','S','M','L','XL','XXL','XXXL']
const SHOE_SIZES     = ['3','4','5','6','7','8','9','10','11','12','13']
const GENDERS        = ['Female','Male','Non-binary','Prefer not to say']

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: {
  label:    string
  required?: boolean
  children: React.ReactNode
  hint?:    string
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: W4, marginBottom: 8, fontFamily: FD }}>
        {label} {required && <span style={{ color: GL }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ marginTop: 5, fontSize: 10, color: WD, fontFamily: FB }}>{hint}</div>}
    </div>
  )
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:       '100%',
  padding:     '11px 14px',
  background:  BLK2,
  border:      `1px solid ${BB}`,
  color:       W,
  fontFamily:  FB,
  fontSize:    13,
  outline:     'none',
  borderRadius: 3,
  boxSizing:   'border-box',
}

function Input({ value, onChange, type = 'text', placeholder, required }: {
  value:       string
  onChange:    (v: string) => void
  type?:       string
  placeholder?: string
  required?:   boolean
}) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
      onFocus={e => e.currentTarget.style.borderColor = GL}
      onBlur={e  => e.currentTarget.style.borderColor = BB}
    />
  )
}

function Select({ value, onChange, options, placeholder }: {
  value:       string
  onChange:    (v: string) => void
  options:     string[]
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => e.currentTarget.style.borderColor = GL}
      onBlur={e  => e.currentTarget.style.borderColor = BB}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── File upload card ─────────────────────────────────────────────────────────
function FileCard({ label, icon, accept, file, preview, onChange, hint }: {
  label:    string
  icon:     string
  accept:   string
  file:     File | null
  preview?: string | null
  onChange: (f: File) => void
  hint?:    string
}) {
  return (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <input
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
      />
      <div style={{
        padding:    '16px',
        background: file ? hex2rgba(GL, 0.06) : BB2,
        border:     `1px dashed ${file ? hex2rgba(GL, 0.5) : hex2rgba(GL, 0.22)}`,
        borderRadius: 3,
        textAlign:  'center',
        transition: 'all 0.2s',
      }}>
        {preview ? (
          <img
            src={preview}
            alt={label}
            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', objectPosition: 'top', borderRadius: 2, marginBottom: 8 }}
          />
        ) : (
          <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: file ? GL : W4, fontFamily: FD, marginBottom: 3 }}>
          {file ? file.name : label}
        </div>
        {hint && <div style={{ fontSize: 10, color: WD, fontFamily: FB }}>{hint}</div>}
        {file && <div style={{ marginTop: 6, fontSize: 10, color: TEAL, fontFamily: FB }}>✓ Ready to upload</div>}
      </div>
    </label>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done    = step < current
  const active  = step === current
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width:       28, height: 28,
        borderRadius: '50%',
        background:  done ? GL : active ? 'transparent' : 'transparent',
        border:      `2px solid ${done ? GL : active ? GL : BB}`,
        display:     'flex', alignItems: 'center', justifyContent: 'center',
        fontSize:    11, fontWeight: 700,
        color:       done ? BLK : active ? GL : W4,
        fontFamily:  FD,
        transition:  'all 0.3s',
      }}>
        {done ? '✓' : step}
      </div>
      <div style={{ fontSize: 9, color: active ? GL : W4, fontWeight: active ? 700 : 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontFamily: FD }}>
        {label}
      </div>
    </div>
  )
}

// ─── Main RegisterPage ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate()

  // Step state
  const [step, setStep] = useState(1)

  // Step 1 — Account
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')

  // Step 2 — Personal details
  const [gender,        setGender]        = useState('')
  const [height,        setHeight]        = useState('')
  const [clothingSize,  setClothingSize]  = useState('')
  const [shoeSize,      setShoeSize]      = useState('')
  const [city,          setCity]          = useState('')
  const [province,      setProvince]      = useState('')
  const [bankName,      setBankName]      = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [branchCode,    setBranchCode]    = useState('')
  const [idNumber,      setIdNumber]      = useState('')

  // Step 3 — Documents
  const [headshotFile,      setHeadshotFile]      = useState<File | null>(null)
  const [headshotPreview,   setHeadshotPreview]   = useState<string | null>(null)
  const [fullBodyFile,      setFullBodyFile]       = useState<File | null>(null)
  const [fullBodyPreview,   setFullBodyPreview]    = useState<string | null>(null)
  const [profilePhotoFile,  setProfilePhotoFile]   = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [cvFile,            setCvFile]             = useState<File | null>(null)
  const [cvPreview,         setCvPreview]          = useState<string | null>(null)
  const [idProofFile,       setIdProofFile]        = useState<File | null>(null)
  const [idProofPreview,    setIdProofPreview]     = useState<string | null>(null)

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  // ── File helper ──────────────────────────────────────────────────────────────
  const handleFileChange = (
    file:        File,
    setFile:     (f: File) => void,
    setPreview:  (s: string | null) => void
  ) => {
    setFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      // For PDFs and docs show filename only
      setPreview(null)
    }
  }

  // ── Step 1 validation ────────────────────────────────────────────────────────
  const validateStep1 = (): string => {
    if (!fullName.trim())        return 'Full name is required'
    if (!email.trim())           return 'Email is required'
    if (!phone.trim())           return 'Phone number is required'
    if (password.length < 6)     return 'Password must be at least 6 characters'
    if (password !== confirm)    return 'Passwords do not match'
    return ''
  }

  // ── Step 2 validation ────────────────────────────────────────────────────────
  const validateStep2 = (): string => {
    if (!gender)  return 'Please select your gender'
    if (!city)    return 'Please select your city'
    if (!province)return 'Please select your province'
    return ''
  }

  // ── Next step ────────────────────────────────────────────────────────────────
  const goNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!headshotFile && !profilePhotoFile) {
      setError('Please upload at least a headshot or profile photo')
      return
    }

    setLoading(true)
    try {
      // Step 1: Register the account
      const registerRes = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName,
          email,
          phone,
          password,
          role:         'PROMOTER',
          gender,
          height:       height ? parseInt(height) : undefined,
          clothingSize: clothingSize || undefined,
          shoeSize:     shoeSize    || undefined,
          city,
          province,
          bankName:      bankName      || undefined,
          accountNumber: accountNumber || undefined,
          branchCode:    branchCode    || undefined,
          idNumber:      idNumber      || undefined,
        }),
      })

      const registerData = await registerRes.json()
      if (!registerRes.ok) {
        setError(registerData.error || registerData.message || 'Registration failed')
        setLoading(false)
        return
      }

      const token = registerData.token
      if (!token) {
        setError('Registration succeeded but no token received')
        setLoading(false)
        return
      }

      // Step 2: Upload documents
      const anyDoc = headshotFile || fullBodyFile || profilePhotoFile || cvFile || idProofFile
      if (anyDoc) {
        const formData = new FormData()
        if (headshotFile)     formData.append('headshot',     headshotFile)
        if (fullBodyFile)     formData.append('fullBodyPhoto', fullBodyFile)
        if (profilePhotoFile) formData.append('profilePhoto',  profilePhotoFile)
        if (cvFile)           formData.append('cv',            cvFile)
        if (idProofFile)      formData.append('idProof',       idProofFile)

        await fetch(`${API}/users/me/documents`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    formData,
        })
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError('Registration failed — please check your connection and try again')
    }
    setLoading(false)
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: BLK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 9, letterSpacing: '0.36em', textTransform: 'uppercase' as const, color: GL, marginBottom: 12, fontWeight: 700, fontFamily: FD }}>Registration Complete</div>
          <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, marginBottom: 12 }}>
            Welcome to Honey Group!
          </h1>
          <p style={{ fontSize: 14, color: W4, fontFamily: FB, lineHeight: 1.7, marginBottom: 24 }}>
            Your application has been submitted. Our team will review your profile and documents. You'll be notified once approved.
          </p>
          <div style={{ fontSize: 12, color: WD, fontFamily: FB }}>Redirecting to login…</div>
        </div>
      </div>
    )
  }

  const STEPS = ['Account', 'Details', 'Documents']

  return (
    <div style={{ minHeight: '100vh', background: BLK, display: 'flex', fontFamily: FB }}>
      <style>{`
        input::placeholder { color: ${WD}; }
        select option { background: ${BLK2}; color: ${W}; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Left panel — brand */}
      <div style={{ width: 380, flexShrink: 0, background: BLK2, borderRight: `1px solid ${BB}`, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: W, marginBottom: 4 }}>
            <span style={{ color: GL }}>HONEY</span> GROUP
          </div>
          <div style={{ fontSize: 10, color: W4, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>Promoter Network</div>
        </div>

        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: GL, marginBottom: 16, fontWeight: 700, fontFamily: FD }}>
            Join the Team
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, lineHeight: 1.2, marginBottom: 20 }}>
            Start your<br />promoter<br />journey
          </h2>
          <p style={{ fontSize: 13, color: W4, lineHeight: 1.7, marginBottom: 32 }}>
            Complete your profile to be matched with top brands and earn great rates across South Africa.
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <StepDot step={i + 1} current={step} label={label} />
                {i < STEPS.length - 1 && (
                  <div style={{ height: 2, flex: 1, background: step > i + 1 ? GL : BB, marginTop: 13, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: W2, fontFamily: FB }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: GL, fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 56px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Step heading */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 8 }}>
              Step {step} of {STEPS.length}
            </div>
            <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W, marginBottom: 6 }}>
              {step === 1 && 'Create Your Account'}
              {step === 2 && 'Personal Details'}
              {step === 3 && 'Upload Your Documents'}
            </h1>
            <p style={{ fontSize: 13, color: W4, fontFamily: FB }}>
              {step === 1 && 'Set up your login credentials'}
              {step === 2 && 'Help us match you with the right jobs'}
              {step === 3 && 'Upload your photos and CV for your profile'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: hex2rgba(CORAL, 0.1), border: `1px solid ${hex2rgba(CORAL, 0.4)}`, borderRadius: 3, marginBottom: 24, fontSize: 13, color: CORAL, fontFamily: FB }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <div>
                <Field label="Full Name" required>
                  <Input value={fullName} onChange={setFullName} placeholder="e.g. Andiswa Ntlamvu" required />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Email Address" required>
                    <Input value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
                  </Field>
                  <Field label="Phone Number" required>
                    <Input value={phone} onChange={setPhone} placeholder="e.g. 0821234567" required />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Password" required>
                    <Input value={password} onChange={setPassword} type="password" placeholder="Min. 6 characters" required />
                  </Field>
                  <Field label="Confirm Password" required>
                    <Input value={confirm} onChange={setConfirm} type="password" placeholder="Repeat password" required />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 2: Personal Details ── */}
            {step === 2 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Gender" required>
                    <Select value={gender} onChange={setGender} options={GENDERS} placeholder="Select gender" />
                  </Field>
                  <Field label="Height (cm)" hint="Used for job matching">
                    <Input value={height} onChange={setHeight} type="number" placeholder="e.g. 168" />
                  </Field>
                  <Field label="Clothing Size">
                    <Select value={clothingSize} onChange={setClothingSize} options={CLOTHING_SIZES} placeholder="Select size" />
                  </Field>
                  <Field label="Shoe Size">
                    <Select value={shoeSize} onChange={setShoeSize} options={SHOE_SIZES} placeholder="Select size" />
                  </Field>
                  <Field label="City" required>
                    <Select value={city} onChange={setCity} options={SOUTH_AFRICAN_CITIES} placeholder="Select city" />
                  </Field>
                  <Field label="Province" required>
                    <Select value={province} onChange={setProvince} options={PROVINCES} placeholder="Select province" />
                  </Field>
                </div>

                <div style={{ margin: '8px 0 20px', height: 1, background: BB }} />
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 16 }}>
                  Banking Details (for payments)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <Field label="Bank Name">
                    <Input value={bankName} onChange={setBankName} placeholder="e.g. FNB" />
                  </Field>
                  <Field label="Account Number">
                    <Input value={accountNumber} onChange={setAccountNumber} placeholder="Account number" />
                  </Field>
                  <Field label="Branch Code">
                    <Input value={branchCode} onChange={setBranchCode} placeholder="e.g. 250655" />
                  </Field>
                </div>

                <div style={{ margin: '8px 0 20px', height: 1, background: BB }} />
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 16 }}>
                  Identity
                </div>
                <Field label="ID Number" hint="South African ID or passport number">
                  <Input value={idNumber} onChange={setIdNumber} placeholder="13-digit SA ID or passport" />
                </Field>
              </div>
            )}

            {/* ── STEP 3: Documents ── */}
            {step === 3 && (
              <div>
                <div style={{ padding: '12px 16px', background: hex2rgba(GL, 0.06), border: `1px solid ${hex2rgba(GL, 0.2)}`, borderRadius: 3, marginBottom: 24, fontSize: 12, color: W4, fontFamily: FB, lineHeight: 1.6 }}>
                  📸 Upload your photos and CV. Your <strong style={{ color: GL }}>headshot</strong> and <strong style={{ color: GL }}>full body photo</strong> are used by businesses when selecting promoters. Your <strong style={{ color: GL }}>CV</strong> should highlight relevant experience.
                </div>

                {/* ── Photos row ── */}
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 14 }}>
                  Photos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
                  <div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>
                      Headshot <span style={{ color: GL }}>*</span>
                    </div>
                    <FileCard
                      label="Upload Headshot"
                      icon="🤳"
                      accept="image/jpeg,image/png,image/webp"
                      file={headshotFile}
                      preview={headshotPreview}
                      onChange={f => handleFileChange(f, setHeadshotFile, setHeadshotPreview)}
                      hint="Face clearly visible"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>
                      Full Body Photo <span style={{ color: GL }}>*</span>
                    </div>
                    <FileCard
                      label="Upload Full Body"
                      icon="🧍"
                      accept="image/jpeg,image/png,image/webp"
                      file={fullBodyFile}
                      preview={fullBodyPreview}
                      onChange={f => handleFileChange(f, setFullBodyFile, setFullBodyPreview)}
                      hint="Head to toe, plain background"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>
                      Profile Photo
                    </div>
                    <FileCard
                      label="Upload Profile Photo"
                      icon="👤"
                      accept="image/jpeg,image/png,image/webp"
                      file={profilePhotoFile}
                      preview={profilePhotoPreview}
                      onChange={f => handleFileChange(f, setProfilePhotoFile, setProfilePhotoPreview)}
                      hint="Used in your public profile"
                    />
                  </div>
                </div>

                {/* ── CV & Documents row ── */}
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: GL, fontWeight: 700, fontFamily: FD, marginBottom: 14 }}>
                  CV & Identity Documents
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
                  {/* CV Upload */}
                  <div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>
                      CV / Portfolio <span style={{ color: GL }}>*</span>
                    </div>
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleFileChange(file, setCvFile, setCvPreview)
                        }}
                      />
                      <div style={{
                        padding:    '20px 16px',
                        background: cvFile ? hex2rgba(GL, 0.06) : BB2,
                        border:     `1px dashed ${cvFile ? hex2rgba(GL, 0.5) : hex2rgba(GL, 0.22)}`,
                        borderRadius: 3,
                        textAlign:  'center',
                        transition: 'all 0.2s',
                        minHeight:  120,
                        display:    'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}>
                        {cvPreview ? (
                          <img src={cvPreview} alt="CV preview" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 2 }} />
                        ) : (
                          <div style={{ fontSize: 32 }}>{cvFile ? '📄' : '📋'}</div>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 700, color: cvFile ? GL : W4, fontFamily: FD }}>
                          {cvFile ? cvFile.name : 'Upload CV or Portfolio'}
                        </div>
                        <div style={{ fontSize: 10, color: WD, fontFamily: FB }}>
                          PDF, DOC, DOCX or image
                        </div>
                        {cvFile && (
                          <div style={{ fontSize: 10, color: TEAL, fontFamily: FB }}>✓ Ready to upload</div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* ID Proof Upload */}
                  <div>
                    <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>
                      ID / Passport Copy
                    </div>
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleFileChange(file, setIdProofFile, setIdProofPreview)
                        }}
                      />
                      <div style={{
                        padding:    '20px 16px',
                        background: idProofFile ? hex2rgba(GL, 0.06) : BB2,
                        border:     `1px dashed ${idProofFile ? hex2rgba(GL, 0.5) : hex2rgba(GL, 0.22)}`,
                        borderRadius: 3,
                        textAlign:  'center',
                        transition: 'all 0.2s',
                        minHeight:  120,
                        display:    'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}>
                        {idProofPreview ? (
                          <img src={idProofPreview} alt="ID preview" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 2 }} />
                        ) : (
                          <div style={{ fontSize: 32 }}>{idProofFile ? '🪪' : '🪪'}</div>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 700, color: idProofFile ? GL : W4, fontFamily: FD }}>
                          {idProofFile ? idProofFile.name : 'Upload ID or Passport'}
                        </div>
                        <div style={{ fontSize: 10, color: WD, fontFamily: FB }}>
                          PDF or image of your ID document
                        </div>
                        {idProofFile && (
                          <div style={{ fontSize: 10, color: TEAL, fontFamily: FB }}>✓ Ready to upload</div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Upload checklist */}
                <div style={{ padding: '14px 16px', background: BB2, border: `1px solid ${BB}`, borderRadius: 3, marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: W4, fontFamily: FB, marginBottom: 8 }}>Upload checklist:</div>
                  {[
                    { label: 'Headshot photo',    done: !!headshotFile,     required: true },
                    { label: 'Full body photo',   done: !!fullBodyFile,     required: true },
                    { label: 'Profile photo',     done: !!profilePhotoFile, required: false },
                    { label: 'CV / Portfolio',    done: !!cvFile,           required: true },
                    { label: 'ID / Passport',     done: !!idProofFile,      required: false },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: item.done ? TEAL : item.required ? CORAL : WD }}>
                        {item.done ? '✓' : item.required ? '○' : '○'}
                      </span>
                      <span style={{ fontSize: 11, color: item.done ? W7 : W4, fontFamily: FB }}>
                        {item.label} {item.required && !item.done && <span style={{ color: CORAL, fontSize: 10 }}>required</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(s => s - 1) }}
                  style={{ flex: 1, padding: '13px', background: 'transparent', border: `1px solid ${BB}`, color: W4, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  ← Back
                </button>
              )}

              {step < 3 && (
                <button
                  type="button"
                  onClick={goNext}
                  style={{ flex: 2, padding: '13px', background: `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: BLK, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Next →
                </button>
              )}

              {step === 3 && (
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 2, padding: '13px', background: loading ? BB : `linear-gradient(135deg, ${GL}, ${GD})`, border: 'none', color: loading ? W4 : BLK, fontFamily: FD, fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  {loading ? 'Submitting…' : '✓ Complete Registration'}
                </button>
              )}
            </div>

          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: W2, fontFamily: FB }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: GL, fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}