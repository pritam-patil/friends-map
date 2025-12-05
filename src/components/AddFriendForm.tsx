// src/components/AddFriendForm.tsx
import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Friend } from '../data/friends';
import { getCoordsFromAddress } from './geocoding';
import './addFriendForm.css';

const defaultIcon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  onSubmit: (friend: Friend) => void;
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function AddFriendForm({ onSubmit }: Props) {
  const [formState, setFormState] = useState<Omit<Friend, 'lat' | 'lng'>>({
    Name: '',
    From: '',
    'Present Address': '',
    Profession: '',
    'Office location': '',
    'Birth date': '',
  });
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef<L.Map>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  }

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setMarkerPos([e.latlng.lat, e.latlng.lng]);
        mapRef.current?.setView([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  async function handleGeocode() {
    if (!formState['Present Address']) return;
    setIsGeocoding(true);
    const coords = await getCoordsFromAddress(formState['Present Address']);
    setIsGeocoding(false);
    if (coords) setMarkerPos([coords.lat, coords.lng]);
    else alert('Could not find coordinates for the address.');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!markerPos) {
      alert('Select a location on the map');
      return;
    }

    const newFriend: Friend = {
      ...formState,
      lat: markerPos[0],
      lng: markerPos[1],
    };

    onSubmit(newFriend);
  }

  return (
    <form className="add-friend-form" onSubmit={handleSubmit}>
      <h2>Add Friend</h2>

      <label>Name *</label>
      <input name="Name" value={formState.Name} onChange={handleInputChange} required />

      <label>From</label>
      <input name="From" value={formState.From} onChange={handleInputChange} />

      <label>Present Address *</label>
      <div className="address-group">
        <input name="Present Address" value={formState['Present Address']} onChange={handleInputChange} required />
        <button type="button" className="find-button" onClick={handleGeocode} disabled={isGeocoding}>
          {isGeocoding ? 'Finding...' : 'Find on Map'}
        </button>
      </div>

      <label>Profession</label>
      <input name="Profession" value={formState.Profession} onChange={handleInputChange} />

      <label>Office Location</label>
      <input name="Office location" value={formState['Office location']} onChange={handleInputChange} />

      <label>Birth date</label>
      <input name="Birth date" value={formState['Birth date']} onChange={handleInputChange} type="date" />

      <label>Mobile Number</label>
      <input name="Mobile number" value={formState['Mobile']} onChange={handleInputChange} type="number" />

      <label>Location on Map *</label>
      <div style={{ height: 250, width: '100%', marginBottom: 12 }}>
        <MapContainer
          ref={mapRef}
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          {markerPos && <ChangeView center={markerPos} zoom={13} />}
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />

          {markerPos && (
            <Marker position={markerPos} icon={defaultIcon} draggable={true} />
          )}
        </MapContainer>
      </div>

      <button type="submit" className="submit-button">
        Save Friend
      </button>
    </form>
  );
}
