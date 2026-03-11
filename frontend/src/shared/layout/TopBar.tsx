// shared/layout/TopBar.tsx
// Sticky top bar — shows the page title and sign-out button.

import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface TopBarProps {
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title = 'Honey Group Promotions' }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: '56px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      background: 'rgba(10,10,10,0.95)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(8px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 900, color: '#0A0A0A',
        }}>
          H
        </div>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}>
          {title}
        </span>
      </div>

      {/* User info + sign out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <span style={{ color: '#555', fontSize: '12px' }}>
            {user.mobile}
          </span>
        )}
        <button
          onClick={logout}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: '#666', fontSize: '12px', fontWeight: 600,
            padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#D4AF37'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#666'; }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
};