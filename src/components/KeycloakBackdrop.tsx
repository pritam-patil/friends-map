import React, { useState } from 'react';
import './keycloakBackdrop.css';

interface KeycloakBackdropProps {
  children: React.ReactNode;
}

const CORRECT_KEY = process.env.REACT_APP_ACCESS_KEY || 'YHK'; // This should be stored more securely in a real application

const KeycloakBackdrop: React.FC<KeycloakBackdropProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.toUpperCase() === CORRECT_KEY) {
      setIsAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="keycloak-backdrop">
      <div className="keycloak-form-container">
        <h1>Enter Access Key</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value);
              setError(false);
            }}
            placeholder="Access Key"
            className={error ? 'error' : ''}
          />
          <button type="submit">Enter</button>
          {error && <p className="error-message">Incorrect Key</p>}
        </form>
      </div>
    </div>
  );
};

export default KeycloakBackdrop;
