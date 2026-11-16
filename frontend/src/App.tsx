import React, { useCallback, useEffect, useState } from 'react';
import { LogOut, Moon, RefreshCw, ShieldAlert, Sun, WifiOff } from 'lucide-react';
import Login from './pages/login/Login';
import Register from './pages/cadastro/cadastro';
import DashboardClient from './pages/dashboard/DashboardCliente';
import DashboardPrestador from './pages/dashboardPrestador/PainelPrestador';
import Profile from './pages/Perfil';
import Chat from './pages/Chat';
import DeveloperMode from './pages/DeveloperMode';
import AppShell, { type AppPage } from './components/layout/AppShell';
import PageHeader from './components/layout/PageHeader';
import Logo from './components/ui/Logo';
import { EmptyState } from './components/ui/Feedback';
import { useToast } from './components/ui/Toast';
import styles from './App.module.css';
import { ApiError, api, errorMessage, session, UNAUTHORIZED_EVENT } from './services/api';
import type { UserProfile } from './services/api';
import type { RegistrationDraft } from './pages/cadastro/cadastro';
import { firstName } from './utils/format';

type AuthState = 'checking' | 'signedOut' | 'profileRequired' | 'ready' | 'unavailable';
type Theme = 'light' | 'dark';

const UNREAD_POLL_MS = 20000;

