import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useValuesVisibility } from '@/hooks/useValuesVisibility';

export const ValuesToggle = () => {
  const { visible, toggle } = useValuesVisibility();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-sm border shadow-sm hover:bg-accent"
      title={visible ? 'Ocultar valores' : 'Mostrar valores'}
    >
      {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
    </Button>
  );
};
