import React from 'react';
import { UserRound } from 'lucide-react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const TONES = ['blue', 'orange', 'green', 'violet'] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || '';
  return `${first}${last}`.toUpperCase();
}

function toneFor(name: string): (typeof TONES)[number] {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  return TONES[hash % TONES.length];
}

/** Avatar circular com iniciais coloridas (cor estável por nome). */
export const Avatar: React.FC<AvatarProps> = ({ name, className = '', size = 'md' }) => {
  const label = name?.trim() || 'Usuário';
  const text = name ? initials(name) : '';
  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${styles[toneFor(label)]} ${className}`}
      role="img"
      aria-label={label}
    >
      {text ? <span aria-hidden="true">{text}</span> : <UserRound aria-hidden="true" size={18} strokeWidth={1.8} />}
    </span>
  );
};

export default Avatar;
