import React, { useState } from 'react';
import { ChevronRight, MapPin, Search, SearchX } from 'lucide-react';
import type { Category, Provider, UserProfile } from '../../services/api';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { RatingBadge } from '../../components/ui/StarRating';
import { EmptyState, Skeleton, SkeletonList } from '../../components/ui/Feedback';
import { firstName } from '../../utils/format';
import styles from './Client.module.css';

interface ClientHomeProps {
  profile: UserProfile;
  categories: Category[];
  topRated: Provider[];
  loading: boolean;
  error: string;
  onSearch: (term?: string) => void;
  onOpenCategory: (category: string) => void;
  onOpenProvider: (id: string) => void;
}

const VISIBLE_CATEGORIES = 6;

/** Início do cliente: saudação, busca, categorias e mais bem avaliados (protótipo). */
export const ClientHome: React.FC<ClientHomeProps> = ({
  profile,
  categories,
  topRated,
  loading,
  error,
  onSearch,
  onOpenCategory,
  onOpenProvider,
}) => {
  const [term, setTerm] = useState('');

  return (
    <div className={`${styles.view} fx-rise`}>
      <PageHeader eyebrow={`Olá, ${firstName(profile.username)}`} title="De que serviço você precisa?" size="lg" />

      <form
        className={styles.searchPill}
        role="search"
        onSubmit={(event) => { event.preventDefault(); onSearch(term.trim()); }}
      >
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar serviço ou profissional"
          placeholder="Buscar serviço ou profissional"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </form>

      {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}

      <div className={styles.homeGrid}>
        <section aria-labelledby="home-categories">
          <div className="fx-section-head">
            <h2 id="home-categories" className="fx-section-title">Categorias</h2>
            <button type="button" className="fx-section-link" onClick={() => onSearch()}>
              Ver todos <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
          {loading && categories.length === 0 ? (
            <div className={styles.categoryGrid} aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} height={96} radius={14} />)}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState compact title="Nenhuma categoria cadastrada" />
          ) : (
            <div className={`${styles.categoryGrid} fx-stagger`}>
              {categories.slice(0, VISIBLE_CATEGORIES).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={styles.categoryTile}
                  onClick={() => onOpenCategory(category.categoria_name)}
                >
                  <CategoryIcon name={category.categoria_name} size={28} />
                  <span>{category.categoria_name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="home-top-rated">
          <div className="fx-section-head">
            <h2 id="home-top-rated" className="fx-section-title">Mais bem avaliados</h2>
            <button type="button" className="fx-section-link" onClick={() => onSearch()}>
              Ver todos <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
          {loading && topRated.length === 0 ? (
            <SkeletonList count={2} label="Carregando prestadores" />
          ) : topRated.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchX size={22} aria-hidden="true" />}
              title="Ainda não há prestadores"
              description="Quando profissionais se cadastrarem, eles aparecem aqui."
            />
          ) : (
            <div className={`${styles.providerList} fx-stagger`}>
              {topRated.map((provider) => (
                <ProviderRow key={provider.id} provider={provider} onOpen={onOpenProvider} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/** Linha de prestador usada no Início e na Busca. */
export const ProviderRow: React.FC<{ provider: Pick<Provider, 'id' | 'username' | 'categoria' | 'cidade' | 'avaliacao'> & { estado?: string | null }; onOpen: (id: string) => void; extra?: React.ReactNode }> = ({
  provider,
  onOpen,
  extra,
}) => (
  <button type="button" className={styles.providerRow} onClick={() => onOpen(provider.id)}>
    <Avatar name={provider.username} />
    <span className={styles.providerInfo}>
      <strong>{provider.username}</strong>
      <small>{provider.categoria || 'Prestador'}</small>
      <small className={styles.providerCity}>
        <MapPin size={13} aria-hidden="true" /> {provider.cidade || 'Cidade não informada'}{provider.estado ? ` - ${provider.estado}` : ''}
      </small>
      {extra}
    </span>
    <RatingBadge value={provider.avaliacao} />
  </button>
);

export default ClientHome;
