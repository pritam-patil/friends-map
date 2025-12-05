// src/components/FriendsMap.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Friend } from '../data/friends';
import './friendsMap.css';
import { getCoordsFromAddress } from './geocoding';


const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

type IconProps = {
  hexColor: string;
  size?: number;
};

const BullsEyeIcon = ({hexColor = "000", size = 28}: IconProps) => {
  return  (
  <svg fill={hexColor} version="1.1" xmlns="http://www.w3.org/2000/svg"
         width={size} height={size} viewBox="0 0 390 390">
<g>
        <g>
                <path d="M355.529,171.52H390c-5.16-43.57-24.631-83.888-56.131-115.389C302.368,24.631,262.051,5.16,218.48,0v34.471
                        C289.18,44.768,345.232,100.82,355.529,171.52z"/>
                <path d="M171.52,34.471V0C127.95,5.16,87.632,24.631,56.131,56.131C24.631,87.632,5.16,127.949,0,171.52h34.471
                        C44.768,100.82,100.82,44.768,171.52,34.471z"/>
                <path d="M218.48,355.529V390c43.569-5.16,83.888-24.631,115.389-56.131c31.5-31.501,50.971-71.818,56.131-115.389h-34.471
                        C345.232,289.18,289.18,345.232,218.48,355.529z"/>
                <path d="M34.471,218.48H0c5.16,43.569,24.631,83.888,56.131,115.389c31.501,31.5,71.818,50.971,115.389,56.131v-34.471
                        C100.82,345.232,44.768,289.18,34.471,218.48z"/>
                <path d="M108.471,171.52c8.312-30.596,32.453-54.737,63.049-63.049V73.433c-49.473,9.538-88.549,48.614-98.087,98.087H108.471z"/>
                <path d="M108.471,218.48H73.433c9.538,49.473,48.614,88.549,98.087,98.086v-35.037
                        C140.924,273.218,116.782,249.076,108.471,218.48z"/>
                <path d="M281.529,218.48c-8.312,30.596-32.453,54.736-63.049,63.049v35.037c49.473-9.537,88.549-48.613,98.087-98.086H281.529z"/>
                <path d="M281.529,171.52h35.038c-9.538-49.473-48.614-88.549-98.087-98.087v35.038
                        C249.076,116.782,273.218,140.924,281.529,171.52z"/>
                <path d="M204.521,149.045V0h-19.042v149.045c-18.252,3.775-32.658,18.182-36.434,36.434H0v19.042h149.045
                        c3.775,18.252,18.182,32.658,36.434,36.435V390h19.042V240.955c18.252-3.775,32.658-18.182,36.435-36.436H390v-19.042H240.955
                        C237.18,167.227,222.773,152.82,204.521,149.045z"/>
        </g>
</g>
</svg>
);
}

// A single default icon
const defaultIcon = createColoredIcon('#007bff');

type Props = {
  friends?: Friend[]; // optional prop - defaults to sample data
  initialCenter?: LatLngExpression;
  initialZoom?: number;
  onSearch?: () => void;
};

const INDIA_BOUNDS = [20.5937, 78.9629] as LatLngExpression;

const FitBoundsButton: React.FC<{ bounds?: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();

  const fitMapToBounds = () => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // nothing valid - reset to world or a default
      map.setView(INDIA_BOUNDS, 4); // India default
    }
  }

  return (
    <button id='recenter-map' className="fit-bounds-control" onClick={fitMapToBounds}>
      <BullsEyeIcon hexColor='#000'/>
    </button>
  );
};

export default function FriendsMap({ friends = [], initialCenter = [21, 78], initialZoom = 5, onSearch }: Props) {
  const [query, setQuery] = useState('');
  const [friendsWithCoords, setFriendsWithCoords] = useState<Friend[]>([]);

  const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    debounce(() => {
      if (typeof onSearch === 'function') {
        onSearch();
      }
    }, 300)();
  }
  
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

    if (typeof onSearch === 'function') {
      onSearch();
    }
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
    } else {
      map.setView(INDIA_BOUNDS, 4); // India default
    }
  }

  return (
    <div className="friends-map-root">
      <div className="controls">
        <input
          aria-label="Search friends"
          placeholder="Search by name or city..."
          value={query}
          onChange={onQueryChange}
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
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <input className='call-action' type="tel" placeholder='Call' value={friend.Mobile} readOnly style={{ flex: 0, textAlign: 'center' }} />
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
