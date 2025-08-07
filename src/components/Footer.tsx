const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Desenvolvido por</span>
          <a 
            href="https://rickreis.dev.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src="/logo-rickreis.png" 
              alt="rickreis" 
              className="h-5 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;