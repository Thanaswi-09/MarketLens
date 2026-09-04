import { Link, useLocation } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          MarketLens
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            Dashboard
          </Link>
          <Link to="/changes" className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/changes' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            What Changed?
          </Link>
        </div>
      </div>
    </nav>
  );
}
