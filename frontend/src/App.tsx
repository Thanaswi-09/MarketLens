import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { WhatChanged } from './pages/WhatChanged';
import { StockDetails } from './pages/StockDetails';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <main className="pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/changes" element={<WhatChanged />} />
            <Route path="/stocks/:symbol" element={<StockDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
