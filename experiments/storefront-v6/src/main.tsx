import React from 'react';
import { createRoot } from 'react-dom/client';
import { BluePremiumStorefrontPremiumMobilePrototype } from './components/generated/BluePremiumStorefrontPremiumMobilePrototype';
import './index.css';

const element = document.getElementById('root');
if (!element) throw new Error('Missing root element');
createRoot(element).render(
  <React.StrictMode>
    <BluePremiumStorefrontPremiumMobilePrototype />
  </React.StrictMode>
);
