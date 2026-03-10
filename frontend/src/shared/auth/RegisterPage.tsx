import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROLES } from '../constants/roles'
import { RegisterPayload } from '../types/auth.types'

interface Field {
  id:          string
  label:       string
  type:        string
  placeholder: string
}

const PROMOTER_FIELDS: Field[] = [
  { id: 'fullName',        label: 'Full Name',        type: 'text',     placeholder: 'John Doe'          },
  { id: 'email',           label: 'Email Address',    type: 'email',    placeholder: 'john@email.com'    },
  { id: 'phone',           label: 'Phone Number',     type: 'tel',      placeholder: '+27 82 000 0000'   },
  { id: 'idNumber',        label: 'ID Number',        type: 'text',     placeholder: '0000000000000'     },
  { id: 'password',        label: 'Password',         type: 'password', placeholder: '••••••••'          },
  { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••'          },
]

const BUSINESS_FIELDS: Field[] = [
  { id: 'companyName',     label: 'Company Name',     type: 'text',     placeholder: 'Acme Corp'           },
  { id: 'contactName',     label: 'Contact Person',   type: 'text',     placeholder: 'Jane Smith'          },
  { id: 'email',           label: 'Business Email',   type: 'email',    placeholder: 'contact@company.com' },
  { id: 'phone',           label: 'Business Phone',   type: 'tel',      placeholder: '+27 11 000 0000'     },
  { id: 'regNumber',       label: 'Reg Number',       type: 'text',     placeholder: '2024/000000/07'      },
  { id: 'password',        label: 'Password',         type: 'password', placeholder: '••••••••'            },
  { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••'            },
]

export default function RegisterPage() {
  const { register }              = useAuth()
  const navigate                  = useNavigate()
  const [role, setRole]           = useState<'promoter' | 'business'>(ROLES.PROMOTER)
  const [form, setForm]           = useState<Record<string, string>>({})
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [focused, setFocused]     = useState<string | null>(null)

  const fields: Field[] = role === ROLES.PROMOTER ? PROMOTER_FIELDS : BUSINESS_FIELDS

  const handleChange = (id: string, value: string): void => {
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const switchRole = (newRole: 'promoter' | 'business'): void => {
    setRole(newRole)
    setForm({})
    setError(null)
  }

  const handleRegister = async (): Promise<void> => {
    if (!form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    const payload: RegisterPayload = {
      name:     form.fullName || form.contactName || '',
      email:    form.email,
      password: form.password,
      role:     role,
    }

    try {
      await register(payload)
      setSubmitted(true)
      const redirectMap: Record<string, string> = {
        [ROLES.PROMOTER]: '/promoter/jobs',
        [ROLES.BUSINESS]: '/business/jobs',
        [ROLES.ADMIN]:    '/admin/jobs',
      }
      setTimeout(() => navigate(redirectMap[role]), 1000)
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const accent       = role === ROLES.PROMOTER ? '#ffbe32'                : '#32c8ff'
  const accentFaint  = role === ROLES.PROMOTER ? 'rgba(255,190,50,0.08)'  : 'rgba(50,200,255,0.06)'
  const accentBorder = role === ROLES.PROMOTER ? 'rgba(255,190,50,0.35)'  : 'rgba(50,200,255,0.3)'
  const accentEnd    = role === ROLES.PROMOTER ? '#ff9500'                 : '#0096cc'

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif", padding: '40px 16px',
      position: 'relative', overflow: 'hidden',
    }}>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,190,50,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,190,50,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', borderRadius: '50%', zIndex: 0,
        background: role === ROLES.PROMOTER
          ? 'radial-gradient(ellipse, rgba(255,180,0,0.10) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(0,180,255,0.08) 0%, transparent 70%)',
        transition: 'background 0.6s ease', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block', fontSize: '11px', letterSpacing: '4px',
            textTransform: 'uppercase', color: accent,
            border: `1px solid ${accentBorder}`,
            padding: '6px 16px', borderRadius: '2px',
            marginBottom: '18px', transition: 'all 0.4s ease',
          }}>
            Create Account
          </div>
          <h1 style={{
            color: '#f5f0e8', fontSize: '30px', fontWeight: '400',
            margin: '0 0 8px', letterSpacing: '-0.5px',
          }}>
            Join the Platform
          </h1>
          <p style={{ color: '#555', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
            Select your role to get started
          </p>
        </div>

        <div style={{
          display: 'flex', background: '#111118',
          border: '1px solid #1e1e2e', borderRadius: '6px',
          padding: '4px', marginBottom: '28px', gap: '4px',
        }}>
          {(['promoter', 'business'] as const).map(r => (
            <button key={r} onClick={() => switchRole(r)} style={{
              flex: 1, padding: '12px',
              background: role === r ? accentFaint : 'transparent',
              border: role === r ? `1px solid ${accentBorder}` : '1px solid transparent',
              borderRadius: '4px',
              color: role === r ? accent : '#444',
              fontSize: '12px', letterSpacing: '2px',
              textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.3s ease', fontFamily: "'Georgia', serif",
            }}>
              {r === ROLES.PROMOTER ? '⚡ Promoter' : '🏢 Business'}
            </button>
          ))}
        </div>

        <div style={{
          background: '#0e0e16', border: '1px solid #1e1e2e',
          borderRadius: '8px', padding: '32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{
            background: accentFaint, border: `1px solid ${accentBorder}`,
            borderRadius: '4px', padding: '12px 16px',
            marginBottom: '24px', transition: 'all 0.4s ease',
          }}>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: accent }}>
              {role === ROLES.PROMOTER
                ? 'Register as a Promoter to view & accept jobs, check in to shifts, and track your earnings.'
                : 'Register as a Business to manage teams, monitor attendance, and oversee job assignments.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {fields.map((field: Field) => (
              <div key={`${role}-${field.id}`}>
                <label style={{
                  display: 'block', fontSize: '11px', letterSpacing: '2px',
                  textTransform: 'uppercase', marginBottom: '7px',
                  color: focused === field.id ? accent : '#444',
                  transition: 'color 0.2s ease',
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.id] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(field.id, e.target.value)
                  }
                  onFocus={() => setFocused(field.id)}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#080810',
                    border: focused === field.id
                      ? `1px solid ${accentBorder}` : '1px solid #1e1e2e',
                    borderRadius: '4px', padding: '12px 16px',
                    color: '#f0ece0', fontSize: '14px',
                    outline: 'none', fontFamily: "'Georgia', serif",
                    transition: 'border-color 0.2s ease',
                    boxShadow: focused === field.id ? `0 0 0 3px ${accentFaint}` : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <p style={{
              marginTop: '16px', marginBottom: 0,
              color: '#ff5555', fontSize: '13px', textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || submitted}
            style={{
              marginTop: '28px', width: '100%', padding: '15px',
              background: submitted
                ? accentFaint
                : `linear-gradient(135deg, ${accent}, ${accentEnd})`,
              border: submitted ? `1px solid ${accentBorder}` : 'none',
              borderRadius: '4px',
              color: submitted ? accent : '#0a0a0f',
              fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'Georgia', serif", fontWeight: '700',
              transition: 'all 0.3s ease',
              boxShadow: submitted ? 'none' : `0 8px 32px ${accentFaint}`,
            }}
          >
            {submitted ? '✓ Account Created!' : loading ? 'Registering...' : `Register as ${role === ROLES.PROMOTER ? 'Promoter' : 'Business'}`}
          </button>

          <p style={{
            textAlign: 'center', marginTop: '20px', marginBottom: 0,
            fontSize: '13px', color: '#444',
          }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{ color: accent, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign in
            </span>
          </p>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '11px', color: '#2a2a3a', letterSpacing: '1px',
        }}>
          ADMIN ACCOUNTS ARE CREATED BY INVITATION ONLY
        </p>
      </div>

      <style>{`
        input::placeholder { color: #2a2a3a; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #080810 inset !important;
          -webkit-text-fill-color: #f0ece0 !important;
        }
      `}</style>
    </div>
  )
}