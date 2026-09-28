import React, { useState } from 'react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/cadastro';
import DashboardClient from './pages/dashboard/DashboardCliente';
import DashboardPrestador from './pages/dashboardPrestador/PainelPrestador';

export function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard' | 'prestador'>('login');

  return (
    <main>
      {currentPage === 'login' && (
      <button
        type="button"
        onClick={() => setCurrentPage('prestador')}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '10px 16px',
          border: 'none',
          borderRadius: '8px',
          background: '#2563eb',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Área do Prestador
      </button>
    )}
      {currentPage === 'login' && (
        <Login 
          onNavigateToRegister={() => setCurrentPage('register')} 
          onLoginSuccess={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'register' && (
        <Register 
          onNavigateToLogin={() => setCurrentPage('login')} 
        />
      )}
      {currentPage === 'dashboard' && (
        <DashboardClient />
      )}
      {currentPage === 'prestador' && (
        <DashboardPrestador />
      )}
    </main>
  );
}

export default App;