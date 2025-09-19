import React from 'react';
import { createRoot } from 'react-dom/client'
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
    <AuthProvider>
      <AuthModalProvider>
        <App />
      </AuthModalProvider>
    </AuthProvider>
  </React.StrictMode>
);
