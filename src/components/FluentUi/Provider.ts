/**
 * Fluent UI Provider and Theme
 */

import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  type Theme,
} from '@fluentui/react-components';

/**
 * Default theme to use across the application
 */
export const defaultTheme = webLightTheme;

// Re-export all
export { FluentProvider, webLightTheme, webDarkTheme, type Theme };
