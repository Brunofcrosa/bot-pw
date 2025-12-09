import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './src/App';
import ErrorBoundary from './src/components/ErrorBoundary';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
