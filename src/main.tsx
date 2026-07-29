/** Application entry point — mounts React to the DOM. */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { Providers } from './app/providers';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>,
);
