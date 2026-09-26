import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-background border-t border-border mt-auto transition-colors duration-150">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="text-base font-semibold text-foreground">RepoGuide</span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="text-[13px] text-muted-foreground">
            © 2026 RepoGuide Infrastructure Inc. Precision developer onboarding.
          </span>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6 text-xs font-mono">
          <a
            href="#docs"
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Documentation
          </a>
          <a
            href="#changelog"
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Changelog
          </a>
          <a
            href="#privacy"
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Privacy
          </a>
          <a
            href="#terms"
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Terms
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
