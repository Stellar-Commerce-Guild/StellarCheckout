import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import CheckoutPage from './pages/CheckoutPage';
import DashboardPage from './pages/DashboardPage';
import CreatePaymentPage from './pages/CreatePaymentPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/pay/:id" element={<CheckoutPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/new" element={<CreatePaymentPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
