import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { initMercadoPago } from '@mercadopago/sdk-react';

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (publicKey) {
  initMercadoPago(publicKey, {
    locale: 'es-AR',
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)