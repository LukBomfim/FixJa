import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
  size?: 'md' | 'lg';
}

/** Título de página: seta de voltar opcional, saudação com barra laranja e ações à direita. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  eyebrow,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  actions,
  size = 'md',
}) => (
  <header className={styles.header}>
    {(onBack || actions) && (
      <div className={styles.toolbar}>
        {onBack ? (
          <button type="button" className={styles.back} onClick={onBack} aria-label={backLabel}>
            <ArrowLeft size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : <span />}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    )}
    {eyebrow && <p className="fx-eyebrow">{eyebrow}</p>}
    <h1 className={`${styles.title} ${size === 'lg' ? styles.titleLg : ''}`}>{title}</h1>
    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
  </header>
);

export default PageHeader;
