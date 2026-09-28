import React, { useEffect, useState } from 'react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/cadastro';
import DashboardClient from './pages/dashboard/DashboardCliente';
import DashboardPrestador from './pages/dashboardPrestador/PainelPrestador';
import Profile from './pages/Perfil';
import styles from './App.module.css';
import { ApiError, api, errorMessage, session, UNAUTHORIZED_EVENT } from './services/api';
import type { UserProfile } from './services/api';
import type { RegistrationDraft } from './pages/cadastro/cadastro';

type AuthState = 'checking' | 'signedOut' | 'profileRequired' | 'ready' | 'unavailable';
type AppPage = 'dashboard' | 'profile';

export function App() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState<AppPage>('dashboard');
  const [dashboardRevision, setDashboardRevision] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<RegistrationDraft | undefined>();
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    const handleUnauthorized = () => {
      setProfile(null);
      setAuthState('signedOut');
      setAuthPage('login');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!session.getToken()) {
      setAuthState('signedOut');
      return;
    }
    api.profile()
      .then((currentProfile) => {
        setProfile(currentProfile);
        setAuthState('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
          setProfile(null);
          setAuthState('profileRequired');
        } else if (error instanceof ApiError && error.status === 401) {
          setAuthState('signedOut');
        } else {
          setStartupError(errorMessage(error));
          setAuthState('unavailable');
        }
      });
  }, []);

  const handleLogout = () => {
    session.clear();
    setProfile(null);
    setProfileDraft(undefined);
    setPage('dashboard');
    setAuthPage('login');
    setAuthState('signedOut');
  };

  const navigateHome = () => {
    setPage('dashboard');
    setDashboardRevision((revision) => revision + 1);
  };

  const handleLogin = (currentProfile: UserProfile | null) => {
    setProfile(currentProfile);
    setAuthState(currentProfile ? 'ready' : 'profileRequired');
    setPage('dashboard');
  };

  const handleRegistration = (token: string, draft: RegistrationDraft) => {
    session.setToken(token);
    setProfileDraft(draft);
    setProfile(null);
    setAuthState('profileRequired');
  };

  const handleProfileSaved = (savedProfile: UserProfile) => {
    setProfile(savedProfile);
    setProfileDraft(undefined);
    setAuthState('ready');
    setPage('dashboard');
  };

  const retrySession = async () => {
    setAuthState('checking');
    setStartupError('');
    try {
      const currentProfile = await api.profile();
      setProfile(currentProfile);
      setAuthState('ready');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setAuthState('profileRequired');
      } else {
        setStartupError(errorMessage(error));
        setAuthState('unavailable');
      }
    }
  };

  if (authState === 'checking') {
    return <main className={styles.messagePage} role="status">Verificando sessão...</main>;
  }

  if (authState === 'signedOut') {
    return (
      <main className={styles.application}>
        {authPage === 'login' ? (
          <Login onNavigateToRegister={() => setAuthPage('register')} onLoginSuccess={handleLogin} />
        ) : (
          <Register onNavigateToLogin={() => setAuthPage('login')} onRegisterSuccess={handleRegistration} />
        )}
      </main>
    );
  }

  if (authState === 'unavailable') {
    return (
      <main className={styles.messagePage}>
        <p role="alert">{startupError}</p>
        <button type="button" className={styles.navButton} onClick={() => void retrySession()}>Tentar novamente</button>
        <button type="button" className={styles.navButton} onClick={handleLogout}>Sair</button>
      </main>
    );
  }

  if (authState === 'profileRequired') {
    return (
      <main className={styles.application}>
        <header className={styles.topbar}>
          <span className={styles.brand}>FixJá</span>
          <button type="button" className={styles.navButton} onClick={handleLogout}>Sair</button>
        </header>
        <Profile profile={null} initial={profileDraft} onSaved={handleProfileSaved} onLogout={handleLogout} />
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className={styles.application}>
      <header className={styles.topbar}>
        <button type="button" className={styles.brand} onClick={navigateHome}>FixJá</button>
        <nav className={styles.navigation} aria-label="Navegação principal">
          <button type="button" className={styles.navButton} onClick={navigateHome}>Início</button>
          <button type="button" className={styles.navButton} onClick={() => setPage('profile')}>Meu perfil</button>
          <button type="button" className={styles.navButton} onClick={handleLogout}>Sair</button>
        </nav>
      </header>
      <div className={styles.content}>
        {page === 'profile' ? (
          <Profile profile={profile} onSaved={handleProfileSaved} onLogout={handleLogout} />
        ) : profile.tipo === 'PRESTADOR' ? (
          <DashboardPrestador key={dashboardRevision} profile={profile} />
        ) : (
          <DashboardClient key={dashboardRevision} profile={profile} />
        )}
      </div>
    </main>
  );
}

export default App;