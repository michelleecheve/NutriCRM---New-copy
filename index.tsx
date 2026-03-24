import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PublicPatient } from './pages/PublicPatient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const portalMatch = window.location.pathname.match(/^\/p\/([^/]+)/);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {portalMatch
      ? <PublicPatient token={portalMatch[1]} />
      : <App />
    }
  </React.StrictMode>
);
