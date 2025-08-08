export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        <span className="text-muted-foreground text-sm">Desenvolvido por</span>
        <a 
          href="https://rickreis.dev.br" 
          target="_blank" 
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <img 
            src="/logo-rickreis.png" 
            alt="rickreis" 
            className="h-6 w-auto"
          />
        </a>
      </div>
    </footer>
  );
};