import React, { useState } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { usersService } from '../../shared/services/usersService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import type { UserProfile } from '../../shared/types/user.types';

type OnboardingStep = 'profile' | 'documents' | 'bank' | 'review';

const STEPS: { id: OnboardingStep; label: string; icon: string }[] = [
  { id: 'profile',   label: 'Personal Info',  icon: '👤' },
  { id: 'documents', label: 'Documents',       icon: '📄' },
  { id: 'bank',      label: 'Banking',         icon: '🏦' },
  { id: 'review',    label: 'Submit',          icon: '✅' },
];

interface Props { onComplete?: () => void; }

export const RegisterUploadDocs: React.FC<Props> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    fullName: '', idNumber: '', dateOfBirth: '', gender: 'female' as 'male'|'female'|'other',
    address: '', city: '', province: '',
    height: '', clothingSize: '', shoeSize: '',
    instagram: '', tiktok: '',
  });

  const [docs, setDocs] = useState({
    idFront: '', idBack: '', taxNumber: '', bankConfirmation: '', cv: '',
    photo1: '', photo2: '', photo3: '',
  });

  const [bank, setBank] = useState({
    bankName: '', accountNumber: '', accountType: 'Cheque', branchCode: '',
  });

  const currentIdx = STEPS.findIndex(s => s.id === step);

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#fff', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#a0a0a0', fontSize: '11px',
    fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', marginBottom: '6px',
  };

  const fieldGroup = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      {input}
    </div>
  );

  // Simulate file upload — stores filename as mock URL
  const handleFileUpload = (field: keyof typeof docs, file: File | null) => {
    if (!file) return;
    setDocs(d => ({ ...d, [field]: `mock://${file.name}` }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const profileData: Partial<UserProfile> = {
        userId: user.id,
        fullName: profile.fullName,
        idNumber: profile.idNumber,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        address: profile.address,
        city: profile.city,
        province: profile.province,
        physicalAttributes: {
          height: Number(profile.height),
          clothingSize: profile.clothingSize,
          shoeSize: profile.shoeSize,
        },
        documents: {
          idFront: docs.idFront,
          idBack: docs.idBack,
          taxNumber: docs.taxNumber,
          bankConfirmation: docs.bankConfirmation,
          cv: docs.cv,
          profilePhotos: [docs.photo1, docs.photo2, docs.photo3].filter(Boolean),
        },
        bankDetails: {
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          accountType: bank.accountType,
          branchCode: bank.branchCode,
        },
        socialMedia: { instagram: profile.instagram, tiktok: profile.tiktok },
        reliabilityScore: 0,
      };
      await usersService.submitOnboarding(user.id, profileData);
      setSubmitted(true);
      onComplete?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h2 style={{ color: '#D4AF37', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
          Application Submitted!
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '15px', maxWidth: '400px', margin: '0 auto 24px' }}>
          Your documents are under review. You'll be notified within 24–48 hours once our admin team has reviewed your profile.
        </p>
        <Badge variant="warning">Pending Review</Badge>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
        Complete Your Profile
      </h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
        Complete all steps to unlock the job feed. This takes less than 5 minutes.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '36px' }}>
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const active = s.id === step;
          return (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: '-50%', top: '16px', width: '100%', height: '2px', background: done ? '#D4AF37' : 'rgba(255,255,255,0.1)' }} />}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: done ? '#D4AF37' : active ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                border: active ? '2px solid #D4AF37' : done ? 'none' : '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', position: 'relative', zIndex: 1,
                color: done ? '#0A0A0A' : active ? '#D4AF37' : '#555',
                fontWeight: 700,
              }}>
                {done ? '✓' : s.icon}
              </div>
              <span style={{ fontSize: '10px', color: active ? '#D4AF37' : '#555', marginTop: '6px', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step: Personal Info */}
      {step === 'profile' && (
        <div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {fieldGroup('Full Name', <input style={fieldStyle} value={profile.fullName} onChange={e => setProfile(p => ({...p, fullName: e.target.value}))} placeholder="As per your SA ID" />)}
            {fieldGroup('SA ID Number', <input style={fieldStyle} value={profile.idNumber} onChange={e => setProfile(p => ({...p, idNumber: e.target.value}))} placeholder="13 digits" maxLength={13} />)}
            {fieldGroup('Date of Birth', <input style={fieldStyle} type="date" value={profile.dateOfBirth} onChange={e => setProfile(p => ({...p, dateOfBirth: e.target.value}))} />)}
            {fieldGroup('Gender', (
              <select style={fieldStyle} value={profile.gender} onChange={e => setProfile(p => ({...p, gender: e.target.value as 'male'|'female'|'other'}))}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            ))}
          </div>
          {fieldGroup('Physical Address', <input style={fieldStyle} value={profile.address} onChange={e => setProfile(p => ({...p, address: e.target.value}))} placeholder="Street address" />)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {fieldGroup('City', <input style={fieldStyle} value={profile.city} onChange={e => setProfile(p => ({...p, city: e.target.value}))} placeholder="e.g. Johannesburg" />)}
            {fieldGroup('Province', (
              <select style={fieldStyle} value={profile.province} onChange={e => setProfile(p => ({...p, province: e.target.value}))}>
                <option value="">Select province</option>
                {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ))}
          </div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 20px' }}>Physical Attributes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            {fieldGroup('Height (cm)', <input style={fieldStyle} type="number" value={profile.height} onChange={e => setProfile(p => ({...p, height: e.target.value}))} placeholder="e.g. 168" />)}
            {fieldGroup('Clothing Size', <input style={fieldStyle} value={profile.clothingSize} onChange={e => setProfile(p => ({...p, clothingSize: e.target.value}))} placeholder="XS/S/M/L/XL" />)}
            {fieldGroup('Shoe Size', <input style={fieldStyle} value={profile.shoeSize} onChange={e => setProfile(p => ({...p, shoeSize: e.target.value}))} placeholder="e.g. 7" />)}
          </div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 20px' }}>Social Media (Optional)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {fieldGroup('Instagram', <input style={fieldStyle} value={profile.instagram} onChange={e => setProfile(p => ({...p, instagram: e.target.value}))} placeholder="@handle" />)}
            {fieldGroup('TikTok', <input style={fieldStyle} value={profile.tiktok} onChange={e => setProfile(p => ({...p, tiktok: e.target.value}))} placeholder="@handle" />)}
          </div>
        </div>
      )}

      {/* Step: Documents */}
      {step === 'documents' && (
        <div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Document Vault</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>All documents must be clear and legible. Max 5MB each. PDF, JPG, or PNG.</p>
          {[
            { key: 'idFront' as const, label: 'SA ID — Front', required: true },
            { key: 'idBack' as const, label: 'SA ID — Back', required: true },
            { key: 'taxNumber' as const, label: 'Tax Certificate / Number', required: true },
            { key: 'bankConfirmation' as const, label: 'Bank Confirmation Letter', required: true, note: 'Must be < 3 months old' },
            { key: 'cv' as const, label: 'CV / Resumé', required: false },
          ].map(doc => (
            <div key={doc.key} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${docs[doc.key] ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: 600 }}>
                  {doc.label} {doc.required && <span style={{ color: '#f87171' }}>*</span>}
                </div>
                {doc.note && <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{doc.note}</div>}
                {docs[doc.key] && <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px' }}>✓ Uploaded</div>}
              </div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFileUpload(doc.key, e.target.files?.[0] ?? null)} />
                <span style={{ padding: '8px 16px', background: docs[doc.key] ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: docs[doc.key] ? '#D4AF37' : '#a0a0a0', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {docs[doc.key] ? 'Replace' : 'Upload'}
                </span>
              </label>
            </div>
          ))}

          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '24px 0 8px' }}>Profile Photos (min. 1, max. 3)</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>Professional headshots. Use your camera or gallery.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['photo1','photo2','photo3'] as const).map((p, i) => (
              <label key={p} style={{ cursor: 'pointer', flex: 1 }}>
                <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={e => handleFileUpload(p, e.target.files?.[0] ?? null)} />
                <div style={{ aspectRatio: '3/4', background: docs[p] ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)', border: `2px dashed ${docs[p] ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{docs[p] ? '✅' : '📸'}</span>
                  <span style={{ color: '#666', fontSize: '11px', textAlign: 'center' }}>Photo {i + 1}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step: Banking */}
      {step === 'bank' && (
        <div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Banking Details</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>Your earnings will be paid directly into this account via EFT.</p>
          {fieldGroup('Bank Name', (
            <select style={fieldStyle} value={bank.bankName} onChange={e => setBank(b => ({...b, bankName: e.target.value}))}>
              <option value="">Select bank</option>
              {['Standard Bank','Absa','FNB','Nedbank','Capitec','African Bank','Investec','Discovery Bank'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          ))}
          {fieldGroup('Account Number', <input style={fieldStyle} value={bank.accountNumber} onChange={e => setBank(b => ({...b, accountNumber: e.target.value}))} placeholder="e.g. 012345678" />)}
          {fieldGroup('Account Type', (
            <select style={fieldStyle} value={bank.accountType} onChange={e => setBank(b => ({...b, accountType: e.target.value}))}>
              <option value="Cheque">Cheque / Current</option>
              <option value="Savings">Savings</option>
              <option value="Transmission">Transmission</option>
            </select>
          ))}
          {fieldGroup('Branch Code', <input style={fieldStyle} value={bank.branchCode} onChange={e => setBank(b => ({...b, branchCode: e.target.value}))} placeholder="e.g. 051001" />)}

          <div style={{ padding: '14px 16px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', marginTop: '8px' }}>
            <p style={{ color: '#D4AF37', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>
              ℹ️ Your banking details are encrypted and stored securely in compliance with POPIA. They will only be used for payroll disbursements.
            </p>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div>
          <h3 style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>Review & Submit</h3>
          {[
            { label: 'Full Name', value: profile.fullName },
            { label: 'ID Number', value: profile.idNumber ? `${profile.idNumber.slice(0,6)}****${profile.idNumber.slice(-3)}` : '-' },
            { label: 'City', value: [profile.city, profile.province].filter(Boolean).join(', ') },
            { label: 'Height', value: profile.height ? `${profile.height}cm` : '-' },
            { label: 'Documents', value: `${Object.values(docs).filter(Boolean).length} file(s) uploaded` },
            { label: 'Bank', value: bank.bankName || '-' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#666', fontSize: '13px' }}>{row.label}</span>
              <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{row.value || <span style={{ color: '#f87171' }}>Missing</span>}</span>
            </div>
          ))}

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', marginTop: '20px' }}>
            <p style={{ color: '#a0a0a0', fontSize: '12px', lineHeight: 1.7, margin: 0 }}>
              By submitting, you confirm all information is accurate and you consent to Honey Group processing your data in accordance with <strong style={{ color: '#D4AF37' }}>POPIA</strong>. Your application will be reviewed within 24–48 hours.
            </p>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', gap: '12px' }}>
        {currentIdx > 0 ? (
          <Button variant="ghost" onClick={() => setStep(STEPS[currentIdx - 1].id)}>← Back</Button>
        ) : <div />}
        {step !== 'review' ? (
          <Button onClick={() => setStep(STEPS[currentIdx + 1].id)}>Continue →</Button>
        ) : (
          <Button loading={loading} onClick={handleSubmit}>Submit Application</Button>
        )}
      </div>
    </div>
  );
};