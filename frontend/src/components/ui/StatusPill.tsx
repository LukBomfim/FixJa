import React from 'react';
import { CircleCheck, CircleSlash, CircleX, Clock3, Wrench } from 'lucide-react';
import type { ContractStatus } from '../../services/api';
import styles from './ui.module.css';

export const STATUS_LABELS: Record<ContractStatus, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  recusado: 'Recusado',
};

const TONE: Record<ContractStatus, string> = {
  pendente: styles.pillWarning,
  aceito: styles.pillSuccess,
  concluido: styles.pillNeutral,
  cancelado: styles.pillDanger,
  recusado: styles.pillDanger,
};

const ICON: Record<ContractStatus, React.ReactNode> = {
  pendente: <Clock3 size={12} aria-hidden="true" />,
  aceito: <Wrench size={12} aria-hidden="true" />,
  concluido: <CircleCheck size={12} aria-hidden="true" />,
  cancelado: <CircleSlash size={12} aria-hidden="true" />,
  recusado: <CircleX size={12} aria-hidden="true" />,
};

/** Pílula colorida do status de uma contratação. */
export const StatusPill: React.FC<{ status: ContractStatus; className?: string }> = ({ status, className = '' }) => (
  <span className={`${styles.pill} ${TONE[status]} ${className}`}>
    {ICON[status]}
    {STATUS_LABELS[status]}
  </span>
);

export default StatusPill;
