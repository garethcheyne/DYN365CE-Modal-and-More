/**
 * D365 CE Page Layout Component
 * Provides consistent header, navigation, and footer across all pages
 */
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'demo' | 'tests' | 'howto';
  version?: string;
}

interface NavItem {
  id: 'demo' | 'tests' | 'howto';
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'demo', label: 'Demo', href: 'demo.html' },
  { id: 'tests', label: 'Tests', href: 'tests.html' },
  { id: 'howto', label: 'Documentation', href: 'howto.html' },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, version }) => {
  return (
    <div className="d365-app">
      {/* Header */}
      <header className="d365-header">
        <a href="demo.html" className="d365-header__logo">
          <div className="d365-header__logo-icon">UI</div>
          <span>err403 UI Library</span>
          {version && <span className="d365-version">v{version}</span>}
        </a>

        <nav className="d365-header__nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`d365-header__nav-item ${currentPage === item.id ? 'd365-header__nav-item--active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="d365-header__actions">
          <a
            href="https://github.com/garethcheyne/DYN365CE-Modal-and-More"
            target="_blank"
            rel="noopener noreferrer"
            className="d365-btn d365-btn--ghost d365-btn--small"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
          <a
            href="https://err403.com"
            target="_blank"
            rel="noopener noreferrer"
            className="d365-btn d365-btn--primary d365-btn--small"
          >
            err403.com
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="d365-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="d365-footer">
        <div>&copy; {new Date().getFullYear()} err403.com - Dynamics 365 CE UI Library</div>
        <div className="d365-footer__links">
          <span>Built with TypeScript + React + Fluent UI</span>
          <span>|</span>
          <a href="https://err403.com" className="d365-footer__link" target="_blank" rel="noopener noreferrer">
            Visit err403.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
