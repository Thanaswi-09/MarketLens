import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, GitCompare, Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/changes', label: 'What Changed?', icon: GitCompare },
];

export function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'rgba(11,15,20,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)' }}>
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: '#F5F7FA' }}>
            Market<span style={{ color: '#38BDF8' }}>Lens</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? '#F5F7FA' : '#9AA4B2',
                  backgroundColor: active ? '#1A222D' : 'transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#F5F7FA'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#9AA4B2'; }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {active && <span className="w-1 h-1 rounded-full ml-0.5" style={{ backgroundColor: '#38BDF8' }} />}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button className="sm:hidden p-1.5 rounded-lg" style={{ color: '#9AA4B2' }}
          onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0B0F14' }}>
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: active ? '#F5F7FA' : '#9AA4B2', backgroundColor: active ? '#1A222D' : 'transparent' }}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
