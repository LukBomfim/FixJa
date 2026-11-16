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
      <svg className={styles.roof} viewBox="0 0 24 16" aria-hidden="true">
        <path d="M3 13 12 4l9 9" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 3v4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  </span>
);

export default Logo;
