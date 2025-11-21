// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FriendsMap from '../components/FriendsMap';
import AddFriendForm from '../components/AddFriendForm';
import Modal from '../components/Modal';
import { Friend } from '../data/friends';

// 1. Replace this with the URL of your published Google Sheet CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR27x7k8_scXZ5GSR9RWq9_AFEWICe0xIVHETy-vUb8YznHvx54ZREM6ReE1sfStnxSfrkyrBeU5_UW/pub?gid=0&single=true&output=csv';

export default function Home() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    Papa.parse<Friend>(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true, // Assumes first row in CSV is header
      complete: (results) => {
        // The parsed data needs to be mapped to the Friend type, especially for lat/lng
        const friendsData = results.data.map(friend => ({
          ...friend,
          lat: Number(friend.lat),
          lng: Number(friend.lng),
        }));
        setFriends(friendsData);
      },
    });
  }, []);

  function addFriend(newFriend: Friend) {
    setFriends(prev => [...prev, newFriend]);
    setOpenForm(false);
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Add Friend Button */}
      <button
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 2,
          padding: '10px 14px',
          background: '#007bff',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          cursor: 'pointer',
        }}
        onClick={() => setOpenForm(true)}
      >
        + Add Friend
      </button>

      {/* Map */}
        <FriendsMap friends={friends} />

      {/* Modal with Form */}
      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <AddFriendForm onSubmit={addFriend} />
      </Modal>
    </div>
  );
}
