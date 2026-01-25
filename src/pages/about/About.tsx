/**
 * About Page - Single page with tabs for Documentation, Demo, and Tests
 */
import React, { useState } from 'react';
import HowTo from '../howto/HowTo';
import Demo from '../demo/Demo';
import Tests from '../tests/Tests';

declare const PACKAGE_VERSION: string;

type TabType = 'documentation' | 'demo' | 'tests';

export const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('documentation');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'documentation', label: 'Documentation', icon: '📖' },
    { id: 'demo', label: 'Demo', icon: '🎨' },
    { id: 'tests', label: 'Tests', icon: '🧪' }
  ];

  return (
    <div className="d365-app">
      {/* Header */}
      <header className="d365-header">
        <div className="d365-header__logo">
          <img 
            src="/WebResources/err403_/logo.svg" 
            alt="err403 Logo" 
            className="d365-header__logo-icon"
            style={{ width: '32px', height: '32px', marginRight: '8px' }}
          />
          <span>err403 UI Library</span>
          {PACKAGE_VERSION && <span className="d365-version">v{PACKAGE_VERSION}</span>}
        </div>

        <div className="d365-header__actions">
          <a
            href="https://github.com/AshleyLGG/D365-ModalAndMore"
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

      {/* Tabs */}
      <div className="d365-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`d365-tab ${activeTab === tab.id ? 'd365-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="d365-tab__icon">{tab.icon}</span>
            <span className="d365-tab__label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="d365-main">
        <div className="d365-tab-content">
          {activeTab === 'documentation' && <HowTo />}
          {activeTab === 'demo' && <Demo />}
          {activeTab === 'tests' && <Tests />}
        </div>
      </main>

      {/* Footer */}
      <footer className="d365-footer">
        <div>&copy; {new Date().getFullYear()} err403.com - Dynamics 365 CE UI Library</div>
        <div className="d365-footer__links">
          <span>Built with TypeScript + React + Fluent UI</span>
        </div>
      </footer>
    </div>
  );
};

export default About;
