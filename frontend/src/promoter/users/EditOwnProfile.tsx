// promoter/users/EditOwnProfile.tsx
// Shows the logged-in promoter's profile — read-only header + editable fields.
// Saves to localStorage via usersService. Never throws "profile not found".
// Document changes are flagged for admin review (not saved directly).

import React, { useState, useEffect } from 'react';
import { useAuth }          from '../../shared/hooks/useAuth';
import { usersService }     from '../../shared/services/usersService';
import { Button }           from '../../shared/components/Button';
import { Badge }            from '../../shared/components/Badge';
import { showToast }        from '../../shared/utils/toast';
import type { UserProfile } from '../../shared/types/user.types';

// Admin‑style tokens
const G = '#D4880A';
const GL = '#E8A820';
const G2 = '#8B5A1A';
const B = '#0C0A07';
const BC = '#1A1508';
const BB = 'rgba(212,136,10,0.14)';
const W = '#FAF3E8';
const WM = 'rgba(250,243,232,0.55)';
const WD = 'rgba(250,243,232,0.28)';
const FB = "'DM Sans', system-ui, sans-serif";
const FD = "'Playfair Display', Georgia, serif";

// Status colors
const TEAL = '#4AABB8';
const AMBER = '#E8A820';
const CORAL = '#C4614A';
const SKY = '#5A9EC4';

