import React from 'react';
import {
  Brush,
  Car,
  Drill,
  Hammer,
  KeyRound,
  Laptop,
  Leaf,
  PaintRoller,
  PawPrint,
  Plug,
  Scissors,
  Snowflake,
  Sparkles,
  Truck,
  Tv,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { normalize } from '../../utils/format';

/** Palavra-chave do nome da categoria → ícone. A primeira que bater vence. */
const RULES: Array<[string[], LucideIcon]> = [
  [['encan', 'hidraul', 'bomb'], Wrench],
  [['eletric', 'eletri'], Zap],
  [['pint'], PaintRoller],
  [['marcen', 'carpint', 'movel', 'moveis'], Hammer],
  [['pedreir', 'reform', 'constru', 'obra', 'gesso'], Drill],
  [['limpez', 'diarist', 'faxin'], Sparkles],
  [['jardin', 'paisag', 'poda'], Leaf],
  [['ar condicionado', 'ar-condicionado', 'refriger', 'climat'], Snowflake],
  [['mudan', 'frete', 'carret'], Truck],
  [['mecan', 'auto', 'carro', 'funilar'], Car],
  [['chaveir', 'fechadur'], KeyRound],
  [['informat', 'comput', 'tecnic de ti', 'ti '], Laptop],
  [['eletrodom', 'eletronic', 'tv', 'televis'], Tv],
  [['instal'], Plug],
  [['cabel', 'barb', 'manicur', 'estet', 'beleza'], Scissors],
  [['pet', 'cachorr', 'animal', 'veterin'], PawPrint],
  [['montag', 'decor'], Brush],
];

export function iconForCategory(name: string | null | undefined): LucideIcon {
  const key = normalize(name);
  const match = RULES.find(([keywords]) => keywords.some((keyword) => key.includes(keyword)));
  return match ? match[1] : Wrench;
}

export const CategoryIcon: React.FC<{ name: string | null | undefined; size?: number; className?: string }> = ({
  name,
  size = 26,
  className,
}) => {
  const Icon = iconForCategory(name);
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" className={className} />;
};

export default CategoryIcon;
