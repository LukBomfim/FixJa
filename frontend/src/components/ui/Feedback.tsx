import React from 'react';
import styles from './ui.module.css';

/** Bloco cinza animado para estados de carregamento. */
export const Skeleton: React.FC<{ height?: number | string; width?: number | string; radius?: number | string; className?: string }> = ({
  height = 16,
  width = '100%',
  radius = 8,
  className = '',
}) => <span className={`${styles.skeleton} ${className}`} style={{ height, width, borderRadius: radius }} aria-hidden="true" />;

/** Lista de cards "fantasmas" enquanto os dados chegam. */
export const SkeletonList: React.FC<{ count?: number; label?: string }> = ({ count = 3, label = 'Carregando...' }) => (
  <div className={styles.skeletonList} role="status" aria-label={label}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={styles.skeletonCard}>
        <Skeleton width={48} height={48} radius="50%" />
        <div className={styles.skeletonLines}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={11} />
          <Skeleton width="25%" height={11} />
        </div>
      </div>
    ))}
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

/** Estado vazio ilustrado com ícone, título e ação opcional. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, compact }) => (
  <div className={`${styles.empty} ${compact ? styles.emptyCompact : ''}`}>
    {icon && <span className={styles.emptyIcon}>{icon}</span>}
    <strong className={styles.emptyTitle}>{title}</strong>
    {description && <p className={styles.emptyText}>{description}</p>}
    {action}
  </div>
);
