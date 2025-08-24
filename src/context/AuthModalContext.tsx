import React, { createContext, useState, useContext, ReactNode } from 'react';

export type AuthMode = 'login' | 'register';

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthMode;
  openModal: (mode: AuthMode) => void;
  closeModal: () => void;
  setMode: (mode: AuthMode) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');

  const openModal = (initialMode: AuthMode) => {
    setMode(initialMode);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, openModal, closeModal, setMode }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
