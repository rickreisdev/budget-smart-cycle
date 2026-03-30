import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ValuesVisibilityContextType {
  visible: boolean;
  toggle: () => void;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined);

export const ValuesVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(() => {
    const stored = localStorage.getItem('values-visible');
    return stored !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('values-visible', String(visible));
    if (!visible) {
      document.body.classList.add('hide-values');
    } else {
      document.body.classList.remove('hide-values');
    }
  }, [visible]);

  const toggle = () => setVisible(prev => !prev);

  return (
    <ValuesVisibilityContext.Provider value={{ visible, toggle }}>
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
