import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Redirect to https, this helps with positioning in some circumstances
const { protocol } = window.location;
if (protocol === 'http:' && window.location.hostname !== 'localhost') {
  // From http://stackoverflow.com/a/4723302/473672
  window.location.href = `https:${window.location.href.substring(protocol.length)}`;
} else {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(<App />);
  }
}
