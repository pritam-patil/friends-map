// src/components/FriendsMap.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Friend } from '../data/friends';
import './friendsMap.css';
import { getCoordsFromAddress } from './geocoding';

/**
 * Small helper: create a simple colored icon using an SVG data URL
 * so we don't rely on external image files.
 */
function createColoredIcon(hexColor: string, size = 28) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" >
      <path fill="${hexColor}" stroke="white" stroke-width="1.5" d="M12 2C8.1 2 5 5.1 5 9c0 5.6 7 13 7 13s7-7.4 7-13c0-3.9-3.1-7-7-7z"/>
      <circle cx="12" cy="9" r="2.6" fill="white" />
    </svg>
  `);

  return new Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    className: '',
  });
}

// A single default icon
const defaultIcon = createColoredIcon('#007bff');

type Props = {
  friends?: Friend[]; // optional prop - defaults to sample data
  initialCenter?: LatLngExpression;
  initialZoom?: number;
};

const FitBoundsButton: React.FC<{ bounds?: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  return (
    <div className="fit-bounds-control">
      <button
        onClick={() => {
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          } else {
            // nothing valid - reset to world or a default
            map.setView([20.5937, 78.9629], 4); // India default
          }
        }}
        title="Fit map to visible friends"
      >
        Fit to markers
      </button>
    </div>
  );
};

export default function FriendsMap({ friends = [], initialCenter = [21, 78], initialZoom = 5 }: Props) {
  const [query, setQuery] = useState('');
  const [friendsWithCoords, setFriendsWithCoords] = useState<Friend[]>([]);

  // When friends prop changes, geocode addresses to get coordinates
  useEffect(() => {
    const geocodeFriends = async () => {
      const promises = friends.map(async (friend) => {
        // If lat/lng are already valid in the data, use them.
        if (friend.lat && friend.lng && !isNaN(friend.lat) && !isNaN(friend.lng)) {
          return friend;
        }
        // Otherwise, fetch from address.
        const coords = await getCoordsFromAddress(friend['Present Address']);
        return { ...friend, lat: coords?.lat ?? 0, lng: coords?.lng ?? 0 };
      });
      const resolvedFriends = await Promise.all(promises);
      // Filter out friends for whom geocoding failed (lat/lng are 0)
      setFriendsWithCoords(resolvedFriends.filter(f => f.lat !== 0 && f.lng !== 0));
    };

    geocodeFriends();
  }, [friends]);

  const filtered = useMemo(() =>
    friendsWithCoords.filter(f =>
      f['Name'].toLowerCase().includes(query.trim().toLowerCase()) ||
      (f['Present Address'] || '').toLowerCase().includes(query.trim().toLowerCase())
    ), [query, friendsWithCoords]);


  // Precompute bounds of filtered markers
  const bounds = useMemo(() => {
    if (!filtered || filtered.length === 0) return null;
    const latlngs = filtered.map(f => [f.lat, f.lng] as [number, number]);
    return L.latLngBounds(latlngs);
  }, [filtered]);

  // on initial load, if we have bounds, fit them
  const mapRef = useRef<L.Map | null>(null);
  function onMapCreated(map: L.Map) {
    mapRef.current = map;
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }

  return (
    <div className="friends-map-root">
      <div className="controls">
        <input
          aria-label="Search friends"
          placeholder="Search by name or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="stats">
          <small>{filtered.length} / {friends.length} friends shown</small>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={initialCenter as LatLngExpression}
          zoom={initialZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          // @ts-ignore
          whenCreated={onMapCreated}
        >
          <TileLayer
            attribution='© OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit bounds control placed as an overlay (custom control via a small component) */}
          <FitBoundsButton bounds={bounds} />

          {/* Markers */}
          {filtered.map(friend => (
            <Marker
              key={friend.Name + friend['Present Address']}
              position={[friend.lat, friend.lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{friend.Name}</strong>
                  <div style={{ marginTop: 6 }}>
                    <div><small>From: {friend.From}</small></div>
                    <div><small>Address: {friend['Present Address']}</small></div>
                    <div><small>Profession: {friend.Profession}</small></div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={() => mapRef.current?.setView([friend.lat, friend.lng], 12, { animate: true })}>Center</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
