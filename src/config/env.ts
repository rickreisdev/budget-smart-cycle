
// Configurações de ambiente para o Supabase
export const ENV = {
  SUPABASE: {
    URL: "https://hrhfvjnfhhaabuhozknu.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGZ2am5maGhhYWJ1aG96a251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjEyNjEsImV4cCI6MjA2NDczNzI2MX0.PuQkHnwTVTG8BfMjRMCTA0KGbHPdlNS84joUwVkJ-BY"
  }
} as const;

// Type para garantir que as configurações estão corretas
export type EnvironmentConfig = typeof ENV;
