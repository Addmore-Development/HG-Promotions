import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── DESIGN TOKENS ──────────────────────────────────────────── */
const BLACK        = '#080808'
const BLACK_CARD   = '#161616'
const BLACK_BORDER = 'rgba(196,151,58,0.15)'
const GOLD         = '#C4973A'
const GOLD_LIGHT   = '#DDB55A'
const GOLD_DIM     = 'rgba(196,151,58,0.55)'
const GOLD_PALE    = 'rgba(196,151,58,0.28)'
const GOLD_FAINT   = 'rgba(196,151,58,0.12)'
const AMBER        = '#B8820A'
const BROWN        = '#7A5C1E'
const WHITE        = '#F4EFE6'
const WHITE_MUTED  = 'rgba(244,239,230,0.55)'
const FD           = "'Playfair Display', Georgia, serif"
const FB           = "'DM Sans', system-ui, sans-serif"

// ... (keep all your other constants: Role, INDUSTRY_OPTIONS, PROMOTER_CATEGORIES, etc.)

/* ─── VALIDATION HELPERS ─────────────────────────────────────── */
// ... (keep validateSAID, validateSAPhone, formatSAPhone, validateCIPC, validateEmail, validatePassword)

/* ─── COMPONENTS: Chip, Field, FileUploadZone, PhotoUpload, PasswordStrength, etc. ── */
// ... (keep all these small components exactly as they were)

