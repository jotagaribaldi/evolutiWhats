'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Bell, Search } from 'lucide-react';

function Topbar() {
  return (
    <header className="app-topbar">
      <div style={{ flex: 1, position: 'relative', maxWidth: 340 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar..."
          className="form-input"
          style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
        />
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-ghost btn-icon" title="Notificações">
          <Bell size={18} />
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          cursor: 'default',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            fontSize: 11, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>E</div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Demo</span>
        </div>
      </div>
    </header>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #10b981', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
