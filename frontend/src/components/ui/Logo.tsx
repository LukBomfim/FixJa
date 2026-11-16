import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Marca FixJá: "Fix" em marinho, "Já" em laranja e o telhado sobre o acento. */
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => (
  <span className={`${styles.logo} ${styles[size]} ${className}`} aria-label="FixJá" role="img">
    <span className={styles.fix} aria-hidden="true">Fix</span>
    <span className={styles.ja} aria-hidden="true">
      Já
      <svg className={styles.roof} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13 12 4l9 9" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 3v4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M5 11v9h14v-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </span>
);

export default Logo;
