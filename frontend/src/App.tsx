import React, { useState } from 'react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/cadastro'; // Importa a tela de cadastro que criamos

export function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  return (
    <main>
      {currentPage === 'login' ? (
        <Login 
          onNavigateToRegister={() => setCurrentPage('register')} 
        />
      ) : (
        <Register 
          onNavigateToLogin={() => setCurrentPage('login')} 
        />
      )}
    </main>
  );
}

export default App;