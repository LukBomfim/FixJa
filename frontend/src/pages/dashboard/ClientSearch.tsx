import React, { useEffect, useState } from 'react';
import { ChevronDown, Funnel, List, LocateFixed, MapPin, Navigation, Route, Search, SearchX, Star, X } from 'lucide-react';
import type { Category, Provider } from '../../services/api';
import PageHeader from '../../components/layout/PageHeader';
import LocationPicker from '../../components/LocationPicker';
import ProviderMap from '../../components/ProviderMap';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { formatDistance, normalize, pluralize } from '../../utils/format';
import { ProviderRow } from './ClientHome';
import type { NearbyState, ProviderFilters } from './DashboardCliente';
import styles from './Client.module.css';

interface ClientSearchProps {
  providers: Provider[];
  categories: Category[];
  filters: ProviderFilters;
  loading: boolean;
  error: string;
  nearby: NearbyState;
  visible: boolean;
  onBack?: () => void;
  onChangeFilters: (patch: Partial<ProviderFilters>) => void;
  onApplyFilters: (category: string, city: string) => Promise<void>;
  onOpenProvider: (id: string) => void;
}

type SearchMode = 'list' | 'nearby';

/** Pluraliza o nome da categoria para o título ("Encanador" → "Encanadores"). */
function pluralTitle(category: string): string {
  const word = category.trim();
  if (!word) return 'Profissionais';
  if (/[rzs]$/i.test(word)) return /s$/i.test(word) ? word : `${word}es`;
  if (/[aeiou]$/i.test(word)) return `${word}s`;
  return word;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  providers,
  categories,
  filters,
  loading,
  error,
  nearby,
  visible,
  onBack,
  onChangeFilters,
  onApplyFilters,
  onOpenProvider,
}) => {
  const [mode, setMode] = useState<SearchMode>('list');
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(filters.category);
  const [draftCity, setDraftCity] = useState(filters.city);

  useEffect(() => {
    setDraftCategory(filters.category);
    setDraftCity(filters.city);
  }, [filters.category, filters.city]);

  const query = normalize(filters.searchTerm);
  const results = providers.filter((provider) => {
    const matchesQuery = !query || [provider.username, provider.categoria, provider.cidade]
      .some((value) => normalize(value).includes(query));
    return matchesQuery && Number(provider.avaliacao || 0) >= filters.minRating;
  });
  const activeFilters = Number(Boolean(filters.category)) + Number(Boolean(filters.city)) + Number(filters.minRating > 0);

  const submitPanel = (event: React.FormEvent) => {
    event.preventDefault();
    setPanelOpen(false);
    void onApplyFilters(draftCategory, draftCity.trim());
  };

  const clearAll = () => {
    setPanelOpen(false);
    onChangeFilters({ minRating: 0, searchTerm: '' });
    void onApplyFilters('', '');
  };

  return (
    <div className={`${styles.view} fx-rise`}>
      <PageHeader
        title={pluralTitle(filters.category)}
        onBack={onBack}
        backLabel="Voltar para o início"
        actions={mode === 'list' ? (
          <button
            type="button"
            className="fx-icon-btn"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="search-filters"
            aria-label="Filtros"
          >
            <Funnel size={18} aria-hidden="true" />
            {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
          </button>
        ) : undefined}
      />

      <SegmentedTabs<SearchMode>
        label="Modo de busca"
        value={mode}
        onChange={setMode}
        options={[
          { id: 'list', label: 'Lista', icon: <List size={16} aria-hidden="true" /> },
          { id: 'nearby', label: 'Perto de mim', icon: <Navigation size={16} aria-hidden="true" /> },
        ]}
      />

      {mode === 'list' ? (
        <>
          <div className={styles.searchPill}>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar por nome, serviço ou cidade"
              placeholder="Nome, serviço ou cidade"
              value={filters.searchTerm}
              onChange={(event) => onChangeFilters({ searchTerm: event.target.value })}
            />
          </div>

          <div className={styles.chips} role="group" aria-label="Filtros rápidos">
            <button
              type="button"
              className={`${styles.chip} ${filters.city ? styles.chipSolid : ''}`}
              onClick={() => setPanelOpen(true)}
            >
              <MapPin size={14} aria-hidden="true" /> {filters.city || 'Cidade'} <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.chip} ${filters.minRating > 0 ? styles.chipActive : ''}`}
              aria-pressed={filters.minRating > 0}
              onClick={() => onChangeFilters({ minRating: filters.minRating > 0 ? 0 : 4 })}
            >
              <Star size={14} aria-hidden="true" /> Nota 4+
            </button>
            <button
              type="button"
              className={`${styles.chip} ${filters.category ? styles.chipActive : ''}`}
              onClick={() => (filters.category ? void onApplyFilters('', filters.city) : setPanelOpen(true))}
              aria-label={filters.category ? `Remover filtro ${filters.category}` : 'Escolher categoria'}
            >
              {filters.category || 'Categoria'} {filters.category ? <X size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
          </div>

          {panelOpen && (
            <form id="search-filters" className={`fx-card ${styles.filterPanel}`} onSubmit={submitPanel}>
              <div className="fx-field">
                <label className="fx-label" htmlFor="filter-category">Categoria</label>
                <select id="filter-category" className="fx-input" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categories.map((item) => <option key={item.id} value={item.categoria_name}>{item.categoria_name}</option>)}
                </select>
              </div>
              <div className="fx-field">
                <label className="fx-label" htmlFor="filter-city">Cidade</label>
                <input id="filter-city" className="fx-input" placeholder="Ex.: Maceió" value={draftCity} onChange={(event) => setDraftCity(event.target.value)} />
              </div>
              <div className={styles.filterActions}>
                <button type="button" className="fx-btn fx-btn--ghost" onClick={clearAll}>Limpar</button>
                <button type="submit" className="fx-btn fx-btn--primary" disabled={loading}>Aplicar filtros</button>
              </div>
            </form>
          )}

          {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}

          {loading ? (
            <SkeletonList count={4} label="Carregando prestadores" />
          ) : (
            <>
              <p className={styles.resultCount} aria-live="polite">
                {pluralize(results.length, 'prestador encontrado', 'prestadores encontrados')}
              </p>
              {results.length === 0 ? (
                <EmptyState
                  icon={<SearchX size={22} aria-hidden="true" />}
                  title={error ? 'Não foi possível carregar prestadores' : 'Nenhum prestador encontrado'}
                  description="Tente outra cidade, remova filtros ou busque por outro termo."
                  action={activeFilters > 0 || filters.searchTerm ? <button type="button" className="fx-btn fx-btn--soft fx-btn--sm" onClick={clearAll}>Limpar filtros</button> : undefined}
                />
              ) : (
                <div className={`${styles.providerList} ${styles.providerListWide} fx-stagger`}>
                  {results.map((provider) => <ProviderRow key={provider.id} provider={provider} onOpen={onOpenProvider} />)}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <NearbyPanel nearby={nearby} visible={visible} onOpenProvider={onOpenProvider} />
      )}
    </div>
  );
};

const NearbyPanel: React.FC<{ nearby: NearbyState; visible: boolean; onOpenProvider: (id: string) => void }> = ({ nearby, visible, onOpenProvider }) => (
  <div className={styles.nearby}>
    <form
      className={`fx-card ${styles.nearbyForm}`}
      onSubmit={(event) => { event.preventDefault(); void nearby.search(); }}
    >
      <div className={styles.nearbyIntro}>
        <span className={styles.nearbyIcon}><LocateFixed size={20} aria-hidden="true" /></span>
        <div>
          <h2 className="fx-section-title">Prestadores próximos de você</h2>
          <p className="fx-muted">A recomendação usa um grafo geográfico e caminhos mínimos calculados no backend.</p>
        </div>
      </div>
      <LocationPicker
        value={nearby.location}
        onChange={nearby.setLocation}
        onConfirmedChange={nearby.setLocationConfirmed}
        showAddress={false}
      />
      <button type="submit" className="fx-btn fx-btn--primary fx-btn--block" disabled={nearby.loading}>
        <Route size={17} aria-hidden="true" /> {nearby.loading ? 'Calculando proximidade...' : 'Buscar prestadores próximos'}
      </button>
    </form>

    {nearby.error && <p className="fx-alert fx-alert--error" role="alert">{nearby.error}</p>}
    {nearby.loading && <SkeletonList count={3} label="Calculando caminhos e distâncias" />}
    {!nearby.loading && nearby.searched && !nearby.error && nearby.providers.length === 0 && (
      <EmptyState compact icon={<MapPin size={22} aria-hidden="true" />} title="Ninguém por perto ainda" description="Não há prestadores com localização cadastrada para este local." />
    )}
    {!nearby.loading && nearby.providers.length > 0 && (
      <div className={styles.nearbyResults}>
        {nearby.locationConfirmed && visible && (
          <ProviderMap
            latitude={Number(nearby.location.latitude)}
            longitude={Number(nearby.location.longitude)}
            providers={nearby.providers}
            selectedProviderId={nearby.selectedId}
            onSelect={nearby.setSelectedId}
          />
        )}
        <div className={`${styles.providerList} fx-stagger`}>
          {nearby.providers.map(({ prestador, distancia_km }) => {
            const selected = nearby.selectedId === prestador.id;
            return (
              <article key={prestador.id} className={`${styles.nearbyItem} ${selected ? styles.nearbySelected : ''}`}>
                <ProviderRow
                  provider={prestador}
                  onOpen={onOpenProvider}
                  extra={<small className={styles.distance}><Route size={13} aria-hidden="true" /> {formatDistance(distancia_km)} aproximados</small>}
                />
                <button
                  type="button"
                  className={`fx-btn fx-btn--sm ${selected ? 'fx-btn--accent' : 'fx-btn--soft'}`}
                  aria-pressed={selected}
                  onClick={() => nearby.setSelectedId(prestador.id)}
                >
                  <MapPin size={14} aria-hidden="true" /> {selected ? 'No mapa' : 'Mostrar no mapa'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    )}
  </div>
);

export default ClientSearch;
