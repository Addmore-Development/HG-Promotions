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

// Admin‑style tokens (same as admin settings)
const G   = '#D4880A';
const GL  = '#E8A820';
const G2  = '#8B5A1A';
const B   = '#0C0A07';
const BC  = '#141008';
const D2  = '#1A1508';   // card background
const D3  = '#221C0C';   // darker card
const BB  = 'rgba(212,136,10,0.12)';
const W   = '#FAF3E8';
const WM  = 'rgba(250,243,232,0.65)';
const WD  = 'rgba(250,243,232,0.28)';
const W28 = WD;
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";

// Status colors
const TEAL   = '#4AABB8';
const AMBER  = '#E8A820';
const CORAL  = '#C4614A';
const SKY    = '#5A9EC4';

// Input styles (matches admin)
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(250,243,232,0.05)',
  border: `1px solid ${BB}`, padding: '10px 14px',
  color: W, fontFamily: FB, fontSize: 13, outline: 'none',
  borderRadius: 2,
};
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
  textTransform: 'uppercase', color: WM, display: 'block', marginBottom: 7,
};

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
    <div style={{ display:'flex', alignItems:'center', gap:'12px', color: WD, padding:'60px 0', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${GL}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'15px', color:WM }}>Loading profile…</span>
    </div>
  );

  const displayName = profile?.fullName || user?.name || 'Promoter';
  const status      = profile?.onboardingStatus || sessionStatus;

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header – exactly like admin's settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>
            Profile
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, color: W }}>My Profile</h1>
        </div>
        <Button loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Success/error messages */}
      {error && (
        <div style={{
          padding: '12px 18px', background: `${CORAL}12`, border: `1px solid ${CORAL}44`,
          marginBottom: 20, fontSize: 13, color: CORAL, fontWeight: 600, borderRadius: 2,
        }}>
          {error}
        </div>
      )}

      {/* Rejection notice */}
      {status === 'rejected' && profile?.rejectionReason && (
        <div style={{
          padding: '12px 18px', background: `${CORAL}12`, border: `1px solid ${CORAL}44`,
          marginBottom: 20, fontSize: 13, color: CORAL, fontWeight: 600, borderRadius: 2,
        }}>
          <strong>Reason:</strong> {profile.rejectionReason}. Please contact support or update your documents.
        </div>
      )}

      {/* Identity Card – premium card with top accent */}
      <div style={{ background: D2, border: `1px solid ${BB}`, borderRadius: 2, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GL}, ${G2})` }} />
        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: `linear-gradient(135deg, ${G}, ${GL})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 900, color: B,
              border: `2px solid ${GL}80`,
            }}>
              {profile?.profilePhoto
                ? <img src={profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ color: W, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>{displayName}</h3>
              <p style={{ color: WM, fontSize: 14, margin: '0 0 2px' }}>{user?.email}</p>
              {(profile?.city || form.city) && (profile?.province || form.province) && (
                <p style={{ color: WD, fontSize: 13, margin: 0 }}>
                  📍 {profile?.city || form.city}, {profile?.province || form.province}
                </p>
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>{statusBadge()}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 20 }}>
            {[
              { label: 'Reliability',   value: profile?.reliabilityScore ? `⭐ ${profile.reliabilityScore}/5` : 'No rating yet' },
              { label: 'Member Since',  value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) : '—' },
              { label: 'ID Number',     value: profile?.idNumber ? `${profile.idNumber.slice(0, 6)}••••` : '—' },
            ].map(row => (
              <div key={row.label}>
                <p style={{ color: WD, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{row.label}</p>
                <p style={{ color: W, fontSize: 14, fontWeight: 600, margin: 0 }}>{row.value}</p>
              </div>
            ))}
          </div>

          {(profile?.physicalAttributes?.height ?? 0) > 0 && (
            <div style={{ paddingTop: 20, borderTop: `1px solid ${BB}`, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                { label: 'Height',   value: `${profile!.physicalAttributes.height}cm` },
                { label: 'Clothing', value: profile!.physicalAttributes.clothingSize || '—' },
                { label: 'Shoe',     value: profile!.physicalAttributes.shoeSize     || '—' },
              ].map(a => (
                <div key={a.label}>
                  <p style={{ color: WD, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 3px' }}>{a.label}</p>
                  <p style={{ color: GL, fontSize: 16, fontWeight: 700, margin: 0 }}>{a.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document change notice */}
      <div style={{ padding: '16px 20px', background: `${GL}0f`, border: `1px solid ${GL}30`, borderRadius: 2, marginBottom: 24 }}>
        <p style={{ color: GL, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          📎 <strong>Documents:</strong> To update your ID, photos, or CV, please contact support. Document changes require admin review before taking effect.
        </p>
      </div>

      {/* Editable sections – grid of cards like admin settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: BB }}>
        {/* Location */}
        <div style={{ background: D2, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, marginBottom: 20, fontWeight: 700 }}>Location</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>City</label>
            <input
              style={inputStyle}
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="e.g. Johannesburg"
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
          <div>
            <label style={labelStyle}>Province</label>
            <select
              style={{ ...inputStyle, background: D3, cursor: 'pointer' }}
              value={form.province}
              onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
            >
              <option value="">Select</option>
              {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Physical Attributes */}
        <div style={{ background: D2, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, marginBottom: 20, fontWeight: 700 }}>Physical Attributes</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Height (cm)</label>
              <input
                style={inputStyle}
                value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                placeholder="168"
                onFocus={e => e.currentTarget.style.borderColor = GL}
                onBlur={e => e.currentTarget.style.borderColor = BB}
              />
            </div>
            <div>
              <label style={labelStyle}>Clothing Size</label>
              <input
                style={inputStyle}
                value={form.clothingSize}
                onChange={e => setForm(f => ({ ...f, clothingSize: e.target.value }))}
                placeholder="S/M/L"
                onFocus={e => e.currentTarget.style.borderColor = GL}
                onBlur={e => e.currentTarget.style.borderColor = BB}
              />
            </div>
            <div>
              <label style={labelStyle}>Shoe Size</label>
              <input
                style={inputStyle}
                value={form.shoeSize}
                onChange={e => setForm(f => ({ ...f, shoeSize: e.target.value }))}
                placeholder="7"
                onFocus={e => e.currentTarget.style.borderColor = GL}
                onBlur={e => e.currentTarget.style.borderColor = BB}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div style={{ background: D2, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, marginBottom: 20, fontWeight: 700 }}>Social Media</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Instagram</label>
            <input
              style={inputStyle}
              value={form.instagram}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              placeholder="@handle"
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
          <div>
            <label style={labelStyle}>TikTok</label>
            <input
              style={inputStyle}
              value={form.tiktok}
              onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))}
              placeholder="@handle"
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
        </div>

        {/* Banking Details */}
        <div style={{ background: D2, padding: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GL, marginBottom: 20, fontWeight: 700 }}>Banking Details</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Bank</label>
            <select
              style={{ ...inputStyle, background: D3, cursor: 'pointer' }}
              value={form.bankName}
              onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
            >
              <option value="">Select bank</option>
              {['Standard Bank','Absa','FNB','Nedbank','Capitec','African Bank','Investec','Discovery Bank'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Account Number</label>
            <input
              style={inputStyle}
              value={form.accountNumber}
              onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
              placeholder="1234567890"
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Account Type</label>
            <select
              style={{ ...inputStyle, background: D3, cursor: 'pointer' }}
              value={form.accountType}
              onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
            >
              <option value="Cheque">Cheque / Current</option>
              <option value="Savings">Savings</option>
              <option value="Transmission">Transmission</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Branch Code</label>
            <input
              style={inputStyle}
              value={form.branchCode}
              onChange={e => setForm(f => ({ ...f, branchCode: e.target.value }))}
              placeholder="051001"
              onFocus={e => e.currentTarget.style.borderColor = GL}
              onBlur={e => e.currentTarget.style.borderColor = BB}
            />
          </div>
        </div>
      </div>
    </div>
  );
};