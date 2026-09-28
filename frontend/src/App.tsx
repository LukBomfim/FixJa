import React, { useState } from 'react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/Cadastro';
import DashboardClient from './pages/dashboard/DashboardCliente';

export function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard'>('login');

  return (
    <main>
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
    </main>
  );
}

export default App;