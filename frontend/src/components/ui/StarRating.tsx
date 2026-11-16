import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '../../utils/format';
import styles from './ui.module.css';

/** Nota compacta: estrela laranja + número (ex.: ★ 4,8). */
export const RatingBadge: React.FC<{ value: number | null | undefined; className?: string }> = ({ value, className = '' }) => (
  <span className={`${styles.ratingBadge} ${className}`} aria-label={`Avaliação ${formatRating(value)} de 5`}>
    <Star size={15} aria-hidden="true" fill="currentColor" strokeWidth={0} />
    <span aria-hidden="true">{formatRating(value)}</span>
  </span>
);

/** Cinco estrelas somente leitura. */
export const StarDisplay: React.FC<{ value: number; size?: number }> = ({ value, size = 15 }) => (
  <span className={styles.starRow} aria-label={`Nota ${value} de 5`} role="img">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        aria-hidden="true"
        className={star <= Math.round(value) ? styles.starOn : styles.starOff}
        fill="currentColor"
        strokeWidth={0}
      />
    ))}
  </span>
);

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  name: string;
  label?: string;
}

const HINTS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

/** Seletor de nota de 1 a 5 com estrelas (acessível como grupo de rádio). */
export const StarInput: React.FC<StarInputProps> = ({ value, onChange, name, label = 'Sua nota' }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className={styles.starInput}>
      <legend className={styles.starLegend}>{label}</legend>
      <div className={styles.starOptions} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className={styles.starOption} onMouseEnter={() => setHover(star)}>
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="fx-sr-only"
            />
            <Star
              size={28}
              aria-hidden="true"
              className={star <= shown ? styles.starOn : styles.starOff}
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="fx-sr-only">{star} {star === 1 ? 'estrela' : 'estrelas'}</span>
          </label>
        ))}
        <span className={styles.starHint} aria-hidden="true">{HINTS[shown]}</span>
      </div>
    </fieldset>
  );
};

export default StarInput;
