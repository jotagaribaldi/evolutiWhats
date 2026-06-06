'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, MessageSquare, Megaphone,
  Smartphone, BarChart2, LogOut, Settings, ChevronDown
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/groups', label: 'Grupos', icon: MessageSquare },
  { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
  { href: '/whatsapp', label: 'WhatsApp', icon: Smartphone },
  { href: '/users', label: 'Usuários', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Até logo!');
  };

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(16,185,129,0.25)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            EvolutiWhats
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gestão WhatsApp</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div className="nav-section-label">Principal</div>
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}

        <div className="nav-section-label">Administração</div>
        {navItems.slice(4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'var(--bg-elevated)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Usuário'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