/* ─── MAIN REGISTER PAGE ─────────────────────────────────────── */
export default function RegisterPage() {
  const navigate = useNavigate()

  const [role,       setRole]       = useState<Role>('promoter')
  const [step,       setStep]       = useState(0)
  const [focused,    setFocused]    = useState<string | null>(null)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  // Promoter states
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [idNumber,     setIdNumber]     = useState('')
  const [address,      setAddress]      = useState('')
  const [headshotFile, setHeadshotFile] = useState<File | null>(null)
  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null)
  const [bankName,     setBankName]     = useState('')
  const [accountNo,    setAccountNo]    = useState('')
  const [bankProof,    setBankProof]    = useState<File | null>(null)
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPw,    setConfirmPw]    = useState('')
  const [promoCategories, setPromoCategories] = useState<string[]>([])
  const [promoLanguages,  setPromoLanguages]  = useState<string[]>([])
  const [promoExperience, setPromoExperience] = useState('')
  const [promoGender,     setPromoGender]     = useState('')
  const [promoHeight,     setPromoHeight]     = useState('')
  const [promoClothing,   setPromoClothing]   = useState('')

  // Business states
  const [companyName,  setCompanyName]  = useState('')
  const [contactName,  setContactName]  = useState('')
  const [bizPhone,     setBizPhone]     = useState('')
  const [regNumber,    setRegNumber]    = useState('')
  const [vatNumber,    setVatNumber]    = useState('')
  const [bizAddress,   setBizAddress]   = useState('')
  const [bizIndustry,  setBizIndustry]  = useState('')
  const [bizEmail,     setBizEmail]     = useState('')
  const [bizPassword,  setBizPassword]  = useState('')
  const [bizConfirmPw, setBizConfirmPw] = useState('')
  const [cipcDoc,      setCipcDoc]      = useState<File | null>(null)
  const [taxPin,       setTaxPin]       = useState<File | null>(null)
  const [bizBankProof, setBizBankProof] = useState<File | null>(null)

  const isPromoter  = role === 'promoter'
  const TOTAL_STEPS = 3

  // ────────────────────────────────────────────────────────────────
  //  Offline fallback – save registration to localStorage
  // ────────────────────────────────────────────────────────────────
  const addRegistration = (data: any) => {
    try {
      const key = 'hg_pending_registrations'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const newEntry = {
        ...data,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        // optional: helps debugging
        browser: navigator.userAgent.slice(0, 100),
      }
      localStorage.setItem(key, JSON.stringify([...existing, newEntry]))
      console.log('[Offline fallback] Registration saved to localStorage')
    } catch (err) {
      console.error('[Offline fallback] Failed to save to localStorage:', err)
    }
  }

  const switchRole = (r: Role) => { 
    setRole(r); 
    setStep(0); 
    setErrors({}); 
    setPromoCategories([]); 
    setPromoLanguages([]) 
  }

  /* ─── VALIDATION ──────────────────────────────────────────────── */
  // ... keep your validateStep, nextStep, prevStep functions unchanged ...

  /* ─── SUBMIT ──────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)

    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

      // 1. Always save to localStorage first (offline resilience)
      if (isPromoter) {
        addRegistration({
          name:       `${firstName} ${lastName}`,
          email:      email.toLowerCase(),
          phone:      phone.replace(/\s/g, ''),
          role:       'PROMOTER',
          idNumber,
          city:       address,
          gender:     promoGender    || undefined,
          height:     promoHeight    ? parseInt(promoHeight) : undefined,
          experience: promoExperience || undefined,
          categories: promoCategories.length > 0 ? promoCategories.join(', ') : undefined,
          languages:  promoLanguages.length  > 0 ? promoLanguages.join(', ')  : undefined,
          bankName:   bankName  || undefined,
          accountNo:  accountNo || undefined,
          documents: [
            headshotFile?.name, 
            fullBodyFile?.name, 
            bankProof?.name,
          ].filter(Boolean) as string[],
        })
      } else {
        addRegistration({
          name:        contactName,
          email:       bizEmail.toLowerCase(),
          phone:       bizPhone.replace(/\s/g, ''),
          role:        'BUSINESS',
          companyName,
          contactName,
          regNumber,
          vatNumber:   vatNumber || undefined,
          bizAddress,
          industry:    bizIndustry,
          documents: [
            cipcDoc?.name, 
            taxPin?.name, 
            bizBankProof?.name,
          ].filter(Boolean) as string[],
        })
      }

      // 2. Attempt real API registration (non-blocking if it fails)
      let userId = ''
      try {
        let res
        if (isPromoter) {
          res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${firstName} ${lastName}`, 
              email: email.toLowerCase(), 
              password,
              role: 'PROMOTER', 
              phone: phone.replace(/\s/g, ''), 
              consentPopia: true,
              idNumber, 
              city: address, 
              gender: promoGender || undefined,
              height: promoHeight ? parseInt(promoHeight) : undefined,
              clothingSize: promoClothing || undefined, 
              experience: promoExperience || undefined,
              industry: promoCategories.length > 0 ? promoCategories.join(', ') : undefined,
              languages: promoLanguages.length  > 0 ? promoLanguages.join(', ')  : undefined,
            }),
          })
        } else {
          res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: companyName, 
              email: bizEmail.toLowerCase(), 
              password: bizPassword,
              role: 'BUSINESS', 
              phone: bizPhone.replace(/\s/g, ''), 
              consentPopia: true,
              companyName, 
              contactName, 
              companyReg: regNumber, 
              vatNumber, 
              city: bizAddress, 
              industry: bizIndustry,
            }),
          })
        }

        if (res.ok) {
          const d = await res.json()
          userId = d.userId || ''
        }
      } catch (apiErr) {
        console.warn('API registration failed – but saved to localStorage', apiErr)
        // You could show a toast here: "Saved offline – will sync when online"
      }

      // 3. Upload documents if we have a userId
      if (userId) {
        const fd = new FormData()
        if (isPromoter) {
          if (bankProof)    fd.append('cv',            bankProof)
          if (headshotFile) fd.append('headshot',      headshotFile)
          if (fullBodyFile) fd.append('fullBodyPhoto', fullBodyFile)
        } else {
          if (cipcDoc)      fd.append('cipcDoc',      cipcDoc)
          if (taxPin)       fd.append('taxPin',       taxPin)
          if (bizBankProof) fd.append('bizBankProof', bizBankProof)
        }

        if ([...fd.entries()].length > 0) {
          try {
            await fetch(`${API}/users/register-documents/${userId}`, { 
              method: 'POST', 
              body: fd 
            })
          } catch (uploadErr) {
            console.warn('Document upload failed', uploadErr)
          }
        }
      }

      setDone(true)
    } catch (err: any) {
      setErrors({ submit: err.message || 'Registration failed. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ... rest of your component (render, step content, modal, styles, etc.) ...
  // remains exactly the same

  // Just make sure the return statement and all JSX is unchanged
}