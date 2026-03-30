import { useValuesVisibility } from '@/hooks/useValuesVisibility';

interface CurrencyDisplayProps {
  value: number;
  prefix?: string;
  className?: string;
}

const formatCurrency = (value: number) => {
  return value.toFixed(2).replace('.', ',');
};

export const CurrencyDisplay = ({ value, prefix = '', className }: CurrencyDisplayProps) => {
  const { visible } = useValuesVisibility();

  if (!visible) {
    return <span className={className}>{prefix}R$ ••••••</span>;
  }

  return <span className={className}>{prefix}R$ {formatCurrency(value)}</span>;
};

export default CurrencyDisplay;
