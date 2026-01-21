/**
 * Fluent UI Helper Utilities
 */

import { React, createRoot, type Root } from './React';
import { FluentProvider, defaultTheme, type Theme } from './Provider';

/**
 * Helper function to create a FluentProvider wrapper
 */
export function createFluentProvider(
  children: React.ReactElement,
  theme: Theme = defaultTheme
): React.ReactElement {
  return React.createElement(FluentProvider, { theme }, children);
}

/**
 * Helper function to mount a React component with FluentProvider
 */
export function mountFluentComponent(
  container: HTMLElement,
  component: React.ReactElement,
  theme: Theme = defaultTheme
): Root {
  const root = createRoot(container);
  root.render(createFluentProvider(component, theme));
  return root;
}

/**
 * Helper to unmount a React component
 */
export function unmountFluentComponent(root: Root): void {
  root.unmount();
}
