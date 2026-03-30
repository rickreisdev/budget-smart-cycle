import { useValuesVisibility } from './useValuesVisibility';
import { useCallback } from 'react';

export const useFormatCurrency = () => {
  const { visible } = useValuesVisibility();

  const formatCurrency = useCallback((value: number) => {
    if (!visible) return '••••••';
    return value.toFixed(2).replace('.', ',');
  }, [visible]);

  return formatCurrency;
};