export const EditOwnProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [form, setForm] = useState({
    city: '', province: '',
    height: '', clothingSize: '', shoeSize: '',
    instagram: '', tiktok: '',
    bankName: '', accountNumber: '', accountType: 'Cheque', branchCode: '',
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    usersService.getProfile(user.id).then(p => {
      setProfile(p);
      if (p) {
        setForm({
          city:          p.city ?? '',
          province:      p.province ?? '',
          height:        String(p.physicalAttributes?.height || ''),
          clothingSize:  p.physicalAttributes?.clothingSize ?? '',
          shoeSize:      p.physicalAttributes?.shoeSize ?? '',
          instagram:     p.socialMedia?.instagram ?? '',
          tiktok:        p.socialMedia?.tiktok ?? '',
          bankName:      p.bankDetails?.bankName ?? '',
          accountNumber: p.bankDetails?.accountNumber ?? '',
          accountType:   p.bankDetails?.accountType ?? 'Cheque',
          branchCode:    p.bankDetails?.branchCode ?? '',
        });
      }
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await usersService.updateProfile(user.id, {
        city:     form.city,
        province: form.province,
        physicalAttributes: {
          height:       Number(form.height) || 0,
          clothingSize: form.clothingSize,
          shoeSize:     form.shoeSize,
        },
        socialMedia: {
          instagram: form.instagram,
          tiktok:    form.tiktok,
        },
        bankDetails: {
          bankName:      form.bankName,
          accountNumber: form.accountNumber,
          accountType:   form.accountType,
          branchCode:    form.branchCode,
        },
      });
      setProfile(updated);
      showToast('Profile saved successfully', 'success');
    } catch (e) {
      setError('Failed to save. Please try again.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Styles
  const fs: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BB}`,
    borderRadius: '8px', color: W, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };
  const ls: React.CSSProperties = {
    display: 'block', color: WM, fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px',
  };
  const SH = ({ t }: { t: string }) => (
    <h3 style={{ color: GL, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '28px 0 16px' }}>{t}</h3>
  );

  const statusBadge = () => {
    if (!profile) return null;
    const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'neutral'; label: string }> = {
      pending_review: { variant: 'warning', label: '⏳ Under Review' },
      approved:       { variant: 'success', label: '✅ Approved' },
      rejected:       { variant: 'danger',  label: '❌ Rejected' },
      incomplete:     { variant: 'neutral', label: '📝 Incomplete' },
      blacklisted:    { variant: 'danger',  label: '🚫 Suspended' },
    };
    const s = map[profile.onboardingStatus] ?? { variant: 'neutral' as const, label: profile.onboardingStatus };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const sessionStatus = (() => {
    try { return JSON.parse(localStorage.getItem('hg_session') || '{}').status || ''; } catch { return ''; }
  })();

  if (loading) return (
    <div style={{ color: WD, padding: '60px 0', textAlign: 'center' }}>Loading profile…</div>
  );

  const displayName = profile?.fullName || user?.name || 'Promoter';
  const status      = profile?.onboardingStatus || sessionStatus;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 30px' }}>
      {/* Header with badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: W, fontSize: '28px', fontWeight: 800, margin: '0 0 6px' }}>My Profile</h1>
          <p style={{ color: WM, fontSize: '14px', margin: 0 }}>Keep your details up to date to match more jobs.</p>
        </div>
        {statusBadge()}
      </div>

      {/* Rejection notice */}
      {status === 'rejected' && profile?.rejectionReason && (
        <div style={{ padding: '16px 20px', background: `${CORAL}12`, border: `1px solid ${CORAL}44`, borderRadius: '12px', marginBottom: '28px' }}>
          <p style={{ color: CORAL, fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            <strong>Reason:</strong> {profile.rejectionReason}. Please contact support or update your documents.
          </p>
        </div>
      )}

      {/* Identity Card */}
      <div style={{ padding: '36px', background: BC, border: `1px solid ${BB}`, borderRadius: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: `linear-gradient(135deg, ${G}, ${GL})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 900, color: B,
            border: `2px solid ${GL}80`,
          }}>
            {profile?.profilePhoto
              ? <img src={profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ color: W, fontWeight: 700, fontSize: '22px', margin: '0 0 6px' }}>{displayName}</h3>
            <p style={{ color: WM, fontSize: '15px', margin: '0 0 3px' }}>{user?.email}</p>
            {(profile?.city || form.city) && (profile?.province || form.province) && (
              <p style={{ color: WD, fontSize: '14px', margin: 0 }}>
                📍 {profile?.city || form.city}, {profile?.province || form.province}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {[
            { label: 'Reliability',   value: profile?.reliabilityScore ? `⭐ ${profile.reliabilityScore}/5` : 'No rating yet' },
            { label: 'Member Since',  value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) : '—' },
            { label: 'ID Number',     value: profile?.idNumber ? `${profile.idNumber.slice(0, 6)}••••` : '—' },
          ].map(row => (
            <div key={row.label}>
              <p style={{ color: WD, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{row.label}</p>
              <p style={{ color: W, fontSize: '15px', fontWeight: 600, margin: 0 }}>{row.value}</p>
            </div>
          ))}
        </div>

        {(profile?.physicalAttributes?.height ?? 0) > 0 && (
          <div style={{ paddingTop: '24px', borderTop: `1px solid ${BB}`, display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {[
              { label: 'Height',   value: `${profile!.physicalAttributes.height}cm` },
              { label: 'Clothing', value: profile!.physicalAttributes.clothingSize || '—' },
              { label: 'Shoe',     value: profile!.physicalAttributes.shoeSize     || '—' },
            ].map(a => (
              <div key={a.label}>
                <p style={{ color: WD, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 3px' }}>{a.label}</p>
                <p style={{ color: GL, fontSize: '18px', fontWeight: 700, margin: 0 }}>{a.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document change notice */}
      <div style={{ padding: '18px 24px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BB}`, borderRadius: '16px', marginBottom: '12px' }}>
        <p style={{ color: WD, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
          📎 <strong style={{ color: WM }}>Documents:</strong> To update your ID, photos, or CV, please contact support. Document changes require admin review before taking effect.
        </p>
      </div>

      {/* Editable Sections with Cards */}
      <div style={{ marginTop: '40px' }}>
        {/* Location */}
        <div style={{ background: BC, borderRadius: '24px', padding: '32px', marginBottom: '20px', border: `1px solid ${BB}` }}>
          <SH t="Location" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={ls}>City</label>
              <input style={fs} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Johannesburg" />
            </div>
            <div>
              <label style={ls}>Province</label>
              <select style={fs} value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
                <option value="">Select</option>
                {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Physical Attributes */}
        <div style={{ background: BC, borderRadius: '24px', padding: '32px', marginBottom: '20px', border: `1px solid ${BB}` }}>
          <SH t="Physical Attributes" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { key: 'height'      as const, label: 'Height (cm)',   ph: '168' },
              { key: 'clothingSize'as const, label: 'Clothing Size', ph: 'S/M/L' },
              { key: 'shoeSize'    as const, label: 'Shoe Size',     ph: '7' },
            ].map(f => (
              <div key={f.key}>
                <label style={ls}>{f.label}</label>
                <input style={fs} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} />
              </div>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div style={{ background: BC, borderRadius: '24px', padding: '32px', marginBottom: '20px', border: `1px solid ${BB}` }}>
          <SH t="Social Media" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { key: 'instagram' as const, label: 'Instagram', ph: '@handle' },
              { key: 'tiktok'    as const, label: 'TikTok',    ph: '@handle' },
            ].map(f => (
              <div key={f.key}>
                <label style={ls}>{f.label}</label>
                <input style={fs} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} />
              </div>
            ))}
          </div>
        </div>

        {/* Banking Details */}
        <div style={{ background: BC, borderRadius: '24px', padding: '32px', marginBottom: '28px', border: `1px solid ${BB}` }}>
          <SH t="Banking Details" />
          <div style={{ padding: '18px 24px', background: `${GL}0f`, border: `1px solid ${GL}30`, borderRadius: '14px', marginBottom: '28px' }}>
            <p style={{ color: GL, fontSize: '14px', margin: 0, lineHeight: 1.6 }}>🔒 Encrypted and POPIA compliant. Used only for EFT payroll disbursements.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={ls}>Bank</label>
              <select style={fs} value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}>
                <option value="">Select bank</option>
                {['Standard Bank','Absa','FNB','Nedbank','Capitec','African Bank','Investec','Discovery Bank'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={ls}>Account Number</label>
              <input style={fs} value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="e.g. 1234567890" />
            </div>
            <div>
              <label style={ls}>Account Type</label>
              <select style={fs} value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}>
                <option value="Cheque">Cheque / Current</option>
                <option value="Savings">Savings</option>
                <option value="Transmission">Transmission</option>
              </select>
            </div>
            <div>
              <label style={ls}>Branch Code</label>
              <input style={fs} value={form.branchCode} onChange={e => setForm(f => ({ ...f, branchCode: e.target.value }))} placeholder="e.g. 051001" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '20px', paddingBottom: '60px' }}>
          <Button loading={saving} onClick={handleSave} style={{ padding: '14px 40px', fontSize: '15px' }}>Save Changes</Button>
          {error && <span style={{ color: CORAL, fontSize: '14px' }}>{error}</span>}
        </div>
      </div>
    </div>
  );
};