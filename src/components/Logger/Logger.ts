/**
 * Logger utility for debugging
 * Provides colored console output for different log levels
 */

export const TRACE = [
  '%c TRACE ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;'
];

// Backwards compatibility alias
export const BUG = TRACE;

export const WAR = [
  '%c WAR ',
  'background: #FF9800; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;'
];

export const ERR = [
  '%c ERR ',
  'background: #F44336; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;'
];

export const UILIB = [
  '%c uiLib ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;'
];

export const Logger = {
  TRACE,
  BUG, // Backwards compatibility
  WAR,
  ERR,
  UILIB
};
