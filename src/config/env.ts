
// Configurações de ambiente para o Supabase
export const ENV = {
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL,
    ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
} as const;

// Type para garantir que as configurações estão corretas
export type EnvironmentConfig = typeof ENV;
