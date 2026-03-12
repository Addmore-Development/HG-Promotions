// promoter/payments/ViewEarnings.tsx

import React, { useState, useEffect } from 'react';
import { useAuth }           from '../../shared/hooks/useAuth';
import { paymentsService }   from '../../shared/services/paymentsService';
import { Badge }             from '../../shared/components/Badge';
import { Table }             from '../../shared/components/Table';
import type { Payment, EarningsSummary } from '../../shared/types/payment.types';

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

  if (loading) return <div style={{ color:'#666', padding:'60px 0' }}>Loading earnings…</div>;

  const stats = [
    { label:'Total Earned', value:`R${(summary?.totalEarned ?? 0).toLocaleString()}`,  sub:'All time',         color:'#D4AF37' },
    { label:'Pending',      value:`R${(summary?.totalPending ?? 0).toLocaleString()}`, sub:'Awaiting approval',color:'#fbbf24' },
    { label:'Paid Out',     value:`R${(summary?.totalPaid ?? 0).toLocaleString()}`,    sub:'Into your bank',   color:'#4ade80' },
    { label:'Shifts Done',  value: String(summary?.shiftsCompleted ?? 0),              sub:'Completed',        color:'#63b3ed' },
  ];

  return (
    <div>
      <h1 style={{ color:'#fff', fontSize:'22px', fontWeight:800, margin:'0 0 6px' }}>My Earnings</h1>
      <p style={{ color:'#666', fontSize:'14px', marginBottom:'32px' }}>Track your payments and pending amounts in real time.</p>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'14px', marginBottom:'36px' }}>
        {stats.map(c => (
          <div key={c.label} style={{ padding:'20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px' }}>
            <p style={{ color:'#555', fontSize:'10px', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', margin:'0 0 8px' }}>{c.label}</p>
            <p style={{ color:c.color, fontSize:'26px', fontWeight:800, margin:'0 0 4px' }}>{c.value}</p>
            <p style={{ color:'#444', fontSize:'11px', margin:0 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {payments.length > 0 && (
        <div style={{ marginBottom:'32px', padding:'24px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px' }}>
          <h3 style={{ color:'#D4AF37', fontSize:'11px', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'20px' }}>Payment Breakdown</h3>
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end', height:'80px' }}>
            {payments.map(p => {
              const max = Math.max(...payments.map(x => x.netAmount));
              const h = (p.netAmount / max) * 80;
              return (
                <div key={p.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'100%', height:`${h}px`, background: p.status === 'paid' ? 'linear-gradient(180deg,#D4AF37,#B8962E)' : 'rgba(251,191,36,0.3)', borderRadius:'4px 4px 0 0', transition:'height 0.5s ease' }} />
                  <span style={{ color:'#555', fontSize:'10px' }}>R{p.netAmount}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:'20px', marginTop:'16px' }}>
            {[{ c:'#D4AF37', l:'Paid' },{ c:'rgba(251,191,36,0.3)', l:'Pending' }].map(({ c, l }) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'2px', background:c }} />
                <span style={{ color:'#666', fontSize:'11px' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        columns={[
          { key:'id',          header:'Reference',  render: p => <span style={{ color:'#555', fontFamily:'monospace', fontSize:'12px' }}>{p.reference || `HGP-${p.id.slice(-6).toUpperCase()}`}</span> },
          { key:'grossAmount', header:'Gross',      render: p => `R${p.grossAmount}` },
          { key:'deductions',  header:'Deductions', render: p => p.deductions > 0 ? <span style={{ color:'#f87171' }}>-R{p.deductions}</span> : <span style={{ color:'#555' }}>—</span> },
          { key:'netAmount',   header:'Net Pay',    render: p => <strong style={{ color:'#D4AF37' }}>R{p.netAmount}</strong> },
          { key:'status',      header:'Status',     render: p => statusBadge(p.status) },
          { key:'paidAt',      header:'Date',       render: p => p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-ZA') : <span style={{ color:'#555' }}>Pending</span> },
        ]}
        data={payments}
        rowKey={p => p.id}
        emptyMessage="No payments yet. Complete a shift to start earning."
      />
    </div>
  );
};