import React, { useEffect, useState } from 'react';
import { Code2, Home, LogOut, MessageSquare, Moon, Sun, UserRound } from 'lucide-react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/cadastro';
import DashboardClient from './pages/dashboard/DashboardCliente';
import DashboardPrestador from './pages/dashboardPrestador/PainelPrestador';
import Profile from './pages/Perfil';
import Chat from './pages/Chat';
import DeveloperMode from './pages/DeveloperMode';
import styles from './App.module.css';
import { ApiError, api, errorMessage, session, UNAUTHORIZED_EVENT } from './services/api';
import type { UserProfile } from './services/api';
import type { RegistrationDraft } from './pages/cadastro/cadastro';

type AuthState = 'checking' | 'signedOut' | 'profileRequired' | 'ready' | 'unavailable';
type AppPage = 'dashboard' | 'profile' | 'chat' | 'developer';
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem('fixja_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState<AppPage>('dashboard');
  const [dashboardRevision, setDashboardRevision] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<RegistrationDraft | undefined>();
  const [startupError, setStartupError] = useState('');
  const [developerAuthorized, setDeveloperAuthorized] = useState(false);
  const [developerAccessChecked, setDeveloperAccessChecked] = useState(false);
  const [developerAccessError, setDeveloperAccessError] = useState('');
  const [chatProviderId, setChatProviderId] = useState<string | undefined>();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem('fixja_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
    if (authState !== 'ready') {
      setDeveloperAuthorized(false);
      setDeveloperAccessChecked(false);
      setDeveloperAccessError('');
      return;
    }
    let active = true;
    api.developerAccess()
      .then(({ authorized }) => {
        if (active) {
          setDeveloperAuthorized(authorized);
          setDeveloperAccessChecked(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setDeveloperAuthorized(false);
          setDeveloperAccessError(errorMessage(error));
          setDeveloperAccessChecked(true);
        }
      });
    return () => { active = false; };
  }, [authState]);

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
    setChatProviderId(undefined);
    setAuthPage('login');
    setAuthState('signedOut');
  };

  const navigateHome = () => {
    setPage('dashboard');
    setChatProviderId(undefined);
    setDashboardRevision((revision) => revision + 1);
  };

  const openChat = (providerId?: string) => {
    setChatProviderId(providerId);
    setPage('chat');
  };

  const handleLogin = (currentProfile: UserProfile | null) => {
    setProfile(currentProfile);
    setAuthState(currentProfile ? 'ready' : 'profileRequired');
    setPage('dashboard');
  };

  const handleRegistration = (token: string, refreshToken: string, draft: RegistrationDraft) => {
    session.setCredentials(token, refreshToken);
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
      <main className={styles.application} data-theme={theme}>
        <button type="button" className={styles.themeToggle} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <><Sun size={16} aria-hidden="true" /> Claro</> : <><Moon size={16} aria-hidden="true" /> Escuro</>}
        </button>
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
      <main className={`${styles.application} ${styles.messagePage}`} data-theme={theme}>
        <button type="button" className={styles.themeToggle} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <><Sun size={16} aria-hidden="true" /> Claro</> : <><Moon size={16} aria-hidden="true" /> Escuro</>}
        </button>
        <p role="alert">{startupError}</p>
        <button type="button" className={styles.navButton} onClick={() => void retrySession()}>Tentar novamente</button>
        <button type="button" className={styles.navButton} onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Sair</button>
      </main>
    );
  }

  if (authState === 'profileRequired') {
    return (
      <main className={styles.application} data-theme={theme}>
        <header className={styles.topbar}>
          <span className={styles.brand}>FixJá</span>
          <nav className={styles.navigation} aria-label="Ações da conta">
            <button type="button" className={styles.navButton} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <><Sun size={16} aria-hidden="true" /> Claro</> : <><Moon size={16} aria-hidden="true" /> Escuro</>}
            </button>
            <button type="button" className={styles.navButton} onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Sair</button>
          </nav>
        </header>
        <Profile profile={null} initial={profileDraft} onSaved={handleProfileSaved} onLogout={handleLogout} />
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className={styles.application} data-theme={theme}>
      <header className={styles.topbar}>
        <button type="button" className={styles.brand} onClick={navigateHome}>FixJá</button>
        <nav className={styles.navigation} aria-label="Navegação principal">
          <button type="button" className={styles.navButton} onClick={navigateHome} aria-current={page === 'dashboard' ? 'page' : undefined}><Home size={16} aria-hidden="true" /> Início</button>
          <button type="button" className={styles.navButton} onClick={() => openChat()} aria-current={page === 'chat' ? 'page' : undefined}><MessageSquare size={16} aria-hidden="true" /> Mensagens</button>
          <button type="button" className={styles.navButton} onClick={() => setPage('developer')} aria-current={page === 'developer' ? 'page' : undefined}><Code2 size={16} aria-hidden="true" /> Modo Desenvolvedor</button>
          <button type="button" className={styles.navButton} onClick={() => setPage('profile')} aria-current={page === 'profile' ? 'page' : undefined}><UserRound size={16} aria-hidden="true" /> Meu perfil</button>
          <button type="button" className={styles.navButton} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? <><Sun size={16} aria-hidden="true" /> Claro</> : <><Moon size={16} aria-hidden="true" /> Escuro</>}
          </button>
          <button type="button" className={styles.navButton} onClick={handleLogout}><LogOut size={16} aria-hidden="true" /> Sair</button>
        </nav>
      </header>
      {developerAccessError && <p className={styles.accessWarning} role="status">Não foi possível verificar o acesso ao Modo Desenvolvedor: {developerAccessError}</p>}
      <div className={styles.content}>
        {page === 'profile' ? (
          <Profile profile={profile} onSaved={handleProfileSaved} onLogout={handleLogout} />
        ) : page === 'chat' ? (
          <Chat key={chatProviderId || 'inbox'} profile={profile} startProviderId={chatProviderId} />
        ) : page === 'developer' ? (
          !developerAccessChecked ? <p className={styles.accessWarning} role="status">Verificando acesso ao Modo Desenvolvedor...</p> :
            developerAuthorized ? <DeveloperMode /> :
              <p className={styles.accessWarning} role="alert">{developerAccessError || 'O Modo Desenvolvedor é restrito. Para liberar este usuário, adicione seu ID à variável DEV_MODE_USER_IDS no backend.'}</p>
        ) : profile.tipo === 'PRESTADOR' ? (
          <DashboardPrestador key={dashboardRevision} profile={profile} onOpenChat={() => openChat()} />
        ) : (
          <DashboardClient key={dashboardRevision} profile={profile} onOpenChat={openChat} />
        )}
      </div>
    </main>
  );
}

export default App;