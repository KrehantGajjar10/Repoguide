import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/theme';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConnectClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      const card = document.getElementById('connect-card');
      if (card) {
        e.preventDefault();
        card.scrollIntoView({ behavior: 'smooth' });
        const input = document.getElementById('repoUrl') as HTMLInputElement | null;
        if (input) input.focus();
      }
    }
  };

  return (
    <header className="w-full bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-colors duration-150">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 py-3 max-w-7xl mx-auto">
        {/* Brand & Product Identifier */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105">
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="m9 9 3 3-3 3" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              RepoGuide
            </span>
          </Link>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-secondary text-[11px] font-mono text-muted-foreground">
            v1.0
          </span>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-[13px] font-mono">
          <Link
            to="/overview"
            className={`font-normal hover:text-foreground hover:bg-secondary transition-colors duration-150 px-3 py-1.5 rounded-md ${
              location.pathname === '/overview' ? 'text-foreground bg-secondary font-medium' : 'text-muted-foreground'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/architecture"
            className={`font-normal hover:text-foreground hover:bg-secondary transition-colors duration-150 px-3 py-1.5 rounded-md ${
              location.pathname === '/architecture' ? 'text-foreground bg-secondary font-medium' : 'text-muted-foreground'
            }`}
          >
            Architecture
          </Link>
          <Link
            to="/onboarding"
            className={`font-normal hover:text-foreground hover:bg-secondary transition-colors duration-150 px-3 py-1.5 rounded-md ${
              location.pathname === '/onboarding' ? 'text-foreground bg-secondary font-medium' : 'text-muted-foreground'
            }`}
          >
            Onboarding
          </Link>
          <a
            href="#docs"
            className="text-muted-foreground font-normal hover:text-foreground hover:bg-secondary transition-colors duration-150 px-3 py-1.5 rounded-md"
          >
            Docs
          </a>
        </nav>

        {/* Trailing Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>

          {/* GitHub Secondary Action */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-foreground hover:text-foreground hover:bg-secondary text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-mono text-xs">GitHub</span>
          </a>

          {/* Connect Repository Primary Action */}
          <Link
            to="/"
            onClick={handleConnectClick}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-md bg-primary text-primary-foreground font-medium text-[13px] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span>Connect Repository</span>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 bg-card space-y-2">
          <Link
            to="/overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary font-mono"
          >
            Overview
          </Link>
          <Link
            to="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary font-mono"
          >
            Architecture
          </Link>
          <Link
            to="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary font-mono"
          >
            Onboarding
          </Link>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary font-mono"
          >
            How it works
          </a>
          <a
            href="#docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary font-mono"
          >
            Docs
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary font-mono"
          >
            GitHub
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </a>
        </div>
      )}
    </header>
  );
};
