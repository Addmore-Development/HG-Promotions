// Displays payment history and summary – now matching the new admin design.

import React, { useState, useEffect } from 'react';
import { useAuth }           from '../../shared/hooks/useAuth';
import { paymentsService }   from '../../shared/services/paymentsService';
import { Badge }             from '../../shared/components/Badge';
import { Table }             from '../../shared/components/Table';
import type { Payment, EarningsSummary } from '../../shared/types/payment.types';

// Updated admin‑style tokens
const G   = '#D4880A';
const GL  = '#E8A820';
const G2  = '#8B5A1A';
const B   = '#0C0A07';
const BC  = '#141008';
const BB  = 'rgba(212,136,10,0.12)';
const W   = '#FAF3E8';
const WM  = 'rgba(250,243,232,0.65)';
const WD  = 'rgba(250,243,232,0.28)';
const FD  = "'Playfair Display', Georgia, serif";
const FB  = "'DM Sans', system-ui, sans-serif";

// Status colors
const TEAL   = '#4AABB8';
const AMBER  = '#E8A820';
const CORAL  = '#C4614A';
const SKY    = '#5A9EC4';

export const ViewEarnings: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary,  setSummary]  = useState<EarningsSummary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      paymentsService.getPaymentsByPromoter(user.id),
      paymentsService.getEarningsSummary(user.id),
    ]).then(([p, s]) => { setPayments(p); setSummary(s); setLoading(false); });
  }, [user]);

  const statusBadge = (status: Payment['status']) => {
    const map: Record<Payment['status'], { variant: 'success'|'warning'|'neutral'|'gold'|'info'|'danger', label: string }> = {
      pending:    { variant:'warning', label:'Pending' },
      approved:   { variant:'info',    label:'Approved' },
      processing: { variant:'info',    label:'Processing' },
      paid:       { variant:'success', label:'Paid ✓' },
      failed:     { variant:'danger',  label:'Failed' },
    };
    const s = map[status] ?? { variant:'neutral' as const, label:status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', color: WD, padding:'60px 0', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${GL}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'15px', color:WM }}>Loading earnings…</span>
    </div>
  );

  const stats = [
    { label:'Total Earned', value:`R${(summary?.totalEarned ?? 0).toLocaleString()}`,  sub:'All time',         color: G },
    { label:'Pending',      value:`R${(summary?.totalPending ?? 0).toLocaleString()}`, sub:'Awaiting approval',color: AMBER },
    { label:'Paid Out',     value:`R${(summary?.totalPaid ?? 0).toLocaleString()}`,    sub:'Into your bank',   color: TEAL },
    { label:'Shifts Done',  value: String(summary?.shiftsCompleted ?? 0),              sub:'Completed',        color: SKY },
  ];

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header – exactly like admin's */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.38em', textTransform: 'uppercase', color: GL, marginBottom: 8, fontWeight: 700 }}>
            Payments
          </div>
          <h1 style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, color: W }}>My Earnings</h1>
          <p style={{ fontSize: 13, color: WM, marginTop: 6 }}>Track your payments and pending amounts in real time.</p>
        </div>
      </div>

      {/* Stat cards grid – identical to admin's */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: BB, marginBottom: 32 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: BC, padding: '24px 22px', position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)` }} />
            <div style={{ position:'absolute', top:0, right:0, width:60, height:60, background:`${stat.color}06`, borderRadius:'0 0 0 60px' }} />
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: WM, marginBottom: 10 }}>{stat.label}</div>
            <div style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, color: W, lineHeight: 1 }}>{stat.value}</div>
            {stat.sub && <div style={{ fontSize: 11, color: stat.color, marginTop: 8, fontWeight: 600 }}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* Bar chart – with admin styling */}
      {payments.length > 0 && (
        <div style={{ marginBottom: '32px', padding: '28px', background: BC, border: `1px solid ${BB}`, borderRadius: 2 }}>
          <h3 style={{ color: GL, fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20 }}>Payment Breakdown</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {payments.map(p => {
              const max = Math.max(...payments.map(x => x.netAmount));
              const h = (p.netAmount / max) * 80;
              return (
                <div key={p.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', height:`${h}px`, background: p.status === 'paid' ? `linear-gradient(180deg, ${G}, ${GL})` : `${AMBER}80`, borderRadius:'4px 4px 0 0', transition:'height 0.5s ease' }} />
                  <span style={{ color: WD, fontSize:10 }}>R{p.netAmount}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            {[{ c: G, l:'Paid' }, { c: `${AMBER}80`, l:'Pending' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:c }} />
                <span style={{ color: WD, fontSize:11 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table – admin style */}
      <div style={{ background: BC, border: `1px solid ${BB}`, overflow: 'hidden', borderRadius: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BB}` }}>
              {['Reference', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: WD, fontFamily: FB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? `1px solid ${BB}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ color: WD, fontFamily: 'monospace', fontSize: 12 }}>{p.reference || `HGP-${p.id.slice(-6).toUpperCase()}`}</span>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: WM }}>R{p.grossAmount}</td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: p.deductions > 0 ? CORAL : WD }}>
                  {p.deductions > 0 ? `-R${p.deductions}` : '—'}
                </td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: GL, fontWeight: 700 }}>R{p.netAmount}</td>
                <td style={{ padding: '14px 18px' }}>{statusBadge(p.status)}</td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: WM }}>
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-ZA') : <span style={{ color: WD }}>Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: WD, fontSize: 13 }}>No payments yet. Complete a shift to start earning.</div>
        )}
      </div>
    </div>
  );
};