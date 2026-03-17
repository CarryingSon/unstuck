import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import '@google/model-viewer';
import { ThemeProvider } from './state/theme.tsx';
import { GamificationProvider } from './state/gamification.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <GamificationProvider>
        <App />
      </GamificationProvider>
    </ThemeProvider>
  </StrictMode>,
);
