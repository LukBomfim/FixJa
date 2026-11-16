import React from 'react';
import { Bell, ClipboardList, House, MessageCircle, Search, UserRound } from 'lucide-react';
import type { AccountType, UserProfile } from '../../services/api';
import Logo from '../ui/Logo';
import Avatar from '../ui/Avatar';
import styles from './AppShell.module.css';

export type AppPage = 'home' | 'search' | 'orders' | 'chat' | 'profile' | 'developer';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ReactNode;
}

function navItemsFor(tipo: AccountType): NavItem[] {
  const icon = (Icon: typeof House) => <Icon size={21} strokeWidth={1.9} aria-hidden="true" />;
  const items: NavItem[] = [
    { id: 'home', label: 'Início', icon: icon(House) },
    { id: 'search', label: 'Buscar', icon: icon(Search) },
    { id: 'orders', label: 'Pedidos',icon: icon(ClipboardList) },
    { id: 'chat', label: 'Mensagens', icon: icon(MessageCircle) },
    { id: 'profile', label: 'Perfil', icon: icon(UserRound) },
  ];
  return tipo === 'PRESTADOR' ? items.filter((item) => item.id !== 'search') : items;
}

interface AppShellProps {
  profile: UserProfile;
  page: AppPage;
  unreadCount: number;
  onNavigate: (page: AppPage) => void;
  children: React.ReactNode;
  banner?: React.ReactNode;
}

/**
 * Estrutura do app autenticado.
 * Celular: cabeçalho com logo e sino + abas inferiores (como no protótipo).
 * Desktop (≥ 960px): barra lateral fixa com os mesmos destinos.
 */
export const AppShell: React.FC<AppShellProps> = ({ profile, page, unreadCount, onNavigate, children, banner }) => {
  const items = navItemsFor(profile.tipo);
  const activeId: AppPage = page === 'developer' ? 'profile' : page;
  const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <button type="button" className={styles.sidebarBrand} onClick={() => onNavigate('home')} aria-label="Ir para o início">
          <Logo size="md" />
        </button>
        <nav className={styles.sideNav}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.sideItem} ${activeId === item.id ? styles.sideItemActive : ''}`}
              aria-current={activeId === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'chat' && unreadCount > 0 && <span className={styles.badge}>{unreadLabel}</span>}
            </button>
          ))}
        </nav>
        <button type="button" className={styles.sideUser} onClick={() => onNavigate('profile')}>
          <Avatar name={profile.username} size="sm" />
          <span className={styles.sideUserText}>
            <strong>{profile.username}</strong>
            <small>{profile.tipo === 'PRESTADOR' ? profile.categoria || 'Prestador' : 'Cliente'}</small>
          </span>
        </button>
      </aside>

      <div className={styles.main}>
        <header className={styles.mobileHeader}>
          <button type="button" className={styles.mobileBrand} onClick={() => onNavigate('home')} aria-label="Ir para o início">
            <Logo size="sm" />
          </button>
          <button
            type="button"
            className="fx-icon-btn"
            onClick={() => onNavigate('chat')}
            aria-label={unreadCount > 0 ? `Mensagens: ${unreadCount} não lida(s)` : 'Mensagens'}
          >
            <Bell size={19} strokeWidth={1.9} aria-hidden="true" />
            {unreadCount > 0 && <span className={styles.dot} aria-hidden="true" />}
          </button>
        </header>
        {banner}
        <div className={styles.content}>
          {children}
        </div>
      </div>

      <nav className={styles.bottomNav} aria-label="Navegação principal">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.tab} ${activeId === item.id ? styles.tabActive : ''}`}
            aria-current={activeId === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.tabIcon}>
              {item.icon}
              {item.id === 'chat' && unreadCount > 0 && <span className={styles.tabBadge}>{unreadLabel}</span>}
            </span>
            <span className={styles.tabLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;
