import React from 'react';
import { UserRound } from 'lucide-react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name?: string | null;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, className = '' }) => (
  <span className={`${styles.avatar} ${className}`} aria-label={name || 'Usuário'}>
    <UserRound aria-hidden="true" size={20} strokeWidth={1.8} />
  </span>
);

export default Avatar;
