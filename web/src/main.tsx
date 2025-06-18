import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element is not defined in html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
