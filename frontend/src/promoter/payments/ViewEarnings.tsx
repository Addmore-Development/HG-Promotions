// promoter/payments/ViewEarnings.tsx
// Displays payment history and summary – now using unified admin color palette.

import React, { useState, useEffect } from 'react';
import { useAuth }           from '../../shared/hooks/useAuth';
import { paymentsService }   from '../../shared/services/paymentsService';
import { Badge }             from '../../shared/components/Badge';
import { Table }             from '../../shared/components/Table';
import type { Payment, EarningsSummary } from '../../shared/types/payment.types';

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

  if (loading) return <div style={{ color: WD, padding: '60px 0' }}>Loading earnings…</div>;

  const stats = [
    { label:'Total Earned', value:`R${(summary?.totalEarned ?? 0).toLocaleString()}`,  sub:'All time',         color: G },
    { label:'Pending',      value:`R${(summary?.totalPending ?? 0).toLocaleString()}`, sub:'Awaiting approval',color: AMBER },
    { label:'Paid Out',     value:`R${(summary?.totalPaid ?? 0).toLocaleString()}`,    sub:'Into your bank',   color: TEAL },
    { label:'Shifts Done',  value: String(summary?.shiftsCompleted ?? 0),              sub:'Completed',        color: SKY },
  ];

  return (
    <div>
      <h1 style={{ color: W, fontSize: '28px', fontWeight: 800, margin: '0 0 6px' }}>My Earnings</h1>
      <p style={{ color: WM, fontSize: '15px', marginBottom: '32px' }}>Track your payments and pending amounts in real time.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '16px', marginBottom: '36px' }}>
        {stats.map(c => (
          <div key={c.label} style={{ padding: '24px', background: BC, border: `1px solid ${BB}`, borderRadius: '20px' }}>
            <p style={{ color: WM, fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 8px' }}>{c.label}</p>
            <p style={{ color: c.color, fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>{c.value}</p>
            <p style={{ color: WD, fontSize: '12px', margin: 0 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div style={{ marginBottom: '32px', padding: '28px', background: BC, border: `1px solid ${BB}`, borderRadius: '24px' }}>
          <h3 style={{ color: GL, fontSize: '12px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '20px' }}>Payment Breakdown</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
            {payments.map(p => {
              const max = Math.max(...payments.map(x => x.netAmount));
              const h = (p.netAmount / max) * 80;
              return (
                <div key={p.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', height:`${h}px`, background: p.status === 'paid' ? `linear-gradient(180deg, ${G}, ${GL})` : `${AMBER}80`, borderRadius:'4px 4px 0 0', transition:'height 0.5s ease' }} />
                  <span style={{ color: WD, fontSize:'10px' }}>R{p.netAmount}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            {[{ c: G, l:'Paid' },{ c: `${AMBER}80`, l:'Pending' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'2px', background:c }} />
                <span style={{ color: WD, fontSize:'11px' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Table
        columns={[
          { key:'id',          header:'Reference',  render: p => <span style={{ color: WD, fontFamily:'monospace', fontSize:'12px' }}>{p.reference || `HGP-${p.id.slice(-6).toUpperCase()}`}</span> },
          { key:'grossAmount', header:'Gross',      render: p => `R${p.grossAmount}` },
          { key:'deductions',  header:'Deductions', render: p => p.deductions > 0 ? <span style={{ color: CORAL }}>-R{p.deductions}</span> : <span style={{ color: WD }}>—</span> },
          { key:'netAmount',   header:'Net Pay',    render: p => <strong style={{ color: GL }}>R{p.netAmount}</strong> },
          { key:'status',      header:'Status',     render: p => statusBadge(p.status) },
          { key:'paidAt',      header:'Date',       render: p => p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-ZA') : <span style={{ color: WD }}>Pending</span> },
        ]}
        data={payments}
        rowKey={p => p.id}
        emptyMessage="No payments yet. Complete a shift to start earning."
      />
    </div>
  );
};