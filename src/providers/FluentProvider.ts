/**
 * FluentProvider wrapper for D365 CE UI Library
 * Provides Fluent UI v9 theming and context for all components
 */

import { FluentProvider as Provider, webLightTheme, Theme } from '@fluentui/react-components';
import { getTargetDocument } from '../utils/dom';

/**
 * Custom theme based on D365 design tokens
 * Extends Fluent UI webLightTheme with D365-specific colors
 */
export const d365Theme: Theme = {
  ...webLightTheme,
  colorBrandBackground: '#0078d4',
  colorBrandBackgroundHover: '#106ebe',
  colorBrandBackgroundPressed: '#005a9e',
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: '#faf9f8',
  colorNeutralForeground1: '#323130',
  colorNeutralForeground2: '#605e5c',
  colorNeutralForeground3: '#a19f9d',
};

/**
 * Initialize FluentProvider in the target document (supports iframes)
 * This should be called once when the library is loaded
 */
export function initializeFluentProvider(): void {
  const doc = getTargetDocument();
  
  // Check if provider container already exists
  let providerContainer = doc.getElementById('d365-fluent-provider-root');
  
  if (!providerContainer) {
    providerContainer = doc.createElement('div');
    providerContainer.id = 'd365-fluent-provider-root';
    providerContainer.style.display = 'none'; // Hidden, just for React context
    doc.body.appendChild(providerContainer);
  }
}

/**
 * Get the Fluent theme for programmatic styling
 */
export function getFluentTheme(): Theme {
  return d365Theme;
}

export { Provider as FluentProvider };
