import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initServiceWorkerAutoUpdate } from './utils/swUpdate';

// Ensure instant PWA/GitHub Pages updates without cache lock
initServiceWorkerAutoUpdate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
