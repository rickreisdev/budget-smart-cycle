import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to format date from YYYY-MM-DD to DD/MM/YYYY
export function formatDateToBrazilian(dateString: string) {
  if (!dateString) return '';
  
  // Handle ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
