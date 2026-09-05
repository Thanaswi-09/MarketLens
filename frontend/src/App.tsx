import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { WhatChanged } from './pages/WhatChanged';
import { StockDetails } from './pages/StockDetails';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main className="pb-16" key={location.pathname}>
      <div className="page-enter">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/changes" element={<WhatChanged />} />
          <Route path="/stocks/:symbol" element={<StockDetails />} />
        </Routes>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: '#0B0F14', color: '#F5F7FA' }}>
        <Navbar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}
