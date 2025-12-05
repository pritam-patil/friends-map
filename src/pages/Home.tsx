// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import FriendsMap from '../components/FriendsMap';
import AddFriendForm from '../components/AddFriendForm';
import Modal from '../components/Modal';
import { Friend } from '../data/friends';

// 1. Replace this with the URL of your published Google Sheet CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR27x7k8_scXZ5GSR9RWq9_AFEWICe0xIVHETy-vUb8YznHvx54ZREM6ReE1sfStnxSfrkyrBeU5_UW/pub?gid=0&single=true&output=csv';
// const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMBXC1j5KsQ0Qnsyltu9t72ZgQ2sFJr_OqY8IlsBMk9SNAacGW6rpIsXrzOySkTfxz/exec'; // 2. Replace with your deployed Apps Script URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5JFSflmN8YWRlo76SDdxuffldXbnnM3L15jESUM_8_gJX7mA2sMx9V_g7MmafczuI/exec'; // 2. Replace with your deployed Apps Script URL

export default function Home() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    Papa.parse<Friend>(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true, // Assumes first row in CSV is header
      complete: (results: { data: any[]; }) => {
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

  async function addFriend(newFriend: Friend) {
    // Optimistically update the UI
    setFriends(prev => [...prev, newFriend]);

    try {
       await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Apps Script web apps
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFriend),
      });

      // NOTE: Because of 'no-cors', we can't actually read the response.
      // We assume it's successful if the request doesn't throw an error.
      // For more robust error handling, a more advanced setup (like a proper backend) is needed.
      console.log('Successfully sent data to Google Sheet.');

    } catch (error) {
      console.error('Error saving friend to Google Sheet:', error);
      // Optional: Implement logic to revert the optimistic UI update on failure
    }

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
