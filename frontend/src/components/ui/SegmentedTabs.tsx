import React from 'react';
import styles from './ui.module.css';

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Abas segmentadas (Todas · Ativas · Concluídas), como no protótipo. */
export function SegmentedTabs<T extends string>({ options, value, onChange, label }: SegmentedTabsProps<T>) {
  return (
    <div className={styles.segmented} role="tablist" aria-label={label}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${styles.segment} ${selected ? styles.segmentActive : ''}`}
            onClick={() => onChange(option.id)}
          >
            {option.icon}
            <span>{option.label}</span>
            {typeof option.count === 'number' && option.count > 0 && <span className={styles.segmentCount}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
