import React from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { PlayerPage } from './pages/PlayerPage/PlayerPage';
import { ToastContainer } from './components/Toast/Toast';
import './styles/globals.css';

/** Root component — wraps the app in the global PlayerProvider. */
function App() {
  return (
    <PlayerProvider>
      <PlayerPage />
      <ToastContainer />
    </PlayerProvider>
  );
}

export default App;
