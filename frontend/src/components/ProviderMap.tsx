import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { NearbyRecommendation } from '../services/api';
import styles from './ProviderMap.module.css';
import 'leaflet/dist/leaflet.css';

interface ProviderMapProps {
  latitude: number;
  longitude: number;
  providers: NearbyRecommendation[];
  selectedProviderId: string | null;
  onSelect: (providerId: string) => void;
}

function MapFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, Math.max(map.getZoom(), 11), { duration: 0.6 }); }, [center, map]);
  return null;
}

export const ProviderMap: React.FC<ProviderMapProps> = ({
  latitude,
  longitude,
  providers,
  selectedProviderId,
  onSelect,
}) => (
  <div className={styles.mapFrame}>
    <MapContainer center={[latitude, longitude]} zoom={11} scrollWheelZoom className={styles.map}>
      <MapFocus
        center={[
          providers.find(({ prestador }) => prestador.id === selectedProviderId)?.prestador.latitude ?? latitude,
          providers.find(({ prestador }) => prestador.id === selectedProviderId)?.prestador.longitude ?? longitude,
        ]}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[latitude, longitude]} radius={9} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0f1b3d', fillOpacity: 1 }}>
        <Popup>Sua localização</Popup>
      </CircleMarker>
      {providers.map(({ prestador, distancia_km }) => {
        const selected = prestador.id === selectedProviderId;
        return (
          <CircleMarker
            key={prestador.id}
            center={[prestador.latitude, prestador.longitude]}
            radius={selected ? 12 : 8}
            pathOptions={{
              color: '#ffffff',
              fillColor: selected ? '#f25c1f' : '#ff9a6e',
              fillOpacity: 1,
              weight: selected ? 4 : 2,
            }}
            eventHandlers={{ click: () => onSelect(prestador.id) }}
          >
            <Popup>
              <strong>{prestador.username}</strong><br />
              {prestador.categoria || 'Prestador'}<br />
              {distancia_km.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km aproximados
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  </div>
);

export default ProviderMap;