function getInitialTheme(): Theme {
  try {
    const savedTheme = window.localStorage.getItem('fixja_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // armazenamento indisponível: segue a preferência do sistema
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ThemeToggle: React.FC<{ theme: Theme; onToggle: () => void; className?: string }> = ({ theme, onToggle, className = '' }) => (
  <button
    type="button"
    className={`fx-icon-btn ${className}`}
    onClick={onToggle}
    aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
  >
    {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>
);

export function App() {
  const toast = useToast();
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [registerAsProvider, setRegisterAsProvider] = useState(false);
  const [page, setPage] = useState<AppPage>('home');
  const [dashboardRevision, setDashboardRevision] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<RegistrationDraft | undefined>();
  const [startupError, setStartupError] = useState('');
  const [developerAuthorized, setDeveloperAuthorized] = useState(false);
  const [developerAccessChecked, setDeveloperAccessChecked] = useState(false);
  const [developerAccessError, setDeveloperAccessError] = useState('');
  const [chatProviderId, setChatProviderId] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    try {
      window.localStorage.setItem('fixja_theme', theme);
    } catch {
      // ignora: o tema continua valendo nesta sessão
    }
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setProfile(null);
      setAuthState('signedOut');
      setAuthPage('login');
      toast.show('Sua sessão expirou. Entre novamente.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [toast]);

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

  // Contador de mensagens não lidas (sino e aba Mensagens).
  useEffect(() => {
    if (authState !== 'ready') {
      setUnreadCount(0);
      return;
    }
    let active = true;
    const load = () => {
      api.conversations()
        .then((conversations) => {
          if (active) setUnreadCount(conversations.reduce((total, conversation) => total + (conversation.nao_lidas || 0), 0));
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, UNREAD_POLL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [authState, page]);

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
    const name = firstName(profile?.username || profileDraft?.username);
    session.clear();
    setProfile(null);
    setProfileDraft(undefined);
    setPage('home');
    setChatProviderId(undefined);
    setAuthPage('login');
    setAuthState('signedOut');
    toast.show(name ? `Você saiu da conta de ${name}` : 'Você saiu da sua conta');
  };

  const navigate = useCallback((target: AppPage) => {
    if (target === 'home' && page === 'home') setDashboardRevision((revision) => revision + 1);
    if (target !== 'chat') setChatProviderId(undefined);
    setPage(target);
    window.scrollTo({ top: 0 });
  }, [page]);

  const openChat = (providerId?: string) => {
    setChatProviderId(providerId);
    setPage('chat');
    window.scrollTo({ top: 0 });
  };

  const handleLogin = (currentProfile: UserProfile | null) => {
    setProfile(currentProfile);
    setAuthState(currentProfile ? 'ready' : 'profileRequired');
    setPage('home');
  };

  const handleRegistration = (token: string, refreshToken: string, draft: RegistrationDraft) => {
    session.setCredentials(token, refreshToken);
    setProfileDraft(draft);
    setProfile(null);
    setAuthState('profileRequired');
  };

  const handleProfileSaved = (savedProfile: UserProfile) => {
    const firstTime = !profile;
    setProfile(savedProfile);
    setProfileDraft(undefined);
    setAuthState('ready');
    setPage('home');
    if (firstTime) toast.show(`Tudo pronto, ${firstName(savedProfile.username)}!`, 'success');
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
    return (
      <main className={styles.splash} role="status" aria-label="Verificando sessão">
        <Logo size="lg" />
        <span className={styles.spinner} aria-hidden="true" />
      </main>
    );
  }

  if (authState === 'signedOut') {
    return (
      <main className={styles.application}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} className={styles.floatingToggle} />
        {authPage === 'login' ? (
          <Login
            onNavigateToRegister={() => { setRegisterAsProvider(false); setAuthPage('register'); }}
            onNavigateToProviderRegister={() => { setRegisterAsProvider(true); setAuthPage('register'); }}
            onLoginSuccess={handleLogin}
          />
        ) : (
          <Register
            key={registerAsProvider ? 'provider' : 'client'}
            initialProvider={registerAsProvider}
            onNavigateToLogin={() => setAuthPage('login')}
            onRegisterSuccess={handleRegistration}
          />
        )}
      </main>
    );
  }

  if (authState === 'unavailable') {
    return (
      <main className={`${styles.application} ${styles.messagePage}`}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} className={styles.floatingToggle} />
        <div className={styles.messageCard}>
          <Logo size="md" />
          <EmptyState
            icon={<WifiOff size={22} aria-hidden="true" />}
            title="Não foi possível conectar"
            description={<span role="alert">{startupError}</span>}
          />
          <div className={styles.messageActions}>
            <button type="button" className="fx-btn fx-btn--primary" onClick={() => void retrySession()}>
              <RefreshCw size={16} aria-hidden="true" /> Tentar novamente
            </button>
            <button type="button" className="fx-btn fx-btn--ghost" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" /> Sair
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (authState === 'profileRequired') {
    return (
      <main className={styles.application}>
        <header className={styles.simpleTopbar}>
          <Logo size="sm" />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        <Profile profile={null} initial={profileDraft} onSaved={handleProfileSaved} onLogout={handleLogout} />
      </main>
    );
  }

  if (!profile) return null;

  const renderPage = () => {
    if (page === 'profile') {
      return (
        <Profile
          profile={profile}
          onSaved={handleProfileSaved}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={setTheme}
          onOpenDeveloper={() => navigate('developer')}
          developerAuthorized={developerAuthorized}
        />
      );
    }
    if (page === 'chat') {
      return <Chat key={chatProviderId || 'inbox'} profile={profile} startProviderId={chatProviderId} />;
    }
    if (page === 'developer') {
      if (!developerAccessChecked) {
        return <p className="fx-alert fx-alert--info" role="status">Verificando acesso ao Modo Desenvolvedor...</p>;
      }
      if (developerAuthorized) return <DeveloperMode onBack={() => navigate('profile')} />;
      return (
        <div className={styles.restricted}>
          <PageHeader title="Modo Desenvolvedor" onBack={() => navigate('profile')} backLabel="Voltar para o perfil" />
          <EmptyState
            icon={<ShieldAlert size={22} aria-hidden="true" />}
            title="Acesso restrito"
            description={<span role="alert">{developerAccessError || 'O Modo Desenvolvedor é restrito. Para liberar este usuário, adicione seu ID à variável DEV_MODE_USER_IDS no backend.'}</span>}
          />
        </div>
      );
    }
    if (profile.tipo === 'PRESTADOR') {
      return (
        <DashboardPrestador
          key={dashboardRevision}
          profile={profile}
          view={page === 'orders' ? 'orders' : 'home'}
          onOpenChat={() => openChat()}
          onNavigate={navigate}
        />
      );
    }
    return (
      <DashboardClient
        key={dashboardRevision}
        profile={profile}
        view={page === 'search' || page === 'orders' ? page : 'home'}
        onNavigate={navigate}
        onOpenChat={openChat}
      />
    );
  };

  return (
    <main className={styles.application}>
      <AppShell profile={profile} page={page} unreadCount={unreadCount} onNavigate={navigate}>
        {renderPage()}
      </AppShell>
    </main>
  );
}

export default App;
