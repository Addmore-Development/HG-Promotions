import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/hooks/useAuth';
import { usersService } from '../../shared/services/usersService';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import type { UserProfile } from '../../shared/types/user.types';

export const EditOwnProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    city: '', province: '',
    height: '', clothingSize: '', shoeSize: '',
    instagram: '', tiktok: '',
    bankName: '', accountNumber: '', accountType: '', branchCode: '',
  });

  useEffect(() => {
    if (!user) return;
    usersService.getProfile(user.id).then(p => {
      setProfile(p);
      if (p) {
        setForm({
          city: p.city ?? '',
          province: p.province ?? '',
          height: String(p.physicalAttributes.height ?? ''),
          clothingSize: p.physicalAttributes.clothingSize ?? '',
          shoeSize: p.physicalAttributes.shoeSize ?? '',
          instagram: p.socialMedia?.instagram ?? '',
          tiktok: p.socialMedia?.tiktok ?? '',
          bankName: p.bankDetails?.bankName ?? '',
          accountNumber: p.bankDetails?.accountNumber ?? '',
          accountType: p.bankDetails?.accountType ?? 'Cheque',
          branchCode: p.bankDetails?.branchCode ?? '',
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await usersService.updateProfile(user.id, {
      city: form.city,
      province: form.province,
      physicalAttributes: { height: Number(form.height), clothingSize: form.clothingSize, shoeSize: form.shoeSize },
      socialMedia: { instagram: form.instagram, tiktok: form.tiktok },
      bankDetails: { bankName: form.bankName, accountNumber: form.accountNumber, accountType: form.accountType, branchCode: form.branchCode },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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

  const onboardingBadge = () => {
    if (!profile) return null;
    const variants: Record<string, { variant: 'warning' | 'success' | 'danger' | 'neutral', label: string }> = {
      pending_review: { variant: 'warning', label: '⏳ Pending Review' },
      approved:       { variant: 'success', label: '✅ Approved' },
      rejected:       { variant: 'danger', label: '❌ Rejected' },
      incomplete:     { variant: 'neutral', label: '📝 Incomplete' },
      blacklisted:    { variant: 'danger', label: '🚫 Blacklisted' },
    };
    const s = variants[profile.onboardingStatus] ?? { variant: 'neutral' as const, label: profile.onboardingStatus };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) return <div style={{ color: '#666', padding: '60px 0' }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>My Profile</h1>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Keep your profile up to date to match more jobs.</p>
        </div>
        {onboardingBadge()}
      </div>

      {profile?.onboardingStatus === 'rejected' && profile.rejectionReason && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>
            <strong>Rejection reason:</strong> {profile.rejectionReason}. Please update your documents and resubmit.
          </p>
        </div>
      )}

      {/* Read-only info */}
      {profile && (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, color: '#0A0A0A', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {profile.profilePhoto
                ? <img src={profile.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.fullName?.charAt(0) ?? '?'
              }
            </div>
            <div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>{profile.fullName || 'New Promoter'}</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{user?.mobile}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Reliability', value: profile.reliabilityScore ? `⭐ ${profile.reliabilityScore}/5` : 'No rating yet' },
              { label: 'Member since', value: new Date(profile.createdAt || Date.now()).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) },
              { label: 'Province', value: profile.province || '—' },
            ].map(row => (
              <div key={row.label}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{row.label}</p>
                <p style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600, margin: 0 }}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable fields */}
      <h3 style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>Location</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>City</label>
          <input style={fieldStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Province</label>
          <select style={fieldStyle} value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
            <option value="">Select</option>
            {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <h3 style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px', marginTop: '8px' }}>Physical Attributes</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
        {[
          { key: 'height' as const, label: 'Height (cm)', placeholder: '168' },
          { key: 'clothingSize' as const, label: 'Clothing Size', placeholder: 'S/M/L' },
          { key: 'shoeSize' as const, label: 'Shoe Size', placeholder: '7' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{f.label}</label>
            <input style={fieldStyle} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
          </div>
        ))}
      </div>

      <h3 style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px', marginTop: '8px' }}>Social Media</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {[{ key: 'instagram' as const, label: 'Instagram', placeholder: '@handle' }, { key: 'tiktok' as const, label: 'TikTok', placeholder: '@handle' }].map(f => (
          <div key={f.key} style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{f.label}</label>
            <input style={fieldStyle} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
          </div>
        ))}
      </div>

      <h3 style={{ color: '#D4AF37', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px', marginTop: '8px' }}>Banking Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {[
          { key: 'bankName' as const, label: 'Bank' },
          { key: 'accountNumber' as const, label: 'Account Number' },
          { key: 'accountType' as const, label: 'Account Type' },
          { key: 'branchCode' as const, label: 'Branch Code' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{f.label}</label>
            <input style={fieldStyle} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
        <Button loading={saving} onClick={handleSave}>Save Changes</Button>
        {saved && <span style={{ color: '#4ade80', fontSize: '13px' }}>✓ Saved successfully</span>}
      </div>
    </div>
  );
};