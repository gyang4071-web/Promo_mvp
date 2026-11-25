import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { GlobalAtmosphereProvider } from './atmosphere/AtmosphereProvider';
import { InterestsProvider } from './state/interests';
import { SmarticLayout } from './components/SmarticLayout';
import { captureAttribution } from './analytics/attribution';
import { atmosphere } from './atmosphere/store';

captureAttribution();
atmosphere.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalAtmosphereProvider>
      <InterestsProvider>
        <SmarticLayout />
      </InterestsProvider>
    </GlobalAtmosphereProvider>
  </StrictMode>,
);
