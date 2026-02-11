/**
 * Logger utility for debugging
 * Provides colored console output for different log levels
 * All ui-Lib logs use consistent purple branding (#9C27B0)
 */

export const TRACE = [
  '%c ui-Lib ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;'
];

// Backwards compatibility alias
export const BUG = TRACE;

export const WAR = [
  '%c ui-Lib ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;'
];

export const ERR = [
  '%c ui-Lib ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;'
];

export const UILIB = [
  '%c ui-Lib ',
  'background: #9C27B0; color: white; font-weight: bold; padding: 2px 8px; border-radius: 3px;'
];

export const Logger = {
  TRACE,
  BUG, // Backwards compatibility
  WAR,
  ERR,
  UILIB
};
