// src/components/AddFriendForm.tsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Friend } from '../data/friends';

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

export default function AddFriendForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'online' | 'offline' | 'busy' | 'away'>('offline');
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setMarkerPos([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!markerPos) {
      alert('Select a location on the map');
      return;
    }

    const newFriend: Friend = {
      id: Date.now().toString(),
      name,
      city,
      phone,
      email,
      status,
      lat: markerPos[0],
      lng: markerPos[1],
    };

    onSubmit(newFriend);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Friend</h2>

      <label>Name</label>
      <input value={name} onChange={e => setName(e.target.value)} required />

      <label>City</label>
      <input value={city} onChange={e => setCity(e.target.value)} />

      <label>Phone</label>
      <input value={phone} onChange={e => setPhone(e.target.value)} />

      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />

      <label>Status</label>
      <select value={status} onChange={e => setStatus(e.target.value as any)}>
        <option value="online">Online</option>
        <option value="busy">Busy</option>
        <option value="away">Away</option>
        <option value="offline">Offline</option>
      </select>

      <label>Select Location</label>
      <div style={{ height: 250, width: '100%', marginBottom: 12 }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />

          {markerPos && (
            <Marker position={markerPos} icon={defaultIcon} />
          )}
        </MapContainer>
      </div>

      <button
        type="submit"
        style={{
          padding: '10px 14px',
          background: '#28a745',
          border: 'none',
          color: '#fff',
          borderRadius: 6,
          cursor: 'pointer',
          width: '100%',
          marginTop: 10,
        }}
      >
        Save Friend
      </button>
    </form>
  );
}
