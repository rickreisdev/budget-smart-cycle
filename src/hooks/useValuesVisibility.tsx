import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ValuesVisibilityContextType {
  visible: boolean;
  toggle: () => void;
  formatValue: (value: string) => string;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined);

export const ValuesVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(() => {
    const stored = localStorage.getItem('values-visible');
    return stored !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('values-visible', String(visible));
  }, [visible]);

  const toggle = () => setVisible(prev => !prev);

  const formatValue = (value: string) => {
    if (visible) return value;
    return '••••••';
  };

  return (
    <ValuesVisibilityContext.Provider value={{ visible, toggle, formatValue }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
};

export const useValuesVisibility = () => {
  const context = useContext(ValuesVisibilityContext);
  if (!context) {
    throw new Error('useValuesVisibility must be used within ValuesVisibilityProvider');
  }
  return context;
};
