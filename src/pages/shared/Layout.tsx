/**
 * D365 CE Page Layout Component
 * Provides consistent header, navigation, and footer across all pages
 */
import React, { useState, useEffect } from 'react';
import { detectEnvironment, environmentStyles, type D365Environment } from './environment';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'demo' | 'tests' | 'howto';
  version?: string;
}

interface NavItem {
  id: 'demo' | 'tests' | 'howto';
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'demo', label: 'Demo', href: 'demo.html', icon: '🎮' },
  { id: 'tests', label: 'Tests', href: 'tests.html', icon: '🧪' },
  { id: 'howto', label: 'Docs', href: 'howto.html', icon: '📚' },
];

// Environment Badge Component
const EnvironmentBadge: React.FC<{ environment: D365Environment }> = ({ environment }) => {
  const style = environmentStyles[environment.environmentType];
  
  return (
    <div 
      className="ui-lib-d365-env-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        background: style.background,
        color: style.color,
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
      }}
      title={environment.isD365Context 
        ? `Connected to: ${environment.orgName || 'D365 Environment'}` 
        : 'Running in standalone demo mode with mock data'}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, version }) => {
  const [environment, setEnvironment] = useState<D365Environment | null>(null);

  useEffect(() => {
    setEnvironment(detectEnvironment());
  }, []);

  return (
    <div className="ui-lib-d365-app">
      {/* Header */}
      <header className="ui-lib-d365-header">
        <a href="demo.html" className="ui-lib-d365-header__logo">
          <div className="ui-lib-d365-header__logo-icon">UI</div>
          <div className="ui-lib-d365-header__logo-text">
            <span className="ui-lib-d365-header__logo-title">err403 UI Library</span>
            {version && <span className="ui-lib-d365-version">v{version}</span>}
          </div>
        </a>

        <nav className="ui-lib-d365-header__nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`ui-lib-d365-header__nav-item ${currentPage === item.id ? 'ui-lib-d365-header__nav-item--active' : ''}`}
            >
              <span className="ui-lib-d365-header__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="ui-lib-d365-header__actions">
          {environment && <EnvironmentBadge environment={environment} />}
          <a
            href="https://github.com/garethcheyne/DYN365CE-Modal-and-More"
            target="_blank"
            rel="noopener noreferrer"
            className="ui-lib-d365-btn ui-lib-d365-btn--ghost ui-lib-d365-btn--small"
            title="View on GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          <a
            href="https://err403.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--small"
          >
            err403.com
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="ui-lib-d365-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="ui-lib-d365-footer">
        <div className="ui-lib-d365-footer__left">
          <span>&copy; {new Date().getFullYear()} err403.com</span>
          <span className="ui-lib-d365-footer__separator">•</span>
          <span>Dynamics 365 CE UI Library</span>
        </div>
        <div className="ui-lib-d365-footer__right">
          <span className="ui-lib-d365-footer__tech">TypeScript + React + Fluent UI v9</span>
          <a 
            href="https://err403.com" 
            className="ui-lib-d365-footer__link" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            err403.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
