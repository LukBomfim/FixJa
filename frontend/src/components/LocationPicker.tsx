import React, { useEffect, useMemo, useState } from 'react';
import { Check, LocateFixed, MapPinned } from 'lucide-react';
import styles from './LocationPicker.module.css';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationValue {
  estado: string;
  cidade: string;
  endereco: string;
  latitude: string;
  longitude: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  onConfirmedChange?: (confirmed: boolean) => void;
  showAddress?: boolean;
}

function LocationClickHandler({ onSelect }: { onSelect: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

const STATES = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
] as const;

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, onConfirmedChange, showAddress = true }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [citiesError, setCitiesError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const hasCoordinates = value.latitude.trim() !== '' && value.longitude.trim() !== ''
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  const searchUrl = useMemo(() => {
    const query = [value.endereco, value.cidade, value.estado].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Brasil')}`;
  }, [value.endereco, value.cidade, value.estado]);

  useEffect(() => {
    setConfirmed(false);
    onConfirmedChange?.(false);
  }, [value.latitude, value.longitude, onConfirmedChange]);

  useEffect(() => {
    if (!value.estado) {
      setCities([]);
      setCitiesError('');
      return;
    }
    const controller = new AbortController();
    setCitiesError('');
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${value.estado}/municipios`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as cidades do estado.');
        return response.json() as Promise<Array<{ nome: string }>>;
      })
      .then((result) => setCities(result.map((city) => city.nome)))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setCitiesError('Não foi possível carregar a lista de cidades. Você ainda pode informar a cidade manualmente.');
      });
    return () => controller.abort();
  }, [value.estado]);

  const update = (patch: Partial<LocationValue>) => onChange({ ...value, ...patch });

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Este navegador não oferece geolocalização.');
      return;
    }
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => update({
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }),
      () => setLocationError('Não foi possível obter sua localização. Verifique a permissão do navegador.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <fieldset className={styles.locationPicker}>
      <legend>Localização</legend>
      <div className={styles.locationFields}>
        <label>
          Estado (UF)
          <select
            value={value.estado}
            onChange={(event) => update({ estado: event.target.value, cidade: '' })}
            required={showAddress}
          >
            <option value="">Selecione um estado</option>
            {STATES.map(([uf, name]) => <option key={uf} value={uf}>{name} ({uf})</option>)}
          </select>
        </label>
        <label>
          Cidade
          {citiesError ? (
            <input value={value.cidade} onChange={(event) => update({ cidade: event.target.value })} required={showAddress} />
          ) : (
            <select
              value={value.cidade}
              onChange={(event) => update({ cidade: event.target.value })}
              disabled={!value.estado || cities.length === 0}
              required={showAddress}
            >
              <option value="">{value.estado ? 'Selecione uma cidade' : 'Selecione o estado primeiro'}</option>
              {value.cidade && !cities.includes(value.cidade) && <option value={value.cidade}>{value.cidade}</option>}
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          )}
        </label>
        {showAddress && (
          <label className={styles.fullWidth}>
            Endereço ou local de atendimento
            <input
              value={value.endereco}
              onChange={(event) => update({ endereco: event.target.value })}
              placeholder="Rua, número, bairro ou referência"
              required
            />
          </label>
        )}
      </div>
      {citiesError && <p className={styles.hint} role="status">{citiesError}</p>}

      <div className={styles.locationActions}>
        <button type="button" onClick={useDeviceLocation}><LocateFixed size={16} aria-hidden="true" /> Usar localização do dispositivo</button>
        <a href={searchUrl} target="_blank" rel="noreferrer"><MapPinned size={16} aria-hidden="true" /> Pesquisar no Google Maps</a>
      </div>
      <p className={styles.hint}>A busca do mapa abre em outra aba. Informe as coordenadas exatas do ponto escolhido abaixo.</p>
      <div className={styles.locationFields}>
        <label>
          Latitude
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={value.latitude}
            onChange={(event) => update({ latitude: event.target.value })}
            required={showAddress}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={value.longitude}
            onChange={(event) => update({ longitude: event.target.value })}
            required={showAddress}
          />
        </label>
      </div>
      <button
        type="button"
        className={styles.confirmButton}
        disabled={!hasCoordinates}
        onClick={() => { setLocationError(''); setConfirmed(true); onConfirmedChange?.(true); }}
      >
        <Check size={16} aria-hidden="true" /> Confirmar localização selecionada
      </button>
      {confirmed && <p className={styles.confirmed} role="status"><Check size={15} aria-hidden="true" /> Localização confirmada. Altere as coordenadas para ajustar o ponto.</p>}
      {locationError && <p className={styles.error} role="alert">{locationError}</p>}
      {hasCoordinates && !confirmed && (
        <div className={styles.mapFrame}>
          <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom className={styles.map}>
            <LocationClickHandler onSelect={(lat, lng) => update({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) })} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 0.95 }} />
          </MapContainer>
          <p className={styles.mapHint}>Clique no mapa para ajustar a posição do marcador.</p>
        </div>
      )}
    </fieldset>
  );
};

export default LocationPicker;
