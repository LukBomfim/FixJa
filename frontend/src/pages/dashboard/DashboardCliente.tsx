import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, errorMessage } from '../../services/api';
import type { Category, NearbyRecommendation, Provider, UserProfile } from '../../services/api';
import type { LocationValue } from '../../components/LocationPicker';
import ClientHome from './ClientHome';
import ClientSearch from './ClientSearch';
import ClientOrders from './ClientOrders';
import ProviderDetail from './ProviderDetail';
import styles from './Client.module.css';

export type ClientView = 'home' | 'search' | 'orders';

interface DashboardClientProps {
  profile: UserProfile;
  view: ClientView;
  onNavigate: (view: ClientView) => void;
  onOpenChat: (providerId?: string) => void;
}

export interface ProviderFilters {
  searchTerm: string;
  category: string;
  city: string;
  minRating: number;
}

export interface NearbyState {
  location: LocationValue;
  locationConfirmed: boolean;
  providers: NearbyRecommendation[];
  selectedId: string | null;
  loading: boolean;
  searched: boolean;
  error: string;
  setLocation: (value: LocationValue) => void;
  setLocationConfirmed: (value: boolean) => void;
  setSelectedId: (id: string | null) => void;
  search: () => Promise<void>;
}

/** Hook com a busca por proximidade (mesma regra e chamada de API da versão anterior). */
function useNearbySearch(profile: UserProfile): NearbyState {
  const [location, setLocationValue] = useState<LocationValue>({
    estado: profile.estado || '',
    cidade: profile.cidade || '',
    endereco: '',
    latitude: '',
    longitude: '',
  });
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [providers, setProviders] = useState<NearbyRecommendation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const setLocation = useCallback((nextLocation: LocationValue) => {
    setLocationValue(nextLocation);
    setLocationConfirmed(false);
    setProviders([]);
    setSelectedId(null);
    setSearched(false);
    setError('');
  }, []);

  const search = async () => {
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    if (!locationConfirmed || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Informe e confirme uma localização válida para buscar prestadores próximos.');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await api.nearbyProviders({
        latitude,
        longitude,
        cidade: location.cidade || undefined,
        estado: location.estado || undefined,
      });
      setProviders(result.prestadores);
      setSelectedId(result.prestadores[0]?.prestador.id || null);
    } catch (requestError) {
      setError(errorMessage(requestError));
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    locationConfirmed,
    providers,
    selectedId,
    loading,
    searched,
    error,
    setLocation,
    setLocationConfirmed,
    setSelectedId,
    search,
  };
}

/**
 * Área do cliente. Mantém os dados compartilhados (prestadores, categorias, filtros)
 * enquanto o usuário alterna entre Início, Buscar e Pedidos.
 */
export const DashboardClient: React.FC<DashboardClientProps> = ({ profile, view, onNavigate, onOpenChat }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerIndex, setProviderIndex] = useState<Record<string, Provider>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ProviderFilters>({ searchTerm: '', category: '', city: '', minRating: 0 });
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [searchOrigin, setSearchOrigin] = useState<ClientView>('home');
  const nearby = useNearbySearch(profile);
  const topRef = useRef<HTMLDivElement>(null);

  const remember = (list: Provider[]) => {
    setProviderIndex((current) => {
      const next = { ...current };
      list.forEach((provider) => { next[provider.id] = provider; });
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.providers(), api.categories()])
      .then(([providerResults, categoryResults]) => {
        if (!active) return;
        setProviders(providerResults);
        remember(providerResults);
        setCategories(categoryResults);
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Fecha o perfil aberto ao trocar de aba pela navegação.
  useEffect(() => {
    setSelectedProviderId(null);
  }, [view]);

  const applyFilters = async (category: string, city: string) => {
    setFilters((current) => ({ ...current, category, city }));
    setLoading(true);
    setError('');
    try {
      const result = await api.providers({ categoria: category || undefined, cidade: city || undefined });
      setProviders(result);
      remember(result);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const openCategory = (category: string) => {
    setSearchOrigin('home');
    onNavigate('search');
    void applyFilters(category, filters.city);
  };

  const openSearch = (term = '') => {
    setSearchOrigin('home');
    setFilters((current) => ({ ...current, searchTerm: term }));
    onNavigate('search');
  };

  const openProvider = (id: string) => {
    setSelectedProviderId(id);
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }));
  };

  const topRated = useMemo(
    () => [...providers].sort((left, right) => Number(right.avaliacao || 0) - Number(left.avaliacao || 0)).slice(0, 5),
    [providers],
  );

  return (
    <div ref={topRef} className={styles.area}>
      {selectedProviderId && (
        <ProviderDetail
          key={selectedProviderId}
          providerId={selectedProviderId}
          onBack={() => setSelectedProviderId(null)}
          onOpenChat={onOpenChat}
          onOpenOrders={() => onNavigate('orders')}
        />
      )}
      <div hidden={Boolean(selectedProviderId)}>
        {view === 'home' && (
          <ClientHome
            key="home"
            profile={profile}
            categories={categories}
            topRated={topRated}
            loading={loading}
            error={error}
            onSearch={openSearch}
            onOpenCategory={openCategory}
            onOpenProvider={openProvider}
          />
        )}
        {view === 'search' && (
          <ClientSearch
            key="search"
            providers={providers}
            categories={categories}
            filters={filters}
            loading={loading}
            error={error}
            nearby={nearby}
            visible={!selectedProviderId}
            onBack={searchOrigin === 'home' ? () => onNavigate('home') : undefined}
            onChangeFilters={(patch) => setFilters((current) => ({ ...current, ...patch }))}
            onApplyFilters={applyFilters}
            onOpenProvider={openProvider}
          />
        )}
        {view === 'orders' && (
          <ClientOrders
            key="orders"
            providerIndex={providerIndex}
            onOpenChat={onOpenChat}
            onOpenProvider={openProvider}
            onFindProviders={() => openSearch()}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardClient;
