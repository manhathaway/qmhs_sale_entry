import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppNav from './components/AppNav.jsx';
import AuthGate from './components/AuthGate.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      <AppNav />
    </AuthGate>
  </StrictMode>,
);