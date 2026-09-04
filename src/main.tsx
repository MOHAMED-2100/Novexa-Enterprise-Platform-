import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './client/i18n/config.js';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
